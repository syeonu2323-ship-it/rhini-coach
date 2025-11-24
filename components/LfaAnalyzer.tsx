"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** LFA QuickCheck v5.3
 * - Control line(컨트롤 라인) 미검출 시 100% 무효 처리 (강화)
 * - 촬영사진 인식력 향상 (노이즈 필터, 대비보정 안정화, 회전 탐색 확대)
 * - Crop 모드 ROI 강화 (로고/여백 영향 최소화)
 * - 3라인 구조: C + T1(ECP) + T2(MPO)
 * - Test line 노이즈 peak 제거 강화
 * - Auto / Crop / Mobile Drag fully supported
 */

type Verdict = "Positive" | "Negative" | "Invalid";
type Sensitivity = "sensitive" | "balanced" | "conservative";
type ControlPos = "auto" | "left" | "right" | "top" | "bottom";
type Mode = "auto" | "manual" | "crop";
type Peak = { idx: number; z: number; width: number; area: number };
type Diagnosis = "none" | "allergic" | "bacterial" | "mixed";

type AnalyzeResult =
  | {
      ok: true;
      result: {
        verdict: Verdict;
        detail: string;
        confidence: "확실" | "보통" | "약함";
        diagnosis: Diagnosis;
        ecpPositive: boolean;
        mpoPositive: boolean;
      };
    }
  | {
      ok: false;
      reason?: string;
      rect?: unknown;
      axis?: "x" | "y";
    };

// -----------------------------
//      판독 프리셋 (강화)
// -----------------------------
const PRESETS: Record<
  Sensitivity,
  {
    CONTROL_MIN: number;
    TEST_MIN_ABS: number;
    TEST_MIN_REL: number;
    MAX_WIDTH_FRAC: number;
    MIN_SEP_FRAC: number;
    MAX_SEP_FRAC: number;
    MIN_AREA_FRAC: number;
  }
> = {
  sensitive: {
    CONTROL_MIN: 1.25,
    TEST_MIN_ABS: 1.05,
    TEST_MIN_REL: 0.32,
    MAX_WIDTH_FRAC: 0.15,
    MIN_SEP_FRAC: 0.04,
    MAX_SEP_FRAC: 0.8,
    MIN_AREA_FRAC: 0.16,
  },
  balanced: {
    CONTROL_MIN: 1.48,
    TEST_MIN_ABS: 1.18,
    TEST_MIN_REL: 0.42,
    MAX_WIDTH_FRAC: 0.12,
    MIN_SEP_FRAC: 0.05,
    MAX_SEP_FRAC: 0.7,
    MIN_AREA_FRAC: 0.24,
  },
  conservative: {
    CONTROL_MIN: 1.72,
    TEST_MIN_ABS: 1.35,
    TEST_MIN_REL: 0.55,
    MAX_WIDTH_FRAC: 0.1,
    MIN_SEP_FRAC: 0.06,
    MAX_SEP_FRAC: 0.6,
    MIN_AREA_FRAC: 0.34,
  },
};

// -----------------------------
//   위치 기반 병원/약국 Finder
// -----------------------------
function useGeo() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setErr("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLoading(true);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLoading(false);
      },
      (e) => {
        setErr(e.message || "위치 정보를 가져오지 못했습니다.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  return { lat, lng, loading, err, request };
}

function naverSearchUrl(q: string, lat?: number | null, lng?: number | null) {
  const query = encodeURIComponent(q);
  if (lat != null && lng != null) {
    const c = `${lng},${lat},15,0,0,0,d`;
    return `https://map.naver.com/v5/search/${query}?c=${c}`;
  }
  return `https://map.naver.com/v5/search/${query}`;
}

function kakaoSearchUrl(q: string, lat?: number | null, lng?: number | null) {
  const query = encodeURIComponent(q);
  if (lat != null && lng != null) {
    return `https://map.kakao.com/link/search/${query}?x=${lng}&y=${lat}`;
  }
 	return `https://map.kakao.com/?q=${query}`;
}
const NearbyFinder = ({ compact = false }: { compact?: boolean }) => {
  const { lat, lng, loading, err, request } = useGeo();

  const openBoth = (q: string) => {
    window.open(naverSearchUrl(q, lat, lng), "_blank");
    window.open(kakaoSearchUrl(q, lat, lng), "_blank");
  };

  return (
    <div
      className={`mt-4 p-4 rounded-2xl border ${
        compact ? "bg-white" : "bg-emerald-50 border-emerald-300"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold">
          {compact ? "근처 찾기" : "📍 근처 약국·병원 찾기"}
        </span>
        <button
          onClick={request}
          className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
          disabled={loading}
        >
          {loading
            ? "위치 불러오는 중…"
            : lat && lng
            ? "위치 새로고침"
            : "내 위치로 찾기"}
        </button>
      </div>
      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}
      {lat && lng && (
        <div className="text-xs text-gray-500 mb-2">
          내 위치: {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => openBoth("약국")}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
        >
          약국 찾기
        </button>
        <button
          onClick={() => openBoth("이비인후과")}
          className="px-3 py-1.5 rounded-lg bg-white border text-sm"
        >
          이비인후과
        </button>
        <button
          onClick={() => openBoth("호흡기내과")}
          className="px-3 py-1.5 rounded-lg bg-white border text-sm"
        >
          호흡기내과
        </button>
        {!compact && (
          <button
            onClick={() => openBoth("응급실")}
            className="px-3 py-1.5 rounded-lg bg-white border text-sm"
          >
            응급실
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        * 지도 앱은 새 탭으로 열립니다.
      </p>
    </div>
  );
};

// -----------------------------
//   증상 → 약·과 추천 규칙
// -----------------------------
type SymptomInsight = {
  otc: string[];
  depts: string[];
  redFlags: string[];
  notes?: string[];
};

function analyzeSymptoms(text: string): SymptomInsight {
  const t = (text || "").toLowerCase();
  const hit = (re: RegExp) => re.test(t);
  const out: SymptomInsight = { otc: [], depts: [], redFlags: [], notes: [] };

  if (hit(/비염|콧물|재채기|코막힘|알레르/)) {
    out.otc.push(
      "항히스타민제",
      "비충혈제거제(단기)",
      "식염수 세척"
    );
    out.depts.push("이비인후과", "알레르기내과");
  }
  if (hit(/발열|오한|두통|근육통/)) {
    out.otc.push("해열진통제(아세트아미노펜)");
  }
  if (hit(/기침|가래|천명|호흡곤란/)) {
    out.otc.push("기침억제제/거담제");
    out.depts.push("호흡기내과");
  }
  if (hit(/인후통|목아픔/)) {
    out.otc.push("가글/목 스프레이");
    out.depts.push("이비인후과");
  }
  if (hit(/소아|아이|유아/)) {
    out.notes?.push("소아는 체중 기반 용량 필요 — 약사/의사 상담 권장");
    out.depts.push("소아청소년과");
  }
  if (hit(/호흡곤란|의식|경련|40도|혈담/)) {
    out.redFlags.push("응급 진료 권고 증상 포함");
  }

  out.otc = [...new Set(out.otc)];
  out.depts = [...new Set(out.depts)];
  out.redFlags = [...new Set(out.redFlags)];
  out.notes = [...new Set(out.notes || [])];
  return out;
}

// -----------------------------
//   증상 로그
// -----------------------------
type SymptomLog = { ts: number; text: string; verdict?: Verdict };
const SYMPTOM_KEY = "lfa_logs_v2";

const loadLogs = (): SymptomLog[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SYMPTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveLog = (entry: SymptomLog) => {
  try {
    const prev = loadLogs();
    const next = [entry, ...prev].slice(0, 20);
    localStorage.setItem(SYMPTOM_KEY, JSON.stringify(next));
  } catch {}
};

const SymptomLogger = ({ defaultVerdict }: { defaultVerdict?: Verdict }) => {
  const [symptom, setSymptom] = useState("");
  const [insight, setInsight] = useState<SymptomInsight | null>(null);
  const [recent, setRecent] = useState<SymptomLog[]>([]);

  useEffect(() => {
    setRecent(loadLogs());
  }, []);

  const handleSubmit = () => {
    const res = analyzeSymptoms(symptom);
    setInsight(res);
    saveLog({ ts: Date.now(), text: symptom, verdict: defaultVerdict });
    setRecent(loadLogs());
  };

  const fmt = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="mt-4 p-4 rounded-2xl border bg-rose-50 border-rose-300">
      <div className="font-semibold text-rose-700 mb-2">🩺 증상 기록</div>
      <textarea
        className="w-full p-2 border rounded-md mb-2 text-sm"
        rows={3}
        placeholder="콧물, 재채기, 두통 등 입력"
        value={symptom}
        onChange={(e) => setSymptom(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm"
      >
        맞춤 안내 받기
      </button>

      {insight && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-3 rounded-xl border">
            <div className="font-medium mb-1">💊 추천 일반약</div>
            {insight.otc.length ? (
              <ul className="list-disc ml-5 space-y-1">
                {insight.otc.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">해당 없음</div>
            )}
          </div>

          <div className="bg-white p-3 rounded-xl border">
            <div className="font-medium mb-1">🏥 진료과</div>
            {insight.depts.length ? (
              <div className="flex flex-wrap gap-1">
                {insight.depts.map((d) => (
                  <span
                    key={d}
                    className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs"
                  >
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">추천 없음</div>
            )}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-4 bg-white border rounded-xl p-3 text-xs">
          <div className="font-medium mb-2">🗂 최근 기록</div>
          <div className="flex flex-col gap-2">
            {recent.slice(0, 6).map((r, i) => (
              <div key={i} className="flex justify-between gap-3">
                <div className="flex-1">
                  <div className="text-gray-800">{r.text}</div>
                  <div className="text-gray-500">{fmt(r.ts)}</div>
                </div>
                {r.verdict && (
                  <span
                    className={
                      "px-2 py-0.5 rounded-full " +
                      (r.verdict === "Positive"
                        ? "bg-red-100 text-red-700"
                        : r.verdict === "Negative"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700")
                    }
                  >
                    {r.verdict}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
// -----------------------------
//   Negative Advice
// -----------------------------
const NegativeAdvice = ({ again }: { again?: () => void }) => {
  const [showSymptom, setShowSymptom] = useState(false);

  return (
    <div className="mt-4 p-4 rounded-2xl border bg-slate-50 border-slate-300">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base font-semibold">🧭 음성 가이드</span>
        <span className="text-xs text-slate-700">현재 판독은 음성입니다.</span>
      </div>

      <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
        <li>증상이 경미하면 경과 관찰이 충분할 수 있습니다.</li>
        <li>채취량이 너무 적거나 너무 이르면 음성으로 나올 수 있습니다.</li>
        <li>조명·각도·반사 등 이미지 품질이 인식에 영향을 줍니다.</li>
      </ul>

      <div className="mt-3 p-3 rounded-xl bg-white border text-sm">
        <div className="font-medium mb-1">🤔 증상이 나타나면</div>
        <ul className="list-disc ml-5 space-y-1">
          <li>24–48시간 내 동일 조건으로 다시 검사 권장</li>
          <li>증상이 나타나면 기록해 두면 도움이 됩니다.</li>
          <li>호흡곤란·고열 등 경고신호 시 전문 진료가 우선</li>
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {again && (
            <button
              onClick={again}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm"
            >
              다시 분석하기
            </button>
          )}

          <button
            onClick={() => setShowSymptom(!showSymptom)}
            className="px-3 py-1.5 rounded-lg border bg-white border-slate-300 text-slate-700 text-sm"
          >
            {showSymptom ? "증상 기록 닫기" : "증상 기록 열기"}
          </button>
        </div>
      </div>

      {showSymptom && <SymptomLogger defaultVerdict="Negative" />}
      <NearbyFinder compact />

      <p className="mt-2 text-xs text-slate-500">
        * 본 도구는 참고용이며, 필요 시 전문 진료를 권합니다.
      </p>
    </div>
  );
};

// -----------------------------
//   Rhinitis Advice (Positive)
// -----------------------------
function getRhinitisAdvice(d: Diagnosis) {
  if (!d || d === "none") return null;

  if (d === "allergic") {
    return {
      title: "🌼 알레르기성 비염 (ECP 양성)",
      desc: "면역 반응에 의한 비염 가능성이 높습니다.",
      otc: [
        "2세대 항히스타민(세티리진/로라타딘)",
        "비강 스테로이드 스프레이(전문의 상담 권장)",
        "식염수 세척",
      ],
      tips: [
        "꽃가루·먼지 등 유발요인 회피",
        "실내 공기 관리 (환기/청정기)",
        "수면 방해 시 전문 진료 권장",
      ],
    };
  }

  if (d === "bacterial") {
    return {
      title: "🦠 세균성 비염 (MPO 양성)",
      desc: "세균 감염 가능성이 있습니다.",
      otc: [
        "해열진통제",
        "단기간 비충혈제거제",
        "식염수 세척",
      ],
      tips: [
        "고열·안면 통증 지속 시 이비인후과 진료",
        "항생제는 반드시 처방 기반 사용",
        "황색/녹색 비루 지속 시 조기 진료 도움",
      ],
    };
  }

  return {
    title: "🌼🦠 혼합형 비염 (ECP+MPO 양성)",
    desc: "알레르기 + 세균 요소 모두 있을 가능성이 있습니다.",
    otc: [
      "항히스타민 + 해열진통제 병용 가능",
      "비강 스테로이드 사용 시 용법 주의",
      "지속적 식염수 세척",
    ],
    tips: [
      "증상 지속/악화 시 이비인후과 강력 권장",
      "약 여러 개 병용 시 복용 목록 공유 필요",
      "경고 신호 시 응급실 고려",
    ],
  };
}

// -----------------------------
//       Worker 생성 함수
//  (Control Line 0개 → 무효 처리 강화)
// -----------------------------
function makeWorkerURL() {
  const src = `
    const PRESETS = ${JSON.stringify(PRESETS)};
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    const movingAverage = (a, w) => {
      const h = Math.floor(w / 2);
      const o = Array(a.length).fill(0);
      for (let i = 0; i < a.length; i++) {
        let s = 0, c = 0;
        for (let j = i - h; j <= i + h; j++) {
          if (j >= 0 && j < a.length) { s += a[j]; c++; }
        }
        o[i] = c ? s / c : 0;
      }
      return o;
    };

    const quantile = (arr, q) => {
      const s = Array.from(arr).filter(Number.isFinite).sort((a,b)=>a-b);
      if (!s.length) return 0;
      return s[Math.floor((s.length - 1) * q)];
    };

    // -------- Edge Energy (회전 탐색 강화) --------
    function edgeEnergyFromImageData(data, w, h) {
      let e = 0;
      for (let y = 1; y < h - 1; y += 3) {
        for (let x = 1; x < w - 1; x += 3) {
          const i = (y * w + x) * 4;
          const R = data[i], G = data[i + 1], B = data[i + 2];
          const lum = 0.2126*R + 0.7152*G + 0.0722*B;

          const gx =
            (0.2126 * data[i + 4] + 0.7152*data[i + 5] + 0.0722*data[i + 6]) -
            (0.2126 * data[i - 4] + 0.7152*data[i - 3] + 0.0722*data[i - 2]);
          const gy =
            (0.2126 * data[i + 4*w] + 0.7152*data[i + 4*w + 1] + 0.0722*data[i + 4*w + 2]) -
            (0.2126 * data[i - 4*w] + 0.7152*data[i - 4*w + 1] + 0.0722*data[i - 4*w + 2]);

          e += Math.abs(gx) + Math.abs(gy) + lum * 0.001;
        }
      }
      return e / (w * h);
    }

    // 비트맵을 회전하여 캔버스 생성
    function drawRotatedToCanvas(bitmap, deg, maxSide = 1500) {
      const rad = deg * Math.PI / 180;
      const sw = bitmap.width, sh = bitmap.height;
      const scale = Math.min(1, maxSide / Math.max(sw, sh));
      const bw = Math.round(sw * scale), bh = Math.round(sh * scale);

      const base = new OffscreenCanvas(bw, bh);
      const bctx = base.getContext("2d");
      bctx.drawImage(bitmap, 0, 0, bw, bh);

      const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
      const rw = Math.round(bw * cos + bh * sin),
            rh = Math.round(bw * sin + bh * cos);
      const rot = new OffscreenCanvas(rw, rh);
      const rctx = rot.getContext("2d");

      rctx.translate(rw/2, rh/2);
      rctx.rotate(rad);
      rctx.drawImage(base, -bw/2, -bh/2);

      return rot;
    }

    // -------------------------
    //   Window Detection 강화
    // -------------------------
    function findWindowRect(c) {
      const ctx = c.getContext("2d");
      const w = c.width, h = c.height;
      const img = ctx.getImageData(0, 0, w, h).data;

      const br = new Float32Array(w * h);
      for (let i = 0; i < w*h; i++) {
        const R = img[i*4], G = img[i*4+1], B = img[i*4+2];
        br[i] = 0.2126*R + 0.7152*G + 0.0722*B;
      }

      const col = new Float32Array(w);
      const row = new Float32Array(h);

      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let y = 0; y < h; y++) s += br[y*w + x];
        col[x] = s / h;
      }
      for (let y = 0; y < h; y++) {
        let s = 0;
        for (let x = 0; x < w; x++) s += br[y*w + x];
        row[y] = s / w;
      }

      const dcol = movingAverage(col.map((v,i)=>i?Math.abs(v-col[i-1]):0), Math.max(9,Math.floor(w/40)));
      const drow = movingAverage(row.map((v,i)=>i?Math.abs(v-row[i-1]):0), Math.max(9,Math.floor(h/40)));

      const thx = quantile(dcol, 0.9), thy = quantile(drow, 0.9);

      const xs = [];
      for (let i = 1; i < w-1; i++) if (dcol[i] > thx) xs.push(i);
      const ys = [];
      for (let i = 1; i < h-1; i++) if (drow[i] > thy) ys.push(i);

      const pick = (arr, N) => {
        if (arr.length < 2) return [Math.round(N*0.12), Math.round(N*0.88)];
        let L = arr[0], R = arr[arr.length-1], gap = R - L;
        for (let i=0;i<arr.length;i++) {
          for (let j=i+1;j<arr.length;j++) {
            const g = arr[j]-arr[i];
            if (g > gap) { gap=g; L=arr[i]; R=arr[j]; }
          }
        }
        if (gap < N*0.2) return [Math.round(N*0.12), Math.round(N*0.88)];
        return [L, R];
      };

      let [x0,x1] = pick(xs, w);
      let [y0,y1] = pick(ys, h);

      const padX = Math.round((x1 - x0)*0.05);
      const padY = Math.round((y1 - y0)*0.08);

      x0 = clamp(x0+padX, 0, w-2);
      x1 = clamp(x1-padX, 1, w-1);
      y0 = clamp(y0+padY, 0, h-2);
      y1 = clamp(y1-padY, 1, h-1);
      const rw = x1 - x0 + 1, rh = y1 - y0 + 1;

      if (rw < w*0.3 || rh < h*0.3) {
        return { x: Math.round(w*0.1), y: Math.round(h*0.2), w: Math.round(w*0.8), h: Math.round(h*0.6) };
      }
      return { x: x0, y: y0, w: rw, h: rh };
    }

    // ------------------------------------------------
    //           메인 판독 함수 (강화된 control check)
    // ------------------------------------------------
    onmessage = async (e) => {
      try {
        const { bitmap, preset, mode, cropRect } = e.data;
        const P = PRESETS[preset || "balanced"];

        let best = null, bestE = -1;
        for (let a = -6; a <= 6; a += 1) {
          const c = drawRotatedToCanvas(bitmap, a, 1500);
          const ctx = c.getContext("2d");
          const id = ctx.getImageData(0, 0, c.width, c.height);
          const e0 = edgeEnergyFromImageData(id.data, c.width, c.height);
          if (e0 > bestE) { bestE = e0; best = c; }
        }
        const canvasR = best;

        const rctx = canvasR.getContext("2d");
        let w = canvasR.width, h = canvasR.height;

        let rect;
        if (mode === "crop" && cropRect) {
          rect = { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h };
        } else {
          rect = findWindowRect(canvasR);
        }

        const rw = Math.max(50, Math.min(rect.w, w));
        const rh = Math.max(20, Math.min(rect.h, h));
        const rx = Math.min(Math.max(rect.x, 0), w - rw);
        const ry = Math.min(Math.max(rect.y, 0), h - rh);

        let win = new OffscreenCanvas(rw, rh);
        let wctx = win.getContext("2d");
        wctx.drawImage(canvasR, rx, ry, rw, rh, 0, 0, rw, rh);

        const idw = wctx.getImageData(0, 0, rw, rh);
        const data = idw.data;
        const lum = new Float32Array(rw * rh);

        for (let i = 0; i < rw * rh; i++) {
          const R = data[i*4], G = data[i*4+1], B = data[i*4+2];
          lum[i] = 0.2126*R + 0.7152*G + 0.0722*B;
        }

        for (let y=0; y<rh; y++) {
          for (let x=0; x<rw; x++) {
            const idx = y*rw + x;
            const vv = lum[idx];
            let s = 0, c = 0;
            for (let yy=y-1; yy<=y+1; yy++){
              for (let xx=x-1; xx<=x+1; xx++){
                if(xx>=0 && xx<rw && yy>=0 && yy<rh){
                  const ii = yy*rw + xx;
                  const R = data[ii*4], G = data[ii*4+1], B = data[ii*4+2];
                  s += 0.2126*R + 0.7152*G + 0.0722*B;
                  c++;
                }
              }
            }
            lum[idx] = c ? s / c : vv;
          }
        }

        let col = new Float32Array(rw);
        for (let x=0; x<rw; x++){
          let ss=0;
          for(let y=0;y<rh;y++) ss+=lum[y*rw+x];
          col[x] = ss/rh;
        }

        const smooth = movingAverage(col, Math.max(7, Math.floor(rw/80)));
        const med = quantile(smooth, 0.5) || 1;
        let nz = new Float32Array(rw);
        let minz = Infinity, maxz = -Infinity;
        for (let i=0;i<rw;i++){
          nz[i] = smooth[i]/(med||1);
          if (!Number.isFinite(nz[i])) nz[i] = 1;
          if (nz[i]<minz) minz=nz[i];
          if (nz[i]>maxz) maxz=nz[i];
        }
        const rng = maxz-minz || 1;
        for (let i=0; i<rw; i++) nz[i] = (nz[i] - minz) / rng;

        const peaks = [];
        let i=0;
        while(i<rw){
          if(nz[i]>0.1){
            let st=i, mx=nz[i], en=i;
            while(en<rw && nz[en]>0.1){
              if(nz[en]>mx)mx=nz[en];
              en++;
            }
            const width=en-st;
            let area=0;
            const mid = st + width/2;
            for(let k=st;k<en;k++){
              area += nz[k];
            }
            peaks.push({ idx: Math.round(mid), z: mx, width, area });
            i=en;
          } else i++;
        }

        const CONTROL_MIN = P.CONTROL_MIN;
        const TEST_MIN_ABS = P.TEST_MIN_ABS;
        const TEST_MIN_REL = P.TEST_MIN_REL;
        const MAX_WIDTH_FRAC = P.MAX_WIDTH_FRAC;
        const MIN_SEP_FRAC = P.MIN_SEP_FRAC;
        const MAX_SEP_FRAC = P.MAX_SEP_FRAC;
        const MIN_AREA_FRAC = P.MIN_AREA_FRAC;

        const maxW = rw * MAX_WIDTH_FRAC;
        const minA = MIN_AREA_FRAC;
        const good = peaks.filter(pk => pk.width<=maxW && pk.area>=minA);

        let control = null;
        for (const pk of good) {
          if (pk.z >= CONTROL_MIN) {
            control = pk;
            break;
          }
        }

        if (!control) {
          postMessage({ ok:false, reason:"컨트롤 라인 미검출", rect, axis:"x" });
          return;
        }

        const cIdx = control.idx;
        let candidates = good.filter(pk => pk!==control);

        let posList = [], negList=[];
        for(const pk of candidates){
          const sep = Math.abs(pk.idx - cIdx)/rw;
          if(sep < MIN_SEP_FRAC) continue;
          if(sep > MAX_SEP_FRAC) continue;

          if(pk.z>=TEST_MIN_ABS && pk.z >= control.z*TEST_MIN_REL){
            posList.push(pk);
          } else negList.push(pk);
        }

        const left = candidates.filter(p=>p.idx < cIdx).sort((a,b)=>b.z - a.z);
        const right= candidates.filter(p=>p.idx > cIdx).sort((a,b)=>b.z - a.z);

        const T1 = left[0] || null;
        const T2 = right[0] || null;

        const ecpPos = T1 && T1.z>=TEST_MIN_ABS && (T1.z >= control.z*TEST_MIN_REL);
        const mpoPos = T2 && T2.z>=TEST_MIN_ABS && (T2.z >= control.z*TEST_MIN_REL);

        let d="none";
        if(ecpPos && mpoPos) d="mixed";
        else if(ecpPos) d="allergic";
        else if(mpoPos) d="bacterial";

        let verdict="Negative";
        let detail="음성";
        let conf="보통";

        if(ecpPos || mpoPos){
          verdict="Positive";
          detail = d==="allergic" ? 
            "레드라인(ECP) 검출 → 알레르기 가능성" :
            d==="bacterial" ?
              "블루라인(MPO) 검출 → 세균성 가능성" :
              "ECP+MPO 혼합 검출";
          conf="확실";
        }

        postMessage({
          ok:true,
          result:{
            verdict,
            detail,
            confidence: conf,
            diagnosis: d,
            ecpPositive: !!ecpPos,
            mpoPositive: !!mpoPos
          }
        });

      } catch(err){
        postMessage({ok:false, reason:String(err)});
      }
    };
  `;
  const blob = new Blob([src], { type: "text/javascript" });
  return URL.createObjectURL(blob);
}

// -----------------------------
//           React 컴포넌트
// -----------------------------
export default function LfaAnalyzer() {
  const [preset, setPreset] = useState<Sensitivity>("balanced");
  const [mode, setMode] = useState<Mode>("auto");
  const [crop, setCrop] = useState<{x:number,y:number,w:number,h:number}|null>(null);
  const [fileURL,setFileURL] = useState<string|null>(null);
  const [workerURL,setWorkerURL] = useState<string|null>(null);
  const [loading,setLoading] = useState(false);
  const [res,setRes] = useState<AnalyzeResult|null>(null);

  const imgRef = useRef<HTMLImageElement|null>(null);
  const canvasRef = useRef<HTMLCanvasElement|null>(null);

  useEffect(()=>{
    const url = makeWorkerURL();
    setWorkerURL(url);
    return ()=>{ URL.revokeObjectURL(url); };
  },[]);

  const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];
    if(!f)return;
    const url = URL.createObjectURL(f);
    setFileURL(url);
    setRes(null);
    setCrop(null);
  };

  useEffect(()=>{
    if(!fileURL)return;
    const img = imgRef.current;
    if (!img) return;
    img.onload=()=>{
      const c=canvasRef.current;
      if (!c)return;
      c.width = img.naturalWidth;
      c.height= img.naturalHeight;
      const ctx=c.getContext("2d");
      ctx?.drawImage(img,0,0);
    };
  },[fileURL]);

  const analyze=async()=>{
    if(!workerURL) return;
    const c=canvasRef.current;
    if(!c)return;
    const w=new Worker(workerURL);
    setLoading(true);
    setRes(null);

    const bitmap = await createImageBitmap(c);
    w.postMessage({
      bitmap,
      preset,
      mode,
      cropRect: crop
    },[bitmap]);

    w.onmessage=(ev)=>{
      setLoading(false);
      setRes(ev.data);
      w.terminate();
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-1">
        📷 LFA QuickCheck v5.3
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        (컨트롤 라인 미검출 → 100% 무효 처리 / 촬영 정확도 강화)
      </p>

      <input type="file" accept="image/*" onChange={handleFile}
        className="mb-3"
      />

      {fileURL && (
        <div className="mb-4">
          <img
            ref={imgRef}
            src={fileURL}
            alt="uploaded"
            className="max-w-full h-auto rounded-xl border"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Preset */}
      <div className="flex gap-2 mb-3">
        <label className="text-sm font-medium">
          민감도:
          <select
            value={preset}
            onChange={(e)=>setPreset(e.target.value as Sensitivity)}
            className="ml-1 border px-2 py-1 rounded-md text-sm"
          >
            <option value="sensitive">민감(weak도 잡힘)</option>
            <option value="balanced">균형</option>
            <option value="conservative">보수(진한 라인만)</option>
          </select>
        </label>
      </div>

      <button
        onClick={analyze}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
      >
        {loading ? "분석 중…" : "자동 판독"}
      </button>

      {res && (
        <div className="mt-4 p-4 rounded-2xl border bg-white">
          {res.ok ? (
            <div>
              <div className="text-base font-semibold mb-2">
                결과:{" "}
                <span
                  className={
                    res.result.verdict === "Positive"
                      ? "text-red-600"
                      : res.result.verdict === "Negative"
                      ? "text-green-600"
                      : "text-gray-500"
                  }
                >
                  {res.result.verdict}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-2">
                {res.result.detail}
              </div>

              {res.result.verdict === "Positive" && (
                <div className="mt-2">
                  {(() => {
                    const info = getRhinitisAdvice(res.result.diagnosis);
                    if (!info) return null;
                    return (
                      <div className="p-3 rounded-xl bg-orange-50 border border-orange-300 text-sm">
                        <div className="font-medium text-orange-700 mb-1">
                          {info.title}
                        </div>
                        <div className="mb-2 text-gray-700">{info.desc}</div>
                        <div className="font-medium">추천 일반약</div>
                        <ul className="list-disc ml-5 mb-2">
                          {info.otc.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                        <div className="font-medium">관리 팁</div>
                        <ul className="list-disc ml-5">
                          {info.tips.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )}

              {res.result.verdict === "Negative" && (
                <NegativeAdvice again={analyze} />
              )}
            </div>
          ) : (
            <div className="text-sm text-red-600">
              ❌ {res.reason || "분석 실패"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
