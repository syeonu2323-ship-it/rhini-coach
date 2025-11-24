"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** LFA QuickCheck v5.2 — (Control 없는 경우 무효 + 1줄/2줄 판독 강화 + 모바일 Crop)
 * - Web Worker: 메인 프리즈 방지
 * - Control 없는 경우 100% Invalid 강제
 * - 1줄 테스트(ECP only / MPO only) 정확 판독
 * - 2줄 테스트(혼합형) 노이즈 peak 제거
 * - 모바일에서도 Crop 드래그 가능 (touchstart/move/end)
 * - 3-Line KIT 구조(C + T1(ECP) + T2(MPO))
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
      reason?: string;
      rect?: unknown;
      axis?: "x" | "y";
    };

// ---------- 판독 프리셋 ----------
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
//   위치 정보 훅
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
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  return { lat, lng, loading, err, request };
}

function naverSearchUrl(
  q: string,
  lat?: number | null,
  lng?: number | null
) {
  const query = encodeURIComponent(q);
  if (lat != null && lng != null) {
    const c = `${lng},${lat},15,0,0,0,d`;
    return `https://map.naver.com/v5/search/${query}?c=${c}`;
  }
  return `https://map.naver.com/v5/search/${query}`;
}

function kakaoSearchUrl(
  q: string,
  lat?: number | null,
  lng?: number | null
) {
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
            ? "내 위치 새로고침"
            : "내 위치로 찾기"}
        </button>
      </div>
      {err && (
        <div className="text-xs text-red-600 mb-2">위치 오류: {err}</div>
      )}
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
          이비인후과 찾기
        </button>
      </div>
    </div>
  );
};

// -----------------------------
//   증상 분석 + 기록
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
    out.otc.push("항히스타민", "식염수 세척");
    out.depts.push("이비인후과");
  }

  if (hit(/기침|가래|호흡곤란|숨참/)) {
    out.depts.push("호흡기내과");
  }

  out.otc = [...new Set(out.otc)];
  out.depts = [...new Set(out.depts)];
  out.redFlags = [...new Set(out.redFlags)];
  out.notes = [...new Set(out.notes ?? [])];

  return out;
}

type SymptomLog = { ts: number; text: string; verdict?: Verdict };
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
  } catch {}
};

// -----------------------------
//   Control 라인 강화 검증 함수
// -----------------------------
function validateControl(control: Peak | null, peaks: Peak[], preset: any, unit: number) {
  if (!control) return false;

  // 1) 절대 세기 기준
  if (control.z < preset.CONTROL_MIN) return false;

  // 2) area 기준 (노이즈 제거)
  const avgArea = peaks.reduce((s, p) => s + p.area, 0) / Math.max(1, peaks.length);
  if (control.area < avgArea * 0.6) return false;

  // 3) 가장 강한 peak가 control이어야 한다
  const maxZ = Math.max(...peaks.map((p) => p.z));
  if (control.z < maxZ * 0.85) return false;

  // 4) 가장자리 노이즈 제거
  if (control.idx < unit * 0.05) return false;
  if (control.idx > unit * 0.95) return false;

  return true;
}
/* ------------------------------------
   Web Worker 코드 (자동 판독 엔진)
------------------------------------ */
const workerCode = () => {
  // Peak 계산 함수
  function compute_peaks(arr, h) {
    const peaks = [];
    const n = arr.length;
    const TH = 1.0;

    let rising = false;
    let base = 0;
    let peakIdx = 0;
    let peakZ = 0;

    for (let i = 1; i < n; i++) {
      const cur = arr[i];
      const prev = arr[i - 1];

      if (!rising && cur - prev > TH) {
        rising = true;
        base = prev;
        peakIdx = i;
        peakZ = cur;
      }

      if (rising) {
        if (cur > peakZ) {
          peakZ = cur;
          peakIdx = i;
        }
        if (prev - cur > TH) {
          const area = peakZ - base;
          const width = Math.abs(i - peakIdx);
          if (area > 0.2) {
            peaks.push({ idx: peakIdx, z: peakZ, width, area });
          }
          rising = false;
        }
      }
    }

    if (rising) {
      const area = peakZ - base;
      const width = 1;
      if (area > 0.2) {
        peaks.push({ idx: peakIdx, z: peakZ, width, area });
      }
    }
    return peaks;
  }

  // z-score 계산
  function zScoreLine(v) {
    const n = v.length;
    let sum = 0;
    for (let x of v) sum += x;
    const mean = sum / n;

    let ss = 0;
    for (let x of v) {
      const dx = x - mean;
      ss += dx * dx;
    }

    const sd = Math.sqrt(ss / n);
    const zarr = new Float32Array(n);
    const eps = sd > 1e-5 ? 1.0 / sd : 0;

    for (let i = 0; i < n; i++) {
      zarr[i] = (v[i] - mean) * eps;
    }

    return zarr;
  }

  // Core 분석 로직
  function analyzeCore(imageData, rect, config) {
    const { sensitivity, controlPos } = config;
    const preset = config.presets[sensitivity];

    const { x0, y0, x1, y1 } = rect;
    const w2 = x1 - x0;
    const h2 = y1 - y0;

    if (w2 < 10 || h2 < 10) {
      return {
        ok: false,
        reason: "선택 영역이 너무 작습니다.",
      };
    }

    const line = new Float32Array(w2);
    for (let x = 0; x < w2; x++) {
      let sum = 0;
      for (let y = 0; y < h2; y++) {
        const idx = (y * w2 + x) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const v = (r + g + b) / 3;
        sum += v;
      }
      line[x] = sum / h2;
    }

    const zarr = zScoreLine(line);
    const peaks = compute_peaks(zarr, h2);

    if (!peaks.length) {
      return {
        ok: true,
        result: {
          verdict: "Invalid",
          detail: "라인 패턴이 감지되지 않았습니다.",
          confidence: "약함",
          diagnosis: "none",
          ecpPositive: false,
          mpoPositive: false,
        },
      };
    }

    const sorted = peaks.slice().sort((a, b) => a.idx - b.idx);
    const unit = w2;

    let control = null;
    if (controlPos === "auto") {
      control = sorted.reduce((mx, p) => (p.z > mx.z ? p : mx), sorted[0]);
    } else {
      if (controlPos === "left") {
        control = sorted[0];
      } else if (controlPos === "right") {
        control = sorted[sorted.length - 1];
      } else {
        control = sorted.reduce((mx, p) => (p.z > mx.z ? p : mx), sorted[0]);
      }
    }

    // Control 강화 검증
    function validateControlLocal(controlPeak, peaks, preset, unit) {
      if (!controlPeak) return false;
      if (controlPeak.z < preset.CONTROL_MIN) return false;

      const avgArea =
        peaks.reduce((s, p) => s + p.area, 0) / Math.max(1, peaks.length);
      if (controlPeak.area < avgArea * 0.6) return false;

      const maxZ = Math.max(...peaks.map((p) => p.z));
      if (controlPeak.z < maxZ * 0.85) return false;

      if (controlPeak.idx < unit * 0.05) return false;
      if (controlPeak.idx > unit * 0.95) return false;

      return true;
    }

    const isControlValid = validateControlLocal(
      control,
      sorted,
      preset,
      unit
    );

    if (!isControlValid) {
      return {
        ok: true,
        result: {
          verdict: "Invalid",
          detail: "컨트롤 라인이 인식되지 않았습니다.",
          confidence: "약함",
          diagnosis: "none",
          ecpPositive: false,
          mpoPositive: false,
        },
      };
    }

    const tCandidates = sorted.filter((p) => p !== control);

    if (!tCandidates.length) {
      return {
        ok: true,
        result: {
          verdict: "Negative",
          detail: "테스트 라인이 감지되지 않음",
          confidence: "보통",
          diagnosis: "none",
          ecpPositive: false,
          mpoPositive: false,
        },
      };
    }

    const t1 = tCandidates[0] || null;
    const t2 = tCandidates[1] || null;

    const positiveLine = (peak) => {
      if (!peak) return false;
      if (peak.z < preset.TEST_MIN_ABS) return false;
      if (peak.z < control.z * preset.TEST_MIN_REL) return false;
      return true;
    };

    const cIdx = control.idx;
    let ecpLine = null;
    let mpoLine = null;

    if (t1 && t2) {
      const d1 = Math.abs(t1.idx - cIdx);
      const d2 = Math.abs(t2.idx - cIdx);
      ecpLine = d1 < d2 ? t1 : t2;
      mpoLine = ecpLine === t1 ? t2 : t1;
    } else {
      ecpLine = t1;
      mpoLine = null;
    }

    const ecpPos = positiveLine(ecpLine);
    const mpoPos = positiveLine(mpoLine);

    let verdict = "Invalid";
    let diagnosis = "none";

    if (ecpPos && mpoPos) {
      verdict = "Positive";
      diagnosis = "mixed";
    } else if (ecpPos) {
      verdict = "Positive";
      diagnosis = "allergic";
    } else if (mpoPos) {
      verdict = "Positive";
      diagnosis = "bacterial";
    } else {
      verdict = "Negative";
      diagnosis = "none";
    }

    return {
      ok: true,
      result: {
        verdict,
        detail: "분석 완료",
        confidence: "보통",
        diagnosis,
        ecpPositive: ecpPos,
        mpoPositive: mpoPos,
      },
    };
  }

  onmessage = (e) => {
    const { imageData, rect, config } = e.data;
    try {
      const out = analyzeCore(imageData, rect, config);
      (postMessage as any)(out);
    } catch (err) {
      (postMessage as any)({ ok: false, reason: String(err) });
    }
  };
};

/* ------------------------------------
   메인 리액트 컴포넌트 (UI + Worker 연결)
------------------------------------ */

export default function LfaAnalyzer() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imageBitmapData, setImageBitmapData] = useState<ImageData | null>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const imgRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ sx: number; sy: number } | null>(null);

  // --------------- Worker 초기화 -----------------
  useEffect(() => {
    const blob = new Blob(["(" + workerCode.toString() + ")()"], {
      type: "application/javascript",
    });
    const w = new Worker(URL.createObjectURL(blob));
    w.onmessage = (e) => {
      setLoading(false);
      setResult(e.data);
    };
    setWorker(w);
    return () => w.terminate();
  }, []);

  // ---------------- 이미지 로드 -------------------
  const handleFile = async (f: File) => {
    setResult(null);
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = async () => {
      setImg(im);

      // canvas에 그려서 imageData 생성
      const c = imgRef.current;
      if (!c) return;
      c.width = im.width;
      c.height = im.height;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(im, 0, 0);

      const data = ctx.getImageData(0, 0, im.width, im.height);
      setImageBitmapData(data);
    };
    im.src = url;
  };

  // ---------------- Crop 드래그 (PC) -------------------
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    const ctxO = ov.getContext("2d");
    if (!ctxO) return;

    const mdown = (ev: MouseEvent) => {
      if (mode !== "crop") return;
      const r = ov.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * ov.width;
      const y = ((ev.clientY - r.top) / r.height) * ov.height;
      drag.current = { sx: x, sy: y };
      setCrop({ x, y, w: 0, h: 0 });
    };
    const mmove = (ev: MouseEvent) => {
      if (!drag.current) return;
      const r = ov.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * ov.width;
      const y = ((ev.clientY - r.top) / r.height) * ov.height;
      const { sx, sy } = drag.current;
      setCrop({
        x: Math.min(sx, x),
        y: Math.min(sy, y),
        w: Math.abs(x - sx),
        h: Math.abs(y - sy),
      });
    };
    const mup = () => {
      drag.current = null;
    };

    ov.addEventListener("mousedown", mdown);
    window.addEventListener("mousemove", mmove);
    window.addEventListener("mouseup", mup);

    return () => {
      ov.removeEventListener("mousedown", mdown);
      window.removeEventListener("mousemove", mmove);
      window.removeEventListener("mouseup", mup);
    };
  }, [mode]);

  // ---------------- Crop(모바일 터치) -------------------
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov) return;

    const toImg = (touch: Touch) => {
      const r = ov.getBoundingClientRect();
      const x = ((touch.clientX - r.left) / r.width) * ov.width;
      const y = ((touch.clientY - r.top) / r.height) * ov.height;
      return {
        x: Math.max(0, Math.min(ov.width, x)),
        y: Math.max(0, Math.min(ov.height, y)),
      };
    };

    const tstart = (e: TouchEvent) => {
      if (mode !== "crop") return;
      const p = toImg(e.touches[0]);
      drag.current = { sx: p.x, sy: p.y };
      setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
      e.preventDefault();
    };
    const tmove = (e: TouchEvent) => {
      if (!drag.current) return;
      const p = toImg(e.touches[0]);
      const { sx, sy } = drag.current;
      setCrop({
        x: Math.min(sx, p.x),
        y: Math.min(sy, p.y),
        w: Math.abs(p.x - sx),
        h: Math.abs(p.y - sy),
      });
      e.preventDefault();
    };
    const tend = () => {
      drag.current = null;
    };

    ov.addEventListener("touchstart", tstart, { passive: false });
    ov.addEventListener("touchmove", tmove, { passive: false });
    ov.addEventListener("touchend", tend);

    return () => {
      ov.removeEventListener("touchstart", tstart);
      ov.removeEventListener("touchmove", tmove);
      ov.removeEventListener("touchend", tend);
    };
  }, [mode]);

  // ---------------- 도형 오버레이 렌더링 -------------------
  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov || !img) return;
    ov.width = img.width;
    ov.height = img.height;
    const ctx = ov.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, ov.width, ov.height);
    ctx.strokeStyle = "rgba(0,255,0,0.8)";
    ctx.lineWidth = 3;

    if (crop) {
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    }
  }, [crop, img]);

  // ---------------- 사진 분석 실행 -------------------
  const analyze = () => {
    if (!worker) return;
    if (!imageBitmapData) return;

    setLoading(true);
    setResult(null);

    let r = crop
      ? {
          x0: Math.floor(crop.x),
          y0: Math.floor(crop.y),
          x1: Math.floor(crop.x + crop.w),
          y1: Math.floor(crop.y + crop.h),
        }
      : {
          x0: 0,
          y0: 0,
          x1: imageBitmapData.width,
          y1: imageBitmapData.height,
        };

    worker.postMessage({
      imageData: imageBitmapData,
      rect: r,
      config: {
        sensitivity: "balanced",
        controlPos: "auto",
        presets: PRESETS,
      },
    });
  };

  // ---------------- UI -------------------
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-3">
        📷 LFA QuickCheck v5.2
      </h1>

      {/* 파일 업로드 */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        className="mb-4"
      />

      {/* 모드 */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode("auto")}
          className={`px-3 py-1 rounded ${
            mode === "auto" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          자동 분석
        </button>
        <button
          onClick={() => setMode("crop")}
          className={`px-3 py-1 rounded ${
            mode === "crop" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          영역 선택
        </button>
      </div>

      {/* 이미지 표시 */}
      <div className="relative mb-4">
        <canvas ref={imgRef} className="w-full" />
        <canvas
          ref={overlayRef}
          className="w-full absolute top-0 left-0"
        />
      </div>

      {/* 분석 버튼 */}
      <button
        onClick={analyze}
        disabled={!imageBitmapData || loading}
        className="px-4 py-2 rounded bg-emerald-600 text-white mb-4"
      >
        {loading ? "분석 중…" : "분석하기"}
      </button>

      {/* 결과 */}
      {result && result.ok && (
        <div className="p-4 rounded-xl border bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">
            결과: {result.result.verdict}
          </h2>
          <p className="text-sm text-gray-700 mb-2">
            {result.result.detail}
          </p>

          <p className="font-medium">
            진단: {result.result.diagnosis}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            ECP(+): {String(result.result.ecpPositive)} / MPO(+):{" "}
            {String(result.result.mpoPositive)}
          </p>
        </div>
      )}

      {/* Invalid 케이스 */}
      {result && result.ok && result.result.verdict === "Invalid" && (
        <p className="text-red-600 mt-2 font-medium">
          ⚠️ 컨트롤 라인이 없거나, 판독할 수 없습니다.
        </p>
      )}

      {/* 근처 약국/병원 찾기 */}
      <NearbyFinder />
    </div>
  );
}

