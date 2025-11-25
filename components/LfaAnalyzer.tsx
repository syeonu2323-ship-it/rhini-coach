"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

/* -------------------------------------------------------
   타입
------------------------------------------------------- */
type Verdict = "Positive" | "Negative" | "Invalid";
type Diagnosis = "none" | "allergic" | "bacterial" | "mixed";

type AnalyzeResult = {
  verdict: Verdict;
  diagnosis: Diagnosis;
  detail: string;
  ecpPositive: boolean;
  mpoPositive: boolean;
};

/* -------------------------------------------------------
   Crop UI 컴포넌트
------------------------------------------------------- */
function CropBox({
  canvasRef,
  onCrop,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCrop: (crop: { x: number; y: number; w: number; h: number }) => void;
})
 {
  const [dragging, setDragging] = useState(false);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const onDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    start.current = { x, y };
    setBox({ x, y, w: 0, h: 0 });
    setDragging(true);
  };

  const onMove = (e: React.MouseEvent) => {
    if (!dragging || !start.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = x - start.current.x;
    const h = y - start.current.y;

    setBox({
      x: start.current.x,
      y: start.current.y,
      w,
      h,
    });
  };

  const onUp = () => {
    if (box) onCrop(box);
    setDragging(false);
    start.current = null;
  };

  return (
    <div
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      className="absolute inset-0 cursor-crosshair"
    >
      {box && (
        <div
          style={{
            position: "absolute",
            border: "2px solid #4F46E5",
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            background: "rgba(79,70,229,0.1)",
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------
   세로 라인(가로형 키트의 세로 peak) 검출
------------------------------------------------------- */
function detectLineInSlice(
  img: ImageData,
  x0: number,
  x1: number
): boolean {
  const { width, height, data } = img;

  const colSum = new Array(height).fill(0);

  for (let y = 0; y < height; y++) {
    let s = 0;
    for (let x = x0; x < x1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const sum = r + g + b || 1;
      const red = r / sum - (g / sum + b / sum) * 0.4;
      if (red > 0.1) s += red;
    }
    colSum[y] = s;
  }

  const threshold = Math.max(...colSum) * 0.45;
  return colSum.some((v) => v > threshold);
}

/* -------------------------------------------------------
   Crop → 3등분 → C/M/E 판독
------------------------------------------------------- */
function analyzeCrop(canvas: HTMLCanvasElement, crop: any): AnalyzeResult {
  const ctx = canvas.getContext("2d")!;
  const { x, y, w, h } = crop;

  const img = ctx.getImageData(x, y, w, h);

  // 3등분
  const w1 = Math.floor(w / 3);
  const cStart = 0;
  const mStart = w1;
  const eStart = w1 * 2;

  const C = detectLineInSlice(img, cStart, cStart + w1);
  const M = detectLineInSlice(img, mStart, mStart + w1);
  const E = detectLineInSlice(img, eStart, eStart + w1);

  if (!C) {
    return {
      verdict: "Invalid",
      diagnosis: "none",
      detail: "Control line not detected",
      ecpPositive: false,
      mpoPositive: false,
    };
  }

  let diagnosis: Diagnosis = "none";
  if (M && E) diagnosis = "mixed";
  else if (M) diagnosis = "bacterial";
  else if (E) diagnosis = "allergic";

  return {
    verdict: M || E ? "Positive" : "Negative",
    diagnosis,
    detail: `C=${C} | MPO=${M} | ECP=${E}`,
    ecpPositive: E,
    mpoPositive: M,
  };
}

/* -------------------------------------------------------
   메인 컴포넌트
------------------------------------------------------- */
export default function LfaAnalyzer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cropBox, setCropBox] = useState<any>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  // 이미지 로드 → Canvas 그리기
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      const scale = Math.min(1, 1600 / Math.max(sw, sh));

      const dw = Math.round(sw * scale);
      const dh = Math.round(sh * scale);

      canvas.width = dw;
      canvas.height = dh;

      ctx.drawImage(img, 0, 0, dw, dh);
    };
  }, [imageUrl]);

  const handleCrop = (box: any) => {
    setCropBox(box);
  };

  const analyze = () => {
    if (!canvasRef.current || !cropBox) return;
    const out = analyzeCrop(canvasRef.current, cropBox);
    setResult(out);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 relative">
      <h1 className="text-xl font-semibold mb-4">📷 LFA QuickCheck — Crop Version</h1>

      {/* 업로드 */}
      <input
        type="file"
        accept="image/*"
        className="mb-3"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setImageUrl(URL.createObjectURL(f));
        }}
      />

      {/* Canvas 영역 */}
      <div className="relative border rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full" />
        {imageUrl && <CropBox canvasRef={canvasRef} onCrop={handleCrop} />


      </div>

      {/* 분석 */}
      <button
        onClick={analyze}
        disabled={!cropBox}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
      >
        판독하기
      </button>

      {/* 결과 */}
      {result && (
        <div className="mt-4 p-4 border rounded-xl bg-white">
          <h3 className="font-semibold mb-2">결과</h3>
          <p>{result.detail}</p>
          <p>진단: {result.diagnosis}</p>
        </div>
      )}
    </div>
  );
}
function RhinitisAdvice({ diagnosis }: { diagnosis: Diagnosis }) {
  if (diagnosis === "none") return null;

  const info =
    diagnosis === "allergic"
      ? {
          title: "🌼 알레르기성 비염",
          desc: "ECP 양성 패턴 → 면역 알레르기 반응이 의심됩니다.",
        }
      : diagnosis === "bacterial"
      ? {
          title: "🦠 세균성 비염",
          desc: "MPO 양성 패턴 → 세균 감염 가능성이 높습니다.",
        }
      : {
          title: "🌼🦠 혼합형 비염",
          desc: "ECP + MPO 모두 양성 → 복합 감염 가능성이 있습니다.",
        };

  return (
    <div className="mt-4 p-4 border bg-amber-50 border-amber-300 rounded-xl">
      <div className="font-semibold mb-1">{info.title}</div>
      <p className="text-sm text-amber-800">{info.desc}</p>
    </div>
  );
}
function analyzeSymptoms(text: string) {
  const t = text.toLowerCase();
  const hit = (r: RegExp) => r.test(t);

  let otc: string[] = [];
  let dept: string[] = [];
  let flags: string[] = [];

  if (hit(/비염|콧물|코막힘|재채기|가려움/)) {
  otc.push("항히스타민(세티리진/로라타딘)");
  otc.push("비충혈 제거제(단기)");
  dept.push("이비인후과");
}

if (hit(/열|발열|오한|근육통/)) {
  otc.push("해열진통제(아세트아미노펜)");
  dept.push("내과");
}

if (hit(/기침|가래|호흡곤란/)) {
  otc.push("기침 억제제·거담제");
  dept.push("호흡기내과");
}

if (hit(/호흡곤란|청색증|의식저하/)) {
  flags.push("⚠️ 응급 증상 가능. 즉시 진료 필요");
}


  return {
    otc: [...new Set(otc)],
    dept: [...new Set(dept)],
    flags: [...new Set(flags)],
  };
}

function SymptomLogger({ defaultVerdict }: { defaultVerdict?: Verdict }) {
  const [text, setText] = useState("");
  const [out, setOut] = useState<ReturnType<typeof analyzeSymptoms> | null>(
    null
  );

  return (
    <div className="mt-6 p-4 border rounded-xl bg-rose-50">
      <h2 className="font-semibold text-rose-700 mb-1">📝 증상 기록 및 분석</h2>
      <textarea
        rows={3}
        className="w-full border p-2 rounded-md text-sm mb-2"
        placeholder="예: 콧물, 재채기, 목아픔..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm"
        onClick={() => setOut(analyzeSymptoms(text))}
      >
        분석하기
      </button>

      {out && (
        <div className="mt-3 text-sm">
          <div className="font-medium">💊 추천 일반의약품</div>
          {out.otc.length ? (
            <ul className="list-disc ml-5">{out.otc.map((x) => <li key={x}>{x}</li>)}</ul>
          ) : (
            "없음"
          )}

          <div className="font-medium mt-3">🏥 권장 진료과</div>
          {out.dept.length ? (
            <ul className="list-disc ml-5">{out.dept.map((x) => <li key={x}>{x}</li>)}</ul>
          ) : (
            "없음"
          )}

          {out.flags.length > 0 && (
            <div className="mt-3 p-2 border rounded-lg text-red-700 bg-red-50 text-xs">
              {out.flags.join(" / ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function useGeo() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const request = () => {
    navigator.geolocation.getCurrentPosition((p) => {
      setLat(p.coords.latitude);
      setLng(p.coords.longitude);
    });
  };

  return { lat, lng, request };
}

function NearbyFinder() {
  const { lat, lng, request } = useGeo();

  const openMap = (q: string) => {
    const query = encodeURIComponent(q);
    const naver = `https://map.naver.com/v5/search/${query}`;
    window.open(naver, "_blank");
    window.open(kakao, "_blank");
  };

  return (
    <div className="mt-6 p-4 border rounded-xl bg-emerald-50">
      <div className="flex gap-2 items-center mb-2">
        <span className="font-semibold">📍 근처 약국·병원 찾기</span>
        <button className="px-2 py-1 border rounded-md bg-white text-xs" onClick={request}>
          내 위치
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          onClick={() => openMap("약국")}
          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg"
        >
          약국
        </button>
        <button
          onClick={() => openMap("이비인후과")}
          className="px-3 py-1.5 bg-white border rounded-lg"
        >
          이비인후과
        </button>
        <button
          onClick={() => openMap("호흡기내과")}
          className="px-3 py-1.5 bg-white border rounded-lg"
        >
          호흡기내과
        </button>
      </div>
    </div>
  );
}
