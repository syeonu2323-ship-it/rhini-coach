(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/LfaAnalyzer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LfaAnalyzer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
"use client";
;
// ---------- 판정 프리셋 ----------
const PRESETS = {
    sensitive: {
        CONTROL_MIN: 1.2,
        TEST_MIN_ABS: 0.95,
        TEST_MIN_REL: 0.3,
        MAX_WIDTH_FRAC: 0.16,
        MIN_SEP_FRAC: 0.04,
        MAX_SEP_FRAC: 0.8,
        MIN_AREA_FRAC: 0.14
    },
    balanced: {
        CONTROL_MIN: 1.45,
        TEST_MIN_ABS: 1.1,
        TEST_MIN_REL: 0.4,
        MAX_WIDTH_FRAC: 0.12,
        MIN_SEP_FRAC: 0.05,
        MAX_SEP_FRAC: 0.7,
        MIN_AREA_FRAC: 0.24
    },
    conservative: {
        CONTROL_MIN: 1.7,
        TEST_MIN_ABS: 1.35,
        TEST_MIN_REL: 0.55,
        MAX_WIDTH_FRAC: 0.1,
        MIN_SEP_FRAC: 0.06,
        MAX_SEP_FRAC: 0.6,
        MIN_AREA_FRAC: 0.34
    }
};
// -----------------------------
//   공통: 내 위치 기반 약국/병원 찾기
// -----------------------------
function useGeo() {
    _s();
    const [lat, setLat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lng, setLng] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [err, setErr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const request = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGeo.useCallback[request]": ()=>{
            if (!navigator.geolocation) {
                setErr("이 브라우저에서는 위치 기능을 지원하지 않습니다.");
                return;
            }
            setLoading(true);
            setErr(null);
            navigator.geolocation.getCurrentPosition({
                "useGeo.useCallback[request]": (pos)=>{
                    setLat(pos.coords.latitude);
                    setLng(pos.coords.longitude);
                    setLoading(false);
                }
            }["useGeo.useCallback[request]"], {
                "useGeo.useCallback[request]": (e)=>{
                    setErr(e.message || "위치 정보를 가져오지 못했습니다.");
                    setLoading(false);
                }
            }["useGeo.useCallback[request]"], {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            });
        }
    }["useGeo.useCallback[request]"], []);
    return {
        lat,
        lng,
        loading,
        err,
        request
    };
}
_s(useGeo, "0+zde6F/k0ddbGQHeF9DuBEZC5A=");
function naverSearchUrl(q, lat, lng) {
    const query = encodeURIComponent(q);
    if (lat != null && lng != null) {
        const c = `${lng},${lat},15,0,0,0,d`;
        return `https://map.naver.com/v5/search/${query}?c=${c}`;
    }
    return `https://map.naver.com/v5/search/${query}`;
}
function kakaoSearchUrl(q, lat, lng) {
    const query = encodeURIComponent(q);
    if (lat != null && lng != null) {
        return `https://map.kakao.com/link/search/${query}?x=${lng}&y=${lat}`;
    }
    return `https://map.kakao.com/?q=${query}`;
}
const NearbyFinder = ({ compact = false })=>{
    _s1();
    const { lat, lng, loading, err, request } = useGeo();
    const openBoth = (q)=>{
        const naver = naverSearchUrl(q, lat, lng);
        const kakao = kakaoSearchUrl(q, lat, lng);
        window.open(naver, "_blank");
        window.open(kakao, "_blank");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `mt-4 p-4 rounded-2xl border ${compact ? "bg-white" : "bg-emerald-50 border-emerald-300"}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-semibold",
                        children: compact ? "근처 찾기" : "📍 근처 약국·병원 찾기"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: request,
                        className: "px-2 py-1 rounded-md border text-xs hover:bg-gray-50",
                        disabled: loading,
                        children: loading ? "위치 불러오는 중…" : lat && lng ? "내 위치 새로고침" : "내 위치로 찾기"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-red-600 mb-2",
                children: [
                    "위치 오류: ",
                    err
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 116,
                columnNumber: 15
            }, ("TURBOPACK compile-time value", void 0)),
            lat && lng && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-gray-500 mb-2",
                children: [
                    "내 위치: ",
                    lat.toFixed(5),
                    ", ",
                    lng.toFixed(5)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 117,
                columnNumber: 22
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>openBoth("약국"),
                        className: "px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm",
                        children: "약국 찾기 (네이버/카카오)"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 119,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>openBoth("이비인후과"),
                        className: "px-3 py-1.5 rounded-lg bg-white border text-sm",
                        children: "이비인후과 찾기"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>openBoth("호흡기내과"),
                        className: "px-3 py-1.5 rounded-lg bg-white border text-sm",
                        children: "호흡기내과 찾기"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 125,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    !compact && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>openBoth("응급실"),
                        className: "px-3 py-1.5 rounded-lg bg-white border text-sm",
                        children: "응급실 찾기"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 129,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 118,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-2 text-xs text-gray-500",
                children: "* 새 탭으로 네이버/카카오 지도를 동시에 엽니다. HTTPS에서 위치 권한을 허용해야 정확합니다."
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/LfaAnalyzer.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(NearbyFinder, "ISQWNARoMxBxPP4y1NDM/POBhkA=", false, function() {
    return [
        useGeo
    ];
});
_c = NearbyFinder;
function analyzeSymptoms(text) {
    const t = (text || "").toLowerCase();
    const hit = (re)=>re.test(t);
    const out = {
        otc: [],
        depts: [],
        redFlags: [],
        notes: []
    };
    if (hit(/비염|콧물|재채기|코막힘|가려움|알레르/)) {
        out.otc.push("항히스타민(세티리진, 로라타딘 등)", "비충혈제거제 단기 사용", "식염수 세척");
        out.depts.push("이비인후과", "알레르기내과");
        out.notes?.push("수면 장애가 있거나 장기간 지속되면 전문 진료 권장");
    }
    if (hit(/발열|열|오한|두통|몸살|근육통|통증/)) {
        out.otc.push("해열·진통제(아세트아미노펜 등)");
        out.depts.push("가정의학과", "내과");
    }
    if (hit(/기침|가래|호흡곤란|숨참|천명|흉통|가슴 통증/)) {
        out.otc.push("기침억제제·거담제", "가글/목 스프레이");
        out.depts.push("호흡기내과", "가정의학과");
    }
    if (hit(/인후통|목아픔|목 통증|연하통|침 삼키기/)) {
        out.otc.push("가글/살균제", "진통제");
        out.depts.push("이비인후과");
    }
    if (hit(/소아|아동|어린이|유아|아이/)) {
        out.notes?.push("소아는 체중 기반 용량 계산이 필요합니다. 복용 전 약사·의사 상담 권장");
        if (!out.depts.includes("소아청소년과")) out.depts.push("소아청소년과");
    }
    if (hit(/호흡곤란|청색증|숨을 못|의식 저하|경련|탈수|혈담|피 섞인 가래|40도|39도/)) {
        out.redFlags.push("호흡곤란/청색증/의식변화/고열 지속 등 응급 징후");
    }
    if (hit(/흉통|가슴통증/)) out.redFlags.push("흉통 동반 — 즉시 진료 권고");
    if (hit(/임신|임부|산모/)) out.notes?.push("임신 중에는 일반약 복용 전 반드시 전문 상담 필요");
    out.otc = Array.from(new Set(out.otc));
    out.depts = Array.from(new Set(out.depts));
    out.redFlags = Array.from(new Set(out.redFlags));
    out.notes = Array.from(new Set(out.notes || []));
    return out;
}
const SYMPTOM_KEY = "lfa_symptom_logs_v1";
function loadLogs() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = localStorage.getItem(SYMPTOM_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch  {
        return [];
    }
}
function saveLog(entry) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const prev = loadLogs();
        const next = [
            entry,
            ...prev
        ].slice(0, 20);
        localStorage.setItem(SYMPTOM_KEY, JSON.stringify(next));
    } catch  {}
}
const SymptomLogger = ({ defaultVerdict })=>{
    _s2();
    const [symptom, setSymptom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [insight, setInsight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [recent, setRecent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SymptomLogger.useEffect": ()=>{
            setRecent(loadLogs());
        }
    }["SymptomLogger.useEffect"], []);
    const handleSubmit = ()=>{
        const res = analyzeSymptoms(symptom);
        setInsight(res);
        saveLog({
            ts: Date.now(),
            text: symptom,
            verdict: defaultVerdict
        });
        setRecent(loadLogs());
    };
    const fmt = (ts)=>{
        const d = new Date(ts);
        const pad = (n)=>n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4 p-4 rounded-2xl border border-rose-300 bg-rose-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "font-semibold text-rose-700 mb-2",
                children: "🩺 증상 기록 및 맞춤 안내"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 232,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                placeholder: "현재 증상을 입력하세요. (예: 콧물, 재채기, 두통, 기침, 목아픔, 소아)",
                className: "w-full p-2 border rounded-md mb-2 text-sm",
                rows: 3,
                value: symptom,
                onChange: (e)=>setSymptom(e.target.value)
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleSubmit,
                className: "px-4 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700",
                children: "맞춤 안내 받기"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 240,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            insight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 grid grid-cols-1 md:grid-cols-2 gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border p-3 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-medium mb-1",
                                children: "💊 추천 일반의약품(카테고리)"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 247,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            insight.otc.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "list-disc ml-5 space-y-1",
                                children: insight.otc.map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: x
                                    }, x, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 251,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 249,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-gray-500",
                                children: "입력된 증상으로 추천 항목이 없습니다."
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 255,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-xs text-gray-500",
                                children: "* 기존 질환/복용약에 따라 적합성이 달라질 수 있어요."
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 257,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 246,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl border p-3 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-medium mb-1",
                                children: "🏥 추천 진료과"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 261,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            insight.depts.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-1",
                                children: insight.depts.map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs",
                                        children: d
                                    }, d, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 265,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 263,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-gray-500",
                                children: "특정 진료과 추천 없음"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 271,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            insight.redFlags.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs",
                                children: [
                                    "⚠️ 즉시 진료 권고: ",
                                    insight.redFlags.join(" · ")
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 274,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            insight.notes && insight.notes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "mt-2 list-disc ml-5 text-xs text-gray-600 space-y-1",
                                children: insight.notes.map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: n
                                    }, n, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 279,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 277,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 260,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "md:col-span-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NearbyFinder, {
                            compact: true
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 286,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 285,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 245,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            recent.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 bg-white rounded-xl border p-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-medium text-sm mb-2",
                        children: "🗂 최근 기록"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 293,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-2 text-xs",
                        children: recent.slice(0, 6).map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-gray-800",
                                                children: r.text
                                            }, void 0, false, {
                                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                                lineNumber: 298,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-gray-500",
                                                children: fmt(r.ts)
                                            }, void 0, false, {
                                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                                lineNumber: 299,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 297,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    r.verdict && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "px-2 py-0.5 rounded-full " + (r.verdict === "Positive" ? "bg-red-100 text-red-700" : r.verdict === "Negative" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"),
                                        children: r.verdict
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 302,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, i, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 296,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 294,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 292,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/LfaAnalyzer.tsx",
        lineNumber: 231,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s2(SymptomLogger, "DlYXsw2Fy/V8eJ0yHFhDg0lLGdM=");
_c1 = SymptomLogger;
const NegativeAdvice = ({ again })=>{
    _s3();
    const [showSymptom, setShowSymptom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4 p-4 rounded-2xl border border-slate-300 bg-slate-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-base font-semibold",
                        children: "🧭 음성 가이드"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 329,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-slate-700",
                        children: "이번 판독은 음성입니다."
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 330,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 328,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "list-disc ml-5 text-sm text-slate-700 space-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: "증상이 없거나 경미하면 경과 관찰만으로 충분할 수 있습니다."
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 333,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: "채취 시점이 너무 이르거나 채취량이 적으면 음성으로 나올 수 있습니다."
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 334,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: "조명·각도·반사 등 이미지 품질 저하도 테스트 라인 인식에 영향을 줄 수 있습니다."
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 335,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 332,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 p-3 rounded-xl bg-white border text-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-medium mb-1",
                        children: "🤔 증상이 나타나거나 심해지면"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 339,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "list-disc ml-5 space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "24–48시간 내 유사 조건으로 ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: "다시 키트 검사"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 341,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "를 권장합니다."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 341,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "재채기·콧물·코막힘 등 뚜렷한 증상이 있으면 간단히 기록해 두세요."
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 342,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "호흡곤란, 고열 지속 등 경고 신호 시 ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: "의료기관 상담"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 343,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "이 우선입니다."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 343,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 340,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 flex flex-wrap items-center gap-2",
                        children: [
                            again && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: again,
                                className: "px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm",
                                children: "다시 분석하기"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 347,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowSymptom(!showSymptom),
                                className: "px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm bg-white hover:bg-slate-100",
                                children: showSymptom ? "증상 기록 닫기" : "증상 기록 열기"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 351,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 345,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 338,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            showSymptom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SymptomLogger, {}, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 362,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 361,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NearbyFinder, {
                compact: true
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 366,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-2 text-xs text-slate-500",
                children: "* 이 도구는 참고용입니다. 필요 시 전문가 상담을 권장합니다."
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 367,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/components/LfaAnalyzer.tsx",
        lineNumber: 327,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s3(NegativeAdvice, "nqczj9YoZ6dGZ7lH8dTIaYjtYlo=");
_c2 = NegativeAdvice;
function LfaAnalyzer() {
    _s4();
    const [imageUrl, setImageUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("auto");
    const [sensitivity, setSensitivity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("balanced");
    const [controlPos, setControlPos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("auto");
    const [requireTwoLines, setRequireTwoLines] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [appliedRotation, setAppliedRotation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const imgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const overlayRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // manual guides
    const [guideC, setGuideC] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [guideT, setGuideT] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // ---------- helpers
    const clamp = (n, min, max)=>Math.max(min, Math.min(max, n));
    const movingAverage = (a, w)=>{
        const h = Math.floor(w / 2), o = new Array(a.length).fill(0);
        for(let i = 0; i < a.length; i++){
            let s = 0, c = 0;
            for(let j = i - h; j <= i + h; j++)if (j >= 0 && j < a.length) {
                s += a[j];
                c++;
            }
            o[i] = c ? s / c : 0;
        }
        return o;
    };
    const quantile = (arr, q)=>{
        const s = Array.from(arr).filter(Number.isFinite).slice().sort((x, y)=>x - y);
        if (!s.length) return 0;
        return s[Math.floor((s.length - 1) * q)];
    };
    // ---------- rotation
    function drawRotated(img, deg) {
        const rad = deg * Math.PI / 180;
        const srcW = img.naturalWidth || img.width, srcH = img.naturalHeight || img.height;
        const scale = Math.min(1, 900 / Math.max(srcW, srcH));
        const base = document.createElement("canvas");
        const bctx = base.getContext("2d");
        base.width = Math.round(srcW * scale);
        base.height = Math.round(srcH * scale);
        bctx.drawImage(img, 0, 0, base.width, base.height);
        const w = base.width, h = base.height;
        const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
        const rw = Math.round(w * cos + h * sin), rh = Math.round(w * sin + h * cos);
        const rot = document.createElement("canvas");
        const rctx = rot.getContext("2d");
        rot.width = rw;
        rot.height = rh;
        rctx.translate(rw / 2, rh / 2);
        rctx.rotate(rad);
        rctx.drawImage(base, -w / 2, -h / 2);
        return rot;
    }
    function edgeEnergy(c) {
        const ctx = c.getContext("2d");
        if (!ctx) return 0;
        const { width: w, height: h } = c;
        const data = ctx.getImageData(0, 0, w, h).data;
        let e = 0;
        for(let y = 1; y < h - 1; y += 2){
            for(let x = 1; x < w - 1; x += 2){
                const i = (y * w + x) * 4;
                const g = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
                const gx = 0.2126 * data[i + 4] + 0.7152 * data[i + 5] + 0.0722 * data[i + 6] - (0.2126 * data[i - 4] + 0.7152 * data[i - 3] + 0.0722 * data[i - 2]);
                const gy = 0.2126 * data[i + 4 * w] + 0.7152 * data[i + 4 * w + 1] + 0.0722 * data[i + 4 * w + 2] - (0.2126 * data[i - 4 * w] + 0.7152 * data[i - 4 * w + 1] + 0.0722 * data[i - 4 * w + 2]);
                e += Math.abs(gx) + Math.abs(gy) + g * 0.002;
            }
        }
        return e / (w * h);
    }
    // ---------- window rect + masks + contrast stretch
    function findWindowRect(c) {
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("Canvas context missing");
        const { width: w, height: h } = c;
        const img = ctx.getImageData(0, 0, w, h);
        const data = img.data;
        const br = new Float32Array(w * h);
        const sat = new Float32Array(w * h);
        for(let y = 0; y < h; y++){
            for(let x = 0; x < w; x++){
                const i = (y * w + x) * 4, R = data[i], G = data[i + 1], B = data[i + 2];
                const max = Math.max(R, G, B), min = Math.min(R, G, B);
                br[y * w + x] = 0.2126 * R + 0.7152 * G + 0.0722 * B;
                sat[y * w + x] = max === 0 ? 0 : (max - min) / max;
            }
        }
        const col = new Float32Array(w), row = new Float32Array(h);
        for(let x = 0; x < w; x++){
            let s = 0;
            for(let y = 0; y < h; y++)s += br[y * w + x];
            col[x] = s / h;
        }
        for(let y = 0; y < h; y++){
            let s = 0;
            for(let x = 0; x < w; x++)s += br[y * w + x];
            row[y] = s / w;
        }
        const dcol = movingAverage(Array.from(col).map((v, i)=>i ? Math.abs(v - col[i - 1]) : 0), Math.max(9, Math.floor(w / 40)));
        const drow = movingAverage(Array.from(row).map((v, i)=>i ? Math.abs(v - row[i - 1]) : 0), Math.max(9, Math.floor(h / 40)));
        const thx = quantile(dcol, 0.9), thy = quantile(drow, 0.9);
        const xs = [];
        for(let i = 1; i < w - 1; i++)if (dcol[i] > thx && dcol[i] >= dcol[i - 1] && dcol[i] > dcol[i + 1]) xs.push(i);
        const ys = [];
        for(let i = 1; i < h - 1; i++)if (drow[i] > thy && drow[i] >= drow[i - 1] && drow[i] > drow[i + 1]) ys.push(i);
        const pickPair = (arr, N)=>{
            if (arr.length < 2) return [
                Math.round(N * 0.12),
                Math.round(N * 0.88)
            ];
            let L = arr[0], R = arr[arr.length - 1], gap = R - L;
            for(let i = 0; i < arr.length; i++)for(let j = i + 1; j < arr.length; j++){
                const g = arr[j] - arr[i];
                if (g > gap) {
                    gap = g;
                    L = arr[i];
                    R = arr[j];
                }
            }
            if (gap < N * 0.2) return [
                Math.round(N * 0.12),
                Math.round(N * 0.88)
            ];
            return [
                L,
                R
            ];
        };
        let [x0, x1] = pickPair(xs, w), [y0, y1] = pickPair(ys, h);
        const padX = Math.round((x1 - x0) * 0.03), padY = Math.round((y1 - y0) * 0.05);
        x0 = clamp(x0 + padX, 0, w - 2);
        x1 = clamp(x1 - padX, 1, w - 1);
        y0 = clamp(y0 + padY, 0, h - 2);
        y1 = clamp(y1 - padY, 1, h - 1);
        // glare/shadow mask (완화)
        const glareMask = new Uint8Array(w * h);
        const brHi = quantile(br, 0.96), brLo = quantile(br, 0.05);
        for(let i = 0; i < w * h; i++){
            if (br[i] > brHi && sat[i] < 0.12) glareMask[i] = 1;
            if (br[i] < brLo * 0.6) glareMask[i] = 1;
        }
        // 대비 보정: 윈도 영역만 1~99% 스트레치
        const win = [];
        for(let yy = y0; yy <= y1; yy++)for(let xx = x0; xx <= x1; xx++)win.push(br[yy * w + xx]);
        const p1 = quantile(win, 0.01), p99 = quantile(win, 0.99) || 1;
        const a = 255 / Math.max(1, p99 - p1), b = -a * p1;
        for(let yy = y0; yy <= y1; yy++)for(let xx = x0; xx <= x1; xx++){
            const k = yy * w + xx;
            br[k] = clamp(a * br[k] + b, 0, 255);
        }
        return {
            x0,
            x1,
            y0,
            y1,
            glareMask,
            br
        };
    }
    function analyzeWindow(c, rect) {
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("Canvas context missing");
        const { x0, x1, y0, y1, glareMask } = rect;
        const w = c.width;
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        const profX = [];
        for(let x = x0; x <= x1; x++){
            let s = 0, cnt = 0;
            for(let y = y0; y <= y1; y++){
                const i = y * w + x, ii = i * 4;
                if (glareMask[i]) continue;
                const R = data[ii], G = data[ii + 1], B = data[ii + 2];
                const sum = R + G + B || 1;
                const chroma = R / sum - 0.5 * (G / sum + B / sum);
                s += chroma;
                cnt++;
            }
            profX.push(cnt ? s / cnt : 0);
        }
        const profY = [];
        for(let y = y0; y <= y1; y++){
            let s = 0, cnt = 0;
            for(let x = x0; x <= x1; x++){
                const i = y * w + x, ii = i * 4;
                if (glareMask[i]) continue;
                const R = data[ii], G = data[ii + 1], B = data[ii + 2];
                const sum = R + G + B || 1;
                const chroma = R / sum - 0.5 * (G / sum + B / sum);
                s += chroma;
                cnt++;
            }
            profY.push(cnt ? s / cnt : 0);
        }
        return {
            profX,
            profY
        };
    }
    function peaksFromProfile(arr) {
        const bg = movingAverage(arr, Math.max(11, Math.floor(arr.length / 12)));
        const detr = arr.map((v, i)=>bg[i] - v);
        const mean = detr.reduce((a, b)=>a + b, 0) / Math.max(1, detr.length);
        const q25 = quantile(detr, 0.25), q75 = quantile(detr, 0.75);
        const iqr = Math.max(1e-6, q75 - q25);
        const sigma = iqr / 1.349;
        const z = detr.map((v)=>(v - mean) / (sigma || 1));
        const edgeMargin = Math.max(4, Math.floor(arr.length * 0.04));
        const peaks = [];
        for(let i = 1; i < z.length - 1; i++){
            if (z[i] >= z[i - 1] && z[i] > z[i + 1]) {
                if (i < edgeMargin || z.length - 1 - i < edgeMargin) continue;
                const half = z[i] * 0.5;
                let L = i, R = i, area = z[i];
                while(L > 0 && z[L] > half){
                    L--;
                    area += z[L];
                }
                while(R < z.length - 1 && z[R] > half){
                    R++;
                    area += z[R];
                }
                peaks.push({
                    idx: i,
                    z: z[i],
                    width: R - L,
                    area
                });
            }
        }
        peaks.sort((a, b)=>b.z - a.z);
        const quality = (peaks[0]?.z || 0) + 0.8 * (peaks[1]?.z || 0);
        return {
            z,
            peaks,
            quality
        };
    }
    // ---------- main analyze with portrait fallback
    const analyzeOnce = (forceAxis)=>{
        if (!imgRef.current || !canvasRef.current || !overlayRef.current) return {
            ok: false,
            reason: "no canvas/img"
        };
        // 1) deskew: −30~+30 step 3
        const img = imgRef.current;
        const angles = [];
        for(let a = -30; a <= 30; a += 3)angles.push(a);
        let best = null;
        for (const a of angles){
            const c = drawRotated(img, a);
            const e = edgeEnergy(c);
            if (!best || e > best.energy) best = {
                angle: a,
                canvas: c,
                energy: e
            };
        }
        setAppliedRotation(best.angle);
        // 2) draw base
        const out = canvasRef.current;
        const octx = out.getContext("2d");
        out.width = best.canvas.width;
        out.height = best.canvas.height;
        octx.drawImage(best.canvas, 0, 0);
        // 3) window rect
        const rect = findWindowRect(best.canvas);
        const overlay = overlayRef.current;
        const ov = overlay.getContext("2d");
        overlay.width = out.width;
        overlay.height = out.height;
        ov.clearRect(0, 0, overlay.width, overlay.height);
        ov.fillStyle = "rgba(0,0,0,0.06)";
        ov.fillRect(0, 0, rect.x0, overlay.height);
        ov.fillRect(rect.x1, 0, overlay.width - rect.x1, overlay.height);
        ov.fillRect(rect.x0, 0, rect.x1 - rect.x0, rect.y0);
        ov.fillRect(rect.x0, rect.y1, rect.x1 - rect.x0, overlay.height - rect.y1);
        ov.strokeStyle = "#22c55e";
        ov.lineWidth = 2;
        ov.strokeRect(rect.x0 + 0.5, rect.y0 + 0.5, rect.x1 - rect.x0 - 1, rect.y1 - rect.y0 - 1);
        // 4) profiles
        const { profX, profY } = analyzeWindow(best.canvas, rect);
        const px = peaksFromProfile(profX);
        const py = peaksFromProfile(profY);
        let axis;
        if (forceAxis) axis = forceAxis;
        else {
            const h = rect.y1 - rect.y0, w = rect.x1 - rect.x0;
            if (h > w * 1.2) axis = py.quality >= px.quality * 0.85 ? "y" : px.quality >= py.quality ? "x" : "y";
            else axis = px.quality >= py.quality ? "x" : "y";
        }
        const sel = axis === "x" ? px : py;
        const idxToCanvas = (i)=>axis === "x" ? rect.x0 + i : rect.y0 + i;
        const peaks = sel.peaks.map((p)=>({
                ...p,
                idx: idxToCanvas(p.idx)
            }));
        // 5) choose control/test
        const preset = PRESETS[sensitivity];
        const unit = axis === "x" ? rect.x1 - rect.x0 : rect.y1 - rect.y0;
        const maxWidth = Math.max(3, Math.round(unit * preset.MAX_WIDTH_FRAC));
        const minSep = Math.round(unit * preset.MIN_SEP_FRAC);
        const maxSep = Math.round(unit * preset.MAX_SEP_FRAC);
        const valid = peaks.filter((p)=>p.width <= maxWidth);
        // debug line draw
        const ov2 = overlayRef.current.getContext("2d");
        if (ov2) {
            ov2.lineWidth = 3;
            for (const p of valid){
                ov2.strokeStyle = "#8884";
                if (axis === "x") {
                    ov2.beginPath();
                    ov2.moveTo(p.idx + 0.5, rect.y0 + 2);
                    ov2.lineTo(p.idx + 0.5, rect.y1 - 2);
                    ov2.stroke();
                } else {
                    ov2.beginPath();
                    ov2.moveTo(rect.x0 + 2, p.idx + 0.5);
                    ov2.lineTo(rect.x1 - 2, p.idx + 0.5);
                    ov2.stroke();
                }
            }
        }
        if (!valid.length) {
            return {
                ok: false,
                reason: "nopeaks",
                rect,
                axis
            };
        }
        const byPos = [
            ...valid
        ].sort((a, b)=>a.idx - b.idx);
        let control, test;
        const tryDir = (dir)=>{
            const arr = dir === 1 ? byPos : [
                ...byPos
            ].reverse();
            control = arr[0];
            test = valid.find((p)=>{
                const d = dir === 1 ? p.idx - control.idx : control.idx - p.idx;
                return d > minSep && d < maxSep;
            });
        };
        if (controlPos === "auto") {
            tryDir(1);
            const c1 = control, t1 = test;
            tryDir(-1);
            const c2 = control, t2 = test;
            const pair1Score = (c1?.z || 0) + (t1?.z || 0);
            const pair2Score = (c2?.z || 0) + (t2?.z || 0);
            if (pair1Score >= pair2Score) {
                control = c1;
                test = t1;
            } else {
                control = c2;
                test = t2;
            }
        } else {
            if (axis === "x") {
                if (controlPos === "left") tryDir(1);
                else tryDir(-1);
            } else {
                if (controlPos === "top") tryDir(1);
                else tryDir(-1);
            }
        }
        // 6) verdict, with soft-retry if C weak
        const { CONTROL_MIN, TEST_MIN_ABS, TEST_MIN_REL, MIN_AREA_FRAC } = PRESETS[sensitivity];
        let verdict = "Invalid";
        let detail = "";
        let confidence = "약함";
        const decide = (c, t, loosen = false)=>{
            const cMin = loosen ? CONTROL_MIN * 0.9 : CONTROL_MIN;
            const absMin = loosen ? TEST_MIN_ABS * 0.95 : TEST_MIN_ABS;
            const relMin = loosen ? TEST_MIN_REL * 0.9 : TEST_MIN_REL;
            const areaFrac = loosen ? MIN_AREA_FRAC * 0.85 : MIN_AREA_FRAC;
            if (!c || c.z < cMin) {
                verdict = "Invalid";
                detail = `컨트롤 라인이 약하거나 인식되지 않았습니다 (C z=${(c?.z ?? 0).toFixed(2)}).`;
                return;
            }
            if (requireTwoLines && !t) {
                verdict = "Negative";
                detail = `음성: 컨트롤만 유효 (C z=${c.z.toFixed(2)})`;
                confidence = c.z > 2.2 ? "확실" : "보통";
                return;
            }
            if (t) {
                const areaOK = t.area >= c.area * areaFrac;
                const absOK = t.z >= absMin;
                const relOK = t.z >= c.z * relMin;
                if (areaOK && absOK && relOK) {
                    verdict = "Positive";
                    detail = `양성: C z=${c.z.toFixed(2)}, T z=${t.z.toFixed(2)} (T/C area ${(t.area / c.area).toFixed(2)})`;
                    confidence = t.z > 2.0 ? "확실" : "보통";
                } else {
                    verdict = "Negative";
                    detail = `음성: 테스트 라인이 기준 미달 (area:${areaOK ? "ok" : "x"}/abs:${absOK ? "ok" : "x"}/rel:${relOK ? "ok" : "x"})`;
                    confidence = absOK || relOK ? "약함" : "확실";
                }
            } else {
                verdict = "Negative";
                detail = `음성: 컨트롤만 유효`;
                confidence = "보통";
            }
        };
        decide(control, test, false);
        if (verdict === "Invalid") {
            // 1) 축 반전 폴백
            const alt = analyzeOnce(axis === "x" ? "y" : "x");
            if (alt.ok && alt.result) return alt;
            // 2) 느슨 판정 재시도
            decide(control, test, true);
        }
        const ov3 = overlayRef.current.getContext("2d");
        if (ov3) {
            const drawLine = (idx, color)=>{
                ov3.strokeStyle = color;
                ov3.lineWidth = 3;
                ov3.beginPath();
                if (axis === "x") {
                    ov3.moveTo(idx + 0.5, rect.y0 + 2);
                    ov3.lineTo(idx + 0.5, rect.y1 - 2);
                } else {
                    ov3.moveTo(rect.x0 + 2, idx + 0.5);
                    ov3.lineTo(rect.x1 - 2, idx + 0.5);
                }
                ov3.stroke();
            };
            if (control) drawLine(control.idx, "#3b82f6");
            if (test) drawLine(test.idx, "#ef4444");
        }
        return {
            ok: true,
            result: {
                verdict,
                detail,
                confidence
            }
        };
    };
    const analyze = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LfaAnalyzer.useCallback[analyze]": ()=>{
            if (!imgRef.current || !canvasRef.current || !overlayRef.current) return;
            try {
                setBusy(true);
                const out = analyzeOnce();
                if (out && out.ok && out.result) {
                    setResult(out.result);
                    saveLog({
                        ts: Date.now(),
                        text: "",
                        verdict: out.result.verdict
                    });
                } else if (out && out.reason === "nopeaks") {
                    setResult({
                        verdict: "Invalid",
                        detail: "스트립을 찾지 못했습니다. 반사/그림자 줄이고 창을 화면 가운데에 맞춰주세요.",
                        confidence: "약함"
                    });
                } else {
                    setResult({
                        verdict: "Invalid",
                        detail: "처리 실패(알 수 없음). 다른 각도에서 다시 시도해 주세요.",
                        confidence: "약함"
                    });
                }
            } catch (err) {
                console.error(err);
                setResult({
                    verdict: "Invalid",
                    detail: `처리 중 오류: ${err?.message || "unknown"}`,
                    confidence: "약함"
                });
            } finally{
                setBusy(false);
            }
        }
    }["LfaAnalyzer.useCallback[analyze]"], [
        sensitivity,
        controlPos,
        requireTwoLines
    ]); // eslint-disable-line react-hooks/exhaustive-deps
    // 파일 입출력
    const onPickFile = (f)=>{
        setImageUrl(URL.createObjectURL(f));
        setResult(null);
        setGuideC(null);
        setGuideT(null);
    };
    const onInput = (e)=>{
        const f = e.target.files?.[0];
        if (f) onPickFile(f);
    };
    const stop = (e)=>e.preventDefault();
    const onDrop = (e)=>{
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onPickFile(f);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LfaAnalyzer.useEffect": ()=>{
            if (imageUrl) {
                const t = setTimeout({
                    "LfaAnalyzer.useEffect.t": ()=>analyze()
                }["LfaAnalyzer.useEffect.t"], 120);
                return ({
                    "LfaAnalyzer.useEffect": ()=>clearTimeout(t)
                })["LfaAnalyzer.useEffect"];
            }
        }
    }["LfaAnalyzer.useEffect"], [
        imageUrl,
        analyze
    ]);
    // manual clicks: 첫 클릭 C, 두 번째 T (pointer-events 처리 주의)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LfaAnalyzer.useEffect": ()=>{
            const o = overlayRef.current;
            if (!o) return;
            const onClick = {
                "LfaAnalyzer.useEffect.onClick": (e)=>{
                    if (mode !== "manual") return;
                    const r = o.getBoundingClientRect();
                    const x = Math.round(e.clientX - r.left);
                    if (guideC == null) setGuideC(x);
                    else if (guideT == null) setGuideT(x);
                    else {
                        setGuideC(x);
                        setGuideT(null);
                    }
                }
            }["LfaAnalyzer.useEffect.onClick"];
            o.addEventListener("click", onClick);
            return ({
                "LfaAnalyzer.useEffect": ()=>{
                    o.removeEventListener("click", onClick);
                }
            })["LfaAnalyzer.useEffect"];
        }
    }["LfaAnalyzer.useEffect"], [
        mode,
        guideC,
        guideT
    ]);
    // UI
    const VerdictBadge = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LfaAnalyzer.useMemo[VerdictBadge]": ()=>{
            if (!result) return null;
            const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold";
            if (result.verdict === "Positive") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${base} bg-red-100 text-red-800`,
                children: "✅ 양성"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 788,
                columnNumber: 47
            }, this);
            if (result.verdict === "Negative") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${base} bg-green-100 text-green-800`,
                children: "🟢 음성"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 789,
                columnNumber: 47
            }, this);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${base} bg-gray-200 text-gray-800`,
                children: "⚠️ 무효"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 790,
                columnNumber: 12
            }, this);
        }
    }["LfaAnalyzer.useMemo[VerdictBadge]"], [
        result
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-6xl mx-auto p-4 sm:p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl sm:text-3xl font-semibold mb-1",
                children: "📷 LFA QuickCheck v4.6"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 795,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-gray-600 mb-4",
                children: "세로 사진 보정 강화 + 맞춤 안내/근처 찾기. 자동 회전·윈도 검출·대비 보정·축 폴백 포함."
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 796,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onDrop: onDrop,
                onDragEnter: stop,
                onDragOver: stop,
                className: "border-2 border-dashed rounded-2xl p-6 mb-4 flex flex-col items-center justify-center text-center hover:bg-gray-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "w-full cursor-pointer",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "file",
                            accept: "image/*",
                            capture: "environment",
                            className: "hidden",
                            onChange: onInput
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 801,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col items-center gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-5xl",
                                    children: "⬆️"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 803,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "font-medium",
                                    children: "사진 업로드 / 드래그"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 804,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-500",
                                    children: "팁: 윈도가 화면의 40~70%가 되게 채워서 찍으면 가장 정확해요."
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 805,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 802,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 800,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 798,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-3 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50",
                        onClick: ()=>analyze(),
                        disabled: !imageUrl || busy,
                        children: busy ? "분석 중…" : "분석"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 811,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-xs text-gray-600",
                                children: "모드"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 816,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "px-2 py-1 border rounded-md",
                                value: mode,
                                onChange: (e)=>setMode(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "auto",
                                        children: "자동"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 818,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "manual",
                                        children: "수동(C/T 클릭)"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 819,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 817,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 815,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-xs text-gray-600",
                                children: "민감도"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 824,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "px-2 py-1 border rounded-md",
                                value: sensitivity,
                                onChange: (e)=>setSensitivity(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "sensitive",
                                        children: "Sensitive"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 826,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "balanced",
                                        children: "Balanced"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 827,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "conservative",
                                        children: "Conservative"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 828,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 825,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 823,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-xs text-gray-600",
                                children: "컨트롤 위치"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 833,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "px-2 py-1 border rounded-md",
                                value: controlPos,
                                onChange: (e)=>setControlPos(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "auto",
                                        children: "자동"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 835,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "left",
                                        children: "왼쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 836,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "right",
                                        children: "오른쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 836,
                                        columnNumber: 45
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "top",
                                        children: "위쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 837,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "bottom",
                                        children: "아래쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 837,
                                        columnNumber: 44
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 834,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 832,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "flex items-center gap-2 text-xs text-gray-600",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: requireTwoLines,
                                onChange: (e)=>setRequireTwoLines(e.target.checked)
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 842,
                                columnNumber: 11
                            }, this),
                            "두 줄 요구(T 없으면 음성)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 841,
                        columnNumber: 9
                    }, this),
                    imageUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            "자동 회전: ",
                            appliedRotation,
                            "°"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 846,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 810,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full overflow-hidden rounded-2xl bg-gray-100",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "aspect-video w-full relative",
                                children: imageUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    ref: imgRef,
                                    src: imageUrl,
                                    alt: "orig",
                                    className: "absolute inset-0 w-full h-full object-contain"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 853,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute inset-0 flex items-center justify-center text-gray-400 text-sm",
                                    children: "원본 미리보기"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 855,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 851,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-2 text-xs text-gray-500",
                                children: "원본"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 858,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 850,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full overflow-hidden rounded-2xl bg-gray-100",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "aspect-video w-full relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                        ref: canvasRef,
                                        className: "absolute inset-0 w-full h-full object-contain"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 863,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                        ref: overlayRef,
                                        className: `absolute inset-0 w-full h-full object-contain ${mode === "manual" ? "cursor-crosshair" : "pointer-events-none"}`
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 865,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 862,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-2 text-xs text-gray-500",
                                children: [
                                    "처리 결과 ",
                                    mode === "manual" ? "(수동: 캔버스 클릭해 C/T 지정)" : ""
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 870,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 861,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 849,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 p-4 rounded-2xl border bg-white",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 mb-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-base font-semibold",
                                children: "판독 결과"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 875,
                                columnNumber: 55
                            }, this),
                            VerdictBadge
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 875,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm text-gray-700",
                        children: result ? `${result.detail} · 신뢰도: ${result.confidence}` : "사진을 올리면 자동으로 판독합니다."
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 876,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 874,
                columnNumber: 7
            }, this),
            result?.verdict === "Positive" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SymptomLogger, {
                        defaultVerdict: "Positive"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 882,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NearbyFinder, {}, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 883,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true),
            result?.verdict === "Negative" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NegativeAdvice, {
                again: ()=>analyze()
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 888,
                columnNumber: 42
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/LfaAnalyzer.tsx",
        lineNumber: 794,
        columnNumber: 5
    }, this);
}
_s4(LfaAnalyzer, "Joti0Zy+7Y7+jwzUGBAt5X+uE94=");
_c3 = LfaAnalyzer;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "NearbyFinder");
__turbopack_context__.k.register(_c1, "SymptomLogger");
__turbopack_context__.k.register(_c2, "NegativeAdvice");
__turbopack_context__.k.register(_c3, "LfaAnalyzer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_7d6dbd17._.js.map