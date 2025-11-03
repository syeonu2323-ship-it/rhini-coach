"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** (헤더 주석은 아무거나 OK) */

// ---------- types ----------
type Verdict = "Positive" | "Negative" | "Invalid";
type Sensitivity = "sensitive" | "balanced" | "conservative";
type ControlPos = "auto" | "left" | "right" | "top" | "bottom";
type Mode = "auto" | "manual";
type Peak = { idx: number; z: number; width: number; area: number };

// ✅ 결과 타입: 중복 제거(단일 타입으로 통합)
type AnalyzeResult =
  | {
      ok: true;
      result: { verdict: Verdict; detail: string; confidence: "확실" | "보통" | "약함" };
    }
  | {
      ok: false;
      reason?: "nopeaks" | string;
      rect?: unknown;
      axis?: "x" | "y";
    };

// -----------------------------
//   공통: 내 위치 기반 약국/병원 찾기
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
    const naver = naverSearchUrl(q, lat, lng);
    const kakao = kakaoSearchUrl(q, lat, lng);
    window.open(naver, "_blank");
    window.open(kakao, "_blank");
  };

  return (
    <div className={`mt-4 p-4 rounded-2xl border ${compact ? "bg-white" : "bg-emerald-50 border-emerald-300"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold">{compact ? "근처 찾기" : "📍 근처 약국·병원 찾기"}</span>
        <button
          onClick={request}
          className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "위치 불러오는 중…" : lat && lng ? "내 위치 새로고침" : "내 위치로 찾기"}
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
        * 새 탭으로 네이버/카카오 지도를 동시에 엽니다. HTTPS에서 위치 권한을 허용해야 정확합니다.
      </p>
    </div>
  );
};

// -----------------------------
//   증상 → 약/과추천/주의신호 규칙
// -----------------------------
type SymptomInsight = {
  otc: string[];             // 약국에서 상담 가능한 일반의약품 카테고리
  depts: string[];           // 추천 진료과
  redFlags: string[];        // 즉시 진료 권고 사유
  notes?: string[];          // 추가 팁
};

function analyzeSymptoms(text: string): SymptomInsight {
  const t = (text || "").toLowerCase();

  const hit = (re: RegExp) => re.test(t);

  const out: SymptomInsight = { otc: [], depts: [], redFlags: [], notes: [] };

  // 코/알레르기
  if (hit(/비염|콧물|재채기|코막힘|가려움|알레르/)) {
    out.otc.push("항히스타민(세티리진, 로라타딘 등)", "비충혈제거제 단기 사용", "식염수 세척");
    out.depts.push("이비인후과", "알레르기내과");
    out.notes?.push("수면 장애가 있거나 장기간 지속되면 전문 진료 권장");
  }

  // 발열/통증
  if (hit(/발열|열|오한|두통|몸살|근육통|통증/)) {
    out.otc.push("해열·진통제(아세트아미노펜 등)");
    out.depts.push("가정의학과", "내과");
  }

  // 기침/호흡
  if (hit(/기침|가래|호흡곤란|숨참|천명|흉통|가슴 통증/)) {
    out.otc.push("기침억제제·거담제", "가글/목 스프레이");
    out.depts.push("호흡기내과", "가정의학과");
  }

  // 인후통
  if (hit(/인후통|목아픔|목 통증|연하통|침 삼키기/)) {
    out.otc.push("가글/살균제", "진통제");
    out.depts.push("이비인후과");
  }

  // 소아 키워드
  if (hit(/소아|아동|어린이|유아|아이/)) {
    out.notes?.push("소아는 체중 기반 용량 계산이 필요합니다. 복용 전 약사·의사 상담 권장");
    if (!out.depts.includes("소아청소년과")) out.depts.push("소아청소년과");
  }

  // 레드 플래그 (즉시 진료 권고)
  if (hit(/호흡곤란|청색증|숨을 못|의식 저하|경련|탈수|혈담|피 섞인 가래|40도|39도/)) {
    out.redFlags.push("호흡곤란/청색증/의식변화/고열 지속 등 응급 징후");
  }
  if (hit(/흉통|가슴통증/)) {
    out.redFlags.push("흉통 동반 — 즉시 진료 권고");
  }
  if (hit(/임신|임부|산모/)) {
    out.notes?.push("임신 중에는 일반약 복용 전 반드시 전문 상담 필요");
  }

  // 중복 제거
  out.otc = Array.from(new Set(out.otc));
  out.depts = Array.from(new Set(out.depts));
  out.redFlags = Array.from(new Set(out.redFlags));
  out.notes = Array.from(new Set(out.notes || []));

  return out;
}

// 최근 기록 저장/불러오기
type SymptomLog = { ts: number; text: string; verdict?: Verdict };
const SYMPTOM_KEY = "lfa_symptom_logs_v1";

function loadLogs(): SymptomLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SYMPTOM_KEY);
    return raw ? (JSON.parse(raw) as SymptomLog[]) : [];
  } catch {
    return [];
  }
}
function saveLog(entry: SymptomLog) {
  if (typeof window === "undefined") return;
  try {
    const prev = loadLogs();
    const next = [entry, ...prev].slice(0, 20); // 최근 20개만
    localStorage.setItem(SYMPTOM_KEY, JSON.stringify(next));
  } catch {}
}

// -----------------------------
//   양성 시 증상 기록/추천 패널
// -----------------------------
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
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  };

  return (
    <div className="mt-4 p-4 rounded-2xl border border-rose-300 bg-rose-50">
      <div className="font-semibold text-rose-700 mb-2">🩺 증상 기록 및 맞춤 안내</div>
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
              <div className="text-gray-500">입력된 증상으로 추천 항목이 없습니다.</div>
            )}
            <p className="mt-2 text-xs text-gray-500">* 기존 질환/복용약에 따라 적합성이 달라질 수 있어요.</p>
          </div>

          <div className="bg-white rounded-xl border p-3 text-sm">
            <div className="font-medium mb-1">🏥 추천 진료과</div>
            {insight.depts.length ? (
              <div className="flex flex-wrap gap-1">
                {insight.depts.map((d) => (
                  <span key={d} className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
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
              <div key={i} className="flex items-start justify-between gap-3">
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
//   음성 시 안내 패널 (라이트 증상 기록 토글 포함)
// -----------------------------
const NegativeAdvice = ({ again }: { again?: () => void }) => {
  const [showSymptom, setShowSymptom] = useState(false);

  return (
    <div className="mt-4 p-4 rounded-2xl border border-slate-300 bg-slate-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base font-semibold">🧭 음성 가이드</span>
        <span className="text-xs text-slate-700">이번 판독은 음성입니다.</span>
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

      {showSymptom && (
        <div className="mt-3">
          <SymptomLogger />
        </div>
      )}

      <NearbyFinder compact />

      <p className="mt-2 text-xs text-slate-500">
        * 이 도구는 참고용입니다. 개인 병력/복용약에 따라 달라질 수 있으니 필요 시 전문가 상담을 권장합니다.
      </p>
    </div>
  );
};

// -----------------------------
//   메인 컴포넌트 (데모 분석 로직 포함)
// -----------------------------
export default function LfaAnalyzer() {
  const [result, setResult] = useState<{ verdict: Verdict; detail: string; confidence: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 🔍 간단한 분석 시뮬레이션 (실전 로직을 붙여도 타입 그대로 사용 가능)
  const analyzeOnce = (forceAxis?: "x" | "y"): AnalyzeResult => {
    if (!imgRef.current) return { ok: false, reason: "no image" };
    const rand = Math.random();
    if (rand < 0.33)
      return { ok: true, result: { verdict: "Positive", detail: "양성으로 감지되었습니다.", confidence: "확실" } };
    else if (rand < 0.66)
      return { ok: true, result: { verdict: "Negative", detail: "테스트 라인이 보이지 않습니다.", confidence: "보통" } };
    else return { ok: false, reason: "nopeaks", axis: forceAxis };
  };

  const analyze = useCallback(() => {
    setBusy(true);
    setTimeout(() => {
      const out = analyzeOnce();
      if (out.ok) {
        setResult(out.result);
        // 결과와 함께 빈 증상 로그도 저장(추후 비교용)
        saveLog({ ts: Date.now(), text: "", verdict: out.result.verdict });
      } else {
        setResult({ verdict: "Invalid", detail: "처리 실패", confidence: "약함" });
      }
      setBusy(false);
    }, 800);
  }, []);

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImageUrl(URL.createObjectURL(f));
  };

  const VerdictBadge = useMemo(() => {
    if (!result) return null;
    const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold";
    if (result.verdict === "Positive") return <span className={`${base} bg-red-100 text-red-800`}>✅ 양성</span>;
    if (result.verdict === "Negative") return <span className={`${base} bg-green-100 text-green-800`}>🟢 음성</span>;
    return <span className={`${base} bg-gray-200 text-gray-800`}>⚠️ 무효</span>;
  }, [result]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-1">📷 LFA QuickCheck v4.6</h1>
      <p className="text-sm text-gray-600 mb-4">양성/음성 맞춤 안내 + 근처 약국·병원 찾기 + 증상 기록 저장.</p>

      <label className="block border-2 border-dashed rounded-2xl p-6 mb-4 text-center cursor-pointer hover:bg-gray-50">
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onInput} />
        <div className="flex flex-col items-center gap-1">
          <div className="text-5xl">⬆️</div>
          <div className="font-medium">사진 업로드 / 드래그</div>
          <div className="text-xs text-gray-500">팁: 테스트창이 화면의 50% 이상 차게 촬영하세요.</div>
        </div>
      </label>

      {imageUrl && (
        <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 mb-4">
          <img ref={imgRef} src={imageUrl} alt="uploaded" className="w-full h-auto object-contain" />
        </div>
      )}

      <button
        onClick={analyze}
        disabled={!imageUrl || busy}
        className="px-5 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
      >
        {busy ? "분석 중…" : "분석하기"}
      </button>

      {/* 결과 카드 */}
      <div className="mt-4 p-4 rounded-2xl border bg-white">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-base font-semibold">판독 결과</span>
          {VerdictBadge}
        </div>
        <div className="text-sm text-gray-700">
          {result ? `${result.detail} · 신뢰도: ${result.confidence}` : "사진을 올리면 자동으로 판독합니다."}
        </div>
      </div>

      {/* ✅ 양성일 때: 증상 기록(저장) + 약/과 추천 + 근처찾기 */}
      {result?.verdict === "Positive" && (
        <>
          <SymptomLogger defaultVerdict="Positive" />
          <NearbyFinder />
        </>
      )}

      {/* ✅ 음성일 때: 안내 + 재검사 권고 + 라이트 증상 기록 + 근처찾기 */}
      {result?.verdict === "Negative" && <NegativeAdvice again={() => analyze()} />}

      {/* 무효일 때도 원하면 근처 찾기 노출 가능
      {result?.verdict === "Invalid" && <NearbyFinder compact />}
      */}
    </div>
  );
}
