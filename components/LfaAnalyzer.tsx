"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * LFA QuickCheck v5.4 (Worker + Crop + 3-Line ECP/MPO, C/M/E 전용 튜닝)
 *
 * - Web Worker로 무거운 연산 분리 → 메인 프리즈 최소화
 * - 대용량 이미지 자동 축소(최대 1400px)
 * - Crop 모드(마우스/터치 드래그)로 로고·여백 제외하고 C/T 창만 분석
 * - 3라인 구조: C + M(MPO) + E(ECP) 고정형 키트에 맞게 라인 매핑
 *   - Control(가장 강한 peak) 기준으로 거리 가까운 순:
 *     ① MPO, ② ECP 로 인식
 * - Control 라인이 없거나 매우 약하면 즉시 무효 처리
 * - 테스트 라인 양성 기준 완화 (실제 MPO/ECP만 잘 잡히도록)
 */

type Verdict = "Positive" | "Negative" | "Invalid";
type Sensitivity = "sensitive" | "balanced" | "conservative";
type ControlPos = "auto" | "left" | "right" | "top" | "bottom";
type Mode = "auto" | "crop";
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
      reason?: "nopeaks" | "noControl" | string;
      rect?: unknown;
      axis?: "x" | "y";
    };

// ---------- 판정 프리셋 ----------
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
    CONTROL_MIN: 1.2,
    TEST_MIN_ABS: 1.0,
    TEST_MIN_REL: 0.32,
    MAX_WIDTH_FRAC: 0.16,
    MIN_SEP_FRAC: 0.04,
    MAX_SEP_FRAC: 0.8,
    MIN_AREA_FRAC: 0.16,
  },
  balanced: {
    CONTROL_MIN: 1.45,
    TEST_MIN_ABS: 1.15,
    TEST_MIN_REL: 0.42,
    MAX_WIDTH_FRAC: 0.12,
    MIN_SEP_FRAC: 0.05,
    MAX_SEP_FRAC: 0.7,
    MIN_AREA_FRAC: 0.24,
  },
  conservative: {
    CONTROL_MIN: 1.7,
    TEST_MIN_ABS: 1.35,
    TEST_MIN_REL: 0.55,
    MAX_WIDTH_FRAC: 0.1,
    MIN_SEP_FRAC: 0.06,
    MAX_SEP_FRAC: 0.6,
    MIN_AREA_FRAC: 0.34,
  },
};

// -----------------------------
// 공통: 내 위치 기반 약국/병원 찾기
// -----------------------------
function useGeo() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setErr("이 브라우저에서는 위치 기능을 지원하지 않습니다.");
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
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
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

const NearbyFinder: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
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
            ? "내 위치 새로고침"
            : "내 위치로 찾기"}
        </button>
      </div>
      {err && <div className="text-xs text-red-600 mb-2">위치 오류: {err}</div>}
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
          약국 찾기 (네이버/카카오)
        </button>
        <button
          onClick={() => openBoth("이비인후과")}
          className="px-3 py-1.5 rounded-lg bg-white border text-sm"
        >
          이비인후과 찾기
        </button>
        <button
          onClick={() => openBoth("호흡기내과")}
          className="px-3 py-1.5 rounded-lg bg-white border text-sm"
        >
          호흡기내과 찾기
        </button>
        {!compact && (
          <button
            onClick={() => openBoth("응급실")}
            className="px-3 py-1.5 rounded-lg bg-white border text-sm"
          >
            응급실 찾기
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        * 새 탭으로 네이버/카카오 지도를 동시에 엽니다. HTTPS에서 위치 권한을
        허용해야 정확합니다.
      </p>
    </div>
  );
};

// -----------------------------
// 증상 → 약/과추천/주의신호 규칙 + 기록
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

  if (hit(/비염|콧물|재채기|코막힘|가려움|알레르/)) {
    out.otc.push(
      "항히스타민(세티리진, 로라타딘 등)",
      "비충혈제거제 단기 사용",
      "식염수 세척"
    );
    out.depts.push("이비인후과", "알레르기내과");
    out.notes?.push("수면 장애/지속 시 전문 진료 권장");
  }

  if (hit(/발열|열|오한|두통|몸살|근육통|통증/)) {
    out.otc.push("해열·진통제(아세트아미노펜 등)");
    out.depts.push("가정의학과", "내과");
  }

  if (hit(/기침|가래|호흡곤란|숨참|천명|흉통|가슴 통증/)) {
    out.otc.push("기침억제제·거담제", "가글/목 스프레이");
    out.depts.push("호흡기내과", "가정의학과");
  }

  if (hit(/인후통|목아픔|연하통/)) {
    out.otc.push("가글/살균제", "진통제");
    out.depts.push("이비인후과");
  }

  if (hit(/소아|아동|유아|아이/)) {
    out.notes?.push("소아는 체중 기반 용량 계산 필요 — 약사·의사 상담 권장");
    if (!out.depts.includes("소아청소년과")) out.depts.push("소아청소년과");
  }

  if (hit(/호흡곤란|청색증|의식 저하|경련|탈수|혈담|40도|39도/)) {
    out.redFlags.push("호흡곤란/의식변화/고열 지속 등 응급 징후");
  }

  if (hit(/흉통|가슴통증/)) {
    out.redFlags.push("흉통 동반 — 즉시 진료 권고");
  }

  if (hit(/임신|임부|산모/)) {
    out.notes?.push("임신 중에는 일반약 복용 전 반드시 전문 상담");
  }

  out.otc = Array.from(new Set(out.otc));
  out.depts = Array.from(new Set(out.depts));
  out.redFlags = Array.from(new Set(out.redFlags));
  out.notes = Array.from(new Set(out.notes || []));

  return out;
}

type SymptomLog = {
  ts: number;
  text: string;
  verdict?: Verdict;
};

const SYMPTOM_KEY = "lfa_symptom_logs_v1";

const loadLogs = (): SymptomLog[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SYMPTOM_KEY);
    return raw ? (JSON.parse(raw) as SymptomLog[]) : [];
  } catch {
    return [];
  }
};

const saveLog = (entry: SymptomLog) => {
  if (typeof window === "undefined") return;
  try {
    const prev = loadLogs();
    const next = [entry, ...prev].slice(0, 20);
    localStorage.setItem(SYMPTOM_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
};

const SymptomLogger: React.FC<{ defaultVerdict?: Verdict }> = ({
  defaultVerdict,
}) => {
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
    <div className="mt-4 p-4 rounded-2xl border border-rose-300 bg-rose-50">
      <div className="font-semibold text-rose-700 mb-2">
        🩺 증상 기록 및 맞춤 안내
      </div>
      <textarea
        placeholder="현재 증상을 입력하세요. (예: 콧물, 재채기, 두통, 기침, 목아픔, 소아)"
        className="w-full p-2 border rounded-md mb-2 text-sm"
        rows={3}
        value={symptom}
        onChange={(e) => setSymptom(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700"
      >
        맞춤 안내 받기
      </button>

      {insight && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border p-3 text-sm">
            <div className="font-medium mb-1">💊 추천 일반의약품(카테고리)</div>
            {insight.otc.length ? (
              <ul className="list-disc ml-5 space-y-1">
                {insight.otc.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">
                입력된 증상으로 추천 항목이 없습니다.
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              * 기존 질환/복용약에 따라 적합성이 달라질 수 있어요.
            </p>
          </div>

          <div className="bg-white rounded-xl border p-3 text-sm">
            <div className="font-medium mb-1">🏥 추천 진료과</div>
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
              <div className="text-gray-500">특정 진료과 추천 없음</div>
            )}

            {insight.redFlags.length > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                ⚠️ 즉시 진료 권고: {insight.redFlags.join(" · ")}
              </div>
            )}

            {insight.notes && insight.notes.length > 0 && (
              <ul className="mt-2 list-disc ml-5 text-xs text-gray-600 space-y-1">
                {insight.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-2">
            <NearbyFinder compact />
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border p-3">
          <div className="font-medium text-sm mb-2">🗂 최근 기록</div>
          <div className="flex flex-col gap-2 text-xs">
            {recent.slice(0, 6).map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3"
              >
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

const NegativeAdvice: React.FC<{ again?: () => void }> = ({ again }) => {
  const [showSymptom, setShowSymptom] = useState(false);

  return (
    <div className="mt-4 p-4 rounded-2xl border border-slate-300 bg-slate-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base font-semibold">🧭 음성 가이드</span>
        <span className="text-xs text-slate-700">
          이번 판독은 음성입니다.
        </span>
      </div>
      <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
        <li>증상이 없거나 경미하면 경과 관찰만으로 충분할 수 있습니다.</li>
        <li>채취 시점이 너무 이르거나 채취량이 적으면 음성으로 나올 수 있습니다.</li>
        <li>조명·각도·반사 등 이미지 품질 저하도 테스트 라인 인식에 영향을 줄 수 있습니다.</li>
      </ul>

      <div className="mt-3 p-3 rounded-xl bg-white border text-sm">
        <div className="font-medium mb-1">🤔 증상이 나타나거나 심해지면</div>
        <ul className="list-disc ml-5 space-y-1">
          <li>24–48시간 내 유사 조건으로 <b>다시 키트 검사</b>를 권장합니다.</li>
          <li>재채기·콧물·코막힘 등 뚜렷한 증상이 있으면 간단히 기록해 두세요.</li>
          <li>호흡곤란, 고열 지속 등 경고 신호 시 <b>의료기관 상담</b>이 우선입니다.</li>
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
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm bg-white hover:bg-slate-100"
          >
            {showSymptom ? "증상 기록 닫기" : "증상 기록 열기"}
          </button>
        </div>
      </div>

      {showSymptom && <SymptomLogger defaultVerdict="Negative" />}

      <NearbyFinder compact />
      <p className="mt-2 text-xs text-slate-500">
        * 이 도구는 참고용입니다. 필요 시 전문가 상담을 권장합니다.
      </p>
    </div>
  );
};

// -----------------------------
// 비염 타입별 맞춤 안내
// -----------------------------
function getRhinitisAdvice(d: Diagnosis) {
  if (!d || d === "none") return null;

  if (d === "allergic") {
    return {
      title: "🌼 알레르기성 비염 (ECP 양성 패턴)",
      desc: "주로 면역 반응(알레르기)에 의해 비염이 발생했을 가능성이 높습니다.",
      otc: [
        "2세대 항히스타민제 (세티리진, 로라타딘 등)",
        "비강 스테로이드 스프레이 (전문의 상담 후)",
        "식염수 비강 세척",
      ],
      tips: [
        "꽃가루·집먼지진드기·애완동물 털 등 유발 요인 회피",
        "실내 공기 관리(환기/공기청정기)와 마스크 활용",
        "수면 방해, 집중력 저하가 심하면 이비인후과·알레르기내과 진료 권장",
      ],
    };
  }

  if (d === "bacterial") {
    return {
      title: "🦠 세균성 비염 (MPO 양성 패턴)",
      desc: "세균 감염과 관련된 비염 가능성이 있습니다.",
      otc: [
        "해열·진통제 (두통·전신 통증 완화 목적)",
        "단기간 비충혈제거제 사용 (연속 장기 사용은 피하기)",
        "식염수 세척으로 진한 비루·코막힘 완화",
      ],
      tips: [
        "고열, 안면 통증, 심한 두통이 지속되면 이비인후과 진료 권장",
        "항생제는 꼭 전문의 처방에 따라 복용 (자가 복용 X)",
        "황색·녹색 비루가 오래 지속되면 조기 진료가 도움 될 수 있음",
      ],
    };
  }

  // mixed
  return {
    title: "🌼🦠 혼합형 비염 (ECP + MPO 모두 양성)",
    desc: "알레르기성 + 세균성 요소가 함께 있을 가능성이 있습니다.",
    otc: [
      "항히스타민제 + 증상에 따른 해열·진통제 병용 가능 (전문의 상담 권장)",
      "비강 스테로이드 및 비충혈제거제는 용법·용량에 주의",
      "지속적인 식염수 세척으로 점액 제거 및 점막 보호",
    ],
    tips: [
      "증상이 오래가거나 악화되면 이비인후과 진료를 강하게 권장",
      "여러 약을 동시에 복용 중이면, 현재 복용 약 목록을 의료진에게 꼭 공유",
      "호흡곤란, 의식 저하, 심한 안면 통증/두통이 동반되면 응급실 내원 고려",
    ],
  };
}

// -----------------------------
// Worker (문자열→Blob) — 무거운 분석 로직
// -----------------------------
function makeWorkerURL() {
  const src = `
const PRESETS = ${JSON.stringify(PRESETS)};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const movingAverage = (a, w) => {
  const h = Math.floor(w / 2);
  const o = new Array(a.length).fill(0);
  for (let i = 0; i < a.length; i++) {
    let s = 0, c = 0;
    for (let j = i - h; j <= i + h; j++) {
      if (j >= 0 && j < a.length) {
        s += a[j];
        c++;
      }
    }
    o[i] = c ? s / c : 0;
  }
  return o;
};

const quantile = (arr, q) => {
  const s = Array.from(arr).filter(Number.isFinite).slice().sort((x, y) => x - y);
  if (!s.length) return 0;
  return s[Math.floor((s.length - 1) * q)];
};

function edgeEnergyFromImageData(data, w, h) {
  let e = 0;
  for (let y = 1; y < h - 1; y += 3) {
    for (let x = 1; x < w - 1; x += 3) {
      const i = (y * w + x) * 4;
      const gx =
        (0.2126 * data[i + 4] + 0.7152 * data[i + 5] + 0.0722 * data[i + 6]) -
        (0.2126 * data[i - 4] + 0.7152 * data[i - 3] + 0.0722 * data[i - 2]);
      const gy =
        (0.2126 * data[i + 4 * w] + 0.7152 * data[i + 4 * w + 1] + 0.0722 * data[i + 4 * w + 2]) -
        (0.2126 * data[i - 4 * w] + 0.7152 * data[i - 4 * w + 1] + 0.0722 * data[i - 4 * w + 2]);
      const R = data[i], G = data[i + 1], B = data[i + 2];
      const g = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      e += Math.abs(gx) + Math.abs(gy) + g * 0.001;
    }
  }
  return e / (w * h);
}

function drawRotatedToCanvas(bitmap, deg, maxSide = 1400) {
  const rad = (deg * Math.PI) / 180;
  const sw = bitmap.width, sh = bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const bw = Math.round(sw * scale), bh = Math.round(sh * scale);

  const base = new OffscreenCanvas(bw, bh);
  const bctx = base.getContext("2d");
  bctx.drawImage(bitmap, 0, 0, bw, bh);

  const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
  const rw = Math.round(bw * cos + bh * sin), rh = Math.round(bw * sin + bh * cos);
  const rot = new OffscreenCanvas(rw, rh);
  const rctx = rot.getContext("2d");
  rctx.translate(rw / 2, rh / 2);
  rctx.rotate(rad);
  rctx.drawImage(base, -bw / 2, -bh / 2);
  return rot;
}

function findWindowRect(c) {
  const ctx = c.getContext("2d");
  const w = c.width, h = c.height;
  const img = ctx.getImageData(0, 0, w, h).data;

  const br = new Float32Array(w * h);
  const sat = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const R = img[i], G = img[i + 1], B = img[i + 2];
      const max = Math.max(R, G, B), min = Math.min(R, G, B);
      br[y * w + x] = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      sat[y * w + x] = max === 0 ? 0 : (max - min) / max;
    }
  }

  const col = new Float32Array(w), row = new Float32Array(h);
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = 0; y < h; y++) s += br[y * w + x];
    col[x] = s / h;
  }
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = 0; x < w; x++) s += br[y * w + x];
    row[y] = s / w;
  }

  const dcol = movingAverage(
    Array.from(col).map((v, i) => (i ? Math.abs(v - col[i - 1]) : 0)),
    Math.max(9, Math.floor(w / 40))
  );
  const drow = movingAverage(
    Array.from(row).map((v, i) => (i ? Math.abs(v - row[i - 1]) : 0)),
    Math.max(9, Math.floor(h / 40))
  );

  const thx = quantile(dcol, 0.9), thy = quantile(drow, 0.9);

  const xs = [];
  for (let i = 1; i < w - 1; i++) {
    if (dcol[i] > thx && dcol[i] >= dcol[i - 1] && dcol[i] > dcol[i + 1]) xs.push(i);
  }
  const ys = [];
  for (let i = 1; i < h - 1; i++) {
    if (drow[i] > thy && drow[i] >= drow[i - 1] && drow[i] > drow[i + 1]) ys.push(i);
  }

  const pick = (arr, N) => {
    if (arr.length < 2) return [Math.round(N * 0.12), Math.round(N * 0.88)];
    let L = arr[0], R = arr[arr.length - 1], gap = R - L;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const g = arr[j] - arr[i];
        if (g > gap) {
          gap = g;
          L = arr[i];
          R = arr[j];
        }
      }
    }
    if (gap < N * 0.2) return [Math.round(N * 0.12), Math.round(N * 0.88)];
    return [L, R];
  };

  let tmp = pick(xs, w);
  let x0 = tmp[0], x1 = tmp[1];
  tmp = pick(ys, h);
  let y0 = tmp[0], y1 = tmp[1];

  const padX = Math.round((x1 - x0) * 0.03);
  const padY = Math.round((y1 - y0) * 0.05);
  x0 = clamp(x0 + padX, 0, w - 2);
  x1 = clamp(x1 - padX, 1, w - 1);
  y0 = clamp(y0 + padY, 0, h - 2);
  y1 = clamp(y1 - padY, 1, h - 1);

  const glareMask = new Uint8Array(w * h);
  const brHi = quantile(br, 0.965), brLo = quantile(br, 0.05);
  for (let i = 0; i < w * h; i++) {
    if (br[i] > brHi) glareMask[i] = 1;
    if (br[i] < brLo * 0.6) glareMask[i] = 1;
  }

  const win = [];
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) win.push(br[yy * w + xx]);
  }
  const p1 = quantile(win, 0.01), p99 = quantile(win, 0.99) || 1;
  let a = 255 / Math.max(1, p99 - p1);
  const b = -a * p1;
  a = a * 1.4;  // contrast 강화

  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const k = yy * w + xx;
      br[k] = clamp(a * br[k] + b, 0, 255);
    }
  }

  return { x0, x1, y0, y1, glareMask, br };
}

function analyzeWindow(c, rect) {
  const ctx = c.getContext("2d");
  const w = c.width;
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const x0 = rect.x0, x1 = rect.x1, y0 = rect.y0, y1 = rect.y1;
  const glareMask = rect.glareMask;

  const profX = [], profY = [];

  for (let x = x0; x <= x1; x++) {
    let s = 0, cnt = 0;
    for (let y = y0; y <= y1; y++) {
      const i = y * w + x;
      const ii = i * 4;
      if (glareMask[i]) continue;
      const R = data[ii], G = data[ii + 1], B = data[ii + 2];
      const sum = R + G + B || 1;
      const chroma = Math.max(0, R / sum - 0.5 * ((G / sum) + (B / sum)));
      s += chroma;
      cnt++;
    }
    profX.push(cnt ? s / cnt : 0);
  }

  for (let y = y0; y <= y1; y++) {
    let s = 0, cnt = 0;
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      const ii = i * 4;
      if (glareMask[i]) continue;
      const R = data[ii], G = data[ii + 1], B = data[ii + 2];
      const sum = R + G + B || 1;
      const chroma = Math.max(0, R / sum - 0.5 * ((G / sum) + (B / sum)));
      s += chroma;
      cnt++;
    }
    profY.push(cnt ? s / cnt : 0);
  }

  return { profX, profY };
}

function peaksFromProfile(arr) {
  const bg = movingAverage(arr, Math.max(11, Math.floor(arr.length / 14)));
  const detr = arr.map((v, i) => bg[i] - v);
  const mean = detr.reduce((a, b) => a + b, 0) / Math.max(1, detr.length);
  const q25 = quantile(detr, 0.25), q75 = quantile(detr, 0.75);
  const iqr = Math.max(1e-6, q75 - q25);
  const sigma = iqr / 1.349;
  const z = detr.map((v) => (v - mean) / (sigma || 1));
  const edgeMargin = Math.max(4, Math.floor(arr.length * 0.04));
  const peaks = [];

  for (let i = 1; i < z.length - 1; i++) {
    if (z[i] >= z[i - 1] && z[i] > z[i + 1]) {
      if (i < edgeMargin || z.length - 1 - i < edgeMargin) continue;
      const half = z[i] * 0.5;
      let L = i, R = i, area = z[i];
      while (L > 0 && z[L] > half) {
        L--;
        area += z[L];
      }
      while (R < z.length - 1 && z[R] > half) {
        R++;
        area += z[R];
      }
      peaks.push({ idx: i, z: z[i], width: R - L, area });
    }
  }

  peaks.sort((a, b) => b.z - a.z);
  const quality = (peaks[0] ? peaks[0].z : 0) + 0.8 * (peaks[1] ? peaks[1].z : 0);
  return { z, peaks, quality };
}

function analyzeCore(bitmap, sensitivity, controlPos, requireTwoLines, crop) {
  const angles = [];
  for (let a = -18; a <= 18; a += 2) angles.push(a);

  let best = null;
  for (const a of angles) {
    const c = drawRotatedToCanvas(bitmap, a);
    const ctx = c.getContext("2d");
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const e = edgeEnergyFromImageData(img.data, c.width, c.height);
    if (!best || e > best.energy) best = { angle: a, canvas: c, energy: e };
  }

  const out = best.canvas;
  const octx = out.getContext("2d");

  let rect;
  if (crop && crop.w > 4 && crop.h > 4) {
    const w = out.width, h = out.height;
    let x0 = Math.max(0, Math.min(w - 2, Math.round(crop.x)));
    let y0 = Math.max(0, Math.min(h - 2, Math.round(crop.y)));
    let x1 = Math.max(x0 + 1, Math.min(w - 1, Math.round(crop.x + crop.w)));
    let y1 = Math.max(y0 + 1, Math.min(h - 1, Math.round(crop.y + crop.h)));

    const img = octx.getImageData(0, 0, w, h);
    const data = img.data;
    const br = new Float32Array(w * h);
    const sat = new Float32Array(w * h);

    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const i = (yy * w + xx) * 4;
        const R = data[i], G = data[i + 1], B = data[i + 2];
        const max = Math.max(R, G, B), min = Math.min(R, G, B);
        br[yy * w + xx] = 0.2126 * R + 0.7152 * G + 0.0722 * B;
        sat[yy * w + xx] = max === 0 ? 0 : (max - min) / max;
      }
    }

    const glareMask = new Uint8Array(w * h);
    const brHi = quantile(br, 0.965), brLo = quantile(br, 0.05);
    for (let i = 0; i < w * h; i++) {
      if (br[i] > brHi) glareMask[i] = 1;
      if (br[i] < brLo * 0.6) glareMask[i] = 1;
    }

    const win = [];
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) win.push(br[yy * w + xx]);
    }
    const p1 = quantile(win, 0.01), p99 = quantile(win, 0.99) || 1;
    let a = 255 / Math.max(1, p99 - p1);
    const b = -a * p1;
    a = a * 1.4;
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const k = yy * w + xx;
        br[k] = clamp(a * br[k] + b, 0, 255);
      }
    }

    rect = { x0, x1, y0, y1, glareMask, br };
  } else {
    rect = findWindowRect(out);
  }

  const profiles = analyzeWindow(out, rect);
  const px = peaksFromProfile(profiles.profX);
  const py = peaksFromProfile(profiles.profY);

  const h = rect.y1 - rect.y0;
  const w2 = rect.x1 - rect.x0;

  let axis;
  if (h > w2 * 1.15) {
    axis = py.quality >= px.quality * 0.85 ? "y" : "x";
  } else {
    axis = px.quality >= py.quality ? "x" : "y";
  }

  const sel = axis === "x" ? px : py;
  const unit = axis === "x" ? rect.x1 - rect.x0 : rect.y1 - rect.y0;
  const preset = PRESETS[sensitivity];

  const maxWidth = Math.max(3, Math.round(unit * preset.MAX_WIDTH_FRAC));
  const valid = sel.peaks.filter((p) => p.width <= maxWidth && p.z > 0.45);

  if (!valid.length) {
    return { ok: false, reason: "nopeaks", rect, axis };
  }

  // Control = 가장 강한 peak
  const control = valid.slice().sort((a, b) => b.z - a.z)[0];

  if (!control || control.z < 0.8) {
    return { ok: false, reason: "noControl", rect, axis };
  }

  const tests = valid.filter((p) => p !== control);

  const testsByDist = tests
    .map((p) => ({ peak: p, dist: Math.abs(p.idx - control.idx) }))
    .sort((a, b) => a.dist - b.dist);

  let mpo = testsByDist[0] ? testsByDist[0].peak : null;
  let ecp = testsByDist[1] ? testsByDist[1].peak : null;

  const absMin = preset.TEST_MIN_ABS * 0.75;
  const relMin = preset.TEST_MIN_REL * 0.75;
  const areaFrac = preset.MIN_AREA_FRAC * 0.9;

  function testPositive(ctrl, t) {
    if (!t) return false;
    const absOK = t.z >= absMin;
    const relOK = t.z >= ctrl.z * relMin;
    const areaOK = t.area >= ctrl.area * areaFrac;
    return areaOK && (absOK || relOK);
  }

  const mpoPos = testPositive(control, mpo);
  const ecpPos = testPositive(control, ecp);

  let diagnosis = "none";
  if (mpoPos && ecpPos) diagnosis = "mixed";
  else if (mpoPos) diagnosis = "bacterial";
  else if (ecpPos) diagnosis = "allergic";

  let verdict = "Negative";
  if (mpoPos || ecpPos) verdict = "Positive";

  const confidence = control.z > 1.8 ? "확실" : "보통";
  const detail =
    "C=" +
    control.z.toFixed(2) +
    ", MPO=" +
    (mpo ? mpo.z.toFixed(2) : "0.00") +
    ", ECP=" +
    (ecp ? ecp.z.toFixed(2) : "0.00");

  return {
    ok: true,
    result: {
      verdict,
      detail,
      confidence,
      diagnosis,
      ecpPositive: !!ecpPos,
      mpoPositive: !!mpoPos,
    },
  };
}

self.onmessage = async (ev) => {
  try {
    const data = ev.data;
    const res = analyzeCore(
      data.bitmap,
      data.sensitivity,
      data.controlPos,
      data.requireTwoLines,
      data.crop
    );
    self.postMessage(res);
  } catch (err) {
    let msg = "worker-error";
    if (err && err.message) msg = err.message;
    self.postMessage({ ok: false, reason: msg });
  }
};
`;

  const blob = new Blob([src], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

// -----------------------------
// 메인 컴포넌트
// -----------------------------
export default function LfaAnalyzer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [sensitivity, setSensitivity] = useState<Sensitivity>("balanced");
  const [controlPos, setControlPos] = useState<ControlPos>("auto");
  const [requireTwoLines, setRequireTwoLines] = useState(true);

  const [result, setResult] = useState<{
    verdict: Verdict;
    detail: string;
    confidence: "확실" | "보통" | "약함";
    diagnosis?: Diagnosis;
    ecpPositive?: boolean;
    mpoPositive?: boolean;
  } | null>(null);

  const [busy, setBusy] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const procRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );
  const drag = useRef<{ sx: number; sy: number } | null>(null);

  const workerURLRef = useRef<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Worker 생성/해제
  useEffect(() => {
    const url = makeWorkerURL();
    workerURLRef.current = url;
    const w = new Worker(url);
    workerRef.current = w;

    return () => {
      w.terminate();
      URL.revokeObjectURL(url);
    };
  }, []);

  const drawToProcessCanvas = (img: HTMLImageElement) => {
    const maxSide = 1400;
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const scale = Math.min(1, maxSide / Math.max(sw, sh));
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);

    const c = procRef.current!;
    c.width = dw;
    c.height = dh;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, dw, dh);
    ctx.drawImage(img, 0, 0, dw, dh);

    const ov = overlayRef.current!;
    ov.width = dw;
    ov.height = dh;
  };

  const onPickFile = (f: File) => {
    setResult(null);
    setCrop(null);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const f = e.target.files?.[0];
      if (!f) return;
      onPickFile(f);
    } catch (err) {
      console.error("Image input error:", err);
    }
  };

  const stopDrag = (e: React.DragEvent) => e.preventDefault();

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  };

  // Overlay 드로잉
  const drawOverlay = useCallback(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext("2d")!;
    ctx.clearRect(0, 0, ov.width, ov.height);

    if (mode === "crop" && crop && crop.w > 4 && crop.h > 4) {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, ov.width, crop.y);
      ctx.fillRect(0, crop.y + crop.h, ov.width, ov.height - (crop.y + crop.h));
      ctx.fillRect(0, crop.y, crop.x, crop.h);
      ctx.fillRect(
        crop.x + crop.w,
        crop.y,
        ov.width - (crop.x + crop.w),
        crop.h
      );

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        crop.x + 0.5,
        crop.y + 0.5,
        crop.w - 1,
        crop.h - 1
      );
    }
  }, [crop, mode]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // Crop 드래그(마우스/터치)
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;

    const toImgCoordFromClient = (clientX: number, clientY: number) => {
      const r = ov.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * ov.width;
      const y = ((clientY - r.top) / r.height) * ov.height;
      return {
        x: Math.max(0, Math.min(ov.width, x)),
        y: Math.max(0, Math.min(ov.height, y)),
      };
    };

    const onDown = (clientX: number, clientY: number) => {
      if (mode !== "crop") return;
      const p = toImgCoordFromClient(clientX, clientY);
      drag.current = { sx: p.x, sy: p.y };
      setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
    };

    const onMove = (clientX: number, clientY: number) => {
      if (!drag.current) return;
      const p = toImgCoordFromClient(clientX, clientY);
      const { sx, sy } = drag.current;
      const x = Math.min(sx, p.x);
      const y = Math.min(sy, p.y);
      const w = Math.abs(p.x - sx);
      const h = Math.abs(p.y - sy);
      setCrop({ x, y, w, h });
    };

    const mdown = (e: MouseEvent) => {
      e.preventDefault();
      onDown(e.clientX, e.clientY);
    };
    const mmove = (e: MouseEvent) => {
      if (!drag.current) return;
      e.preventDefault();
      onMove(e.clientX, e.clientY);
    };
    const mup = () => {
      drag.current = null;
    };

    const tstart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      e.preventDefault();
      onDown(t.clientX, t.clientY);
    };
    const tmove = (e: TouchEvent) => {
      if (!drag.current) return;
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      e.preventDefault();
      onMove(t.clientX, t.clientY);
    };
    const tend = () => {
      drag.current = null;
    };

    ov.addEventListener("mousedown", mdown);
    window.addEventListener("mousemove", mmove);
    window.addEventListener("mouseup", mup);

    ov.addEventListener("touchstart", tstart, { passive: false });
    window.addEventListener("touchmove", tmove, { passive: false });
    window.addEventListener("touchend", tend);
    window.addEventListener("touchcancel", tend);

    return () => {
      ov.removeEventListener("mousedown", mdown);
      window.removeEventListener("mousemove", mmove);
      window.removeEventListener("mouseup", mup);

      ov.removeEventListener("touchstart", tstart);
      window.removeEventListener("touchmove", tmove);
      window.removeEventListener("touchend", tend);
      window.removeEventListener("touchcancel", tend);
    };
  }, [mode]);

  const analyze = useCallback(async () => {
    if (!procRef.current || !workerRef.current) return;

    try {
      setBusy(true);
      const c = procRef.current;
      const bitmap = await createImageBitmap(c);
      const w = workerRef.current!;

      const res: AnalyzeResult = await new Promise((resolve) => {
        const onMsg = (ev: MessageEvent) => {
          w.removeEventListener("message", onMsg as any);
          resolve(ev.data as AnalyzeResult);
        };
        w.addEventListener("message", onMsg as any);
        w.postMessage(
          {
            bitmap,
            sensitivity,
            controlPos,
            requireTwoLines,
            crop,
          },
          [bitmap as any]
        );
      });

      if (res.ok) {
        setResult(res.result);
        saveLog({
          ts: Date.now(),
          text: "",
          verdict: res.result.verdict,
        });
      } else if (res.reason === "nopeaks") {
        setResult({
          verdict: "Invalid",
          detail:
            "스트립을 찾지 못했습니다. (Crop 모드에서 C/T 창만 박스로 지정해보세요)",
          confidence: "약함",
        });
      } else if (res.reason === "noControl") {
        setResult({
          verdict: "Invalid",
          detail: "컨트롤 라인이 인식되지 않았습니다. 키트 결과 자체가 무효일 수 있습니다.",
          confidence: "약함",
        });
      } else {
        setResult({
          verdict: "Invalid",
          detail:
            "처리 실패(알 수 없음). 다른 각도/밝기에서 다시 시도해 주세요.",
          confidence: "약함",
        });
      }
    } catch (err: any) {
      console.error(err);
      setResult({
        verdict: "Invalid",
        detail: `처리 중 오류: ${err?.message || "unknown"}`,
        confidence: "약함",
      });
    } finally {
      setBusy(false);
    }
  }, [sensitivity, controlPos, requireTwoLines, crop]);

  // 이미지 로드되면 처리 캔버스에 그림 + auto 모드면 자동 분석
  useEffect(() => {
    if (!imageUrl || !imgRef.current) return;
    const img = imgRef.current;

    const onLoad = () => {
      drawToProcessCanvas(img);
      if (mode === "auto") {
        analyze();
      }
    };

    if (img.complete) {
      onLoad();
    } else {
      img.addEventListener("load", onLoad, { once: true });
      return () => {
        img.removeEventListener("load", onLoad);
      };
    }
  }, [imageUrl, mode, analyze]);

  const VerdictBadge = useMemo(() => {
    if (!result) return null;
    const base =
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold";
    if (result.verdict === "Positive")
      return (
        <span className={`${base} bg-red-100 text-red-800`}>✅ 양성</span>
      );
    if (result.verdict === "Negative")
      return (
        <span className={`${base} bg-green-100 text-green-800`}>🟢 음성</span>
      );
    return (
      <span className={`${base} bg-gray-200 text-gray-800`}>⚠️ 무효</span>
    );
  }, [result]);

  const advice = useMemo(
    () =>
      result?.diagnosis
        ? getRhinitisAdvice(result.diagnosis as Diagnosis)
        : null,
    [result?.diagnosis]
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-1">
        📷 LFA QuickCheck v5.4
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        3라인(C + M(MPO) + E(ECP)) 자동 판독 · Web Worker 기반 프리즈 방지 ·
        Crop 모드 및 모바일 드래그 지원.
      </p>

      <div
        onDrop={onDrop}
        onDragEnter={stopDrag}
        onDragOver={stopDrag}
        className="border-2 border-dashed rounded-2xl p-6 mb-4 flex flex-col items-center justify-center text-center hover:bg-gray-50"
      >
        <label htmlFor="mobileCameraInput" className="w-full cursor-pointer">
          <input
            id="mobileCameraInput"
            type="file"
            accept="image/*"
            className="hidden"
            multiple={false}
            onChange={onInput}
          />
          <div className="flex flex-col items-center gap-1">
            <div className="text-5xl">⬆️</div>
            <div className="font-medium">사진 업로드 / 드래그</div>
            <div className="text-xs text-gray-500">
              팁: Crop 모드에서 C/T 창만 박스로 지정하면 더 정확합니다.
            </div>
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
          onClick={() => analyze()}
          disabled={!imageUrl || busy}
        >
          {busy ? "분석 중…" : "분석"}
        </button>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">모드</label>
          <select
            className="px-2 py-1 border rounded-md"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as Mode);
            }}
          >
            <option value="auto">자동</option>
            <option value="crop">Crop(드래그)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">민감도</label>
          <select
            className="px-2 py-1 border rounded-md"
            value={sensitivity}
            onChange={(e) =>
              setSensitivity(e.target.value as Sensitivity)
            }
          >
            <option value="sensitive">Sensitive</option>
            <option value="balanced">Balanced</option>
            <option value="conservative">Conservative</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">컨트롤 위치</label>
          <select
            className="px-2 py-1 border rounded-md"
            value={controlPos}
            onChange={(e) =>
              setControlPos(e.target.value as ControlPos)
            }
          >
            <option value="auto">자동</option>
            <option value="left">왼쪽(C - M - E)</option>
            <option value="right">오른쪽(E - M - C)</option>
            <option value="top">위쪽(C - M - E)</option>
            <option value="bottom">아래쪽(E - M - C)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={requireTwoLines}
            onChange={(e) => setRequireTwoLines(e.target.checked)}
          />
          두 줄 요구(T 없으면 음성) — 2라인 키트용 옵션(3라인에선 영향 거의 없음)
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 원본 미리보기 */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100">
          <div className="aspect-video w-full relative">
            {imageUrl ? (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="orig"
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                원본 미리보기
              </div>
            )}
          </div>
          <div className="p-2 text-xs text-gray-500">원본</div>
        </div>

        {/* 처리용 캔버스 + Crop 오버레이 */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100">
          <div className="aspect-video w-full relative">
            <canvas
              ref={procRef}
              className="absolute inset-0 w-full h-full object-contain"
            />
            <canvas
              ref={overlayRef}
              className={
                "absolute inset-0 w-full h-full object-contain " +
                (mode === "crop" ? "cursor-crosshair" : "pointer-events-none")
              }
            />
          </div>
          <div className="p-2 text-xs text-gray-500">
            처리용 캔버스 {mode === "crop" ? "(드래그로 ROI 선택)" : ""}
          </div>
        </div>
      </div>

      {/* 판독 결과 */}
      <div className="mt-4 p-4 rounded-2xl border bg-white">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-base font-semibold">판독 결과</span>
          {VerdictBadge}
        </div>
        <div className="text-sm text-gray-700">
          {result
            ? `${result.detail} · 신뢰도: ${result.confidence}`
            : "사진을 올리고 ‘분석’을 누르세요. Web Worker로 멈춤 없이 처리됩니다."}
        </div>

        {result && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {"ecpPositive" in result && (
              <span
                className={
                  "px-2 py-1 rounded-full " +
                  (result.ecpPositive
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-700")
                }
              >
                T2 · ECP: {result.ecpPositive ? "양성" : "음성"}
              </span>
            )}
            {"mpoPositive" in result && (
              <span
                className={
                  "px-2 py-1 rounded-full " +
                  (result.mpoPositive
                    ? "bg-sky-100 text-sky-800"
                    : "bg-gray-100 text-gray-700")
                }
              >
                T1 · MPO: {result.mpoPositive ? "양성" : "음성"}
              </span>
            )}
            {result.diagnosis && result.diagnosis !== "none" && (
              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                해석:{" "}
                {result.diagnosis === "allergic"
                  ? "알레르기성 비염 패턴"
                  : result.diagnosis === "bacterial"
                  ? "세균성 비염 패턴"
                  : "혼합형 비염 패턴"}
              </span>
            )}
          </div>
        )}

        {mode === "crop" && (
          <div className="mt-2 text-xs text-amber-700">
            💡 ROI(초록 박스) 안의 C/T 창만 분석합니다. 로고/글자/구멍은
            제외해주세요.
          </div>
        )}
      </div>

      {/* 양성일 때: 비염 타입별 안내 + 증상 로거 + 근처 찾기 */}
      {result?.verdict === "Positive" && advice && (
        <div className="mt-4 p-4 rounded-2xl border border-amber-300 bg-amber-50">
          <div className="font-semibold mb-1">{advice.title}</div>
          <p className="text-sm text-amber-800 mb-2">{advice.desc}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium mb-1">
                💊 증상 완화에 참고할 수 있는 일반의약품
              </div>
              <ul className="list-disc ml-5 space-y-1">
                {advice.otc.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">
                📌 생활 습관 & 주의사항
              </div>
              <ul className="list-disc ml-5 space-y-1">
                {advice.tips.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {result?.verdict === "Positive" && (
        <>
          <SymptomLogger defaultVerdict="Positive" />
          <NearbyFinder />
        </>
      )}

      {result?.verdict === "Negative" && (
        <NegativeAdvice again={() => analyze()} />
      )}
    </div>
  );
}
