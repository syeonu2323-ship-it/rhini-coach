"use client";
import React from "react";

export default function NearbyFinder() {
  const openBoth = (q: string) => {
    const query = encodeURIComponent(q);
    window.open(`https://map.naver.com/v5/search/${query}`, "_blank");
    window.open(`https://map.kakao.com/link/search/${query}`, "_blank");
  };

  return (
    <div className="p-4 border rounded-2xl bg-emerald-50 mb-4">
      <h2 className="font-semibold mb-2">📍 근처 약국·병원 찾기</h2>
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg" onClick={() => openBoth("약국")}>약국 찾기</button>
        <button className="px-3 py-1.5 border rounded-lg" onClick={() => openBoth("이비인후과")}>이비인후과</button>
        <button className="px-3 py-1.5 border rounded-lg" onClick={() => openBoth("호흡기내과")}>호흡기내과</button>
        <button className="px-3 py-1.5 border rounded-lg" onClick={() => openBoth("응급실")}>응급실</button>
      </div>
    </div>
  );
}
