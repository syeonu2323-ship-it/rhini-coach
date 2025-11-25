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
   📌 안정화된 CropBox
============================================================ */
function CropBox({
  canvasRef,
  onCrop,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCrop: (r: CropRect) => void;
}) {
  const [box, setBox] = useState<CropRect | null>(null);
  const [isDown, setIsDown] = useState(false);

  const getScale = () => {
    if (!canvasRef.current) return { scaleX: 1, scaleY: 1 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      scaleX: canvasRef.current.width / rect.width,
      scaleY: canvasRef.current.height / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScale();

    setIsDown(true);
    setBox({
      x0: (e.clientX - rect.left) * scaleX,
      y0: (e.clientY - rect.top) * scaleY,
      x1: (e.clientX - rect.left) * scaleX,
      y1: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !isDown || !box) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScale();

    setBox({
      ...box,
      x1: (e.clientX - rect.left) * scaleX,
      y1: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleMouseUp = () => {
    if (isDown && box) onCrop(box);
    setIsDown(false);
  };

  const { scaleX, scaleY } = getScale();

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {box && (
        <div
          className="absolute border-2 border-red-500 pointer-events-none"
          style={{
            left: Math.min(box.x0, box.x1) / scaleX,
            top: Math.min(box.y0, box.y1) / scaleY,
            width: Math.abs(box.x1 - box.x0) / scaleX,
            height: Math.abs(box.y1 - box.y0) / scaleY,
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   📌 Crop 후 표시되는 3-Zone Overlay
============================================================ */
function ZoneGuide({
  rect,
  canvasRef,
}: {
  rect: CropRect;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  if (!canvasRef.current) return null;

  const cvs = canvasRef.current;
  const display = cvs.getBoundingClientRect();

  const scaleX = display.width / cvs.width;
  const scaleY = display.height / cvs.height;

  const x = Math.min(rect.x0, rect.x1) * scaleX;
  const y = Math.min(rect.y0, rect.y1) * scaleY;
  const w = Math.abs(rect.x1 - rect.x0) * scaleX;
  const h = Math.abs(rect.y1 - rect.y0) * scaleY;

  const zoneW = w / 3;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute border border-blue-400"
        style={{ left: x, top: y, width: zoneW, height: h }}
      />
      <div
        className="absolute border border-green-400"
        style={{ left: x + zoneW, top: y, width: zoneW, height: h }}
      />
      <div
        className="absolute border border-orange-400"
        style={{ left: x + zoneW * 2, top: y, width: zoneW, height: h }}
      />
    </div>
  );
}

/* ============================================================
   📌 Hue 기반 판독
============================================================ */
/* ============================================================
   📌 개선 버전 — 자주색(Magenta/Red) 기반 판독
============================================================ */
/* ============================================================
   📌 Super Sensitive — 자주/빨강/갈자주 모두 감지하는 버전
============================================================ */
function analyzeCrop(
  canvas: HTMLCanvasElement,
  rect: CropRect
): AnalyzeOut {
  const ctx = canvas.getContext("2d")!;
  const x0 = Math.min(rect.x0, rect.x1);
  const y0 = Math.min(rect.y0, rect.y1);
  const w = Math.abs(rect.x1 - rect.x0);
  const h = Math.abs(rect.y1 - rect.y0);

  const img = ctx.getImageData(x0, y0, w, h);
  const d = img.data;

  const zoneW = Math.floor(w / 3);

  /* 🔥 극민감 자주+붉자주+갈자주 감지 함수 */
  const detectLineZone = (sx: number, ex: number) => {
    let hit = 0, tot = 0;

    for (let x = sx; x < ex; x++) {
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];

        const R = r / 255, G = g / 255, B = b / 255;
        const max = Math.max(R, G, B);
        const min = Math.min(R, G, B);
        const delta = max - min;

        let H = 0;
        if (delta !== 0) {
          if (max === R) H = ((G - B) / delta) % 6;
          else if (max === G) H = (B - R) / delta + 2;
          else H = (R - G) / delta + 4;
        }
        H *= 60;
        if (H < 0) H += 360;

        /* 🎯 Hue 기준을 대폭 확장
           - 0°~50° : 빨강~주황(갈색)
           - 280°~360° : 보라~자주색 
        */
        const hueHit =
          (H >= 0 && H <= 50) || 
          (H >= 280 && H <= 360);

        /* 🎯 Intensity 기준 완화
           - 붉은빛 또는 자주빛만 있어도 인정
        */
        const intensityHit =
          (r > g + 20 && r > b + 10) ||   // 붉은 라인
          (r > 70 && b > 70) ||           // 자주색
          (r > 90 && g > 60 && b > 40);   // 갈색 섞인 자주

        if (hueHit && intensityHit) hit++;
        tot++;
      }
    }
    return hit / tot;
  };

  const C = detectLineZone(0, zoneW);
  const M = detectLineZone(zoneW, zoneW * 2);
  const E = detectLineZone(zoneW * 2, zoneW * 3);

  /* 🎯 임계값을 아주 낮게 설정 (극민감) */
  const Cdet = C > 0.003; 
  const Mdet = M > 0.0025;
  const Edet = E > 0.0025;

  if (!Cdet) {
    return {
      verdict: "Invalid",
      detail: `C=${(C*100).toFixed(3)}% / M=${(M*100).toFixed(3)}% / E=${(E*100).toFixed(3)}%`,
      diagnosis: "none",
      mpoPositive: false,
      ecpPositive: false,
    };
  }

  const mpo = Mdet;
  const ecp = Edet;

  const verdict: Verdict = mpo || ecp ? "Positive" : "Negative";
  const dx: Diagnosis =
    mpo && ecp ? "mixed" :
    mpo ? "bacterial" :
    ecp ? "allergic" :
    "none";

  return {
    verdict,
    detail: `Line% → C=${(C*100).toFixed(3)}% | MPO=${(M*100).toFixed(3)}% | ECP=${(E*100).toFixed(3)}%`,
    diagnosis: dx,
    mpoPositive: mpo,
    ecpPositive: ecp,
  };
}

/* ============================================================
   📌 메인 컴포넌트
============================================================ */
export default function LfaAnalyzer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState<CropRect | null>(null);
  const [result, setResult] = useState<AnalyzeOut | null>(null);
  const [symptom, setSymptom] = useState("");

  /* 이미지 로드 */
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const cvs = canvasRef.current!;
      const ctx = cvs.getContext("2d")!;

      const maxW = 1300;
      const scale = Math.min(1, maxW / img.width);

      cvs.width = img.width * scale;
      cvs.height = img.height * scale;

      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
    };
  }, [imageUrl]);

  const analyze = () => {
    if (!canvasRef.current || !cropBox) return;
    setResult(analyzeCrop(canvasRef.current, cropBox));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-lg font-semibold mb-4">
        📸 LFA QuickCheck — Crop + 3-Zone
      </h1>

      <input
        type="file"
        accept="image/*"
        className="mb-4"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setImageUrl(URL.createObjectURL(f));
            setCropBox(null);
            setResult(null);
          }
        }}
      />

      <div className="relative border rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full" />

        {imageUrl && (
          <CropBox canvasRef={canvasRef} onCrop={setCropBox} />
        )}

        {cropBox && (
          <ZoneGuide rect={cropBox} canvasRef={canvasRef} />
        )}
      </div>

      <button
        onClick={analyze}
        disabled={!cropBox}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
      >
        판독하기
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded-xl bg-white">
          <div className="font-semibold">🎯 판독 결과</div>
          <p className="text-sm mt-1">{result.detail}</p>

          <div className="flex gap-2 mt-3">
            <span
              className={`px-2 py-1 rounded-md text-sm ${
                result.mpoPositive
                  ? "bg-sky-100 text-sky-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              MPO: {result.mpoPositive ? "양성" : "음성"}
            </span>

            <span
              className={`px-2 py-1 rounded-md text-sm ${
                result.ecpPositive
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
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
      <div className="mt-4 p-4 bg-rose-50 border rounded-xl text-sm">
        <div className="font-semibold mb-1">📝 증상 기록</div>

        <textarea
          rows={3}
          className="w-full border rounded-md p-2 text-sm"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder="예: 콧물, 코막힘, 재채기 등"
        />

        <button
          className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg"
          onClick={() => {
            const out = analyzeSymptoms(symptom);
            alert(
              `💊 약 추천: ${out.otc.join(", ") || "없음"}
🏥 진료과: ${out.dept.join(", ") || "없음"}
${out.flags.join(", ")}`
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

