"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

/* ---------------------------------------------------------------------
   타입 정의
--------------------------------------------------------------------- */
type Verdict = "Positive" | "Negative" | "Invalid";
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
    };

/* ---------------------------------------------------------------------
   위치 기반 약국/병원 찾기
--------------------------------------------------------------------- */

function useGeo() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const request = () => {
    if (!navigator.geolocation) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLoading(false);
      },
      () => setLoading(false)
    );
  };

  return { lat, lng, loading, request };
}

function naverUrl(q: string, lat?: number | null, lng?: number | null) {
  const enc = encodeURIComponent(q);
  if (lat != null && lng != null) {
    const c = `${lng},${lat},15,0,0,0,d`;
    return `https://map.naver.com/v5/search/${enc}?c=${c}`;
  }
  return `https://map.naver.com/v5/search/${enc}`;
}

function kakaoUrl(q: string, lat?: number | null, lng?: number | null) {
  const enc = encodeURIComponent(q);
  if (lat != null && lng != null)
    return `https://map.kakao.com/link/search/${enc}?x=${lng}&y=${lat}`;
  return `https://map.kakao.com/?q=${enc}`;
}

function NearbyFinder() {
  const { lat, lng, request, loading } = useGeo();

  const search = (q: string) => {
    window.open(naverUrl(q, lat, lng), "_blank");
    window.open(kakaoUrl(q, lat, lng), "_blank");
  };

  return (
    <div className="mt-4 p-4 border rounded-xl bg-emerald-50">
      <div className="flex gap-2 items-center mb-2">
        <span className="font-semibold">📍 근처 약국·병원 찾기</span>
        <button
          className="px-2 py-1 border rounded-md bg-white text-xs"
          onClick={request}
        >
          {loading ? "위치 불러오는 중…" : "내 위치"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          onClick={() => search("약국")}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
        >
          약국
        </button>

        <button
          onClick={() => search("이비인후과")}
          className="px-3 py-1.5 rounded-lg bg-white border"
        >
          이비인후과
        </button>

        <button
          onClick={() => search("호흡기내과")}
          className="px-3 py-1.5 rounded-lg bg-white border"
        >
          호흡기내과
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   증상 분석 → 약/과 추천 시스템
--------------------------------------------------------------------- */

function analyzeSymptoms(text: string) {
  const t = (text || "").toLowerCase();
  const hit = (r: RegExp) => r.test(t);

  let otc: string[] = [];
  let dept: string[] = [];
  let flags: string[] = [];

  if (hit(/비염|콧물|재채기|코막힘|가려움/)) {
    otc.push("항히스타민(세티리진/로라타딘)");
    otc.push("비충혈 제거제(단기)");
    dept.push("이비인후과");
    dept.push("알레르기내과");
  }

  if (hit(/발열|열|오한|근육통|통증/)) {
    otc.push("해열·진통제(아세트아미노펜)");
    dept.push("내과");
  }

  if (hit(/기침|가래|호흡곤란|흉통/)) {
    otc.push("기침 억제제·거담제");
    dept.push("호흡기내과");
  }

  if (hit(/호흡곤란|청색증|의식변화/)) {
    flags.push("응급 증상 가능. 즉시 진료 필요");
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
    <div className="mt-4 p-4 border rounded-xl bg-rose-50">
      <div className="font-semibold text-rose-700 mb-2">📝 증상 기록 및 분석</div>

      <textarea
        rows={3}
        className="w-full border p-2 rounded-md text-sm mb-2"
        placeholder="예: 콧물, 재채기, 목아픔..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={() => setOut(analyzeSymptoms(text))}
        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm"
      >
        분석하기
      </button>

      {out && (
        <div className="mt-3 text-sm">
          <div className="font-medium mb-1">💊 추천 일반의약품</div>
          {out.otc.length ? (
            <ul className="list-disc ml-5">
              {out.otc.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            "추천 없음"
          )}

          <div className="font-medium mt-3 mb-1">🏥 추천 진료과</div>
          {out.dept.length ? (
            <ul className="list-disc ml-5">
              {out.dept.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            "추천 없음"
          )}

          {out.flags.length > 0 && (
            <div className="mt-3 p-2 border rounded-lg text-red-700 bg-red-50 text-xs">
              ⚠️ {out.flags.join(" / ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   비염 타입별 해석
--------------------------------------------------------------------- */

function RhinitisAdvice({ diagnosis }: { diagnosis: Diagnosis }) {
  if (diagnosis === "none") return null;

  const info =
    diagnosis === "allergic"
      ? {
          title: "🌼 알레르기성 비염",
          desc: "ECP 양성 패턴 → 면역반응 기반 비염 가능성이 높습니다.",
        }
      : diagnosis === "bacterial"
      ? {
          title: "🦠 세균성 비염",
          desc: "MPO 양성 패턴 → 세균 감염 가능성이 있습니다.",
        }
      : {
          title: "🌼🦠 혼합형 비염",
          desc: "ECP + MPO 모두 양성 → 복합 원인 가능성이 있습니다.",
        };

  return (
    <div className="mt-4 p-4 border bg-amber-50 border-amber-300 rounded-xl">
      <div className="font-semibold mb-1">{info.title}</div>
      <p className="text-sm text-amber-800">{info.desc}</p>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Worker — 자동판독 엔진
--------------------------------------------------------------------- */

function makeWorkerURL() {
  const src = `
self.onmessage = async (ev) => {
  const { bitmap } = ev.data;

  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);

    const { width, height } = canvas;
    const img = ctx.getImageData(0, 0, width, height);
    const data = img.data;

    const mask = new Uint8Array(width * height);

    // 1) RGB→HSV + 붉은 마스크
    for (let i = 0; i < width * height; i++) {
      const r = data[i*4]/255;
      const g = data[i*4+1]/255;
      const b = data[i*4+2]/255;

      const mx = Math.max(r,g,b);
      const mn = Math.min(r,g,b);
      const d = mx - mn;

      let h = 0;
      if (d !== 0) {
        if (mx === r) h = ((g-b)/d) % 6;
        else if (mx === g) h = (b-r)/d + 2;
        else h = (r-g)/d + 4;
      }
      h = (h*60+360) % 360;

      const s = mx === 0 ? 0 : d/mx;
      const v = mx;

      if ((h < 25 || h > 330) && s > 0.35 && v > 0.25) mask[i] = 1;
    }

    // 2) Blob 자동 탐지
    const visited = new Uint8Array(width * height);
    const blobs = [];

    for (let i = 0; i < width * height; i++) {
      if (mask[i] && !visited[i]) {
        const q = [i];
        visited[i] =1;

        let count=0;
        let minY=height, maxY=0;

        while(q.length){
          const p = q.pop();
          count++;
          const y = (p/width)|0;
          minY = Math.min(minY,y);
          maxY = Math.max(maxY,y);

          const nb=[p-1,p+1,p-width,p+width];
          for(const n of nb){
            if(n>=0 && n < width*height && mask[n] && !visited[n]){
              visited[n]=1;
              q.push(n);
            }
          }
        }

        if(count>120){
          blobs.push({
            count,
            centerY:(minY+maxY)/2
          });
        }
      }
    }

    if(blobs.length===0){
      self.postMessage({ok:false, reason:"no-lines"});
      return;
    }

    blobs.sort((a,b)=>a.centerY-b.centerY);

    const C = blobs[0];
    const M = blobs[1] || null;
    const E = blobs[2] || null;

    const mpo = !!M;
    const ecp = !!E;

    self.postMessage({
      ok:true,
      result:{
        verdict: mpo || ecp ? "Positive":"Negative",
        detail: \`C=OK | MPO=\${mpo} | ECP=\${ecp}\`,
        confidence:"확실",
        diagnosis:
          mpo && ecp ? "mixed" :
          mpo ? "bacterial" :
          ecp ? "allergic" :
          "none",
        mpoPositive:mpo,
        ecpPositive:ecp
      }
    });

  } catch(e){
    self.postMessage({ok:false, reason:"worker-error"});
  }
};
`;

  return URL.createObjectURL(new Blob([src], { type: "application/javascript" }));
}

/* ---------------------------------------------------------------------
   메인 자동판독 UI
--------------------------------------------------------------------- */

export default function LfaAnalyzer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeResult["result"] | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const procRef = useRef<HTMLCanvasElement | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Worker 생성
  useEffect(() => {
    const url = makeWorkerURL();
    const w = new Worker(url);
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  // 파일 선택
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setResult(null);
    setImageUrl(URL.createObjectURL(f));
  };

  // Canvas에 이미지 그리기
  useEffect(() => {
    if (!imageUrl || !imgRef.current || !procRef.current) return;

    const img = imgRef.current;
    const canvas = procRef.current;
    const ctx = canvas.getContext("2d")!;

    const onLoad = () => {
      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      const scale = Math.min(1, 1400 / Math.max(sw, sh));

      const dw = Math.round(sw * scale);
      const dh = Math.round(sh * scale);

      canvas.width = dw;
      canvas.height = dh;

      ctx.clearRect(0, 0, dw, dh);
      ctx.drawImage(img, 0, 0, dw, dh);
    };

    if (img.complete) onLoad();
    else img.addEventListener("load", onLoad, { once: true });
  }, [imageUrl]);

  // 자동판독 시작
  const analyze = useCallback(async () => {
    if (!procRef.current || !workerRef.current) return;

    setBusy(true);
    const bitmap = await createImageBitmap(procRef.current);

    const res: AnalyzeResult = await new Promise((resolve) => {
      const handler = (ev: MessageEvent) => {
        workerRef.current?.removeEventListener("message", handler);
        resolve(ev.data);
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ bitmap }, [bitmap]);
    });

    if (res.ok) setResult(res.result);
    else
      setResult({
        verdict: "Invalid",
        detail: res.reason || "",
        confidence: "약함",
        diagnosis: "none",
        mpoPositive: false,
        ecpPositive: false,
      });

    setBusy(false);
  }, []);

  const VerdictBadge = useMemo(() => {
    if (!result) return null;
    const base = "px-3 py-1 rounded-full text-sm";

    if (result.verdict === "Positive")
      return <span className={`${base} bg-red-100 text-red-700`}>양성</span>;

    if (result.verdict === "Negative")
      return <span className={`${base} bg-green-100 text-green-700`}>음성</span>;

    return <span className={`${base} bg-gray-200 text-gray-700`}>무효</span>;
  }, [result]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">
        📷 LFA QuickCheck v8.0 — 자동판독 키트
      </h1>

      {/* 업로드 */}
      <div className="border-2 border-dashed p-6 rounded-xl mb-4 text-center">
        <input
          id="file"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onInput}
        />
        <label htmlFor="file" className="cursor-pointer font-medium text-indigo-600">
          사진 업로드 / 드래그
        </label>
      </div>

      {/* 분석 버튼 */}
      <button
        onClick={analyze}
        disabled={!imageUrl || busy}
        className="px-4 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
      >
        {busy ? "분석 중…" : "분석"}
      </button>

      {/* Canvas 미리보기 */}
      <div className="mt-4">
        <canvas ref={procRef} className="w-full rounded-xl" />
      </div>

      {/* 결과 */}
      <div className="mt-4 p-4 border rounded-xl bg-white">
        <div className="flex gap-2 items-center mb-1">
          <span className="font-semibold">판독 결과</span>
          {VerdictBadge}
        </div>

        <p className="text-sm text-gray-700">{result?.detail}</p>

        {result && (
          <div className="mt-2 flex gap-2 text-xs">
            <span
              className={`px-2 py-1 rounded-full ${
                result.ecpPositive ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              ECP: {result.ecpPositive ? "양성" : "음성"}
            </span>

            <span
              className={`px-2 py-1 rounded-full ${
                result.mpoPositive ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              MPO: {result.mpoPositive ? "양성" : "음성"}
            </span>
          </div>
        )}
      </div>

      {/* 비염 해석 */}
      {result?.diagnosis && result.diagnosis !== "none" && (
        <RhinitisAdvice diagnosis={result.diagnosis} />
      )}

      {/* 증상 분석/약 추천 */}
      {result && <SymptomLogger defaultVerdict={result.verdict} />}

      {/* 근처 약국/병원 찾기 */}
      <NearbyFinder />
    </div>
  );
}
