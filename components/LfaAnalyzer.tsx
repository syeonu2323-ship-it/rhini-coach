"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

/* ============================================================
   📌 타입 정의
============================================================ */
type Verdict = "Positive" | "Negative" | "Invalid";
type Diagnosis = "none" | "allergic" | "bacterial" | "mixed";

type AnalyzeOut = {
  verdict: Verdict;
  detail: string;
  diagnosis: Diagnosis;
  ecpPositive: boolean;
  mpoPositive: boolean;
};

/* ============================================================
   📌 CropBox 컴포넌트 (드래그로 ROI 만드는 박스)
============================================================ */
type CropRect = { x0: number; y0: number; x1: number; y1: number };

function CropBox({
  canvasRef,
  onCrop,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCrop: (r: CropRect) => void;
}) {
  const [box, setBox] = useState<CropRect | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setBox({
      x0: e.clientX - rect.left,
      y0: e.clientY - rect.top,
      x1: e.clientX - rect.left,
      y1: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !box) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setBox({
      ...box,
      x1: e.clientX - rect.left,
      y1: e.clientY - rect.top,
    });
  };

  const handleMouseUp = () => {
    if (box) onCrop(box);
  };

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {box && (
        <div
          className="absolute border-2 border-red-500"
          style={{
            left: Math.min(box.x0, box.x1),
            top: Math.min(box.y0, box.y1),
            width: Math.abs(box.x1 - box.x0),
            height: Math.abs(box.y1 - box.y0),
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   📌 이미지 intensity 분석 (3등분)
============================================================ */
function analyzeCrop(
  canvas: HTMLCanvasElement,
  rect: { x0: number; y0: number; x1: number; y1: number }
): AnalyzeOut {
  const ctx = canvas.getContext("2d")!;
  const x0 = Math.min(rect.x0, rect.x1);
  const y0 = Math.min(rect.y0, rect.y1);
  const w = Math.abs(rect.x1 - rect.x0);
  const h = Math.abs(rect.y1 - rect.y0);

  const img = ctx.getImageData(x0, y0, w, h);
  const d = img.data;

  // 🎯 3등분
  const c1 = 0; // C
  const c2 = Math.floor(w / 3); // M
  const c3 = Math.floor((w * 2) / 3); // E

  function avgZone(xStart: number, xEnd: number) {
    let sum = 0;
    let count = 0;

    for (let x = xStart; x < xEnd; x++) {
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        const chroma = r - (g + b) * 0.3;
        sum += Math.max(0, chroma);
        count++;
      }
    }
    return sum / count;
  }

  const C = avgZone(c1, c2);
  const M = avgZone(c2, c3);
  const E = avgZone(c3, w);

  // ⚠ C(컨트롤)이 일정 threshold 이하 → 무효
  if (C < 5) {
    return {
      verdict: "Invalid",
      detail: "Control line not detected",
      diagnosis: "none",
      ecpPositive: false,
      mpoPositive: false,
    };
  }

  const mpoPositive = M > 6;
  const ecpPositive = E > 6;

  let verdict: Verdict = mpoPositive || ecpPositive ? "Positive" : "Negative";

  const diagnosis: Diagnosis =
    mpoPositive && ecpPositive
      ? "mixed"
      : mpoPositive
      ? "bacterial"
      : ecpPositive
      ? "allergic"
      : "none";

  return {
    verdict,
    detail: `C=${C.toFixed(1)} | M=${M.toFixed(1)} | E=${E.toFixed(1)}`,
    diagnosis,
    mpoPositive,
    ecpPositive,
  };
}

/* ============================================================
   📌 증상 분석 + 약 추천
============================================================ */
function analyzeSymptoms(text: string) {
  const t = text.toLowerCase();

  const hit = (r: RegExp) => r.test(t);

  let otc = new Set<string>();
  let dept = new Set<string>();
  let flags = new Set<string>();

  if (hit(/콧물|코막힘|비염|재채기/)) {
    otc.add("항히스타민(세티리진/로라타딘)");
    dept.add("이비인후과");
  }
  if (hit(/기침|목아픔/)) dept.add("호흡기내과");
  if (hit(/열|오한/)) otc.add("해열진통제");

  if (hit(/호흡곤란|청색증/)) flags.add("⚠ 응급 가능성 → 즉시 진료");

  return {
    otc: [...otc],
    dept: [...dept],
    flags: [...flags],
  };
}

/* ============================================================
   📌 위치 기반 Finder
============================================================ */
function NearbyFinder() {
  const search = (q: string) => {
    const naver = `https://map.naver.com/v5/search/${encodeURIComponent(q)}`;
    const kakao = `https://map.kakao.com/?q=${encodeURIComponent(q)}`;
    window.open(naver, "_blank");
    window.open(kakao, "_blank");
  };

  return (
    <div className="mt-4 p-4 border rounded-xl bg-emerald-50 text-sm">
      <div className="font-semibold mb-2">📍 근처 병원/약국 찾기</div>
      <button
        onClick={() => search("약국")}
        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg mr-2"
      >
        약국
      </button>
      <button
        onClick={() => search("이비인후과")}
        className="px-3 py-1.5 bg-white border rounded-lg"
      >
        이비인후과
      </button>
    </div>
  );
}

/* ============================================================
   📌 메인 컴포넌트
============================================================ */
export default function LfaAnalyzer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState<any>(null);
  const [result, setResult] = useState<AnalyzeOut | null>(null);
  const [symptom, setSymptom] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  /* 🔄 이미지 로드 → 캔버스에 반영 */
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      const cvs = canvasRef.current;
if (!cvs) return;   // ← 이 한 줄이면 완벽 해결

const ctx = cvs.getContext("2d");
if (!ctx) return;


      const maxW = 1200;
      const scale = Math.min(1, maxW / img.width);

      cvs.width = img.width * scale;
      cvs.height = img.height * scale;

      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
    };
  }, [imageUrl]);

  /* 🔍 분석 실행 */
  const analyze = () => {
    if (!canvasRef.current || !cropBox) return;
    const out = analyzeCrop(canvasRef.current, cropBox);
    setResult(out);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">📸 LFA QuickCheck — Crop Version (3-Line)</h1>

      <input
        type="file"
        accept="image/*"
        className="mb-3"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setImageUrl(URL.createObjectURL(f));
        }}
      />

      {/* Canvas + Crop */}
      <div className="relative border rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full" />
        {imageUrl && <CropBox canvasRef={canvasRef} onCrop={setCropBox} />}
      </div>

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
          <h3 className="font-semibold text-lg mb-2">결과</h3>
          <p className="text-sm mb-2">{result.detail}</p>

          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-lg text-sm ${result.mpoPositive ? "bg-sky-100 text-sky-700" : "bg-gray-200 text-gray-700"}`}>
              MPO: {result.mpoPositive ? "양성" : "음성"}
            </span>
            <span className={`px-2 py-1 rounded-lg text-sm ${result.ecpPositive ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-700"}`}>
              ECP: {result.ecpPositive ? "양성" : "음성"}
            </span>
          </div>

          <p className="mt-3 text-sm">
            🧩 진단:{" "}
            {result.diagnosis === "allergic"
              ? "🌼 알레르기성 비염"
              : result.diagnosis === "bacterial"
              ? "🦠 세균성 비염"
              : result.diagnosis === "mixed"
              ? "🌼🦠 혼합형"
              : "해당 없음"}
          </p>
        </div>
      )}

      {/* 증상 기록 */}
      <div className="mt-4 p-4 border rounded-xl bg-rose-50 text-sm">
        <div className="font-semibold mb-1">📝 증상 기록</div>
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          rows={3}
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder="예: 콧물, 재채기, 목아픔…"
        />
        <button
          className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg"
          onClick={() => {
            const out = analyzeSymptoms(symptom);
            alert(
              `💊 약 추천: ${out.otc.join(", ") || "없음"}\n🏥 진료과: ${out.dept.join(
                ", "
              ) || "없음"}\n${out.flags.join(", ")}`
            );
          }}
        >
          증상 분석
        </button>
      </div>

      <NearbyFinder />
    </div>
  );
}
