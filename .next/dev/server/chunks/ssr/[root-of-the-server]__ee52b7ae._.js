module.exports = [
"[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/favicon.ico.mjs { IMAGE => \"[project]/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/components/LfaAnalyzer.tsx [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

// ✅ LFA QuickCheck v4.1 — Low contrast & glare robust version
const PRESETS = {
    sensitive: {
        CONTROL_MIN: 1.20,
        TEST_MIN_ABS: 0.95,
        TEST_MIN_REL: 0.30,
        MAX_WIDTH_FRAC: 0.14,
        MIN_SEP_FRAC: 0.05,
        MAX_SEP_FRAC: 0.75,
        MIN_AREA_FRAC: 0.16
    },
    balanced: {
        CONTROL_MIN: 1.45,
        TEST_MIN_ABS: 1.10,
        TEST_MIN_REL: 0.40,
        MAX_WIDTH_FRAC: 0.11,
        MIN_SEP_FRAC: 0.06,
        MAX_SEP_FRAC: 0.65,
        MIN_AREA_FRAC: 0.25
    },
    conservative: {
        CONTROL_MIN: 1.70,
        TEST_MIN_ABS: 1.35,
        TEST_MIN_REL: 0.55,
        MAX_WIDTH_FRAC: 0.09,
        MIN_SEP_FRAC: 0.07,
        MAX_SEP_FRAC: 0.58,
        MIN_AREA_FRAC: 0.35
    }
};
// 🩵 글레어 / 그림자 마스크 완화
function findWindowRect(c) {
    const ctx = c.getContext("2d");
    const { width: w, height: h } = c;
    const data = ctx.getImageData(0, 0, w, h).data;
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
    const brHi = quantile(Array.from(br), 0.96), brLo = quantile(Array.from(br), 0.06);
    const glareMask = new Uint8Array(w * h);
    for(let i = 0; i < w * h; i++){
        if (br[i] > brHi && sat[i] < 0.12) glareMask[i] = 1;
        if (br[i] < brLo * 0.6) glareMask[i] = 1;
    }
    return {
        glareMask
    };
}
// 🧮 저대비에서 z-score 안정화 (IQR 정규화)
function peaksFromProfile(arr, axisLength) {
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
}),
"[project]/app/analyze/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Page
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$LfaAnalyzer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/LfaAnalyzer.tsx [app-rsc] (ecmascript)");
;
;
function Page() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$LfaAnalyzer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
            fileName: "[project]/app/analyze/page.tsx",
            lineNumber: 7,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/analyze/page.tsx",
        lineNumber: 6,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/analyze/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/analyze/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ee52b7ae._.js.map