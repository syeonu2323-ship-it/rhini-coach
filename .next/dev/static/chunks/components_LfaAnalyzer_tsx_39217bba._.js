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
var _s = __turbopack_context__.k.signature();
"use client";
;
const PRESETS = {
    sensitive: {
        CONTROL_MIN: 1.20,
        TEST_MIN_ABS: 0.95,
        TEST_MIN_REL: 0.30,
        MAX_WIDTH_FRAC: 0.16,
        MIN_SEP_FRAC: 0.04,
        MAX_SEP_FRAC: 0.80,
        MIN_AREA_FRAC: 0.14
    },
    balanced: {
        CONTROL_MIN: 1.45,
        TEST_MIN_ABS: 1.10,
        TEST_MIN_REL: 0.40,
        MAX_WIDTH_FRAC: 0.12,
        MIN_SEP_FRAC: 0.05,
        MAX_SEP_FRAC: 0.70,
        MIN_AREA_FRAC: 0.24
    },
    conservative: {
        CONTROL_MIN: 1.70,
        TEST_MIN_ABS: 1.35,
        TEST_MIN_REL: 0.55,
        MAX_WIDTH_FRAC: 0.10,
        MIN_SEP_FRAC: 0.06,
        MAX_SEP_FRAC: 0.60,
        MIN_AREA_FRAC: 0.34
    }
};
// 공통 유틸
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
// 회전/에지
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
// 윈도 검출 + 대비보정 + 프로필
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
    const thx = quantile(dcol, 0.90), thy = quantile(drow, 0.90);
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
        if (gap < N * 0.20) return [
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
    const glareMask = new Uint8Array(w * h);
    const brHi = quantile(br, 0.96), brLo = quantile(br, 0.05);
    for(let i = 0; i < w * h; i++){
        if (br[i] > brHi && sat[i] < 0.12) glareMask[i] = 1;
        if (br[i] < brLo * 0.6) glareMask[i] = 1;
    }
    const win = [];
    for(let yy = y0; yy <= y1; yy++)for(let xx = x0; xx <= x1; xx++)win.push(br[yy * w + xx]);
    const p1 = quantile(win, 0.01), p99 = quantile(win, 0.99) || 1;
    const a = 255 / Math.max(1, p99 - p1);
    const b = -a * p1;
    for(let yy = y0; yy <= y1; yy++){
        for(let xx = x0; xx <= x1; xx++){
            const k = yy * w + xx;
            br[k] = clamp(a * br[k] + b, 0, 255);
        }
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
function LfaAnalyzer() {
    _s();
    var _s1 = __turbopack_context__.k.signature();
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
    // ===== 증상 기록 공통 상태 =====
    const [symptom, setSymptom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        sneezing: 0,
        rhinorrhea: 0,
        congestion: 0,
        itchyEyes: 0,
        cough: 0,
        fever: 0,
        note: "",
        medsTaken: []
    });
    const [log, setLog] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [links, setLinks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        lat: null,
        lng: null
    });
    const [lastRecs, setLastRecs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lastFlags, setLastFlags] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // ✅ 음성 섹션: 라이트 폼 토글
    const [showNegLight, setShowNegLight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LfaAnalyzer.useEffect": ()=>{
            try {
                const raw = localStorage.getItem("lfa_symptom_log_v1");
                if (raw) setLog(JSON.parse(raw));
            } catch  {}
        }
    }["LfaAnalyzer.useEffect"], []);
    const saveLog = (entry)=>{
        const next = [
            entry,
            ...log
        ].slice(0, 200);
        setLog(next);
        try {
            localStorage.setItem("lfa_symptom_log_v1", JSON.stringify(next));
        } catch  {}
    };
    const requestLocation = ()=>{
        if (!navigator.geolocation) {
            setLinks({
                lat: null,
                lng: null
            });
            return;
        }
        navigator.geolocation.getCurrentPosition((pos)=>{
            const { latitude: lat, longitude: lng } = pos.coords;
            const gHosp = `https://www.google.com/maps/search/%EB%B3%91%EC%9B%90/@${lat},${lng},15z`;
            const gPhar = `https://www.google.com/maps/search/%EC%95%BD%EA%B5%AD/@${lat},${lng},15z`;
            const nHosp = `https://map.naver.com/p/search/%EB%B3%91%EC%9B%90?c=${lng},${lat},15,0,0,0,dh`;
            const nPhar = `https://map.naver.com/p/search/%EC%95%BD%EA%B5%AD?c=${lng},${lat},15,0,0,0,dh`;
            setLinks({
                lat,
                lng,
                googleHospital: gHosp,
                googlePharmacy: gPhar,
                naverHospital: nHosp,
                naverPharmacy: nPhar
            });
        }, ()=>setLinks({
                lat: null,
                lng: null
            }));
    };
    // 규칙 기반 추천
    const OTC_LABELS = {
        loratadine: "로라타딘(덜 졸림 경구 항히스타민, 1일 1회)",
        cetirizine: "세티리진(효과 강함, 졸림 가능, 1일 1회)",
        fluticasone: "플루티카손 비강 스프레이(코막힘/재채기/콧물)",
        saline: "식염수 비강세척(보조)"
    };
    const computeRecs = (s)=>{
        const { sneezing, rhinorrhea, congestion, itchyEyes, cough, fever } = s;
        const scoreLoratadine = sneezing * 1.0 + itchyEyes * 1.0 + rhinorrhea * 0.8;
        const scoreCetirizine = sneezing * 1.1 + itchyEyes * 1.1 + rhinorrhea * 0.8 + (Math.max(sneezing, itchyEyes) >= 7 ? 2 : 0);
        const scoreFluticasone = congestion * 1.2 + sneezing * 0.3 + rhinorrhea * 0.3 + (congestion >= 7 ? 1.5 : 0);
        const scoreSaline = congestion * 0.6 + rhinorrhea * 0.8 + itchyEyes * 0.2 + sneezing * 0.2;
        const recs = [
            {
                key: "fluticasone",
                label: OTC_LABELS.fluticasone,
                score: scoreFluticasone,
                reason: congestion >= 6 ? "코막힘 점수가 높아 비강 스테로이드 권장." : "코막힘·재채기·콧물 전반에 도움."
            },
            {
                key: "loratadine",
                label: OTC_LABELS.loratadine,
                score: scoreLoratadine,
                reason: sneezing + itchyEyes >= 10 ? "재채기/눈 가려움이 뚜렷—덜 졸리는 항히스타민." : "경구 항히스타민 기본 옵션.",
                caution: "간질환/임신·수유/다약제 복용 시 상담."
            },
            {
                key: "cetirizine",
                label: OTC_LABELS.cetirizine,
                score: scoreCetirizine,
                reason: Math.max(sneezing, itchyEyes) >= 7 ? "증상이 강해 효과 강한 계열 제안(졸림 가능)." : "항히스타민 대체 옵션(졸림 가능).",
                caution: "운전/시험 전 주의."
            },
            {
                key: "saline",
                label: OTC_LABELS.saline,
                score: scoreSaline,
                reason: rhinorrhea >= 5 || congestion >= 5 ? "세척으로 점액 제거·통기 개선." : "저자극 보조요법."
            }
        ].sort((a, b)=>b.score - a.score);
        const danger = [];
        if (fever >= 7) danger.push("발열 점수가 높습니다. 감염 가능성 고려해 진료 권장.");
        if (cough >= 7) danger.push("기침 점수가 높습니다. 호흡기 감염/천식 등 감별 위해 진료 권장.");
        if (fever >= 4 && cough >= 4) danger.push("발열+기침 동반: 알레르기 외 감염 가능성. 진료 우선.");
        return {
            recs,
            danger: danger.length ? danger : undefined
        };
    };
    // 분석 (한 번)
    const analyzeOnce = (forceAxis)=>{
        if (!imgRef.current || !canvasRef.current || !overlayRef.current) return {
            ok: false
        };
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
        const out = canvasRef.current;
        const octx = out.getContext("2d");
        out.width = best.canvas.width;
        out.height = best.canvas.height;
        octx.drawImage(best.canvas, 0, 0);
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
        const { profX, profY } = analyzeWindow(best.canvas, rect);
        const px = peaksFromProfile(profX);
        const py = peaksFromProfile(profY);
        let axis;
        if (forceAxis) {
            axis = forceAxis;
        } else {
            const h = rect.y1 - rect.y0, w = rect.x1 - rect.x0;
            axis = h > w * 1.2 ? py.quality >= px.quality * 0.85 ? "y" : px.quality >= py.quality ? "x" : "y" : px.quality >= py.quality ? "x" : "y";
        }
        const sel = axis === "x" ? px : py;
        const idxToCanvas = (i)=>axis === "x" ? rect.x0 + i : rect.y0 + i;
        const peaks = sel.peaks.map((p)=>({
                ...p,
                idx: idxToCanvas(p.idx)
            }));
        const preset = PRESETS[sensitivity];
        const unit = axis === "x" ? rect.x1 - rect.x0 : rect.y1 - rect.y0;
        const maxWidth = Math.max(3, Math.round(unit * preset.MAX_WIDTH_FRAC));
        const minSep = Math.round(unit * preset.MIN_SEP_FRAC);
        const maxSep = Math.round(unit * preset.MAX_SEP_FRAC);
        const valid = peaks.filter((p)=>p.width <= maxWidth);
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
        const CONTROL_MIN = preset.CONTROL_MIN;
        const TEST_MIN_ABS = preset.TEST_MIN_ABS;
        const TEST_MIN_REL = preset.TEST_MIN_REL; // ✅ 오타 수정
        const MIN_AREA_FRAC = preset.MIN_AREA_FRAC;
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
            const alt = analyzeOnce(axis === "x" ? "y" : "x");
            if (alt.ok && alt.result) return alt;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["LfaAnalyzer.useCallback[analyze]"], [
        sensitivity,
        controlPos,
        requireTwoLines
    ]);
    const manualAnalyze = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LfaAnalyzer.useCallback[manualAnalyze]": ()=>{
            if (!canvasRef.current) {
                return;
            }
            const c = canvasRef.current, ctx = c.getContext("2d");
            if (!ctx) return;
            if (guideC == null) {
                setResult({
                    verdict: "Invalid",
                    detail: "수동 모드: C 라인을 먼저 지정하세요.",
                    confidence: "약함"
                });
                return;
            }
            const band = Math.max(2, Math.round(c.width * 0.01));
            const sample = {
                "LfaAnalyzer.useCallback[manualAnalyze].sample": (x0, y0, x1, y1)=>{
                    const w = x1 - x0, h = y1 - y0;
                    if (w <= 0 || h <= 0) return {
                        m: 0,
                        s: 1
                    };
                    const d = ctx.getImageData(x0, y0, w, h).data;
                    let sum = 0, sum2 = 0, n = 0;
                    for(let i = 0; i < d.length; i += 4){
                        const R = d[i], G = d[i + 1], B = d[i + 2];
                        const S = R + G + B || 1;
                        const chroma = R / S - 0.5 * (G / S + B / S);
                        sum += chroma;
                        sum2 += chroma * chroma;
                        n++;
                    }
                    const m = sum / n, v = Math.max(1e-8, sum2 / n - m * m);
                    return {
                        m,
                        s: Math.sqrt(v)
                    };
                }
            }["LfaAnalyzer.useCallback[manualAnalyze].sample"];
            const bg = sample(0, 0, c.width, c.height);
            const zAt = {
                "LfaAnalyzer.useCallback[manualAnalyze].zAt": (x)=>(sample(Math.max(0, Math.round(x - band / 2)), 0, Math.min(c.width, Math.round(x + band / 2)), c.height).m - bg.m) / bg.s
            }["LfaAnalyzer.useCallback[manualAnalyze].zAt"];
            const zC = zAt(guideC), zT = guideT != null ? zAt(guideT) : -999;
            const preset = PRESETS[sensitivity];
            if (zC < preset.CONTROL_MIN) {
                setResult({
                    verdict: "Invalid",
                    detail: `컨트롤(z=${zC.toFixed(2)})이 약합니다.`,
                    confidence: "약함"
                });
                return;
            }
            if (requireTwoLines && guideT == null) {
                setResult({
                    verdict: "Negative",
                    detail: `음성(수동): 컨트롤만 유효`,
                    confidence: zC > 2.2 ? "확실" : "보통"
                });
                return;
            }
            if (guideT != null) {
                const absOK = zT >= preset.TEST_MIN_ABS;
                const relOK = zT >= zC * preset.TEST_MIN_REL;
                const verdict = absOK && relOK ? "Positive" : "Negative";
                setResult({
                    verdict,
                    detail: verdict === "Positive" ? `양성(수동): C z=${zC.toFixed(2)}, T z=${zT.toFixed(2)}` : `음성(수동): T 기준 미달 (abs:${absOK ? "ok" : "x"}/rel:${relOK ? "ok" : "x"})`,
                    confidence: verdict === "Positive" ? zT > 2.0 ? "확실" : "보통" : absOK || relOK ? "약함" : "확실"
                });
            }
        }
    }["LfaAnalyzer.useCallback[manualAnalyze]"], [
        guideC,
        guideT,
        sensitivity,
        requireTwoLines
    ]);
    // 파일/드래그
    const onPickFile = (f)=>{
        setImageUrl(URL.createObjectURL(f));
        setResult(null);
        setGuideC(null);
        setGuideT(null);
        setShowNegLight(false);
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
    const VerdictBadge = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LfaAnalyzer.useMemo[VerdictBadge]": ()=>{
            if (!result) return null;
            const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold";
            if (result.verdict === "Positive") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${base} bg-red-100 text-red-800`,
                children: "✅ 양성"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 528,
                columnNumber: 45
            }, this);
            if (result.verdict === "Negative") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${base} bg-green-100 text-green-800`,
                children: "🟢 음성"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 529,
                columnNumber: 45
            }, this);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `${base} bg-gray-200 text-gray-800`,
                children: "⚠️ 무효"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 530,
                columnNumber: 12
            }, this);
        }
    }["LfaAnalyzer.useMemo[VerdictBadge]"], [
        result
    ]);
    // ===== 음성 라이트 기록 폼 =====
    const NegativeLightForm = ()=>{
        _s1();
        const [lite, setLite] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
            sneezing: 0,
            rhinorrhea: 0,
            congestion: 0,
            note: ""
        });
        const addLite = ()=>{
            const full = {
                ts: new Date().toISOString(),
                sneezing: lite.sneezing,
                rhinorrhea: lite.rhinorrhea,
                congestion: lite.congestion,
                itchyEyes: 0,
                cough: 0,
                fever: 0,
                note: lite.note,
                medsTaken: []
            };
            saveLog(full);
            const { recs } = computeRecs(full);
            setLastRecs(recs.slice(0, 3));
            setLastFlags(null);
            alert("간단 기록이 저장됐어요! 아래 추천을 확인해보세요.");
        };
        const slider = (label, key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between text-xs text-gray-600",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: label
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 558,
                                columnNumber: 69
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    lite[key],
                                    "/10"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 558,
                                columnNumber: 89
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 558,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "range",
                        min: 0,
                        max: 10,
                        value: lite[key],
                        onChange: (e)=>setLite((v)=>({
                                    ...v,
                                    [key]: Number(e.target.value)
                                }))
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 559,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 557,
                columnNumber: 7
            }, this);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-3 p-4 rounded-2xl border bg-white",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm font-semibold mb-2",
                    children: "📝 증상 라이트 기록"
                }, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 565,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid sm:grid-cols-2 gap-3",
                    children: [
                        slider("재채기", "sneezing"),
                        slider("콧물", "rhinorrhea"),
                        slider("코막힘", "congestion")
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 566,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                    className: "w-full mt-3 p-2 border rounded-lg text-sm",
                    placeholder: "메모(선택)",
                    value: lite.note,
                    onChange: (e)=>setLite((v)=>({
                                ...v,
                                note: e.target.value
                            }))
                }, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 571,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-3 flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm",
                            onClick: addLite,
                            children: "저장 & 추천 보기"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 578,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "px-3 py-2 rounded-xl border text-sm",
                            onClick: ()=>setShowNegLight(false),
                            children: "닫기"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 579,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 577,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/LfaAnalyzer.tsx",
            lineNumber: 564,
            columnNumber: 7
        }, this);
    };
    _s1(NegativeLightForm, "0SuEC1tcIJivjKMMSqKyhJgWhnU=");
    // ===== 추천 패널/근처/히스토리 (Positive와 공유) =====
    const RecoPanel = ()=>{
        if (!lastRecs && !lastFlags) return null;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-4 p-4 rounded-2xl border border-amber-300 bg-amber-50",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 mb-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-base font-semibold",
                            children: "🧪 맞춤 약 추천"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 591,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-amber-700",
                            children: "최근 기록을 기준으로 계산됨"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 592,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 590,
                    columnNumber: 9
                }, this),
                lastFlags?.danger && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-3 p-3 rounded-xl bg-red-100 text-red-800 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "font-semibold",
                            children: "⚠️ 주의/진료 권고"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 596,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "list-disc ml-5",
                            children: lastFlags.danger.map((d, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: d
                                }, i, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 597,
                                    columnNumber: 73
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 597,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 595,
                    columnNumber: 11
                }, this),
                lastRecs && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid sm:grid-cols-2 gap-3",
                    children: lastRecs.map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-3 rounded-xl bg-white border",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm font-semibold",
                                    children: [
                                        i + 1,
                                        ". ",
                                        r.label
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 604,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-600 mt-1",
                                    children: r.reason
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 605,
                                    columnNumber: 17
                                }, this),
                                r.caution && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-500 mt-1",
                                    children: [
                                        "주의: ",
                                        r.caution
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 606,
                                    columnNumber: 31
                                }, this)
                            ]
                        }, r.key, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 603,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 601,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-3 text-xs text-gray-500",
                    children: "* 일반적 정보 제공 목적이며, 개인 병력/복용 약물에 따라 다를 수 있어요. 의사·약사의 안내를 우선하세요."
                }, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 611,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/LfaAnalyzer.tsx",
            lineNumber: 589,
            columnNumber: 7
        }, this);
    };
    const NearbyBlock = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: requestLocation,
                            className: "px-3 py-1.5 rounded-lg bg-emerald-600 text-white",
                            children: "📍 내 위치로 찾기"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 619,
                            columnNumber: 9
                        }, this),
                        links.lat != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-gray-600",
                            children: "위치 사용 허용됨"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 622,
                            columnNumber: 29
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 618,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid sm:grid-cols-2 gap-2 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            className: "px-3 py-2 rounded-lg border hover:bg-gray-50",
                            href: links.googleHospital || "https://www.google.com/maps/search/%EB%B3%91%EC%9B%90/",
                            target: "_blank",
                            rel: "noreferrer",
                            children: "Google 지도: 근처 병원"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 625,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            className: "px-3 py-2 rounded-lg border hover:bg-gray-50",
                            href: links.googlePharmacy || "https://www.google.com/maps/search/%EC%95%BD%EA%B5%AD/",
                            target: "_blank",
                            rel: "noreferrer",
                            children: "Google 지도: 근처 약국"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 626,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            className: "px-3 py-2 rounded-lg border hover:bg-gray-50",
                            href: links.naverHospital || "https://map.naver.com/p/search/%EB%B3%91%EC%9B%90",
                            target: "_blank",
                            rel: "noreferrer",
                            children: "네이버 지도: 근처 병원"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 627,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            className: "px-3 py-2 rounded-lg border hover:bg-gray-50",
                            href: links.naverPharmacy || "https://map.naver.com/p/search/%EC%95%BD%EA%B5%AD",
                            target: "_blank",
                            rel: "noreferrer",
                            children: "네이버 지도: 근처 약국"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 628,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 624,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs text-gray-500",
                    children: "* 응급 증상(호흡곤란, 의식 저하, 고열 지속 등) 시 즉시 119 또는 응급실로 이동하세요."
                }, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 630,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/LfaAnalyzer.tsx",
            lineNumber: 617,
            columnNumber: 5
        }, this);
    const MedsChecklist = ()=>{
        const items = [
            {
                key: "loratadine",
                label: OTC_LABELS.loratadine
            },
            {
                key: "cetirizine",
                label: OTC_LABELS.cetirizine
            },
            {
                key: "fluticasone",
                label: OTC_LABELS.fluticasone
            },
            {
                key: "saline",
                label: OTC_LABELS.saline
            }
        ];
        const toggleMed = (key)=>{
            setSymptom((prev)=>{
                const has = prev.medsTaken.includes(key);
                return {
                    ...prev,
                    medsTaken: has ? prev.medsTaken.filter((k)=>k !== key) : [
                        ...prev.medsTaken,
                        key
                    ]
                };
            });
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid sm:grid-cols-2 gap-2",
            children: items.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    className: "flex items-start gap-2 p-2 rounded-xl border hover:bg-gray-50 cursor-pointer",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "checkbox",
                            className: "mt-1",
                            checked: symptom.medsTaken.includes(m.key),
                            onChange: ()=>toggleMed(m.key)
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 651,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm font-medium",
                                children: m.label
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 652,
                                columnNumber: 18
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 652,
                            columnNumber: 13
                        }, this)
                    ]
                }, m.key, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 650,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/components/LfaAnalyzer.tsx",
            lineNumber: 648,
            columnNumber: 7
        }, this);
    };
    const SymptomLogger = ()=>{
        const severitySlider = (label, key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between text-xs text-gray-600",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: label
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 663,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    symptom[key],
                                    "/10"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 663,
                                columnNumber: 31
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 662,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "range",
                        min: 0,
                        max: 10,
                        value: symptom[key],
                        onChange: (e)=>setSymptom((s)=>({
                                    ...s,
                                    [key]: Number(e.target.value)
                                }))
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 665,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 661,
                columnNumber: 7
            }, this);
        const addEntry = ()=>{
            const entry = {
                ts: new Date().toISOString(),
                ...symptom
            };
            saveLog(entry);
            const { recs, danger } = computeRecs(symptom);
            setLastRecs(recs.slice(0, 3));
            setLastFlags(danger ? {
                danger
            } : null);
            setSymptom((s)=>({
                    ...s,
                    note: ""
                }));
        };
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mt-4 p-4 rounded-2xl border bg-white",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-base font-semibold",
                            children: "📝 증상 기록"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 679,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-gray-500",
                            children: "로컬 저장(브라우저에만 저장)"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 680,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 678,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid sm:grid-cols-2 gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: [
                                severitySlider("재채기", "sneezing"),
                                severitySlider("콧물", "rhinorrhea"),
                                severitySlider("코막힘", "congestion"),
                                severitySlider("가려운 눈", "itchyEyes"),
                                severitySlider("기침", "cough"),
                                severitySlider("발열", "fever")
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 683,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs text-gray-600 mb-1",
                                            children: "복용/사용 중인 약"
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 693,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MedsChecklist, {}, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 694,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 692,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs text-gray-600 mb-1",
                                            children: "메모"
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 697,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                            className: "w-full min-h-[84px] p-2 border rounded-lg",
                                            placeholder: "특이사항/유발요인 등",
                                            value: symptom.note,
                                            onChange: (e)=>setSymptom((s)=>({
                                                        ...s,
                                                        note: e.target.value
                                                    }))
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 698,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 696,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "px-4 py-2 rounded-xl bg-indigo-600 text-white",
                                            onClick: addEntry,
                                            children: "기록 저장 & 약 추천"
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 702,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "px-3 py-2 rounded-xl border",
                                            onClick: ()=>{
                                                if (!confirm("증상 기록 전체 삭제할까요?")) return;
                                                setLog([]);
                                                setLastRecs(null);
                                                setLastFlags(null);
                                                try {
                                                    localStorage.removeItem("lfa_symptom_log_v1");
                                                } catch  {}
                                            },
                                            children: "기록 전체 삭제"
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 703,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 701,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 691,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 682,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RecoPanel, {}, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 712,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 mb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-base font-semibold",
                                children: "🏥 근처 병원 · 약국"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 716,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 715,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NearbyBlock, {}, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 718,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 714,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-base font-semibold",
                                    children: "📚 내 기록"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 723,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs text-gray-500",
                                    children: [
                                        log.length,
                                        "건"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 724,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 722,
                            columnNumber: 11
                        }, this),
                        log.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm text-gray-500",
                            children: "아직 저장된 기록이 없습니다."
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 727,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "overflow-x-auto",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "min-w-full text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "text-left text-gray-500",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "시간"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 733,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "재채기"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 734,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "콧물"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 735,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "코막힘"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 736,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "눈가려움"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 737,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "기침"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 738,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "발열"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 739,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2 pr-3",
                                                    children: "약"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 740,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "py-2",
                                                    children: "메모"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                                    lineNumber: 741,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 732,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 731,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        children: log.map((e, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "border-t",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 whitespace-nowrap",
                                                        children: new Date(e.ts).toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 747,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: e.sneezing
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 748,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: e.rhinorrhea
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 749,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: e.congestion
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 750,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: e.itchyEyes
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 751,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: e.cough
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 752,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: e.fever
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 753,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: e.medsTaken.map((k)=>OTC_LABELS[k]?.split("(")[0]).filter(Boolean).join(", ")
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 754,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2",
                                                        children: e.note
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                                        lineNumber: 757,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, i, true, {
                                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                                lineNumber: 746,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 744,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 730,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 729,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 721,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/LfaAnalyzer.tsx",
            lineNumber: 677,
            columnNumber: 7
        }, this);
    };
    const NegativeAdvice = ({ again })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            lineNumber: 772,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-slate-700",
                            children: "이번 판독은 음성입니다."
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 773,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 771,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "list-disc ml-5 text-sm text-slate-700 space-y-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: "증상이 없거나 경미한 경우, 추가 조치 없이 경과 관찰."
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 776,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: "채취 시점/채취량/사진 품질 문제로 위음성 가능성."
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 777,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 775,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-3 p-3 rounded-xl bg-white border text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "font-medium mb-2",
                            children: "🤔 증상이 나타나거나 심해지면"
                        }, void 0, false, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 780,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "list-disc ml-5 space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "24–48시간 내 동일 조건으로 ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: "다시 키트 검사"
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 782,
                                            columnNumber: 33
                                        }, this),
                                        " 권장."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 782,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "재채기·콧물·코막힘 뚜렷해지면 ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: "증상 기록"
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 783,
                                            columnNumber: 32
                                        }, this),
                                        " 후 맞춤 안내 확인."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 783,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "호흡곤란/고열 지속 시 ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: "의료기관 상담"
                                        }, void 0, false, {
                                            fileName: "[project]/components/LfaAnalyzer.tsx",
                                            lineNumber: 784,
                                            columnNumber: 28
                                        }, this),
                                        " 우선."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 784,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 781,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-3 flex items-center gap-2",
                            children: [
                                again && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: again,
                                    className: "px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm",
                                    children: "다시 분석하기"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 787,
                                    columnNumber: 21
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setShowNegLight((s)=>!s),
                                    className: "px-3 py-1.5 rounded-lg border text-sm",
                                    children: showNegLight ? "라이트 기록 닫기" : "증상 라이트 기록 열기"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 788,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 786,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 779,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-xs text-slate-500",
                    children: "* 이 도구는 참고용입니다. 필요 시 전문가 상담을 권장합니다."
                }, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 793,
                    columnNumber: 7
                }, this),
                showNegLight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NegativeLightForm, {}, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 796,
                    columnNumber: 24
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RecoPanel, {}, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 799,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/LfaAnalyzer.tsx",
            lineNumber: 770,
            columnNumber: 5
        }, this);
    // 렌더
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-6xl mx-auto p-4 sm:p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl sm:text-3xl font-semibold mb-1",
                children: "📷 LFA QuickCheck v4.5.1"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 806,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-gray-600 mb-4",
                children: "세로 보정·자동 판독 + (양성) 증상 기록/약 추천/근처 찾기 + (음성) 재검사 가이드 & 라이트 기록"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 807,
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
                            lineNumber: 812,
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
                                    lineNumber: 814,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "font-medium",
                                    children: "사진 업로드 / 드래그"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 815,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-500",
                                    children: "팁: 윈도가 화면의 40~70%가 되게 채워서 찍으면 가장 정확해요."
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 816,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/LfaAnalyzer.tsx",
                            lineNumber: 813,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 811,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 809,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-3 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50",
                        onClick: ()=>mode === "auto" ? analyze() : manualAnalyze(),
                        disabled: !imageUrl || busy,
                        children: busy ? "분석 중…" : "분석"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 822,
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
                                lineNumber: 828,
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
                                        lineNumber: 830,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "manual",
                                        children: "수동(C/T 클릭)"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 831,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 829,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 827,
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
                                lineNumber: 836,
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
                                        lineNumber: 838,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "balanced",
                                        children: "Balanced"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 839,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "conservative",
                                        children: "Conservative"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 840,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 837,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 835,
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
                                lineNumber: 845,
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
                                        lineNumber: 847,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "left",
                                        children: "왼쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 848,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "right",
                                        children: "오른쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 848,
                                        columnNumber: 45
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "top",
                                        children: "위쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 849,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "bottom",
                                        children: "아래쪽"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 849,
                                        columnNumber: 44
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 846,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 844,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "flex items-center gap-2 text-xs text-gray-600",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                className: "accent-indigo-600",
                                checked: requireTwoLines,
                                onChange: (e)=>setRequireTwoLines(e.target.checked)
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 854,
                                columnNumber: 11
                            }, this),
                            "테스트 라인 필요(2-라인 키트)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 853,
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
                        lineNumber: 858,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 821,
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
                                    lineNumber: 864,
                                    columnNumber: 25
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute inset-0 flex items-center justify-center text-gray-400 text-sm",
                                    children: "원본 미리보기"
                                }, void 0, false, {
                                    fileName: "[project]/components/LfaAnalyzer.tsx",
                                    lineNumber: 865,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 863,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-2 text-xs text-gray-500",
                                children: "원본"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 867,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 862,
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
                                        lineNumber: 872,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                        ref: overlayRef,
                                        className: "absolute inset-0 w-full h-full object-contain pointer-events-auto"
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 874,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 871,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-2 text-xs text-gray-500",
                                children: "처리 결과 (수동: 캔버스 클릭해 C/T 지정)"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 876,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 870,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 861,
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
                                lineNumber: 881,
                                columnNumber: 55
                            }, this),
                            VerdictBadge
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 881,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm text-gray-700",
                        children: result ? `${result.detail} · 신뢰도: ${result.confidence}` : "사진을 올리면 자동으로 판독합니다."
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 882,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 880,
                columnNumber: 7
            }, this),
            result?.verdict === "Positive" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SymptomLogger, {}, void 0, false, {
                    fileName: "[project]/components/LfaAnalyzer.tsx",
                    lineNumber: 888,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 887,
                columnNumber: 9
            }, this),
            result?.verdict === "Negative" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NegativeAdvice, {
                again: ()=>analyze()
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 894,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/LfaAnalyzer.tsx",
        lineNumber: 805,
        columnNumber: 5
    }, this);
}
_s(LfaAnalyzer, "EkJJrGX5PWFzIDkKpN/fJq4fm70=");
_c = LfaAnalyzer;
var _c;
__turbopack_context__.k.register(_c, "LfaAnalyzer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_LfaAnalyzer_tsx_39217bba._.js.map