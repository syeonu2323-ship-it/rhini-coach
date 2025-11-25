"use client";

import React, { useRef, useState, useEffect } from "react";

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

type CropRect = { x0: number; y0: number; x1: number; y1: number };

/* ============================================================
📌 Crop 드래그 박스
============================================================ */
function CropBox({
  canvasRef,
  onCrop,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCrop: (r: CropRect) => void;
}) {
  const [box, setBox] = useState<CropRect | null>(null);
  const [drag, setDrag] = useState(false);

  const handleDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDrag(true);
    setBox({
      x0: e.clientX - rect.left,
      y0: e.clientY - rect.top,
      x1: e.clientX - rect.left,
      y1: e.clientY - rect.top,
    });
  };

  const handleMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !drag || !box) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setBox({
      ...box,
      x1: e.clientX - rect.left,
      y1: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const endDrag = () => {
      if (drag && box) onCrop(box);
      setDrag(false);
    };
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, [drag, box, onCrop]);

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleDown}
      onMouseMove={handleMove}
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
📌 3-zone Overlay (가로 3분할 C / MPO / ECP)
============================================================ */
function CropZoneOverlay({ rect }: { rect: CropRect | null }) {
  if (!rect) return null;

  const x = Math.min(rect.x0, rect.x1);
  const y = Math.min(rect.y0, rect.y1);
  const w = Math.abs(rect.x1 - rect.x0);
  const h = Math.abs(rect.y1 - rect.y0);

  const zoneW = w / 3; // 가로 방향 3등분

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* C */}
      <div
        className="absolute border border-green-400"
        style={{
          left: x,
          top: y,
          width: zoneW,
          height: h,
          background: "rgba(0,255,0,0.1)",
        }}
      />
      {/* MPO */}
      <div
        className="absolute border border-blue-400"
        style={{
          left: x + zoneW,
          top: y,
          width: zoneW,
          height: h,
          background: "rgba(0,0,255,0.1)",
        }}
      />
      {/* ECP */}
      <div
        className="absolute border border-yellow-400"
        style={{
          left: x + zoneW * 2,
          top: y,
          width: zoneW,
          height: h,
          background: "rgba(255,255,0,0.1)",
        }}
      />
    </div>
  );
}

/* ============================================================
📌 가로 3-zone + 세로줄 탐지 알고리즘
============================================================ */
function analyzeCrop(canvas: HTMLCanvasElement, rect: CropRect): AnalyzeOut {
  const ctx = canvas.getContext("2d")!;
  const x = Math.min(rect.x0, rect.x1);
  const y = Math.min(rect.y0, rect.y1);
  const w = Math.abs(rect.x1 - rect.x0);
  const h = Math.abs(rect.y1 - rect.y0);

  const zoneW = Math.floor(w / 3); // 가로 3등분

  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;

  // 🔥 세로줄 탐지: col-wise 최소/최대 밝기 차이
const detectZoneRed = (xStart: number, xEnd: number) => {
  let total = 0;
  let count = 0;

  for (let col = xStart; col < xEnd; col++) {
    for (let row = 0; row < h; row++) {
      const i = (row * w + col) * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];

      // 🔥 전체 칸에서 붉은 성분 기반 강화
      const redBoost = r - 0.5 * (g + b);

      total += Math.max(0, redBoost);
      count++;
    }
  }

  // 전체 zone 평균 redBoost
  return total / count;
};

// 🎯 D 방식 최적 threshold
const Cavg = detectZoneRed(0, zoneW);
const Mavg = detectZoneRed(zoneW, zoneW * 2);
const Eavg = detectZoneRed(zoneW * 2, zoneW * 3);

// 🔥 빨간색 평균값 기반 threshold
const Cdet = Cavg > 0.9;    // control은 항상 진하게 → threshold 높게
const Mdet = Mavg > 0.25;   // T-lines는 약함 → threshold 낮게
const Edet = Eavg > 0.25;


  if (!Cdet) {
    return {
      verdict: "Invalid",
      detail: "Control line missing",
      diagnosis: "none",
      ecpPositive: false,
      mpoPositive: false,
    };
  }

  const mpoPositive = Mdet;
  const ecpPositive = Edet;

  const diagnosis =
    mpoPositive && ecpPositive
      ? "mixed"
      : mpoPositive
      ? "bacterial"
      : ecpPositive
      ? "allergic"
      : "none";

  return {
    verdict: mpoPositive || ecpPositive ? "Positive" : "Negative",
    detail: `C=${Cdet} M=${Mdet} E=${Edet}`,
    diagnosis,
    mpoPositive,
    ecpPositive,
  };
}

/* ============================================================
📌 증상 분석
============================================================ */
function analyzeSymptoms(text: string) {
  const t = text.toLowerCase();
  const hit = (r: RegExp) => r.test(t);

  let otc = new Set<string>();
  let dept = new Set<string>();
  let flags = new Set<string>();

  if (hit(/콧물|코막힘|재채기|비염/)) {
    otc.add("항히스타민제(세티리진, 로라타딘)");
    dept.add("이비인후과");
  }
  if (hit(/열|오한/)) otc.add("해열진통제");
  if (hit(/목/)) dept.add("호흡기내과");
  if (hit(/호흡곤란|숨참/)) flags.add("⚠ 즉시 진료 필요");

  return {
    otc: [...otc],
    dept: [...dept],
    flags: [...flags],
  };
}

/* ============================================================
📌 근처 병원/약국 Finder
============================================================ */
function NearbyFinder() {
  const search = (q: string) => {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(q)}`, "_blank");
    window.open(`https://map.kakao.com/?q=${encodeURIComponent(q)}`, "_blank");
  };

  return (
    <div className="mt-5 p-4 border rounded-xl bg-emerald-50 text-sm">
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
  const [cropBox, setCropBox] = useState<CropRect | null>(null);
  const [result, setResult] = useState<AnalyzeOut | null>(null);
  const [symptom, setSymptom] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* 이미지 로딩 */
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const cvs = canvasRef.current!;
      const ctx = cvs.getContext("2d")!;
      const maxW = 1200;
      const scale = Math.min(1, maxW / img.width);

      cvs.width = img.width * scale;
      cvs.height = img.height * scale;

      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
    };
  }, [imageUrl]);

  /* 판독하기 */
  const handleAnalyze = () => {
    if (canvasRef.current && cropBox) {
      setResult(analyzeCrop(canvasRef.current, cropBox));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-lg font-semibold mb-4">📸 LFA QuickCheck — 3구역 + 세로줄 탐지 버전</h1>

      {/* 이미지 업로드 */}
      <input
        type="file"
        accept="image/*"
        className="mb-3"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setImageUrl(URL.createObjectURL(f));
            setCropBox(null);
            setResult(null);
          }
        }}
      />

      {/* 캔버스 + crop + overlay */}
      <div className="relative border rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full" />
        {imageUrl && <CropBox canvasRef={canvasRef} onCrop={setCropBox} />}
        {cropBox && <CropZoneOverlay rect={cropBox} />}
      </div>

      {/* 판독 버튼 */}
      <button
        onClick={handleAnalyze}
        disabled={!cropBox}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
      >
        판독하기
      </button>

      {/* 결과 */}
      {result && (
        <div className="mt-4 p-4 border rounded-xl bg-white">
          <h3 className="font-semibold text-lg mb-2">결과</h3>
          <p className="text-sm">{result.detail}</p>

          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 rounded-lg text-sm ${result.mpoPositive ? "bg-blue-100 text-blue-700" : "bg-gray-200"}`}>
              MPO: {result.mpoPositive ? "양성" : "음성"}
            </span>
            <span className={`px-2 py-1 rounded-lg text-sm ${result.ecpPositive ? "bg-yellow-100 text-yellow-700" : "bg-gray-200"}`}>
              ECP: {result.ecpPositive ? "양성" : "음성"}
            </span>
          </div>

          <p className="mt-3 text-sm">
            🧩 {result.diagnosis === "bacterial"
              ? "🦠 세균성 비염"
              : result.diagnosis === "allergic"
              ? "🌼 알레르기성 비염"
              : result.diagnosis === "mixed"
              ? "🦠🌼 혼합형"
              : "음성"}
          </p>
        </div>
      )}

      {/* 증상 입력 */}
      <div className="mt-5 p-4 border rounded-xl bg-rose-50 text-sm">
        <div className="font-semibold mb-1">📝 증상 기록</div>
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          rows={3}
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder="예: 콧물, 코막힘, 재채기, 목아픔 등..."
        />
        <button
          className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg"
          onClick={() => {
            const out = analyzeSymptoms(symptom);
            alert(
              `💊 약 추천: ${out.otc.join(", ") || "없음"}\n` +
              `🏥 진료과: ${out.dept.join(", ") || "없음"}\n` +
              `${out.flags.join(", ")}`
            );
          }}
        >
          증상 분석
        </button>
      </div>

      {/* 근처 병원/약국 Finder */}
      <NearbyFinder />
    </div>
  );
}
