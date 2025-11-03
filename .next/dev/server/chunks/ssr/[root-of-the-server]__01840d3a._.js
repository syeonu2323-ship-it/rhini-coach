module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/components/LfaAnalyzer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LfaAnalyzer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// components/LfaAnalyzer.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function toGray(r, g, b) {
    // 표준 가중치 회색화
    return 0.299 * r + 0.587 * g + 0.114 * b;
}
function sampleMeanGray(ctx, rect) {
    const { x, y, w, h } = rect;
    const img = ctx.getImageData(x, y, w, h);
    const data = img.data;
    let sum = 0;
    let sum2 = 0;
    let n = 0;
    for(let i = 0; i < data.length; i += 4){
        const gray = toGray(data[i], data[i + 1], data[i + 2]);
        sum += gray;
        sum2 += gray * gray;
        n++;
    }
    const mean = sum / n;
    const variance = sum2 / n - mean * mean;
    return {
        mean,
        std: Math.sqrt(Math.max(variance, 0))
    };
}
function scaleToFit(imgW, imgH, maxW = 1000, maxH = 800) {
    const ratio = Math.min(maxW / imgW, maxH / imgH, 1);
    return {
        w: Math.round(imgW * ratio),
        h: Math.round(imgH * ratio),
        scale: ratio
    };
}
function LfaAnalyzer() {
    const [imageURL, setImageURL] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [imgDim, setImgDim] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        w: 0,
        h: 0
    });
    const [canvasDim, setCanvasDim] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        w: 0,
        h: 0
    });
    const [dragging, setDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const imgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // 기본 ROI(컨트롤/테스트 라인 박스) — 이미지 크기 로딩 후 중앙 근처로 배치
    const [controlRect, setControlRect] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        x: 50,
        y: 100,
        w: 220,
        h: 22
    });
    const [testRect, setTestRect] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        x: 50,
        y: 160,
        w: 220,
        h: 22
    });
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        verdict: null
    });
    // 이미지 선택
    const onFile = (f)=>{
        if (!f) return;
        const url = URL.createObjectURL(f);
        setImageURL(url);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!imageURL) return;
        const img = new Image();
        img.onload = ()=>{
            imgRef.current = img;
            setImgDim({
                w: img.naturalWidth,
                h: img.naturalHeight
            });
            const { w, h } = scaleToFit(img.naturalWidth, img.naturalHeight);
            setCanvasDim({
                w,
                h
            });
            // ROI 초기화(가이드): 폭은 이미지 폭의 60%, 높이는 2.2% 정도
            const rw = Math.round(w * 0.6);
            const rh = Math.max(16, Math.round(h * 0.025));
            const x0 = Math.round((w - rw) / 2);
            setControlRect({
                x: x0,
                y: Math.round(h * 0.35),
                w: rw,
                h: rh
            });
            setTestRect({
                x: x0,
                y: Math.round(h * 0.55),
                w: rw,
                h: rh
            });
            // 그리기
            draw(img, w, h, {
                x: x0,
                y: Math.round(h * 0.35),
                w: rw,
                h: rh
            }, {
                x: x0,
                y: Math.round(h * 0.55),
                w: rw,
                h: rh
            });
        };
        img.src = imageURL;
        return ()=>{
            setResult({
                verdict: null
            });
        };
    }, [
        imageURL
    ]);
    // 캔버스에 이미지/오버레이 그리기
    const draw = (img, w, h, cr = controlRect, tr = testRect)=>{
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        // 가이드 오버레이
        function strokeRect(r, color) {
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.strokeRect(r.x, r.y, r.w, r.h);
            ctx.fillStyle = color + "22";
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.restore();
        }
        strokeRect(cr, "#22c55e"); // control - green
        strokeRect(tr, "#3b82f6"); // test - blue
    };
    // ROI를 드래그 이동
    const startDrag = (target)=>(e)=>{
            e.preventDefault();
            setDragging({
                target,
                dx: e.clientX,
                dy: e.clientY
            });
        };
    const onMove = (e)=>{
        if (!dragging) return;
        const dx = e.clientX - dragging.dx;
        const dy = e.clientY - dragging.dy;
        const updateRect = (r)=>{
            const nx = clamp(r.x + dx, 0, canvasDim.w - r.w);
            const ny = clamp(r.y + dy, 0, canvasDim.h - r.h);
            return {
                ...r,
                x: nx,
                y: ny
            };
        };
        if (dragging.target === "control") {
            const nr = updateRect(controlRect);
            setControlRect(nr);
            setDragging({
                ...dragging,
                dx: e.clientX,
                dy: e.clientY
            });
            if (imgRef.current) draw(imgRef.current, canvasDim.w, canvasDim.h, nr, testRect);
        } else {
            const nr = updateRect(testRect);
            setTestRect(nr);
            setDragging({
                ...dragging,
                dx: e.clientX,
                dy: e.clientY
            });
            if (imgRef.current) draw(imgRef.current, canvasDim.w, canvasDim.h, controlRect, nr);
        }
    };
    const endMove = ()=>setDragging(null);
    // 판독 실행
    const analyze = ()=>{
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // ROI 평균 회색값(값이 낮을수록 어두움 → 일반적인 분홍/적색 라인은 밝기↓)
        const c = sampleMeanGray(ctx, controlRect);
        const t = sampleMeanGray(ctx, testRect);
        // 배경은 ROI 위/아래로 동일 높이 박스를 잡아 평균(가능하면 이미지 범위 안에서만)
        const bgH = Math.max(12, Math.round(controlRect.h * 1.1));
        const bgPad = 8;
        const ctrlBgY = clamp(controlRect.y - bgH - bgPad, 0, canvasDim.h - bgH);
        const testBgY = clamp(testRect.y + testRect.h + bgPad, 0, canvasDim.h - bgH);
        const ctrlBg = {
            x: controlRect.x,
            y: ctrlBgY,
            w: controlRect.w,
            h: bgH
        };
        const testBg = {
            x: testRect.x,
            y: testBgY,
            w: testRect.w,
            h: bgH
        };
        const cbg = sampleMeanGray(ctx, ctrlBg);
        const tbg = sampleMeanGray(ctx, testBg);
        // 밝기값이 낮을수록 라인이 진함 → "배경/ROI" 비율로 선명도 산출
        // ratio > 1.20 정도면 "눈에 띄게 어두움(=라인 존재)"로 판단
        const controlRatio = cbg.mean / Math.max(1e-6, c.mean);
        const testRatio = tbg.mean / Math.max(1e-6, t.mean);
        const CONTROL_THRESH = 1.18;
        const TEST_THRESH = 1.12;
        const controlPresent = controlRatio >= CONTROL_THRESH;
        const testPresent = testRatio >= TEST_THRESH;
        let verdict;
        if (!controlPresent) {
            verdict = "Invalid";
        } else if (testPresent) {
            verdict = "Positive";
        } else {
            verdict = "Negative";
        }
        // 신뢰도 추정(간단): (ratio-1)의 크기 기반 0~1 스케일
        const confBase = verdict === "Invalid" ? Math.min(Math.max(controlRatio - CONTROL_THRESH, 0), 0.5) * 2 : Math.min(Math.max(verdict === "Positive" ? testRatio - TEST_THRESH : CONTROL_THRESH - testRatio, 0), 0.5) * 2;
        const confidence = Math.round(clamp(0.5 + confBase, 0, 1) * 100) / 100;
        setResult({
            verdict,
            controlRatio: Math.round(controlRatio * 1000) / 1000,
            testRatio: Math.round(testRatio * 1000) / 1000,
            confidence,
            detail: `CTRL ratio=${controlRatio.toFixed(3)} / TEST ratio=${testRatio.toFixed(3)} (bg/roi)`
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-3xl mx-auto p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-2xl font-semibold mb-3",
                children: "📷 LFA 키트 판독 (알레르기성 비염)"
            }, void 0, false, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 221,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        accept: "image/*",
                        onChange: (e)=>onFile(e.target.files?.[0]),
                        className: "hidden"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 224,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer hover:bg-gray-50",
                        children: imageURL ? "다시 업로드하려면 클릭" : "여기를 클릭하거나 이미지를 드래그해 업로드"
                    }, void 0, false, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 230,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/LfaAnalyzer.tsx",
                lineNumber: 223,
                columnNumber: 7
            }, this),
            imageURL && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: containerRef,
                        className: "relative mt-4 select-none",
                        style: {
                            width: canvasDim.w,
                            height: canvasDim.h
                        },
                        onMouseMove: onMove,
                        onMouseUp: endMove,
                        onMouseLeave: endMove,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                ref: canvasRef,
                                width: canvasDim.w,
                                height: canvasDim.h,
                                className: "rounded-xl shadow"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 245,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                role: "button",
                                "aria-label": "Control line ROI",
                                title: "Control line ROI",
                                onMouseDown: startDrag("control"),
                                style: {
                                    position: "absolute",
                                    left: controlRect.x,
                                    top: controlRect.y,
                                    width: controlRect.w,
                                    height: controlRect.h,
                                    border: "2px solid #22c55e",
                                    background: "rgba(34,197,94,0.10)",
                                    borderRadius: "10px",
                                    cursor: "move"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 252,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                role: "button",
                                "aria-label": "Test line ROI",
                                title: "Test line ROI",
                                onMouseDown: startDrag("test"),
                                style: {
                                    position: "absolute",
                                    left: testRect.x,
                                    top: testRect.y,
                                    width: testRect.w,
                                    height: testRect.h,
                                    border: "2px solid #3b82f6",
                                    background: "rgba(59,130,246,0.10)",
                                    borderRadius: "10px",
                                    cursor: "move"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 270,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 237,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 flex gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    if (imgRef.current) draw(imgRef.current, canvasDim.w, canvasDim.h);
                                },
                                className: "px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200",
                                children: "가이드 다시 그리기"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 290,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: analyze,
                                className: "px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800",
                                children: "판독하기"
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 298,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 289,
                        columnNumber: 11
                    }, this),
                    result.verdict && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 p-4 rounded-2xl border shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-lg",
                                children: [
                                    "결과:",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: result.verdict === "Positive" ? "text-green-600 font-semibold" : result.verdict === "Negative" ? "text-blue-600 font-semibold" : "text-red-600 font-semibold",
                                        children: result.verdict
                                    }, void 0, false, {
                                        fileName: "[project]/components/LfaAnalyzer.tsx",
                                        lineNumber: 310,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 308,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-600 mt-1",
                                children: [
                                    result.detail,
                                    typeof result.confidence === "number" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            " / Confidence ≈ ",
                                            Math.round(result.confidence * 100),
                                            "%"
                                        ]
                                    }, void 0, true)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 322,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-500 mt-1",
                                children: "※ 컨트롤 라인이 약하면 박스를 더 얇게/정확히 맞춘 뒤 다시 판독하세요."
                            }, void 0, false, {
                                fileName: "[project]/components/LfaAnalyzer.tsx",
                                lineNumber: 328,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/LfaAnalyzer.tsx",
                        lineNumber: 307,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/components/LfaAnalyzer.tsx",
        lineNumber: 220,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This has to be a shared module which is shared between client component error boundary and dynamic component
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    BailoutToCSRError: null,
    isBailoutToCSRError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    BailoutToCSRError: function() {
        return BailoutToCSRError;
    },
    isBailoutToCSRError: function() {
        return isBailoutToCSRError;
    }
});
const BAILOUT_TO_CSR = 'BAILOUT_TO_CLIENT_SIDE_RENDERING';
class BailoutToCSRError extends Error {
    constructor(reason){
        super(`Bail out to client-side rendering: ${reason}`), this.reason = reason, this.digest = BAILOUT_TO_CSR;
    }
}
function isBailoutToCSRError(err) {
    if (typeof err !== 'object' || err === null || !('digest' in err)) {
        return false;
    }
    return err.digest === BAILOUT_TO_CSR;
} //# sourceMappingURL=bailout-to-csr.js.map
}),
"[project]/node_modules/next/dist/shared/lib/lazy-dynamic/dynamic-bailout-to-csr.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BailoutToCSR", {
    enumerable: true,
    get: function() {
        return BailoutToCSR;
    }
});
const _bailouttocsr = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js [app-ssr] (ecmascript)");
function BailoutToCSR({ reason, children }) {
    if ("TURBOPACK compile-time truthy", 1) {
        throw Object.defineProperty(new _bailouttocsr.BailoutToCSRError(reason), "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
    }
    return children;
} //# sourceMappingURL=dynamic-bailout-to-csr.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxRuntime; //# sourceMappingURL=react-jsx-runtime.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactDOM; //# sourceMappingURL=react-dom.js.map
}),
"[project]/node_modules/next/dist/shared/lib/encode-uri-path.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "encodeURIPath", {
    enumerable: true,
    get: function() {
        return encodeURIPath;
    }
});
function encodeURIPath(file) {
    return file.split('/').map((p)=>encodeURIComponent(p)).join('/');
} //# sourceMappingURL=encode-uri-path.js.map
}),
"[project]/node_modules/next/dist/shared/lib/lazy-dynamic/preload-chunks.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PreloadChunks", {
    enumerable: true,
    get: function() {
        return PreloadChunks;
    }
});
const _jsxruntime = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-runtime.js [app-ssr] (ecmascript)");
const _reactdom = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js [app-ssr] (ecmascript)");
const _workasyncstorageexternal = __turbopack_context__.r("[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)");
const _encodeuripath = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/encode-uri-path.js [app-ssr] (ecmascript)");
function PreloadChunks({ moduleIds }) {
    // Early return in client compilation and only load requestStore on server side
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const workStore = _workasyncstorageexternal.workAsyncStorage.getStore();
    if (workStore === undefined) {
        return null;
    }
    const allFiles = [];
    // Search the current dynamic call unique key id in react loadable manifest,
    // and find the corresponding CSS files to preload
    if (workStore.reactLoadableManifest && moduleIds) {
        const manifest = workStore.reactLoadableManifest;
        for (const key of moduleIds){
            if (!manifest[key]) continue;
            const chunks = manifest[key].files;
            allFiles.push(...chunks);
        }
    }
    if (allFiles.length === 0) {
        return null;
    }
    const dplId = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : '';
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(_jsxruntime.Fragment, {
        children: allFiles.map((chunk)=>{
            const href = `${workStore.assetPrefix}/_next/${(0, _encodeuripath.encodeURIPath)(chunk)}${dplId}`;
            const isCss = chunk.endsWith('.css');
            // If it's stylesheet we use `precedence` o help hoist with React Float.
            // For stylesheets we actually need to render the CSS because nothing else is going to do it so it needs to be part of the component tree.
            // The `preload` for stylesheet is not optional.
            if (isCss) {
                return /*#__PURE__*/ (0, _jsxruntime.jsx)("link", {
                    // @ts-ignore
                    precedence: "dynamic",
                    href: href,
                    rel: "stylesheet",
                    as: "style",
                    nonce: workStore.nonce
                }, chunk);
            } else {
                // If it's script we use ReactDOM.preload to preload the resources
                (0, _reactdom.preload)(href, {
                    as: 'script',
                    fetchPriority: 'low',
                    nonce: workStore.nonce
                });
                return null;
            }
        })
    });
} //# sourceMappingURL=preload-chunks.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__01840d3a._.js.map