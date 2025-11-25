 "use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";


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
/* ============================================================
   📌 안정화된 CropBox — Mouse + Touch 지원 버전
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

  /* -----------------------------
        공통 좌표 계산 함수
  ----------------------------- */
  const getPos = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScale();

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  /* -----------------------------
        Mouse 이벤트
  ----------------------------- */
  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getPos(e.clientX, e.clientY);
    setIsDown(true);
    setBox({ x0: x, y0: y, x1: x, y1: y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !box) return;
    const { x, y } = getPos(e.clientX, e.clientY);
    setBox({ ...box, x1: x, y1: y });
  };

  const handleMouseUp = () => {
    if (isDown && box) onCrop(box);
    setIsDown(false);
  };

  /* -----------------------------
        Touch 이벤트 (모바일)
  ----------------------------- */
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const { x, y } = getPos(t.clientX, t.clientY);
    setIsDown(true);
    setBox({ x0: x, y0: y, x1: x, y1: y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDown || !box) return;
    const t = e.touches[0];
    const { x, y } = getPos(t.clientX, t.clientY);
    setBox({ ...box, x1: x, y1: y });
  };

  const handleTouchEnd = () => {
    if (isDown && box) onCrop(box);
    setIsDown(false);
  };

  /* -----------------------------
        렌더
  ----------------------------- */
  const { scaleX, scaleY } = getScale();

  return (
    <div
      className="absolute inset-0 cursor-crosshair touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
   📌 Crop 후 3-Zone 안내선
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
      <div className="absolute border border-blue-400" style={{ left: x, top: y, width: zoneW, height: h }} />
      <div className="absolute border border-green-400" style={{ left: x + zoneW, top: y, width: zoneW, height: h }} />
      <div className="absolute border border-orange-400" style={{ left: x + zoneW * 2, top: y, width: zoneW, height: h }} />
    </div>
  );
}

/* ============================================================
   📌 Super Sensitive — 자주/붉자주/갈자주 감지판독
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

        const hueHit =
          (H >= 0 && H <= 50) ||   // 빨강~갈색
          (H >= 280 && H <= 360);  // 보라~자주

        const intensityHit =
          (r > g + 20 && r > b + 10) || 
          (r > 70 && b > 70) ||
          (r > 90 && g > 60 && b > 40);

        if (hueHit && intensityHit) hit++;
        tot++;
      }
    }
    return hit / tot;
  };

  const C = detectLineZone(0, zoneW);
  const M = detectLineZone(zoneW, zoneW * 2);
  const E = detectLineZone(zoneW * 2, zoneW * 3);

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
   📌 증상 분석
============================================================ */
function analyzeSymptoms(text: string) {
  const t = text.toLowerCase();
  const hit = (r: RegExp) => r.test(t);

  const otc = new Set<string>();
  const dept = new Set<string>();
  const flags = new Set<string>();

  if (hit(/콧물|코막힘|비염|재채기/)) {
    otc.add("항히스타민제(세티리진/로라타딘)");
    dept.add("이비인후과");
  }
  if (hit(/기침|목아픔/)) dept.add("호흡기내과");
  if (hit(/열|오한/)) otc.add("해열진통제");
  if (hit(/호흡곤란|청색증/)) flags.add("⚠ 즉시 응급진료!");

  return { otc: [...otc], dept: [...dept], flags: [...flags] };
}

/* ============================================================
   📌 근처 찾기
============================================================ */
function NearbyFinder() {
  const go = (q: string) =>
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(q)}`);

  return (
    <div className="mt-4 p-3 bg-emerald-50 border rounded-xl text-sm">
      <div className="font-semibold mb-1">📍 근처 병원/약국 찾기</div>
      <button onClick={() => go("약국")} className="px-3 py-1 bg-emerald-600 text-white rounded-lg mr-2">
        약국
      </button>
      <button onClick={() => go("이비인후과")} className="px-3 py-1 bg-white border rounded-lg">
        이비인후과
      </button>
    </div>
  );
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
  const [otherSymptom, setOtherSymptom] = useState("");


    const router = useRouter();


    const resetAll = () => {
    setImageUrl(null);
    setCropBox(null);
    setResult(null);
    setSymptom("");
  };


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
    <h1
  onClick={() => router.push("/")}
  className="text-lg font-semibold mb-4 cursor-pointer select-none hover:text-indigo-600 transition"
>
  📸 LFA QuickCheck — Crop + 3-Zone
</h1>




     {/* 파일 업로드 (버튼 스타일) */}
<div className="mb-4">
  <label
    htmlFor="fileUpload"
    className="block w-full px-4 py-2 bg-indigo-600 text-white text-center rounded-lg cursor-pointer hover:bg-indigo-700 transition select-none"
  >
    📷 키트 사진 선택하기
  </label>

  <input
    id="fileUpload"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (f) {
        setImageUrl(URL.createObjectURL(f));
        setCropBox(null);
        setResult(null);
      }
    }}
  />

  {imageUrl && (
    <p className="mt-2 text-sm text-gray-600">
      선택된 파일: <span className="font-medium text-gray-800">{imageUrl.split("/").pop()}</span>
    </p>
  )}
</div>
{/* 📘 촬영 가이드 */}
<div className="mb-4 mt-2 p-3 border rounded-lg bg-blue-50 text-sm leading-relaxed">
  <div className="font-semibold text-blue-800 mb-1">📘 정확한 판독을 위한 촬영 가이드</div>

  <ul className="list-disc ml-5 text-blue-900 space-y-1">
    <li>키트를 밝은 환경에서 촬영해주세요. (형광등/햇빛 권장)</li>
    <li>그림자나 손가락이 키트 위를 가리지 않도록 해주세요.</li>
    <li>카메라를 너무 가까이 대지 말고, 키트 전체가 보이게 촬영해주세요.</li>
    <li>사진을 업로드한 후에는 C / MPO / ECP 라인이 모두 들어오도록 영역을 드래그해주세요.</li>
    <li>사진이 세로로 찍혔다면 crop 박스로 영역을 정확히 지정해주세요.</li>
    <li>희미한 라인도 잡아내기 때문에 흐릿해 보이더라도 그대로 업로드해도 괜찮습니다.</li>
  </ul>

  <div className="mt-2 text-xs text-blue-800">TIP: 너무 밝거나 어두우면 색이 왜곡될 수 있어요!</div>
</div>



      <div className="relative border rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full" />

        {imageUrl && <CropBox canvasRef={canvasRef} onCrop={setCropBox} />}

        {cropBox && <ZoneGuide rect={cropBox} canvasRef={canvasRef} />}
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
                result.mpoPositive ? "bg-sky-100 text-sky-700" : "bg-gray-200 text-gray-700"
              }`}
            >
              MPO: {result.mpoPositive ? "양성" : "음성"}
            </span>

            <span
              className={`px-2 py-1 rounded-md text-sm ${
                result.ecpPositive ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-700"
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
{/* 🔥 증상 선택 (버튼 + 기타 입력) */}
<div className="p-4 bg-rose-50 border rounded-xl text-sm mb-4">
  <div className="font-semibold mb-2">📝 현재 증상 선택</div>

  <div className="flex flex-wrap gap-2">
    {[
      "콧물",
      "코막힘",
      "재채기",
      "기침",
      "목아픔",
      "열",
    ].map((sym) => (
      <button
        key={sym}
        className={`px-3 py-1 rounded-lg border ${
          symptom.includes(sym)
            ? "bg-rose-600 text-white border-rose-600"
            : "bg-white"
        }`}
        onClick={() => {
          if (symptom.includes(sym)) {
            setSymptom(symptom.replace(sym, ""));
          } else {
            setSymptom(symptom + " " + sym);
          }
        }}
      >
        {sym}
      </button>
    ))}

    {/* ⭐ 기타 버튼 */}
    <button
      className={`px-3 py-1 rounded-lg border ${
        symptom.includes("기타")
          ? "bg-rose-600 text-white border-rose-600"
          : "bg-white"
      }`}
      onClick={() => {
        if (symptom.includes("기타")) {
          setSymptom(symptom.replace("기타", ""));
        } else {
          setSymptom(symptom + " 기타");
        }
      }}
    >
      기타
    </button>
  </div>

  {/* ⭐ 기타 입력창 */}
  {symptom.includes("기타") && (
    <div className="mt-3">
      <input
        type="text"
        placeholder="기타 증상을 입력하세요 (예: 두통)"
        className="w-full border rounded-md p-2 text-sm"
        value={otherSymptom}
        onChange={(e) => setOtherSymptom(e.target.value)}
      />
    </div>
  )}
</div>

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
            const out = analyzeSymptoms(symptom + " " + otherSymptom);
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
