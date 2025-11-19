"use client";

import React, { useState } from "react";
import NearbyFinder from "@/components/NearbyFinder";
import SymptomLogger from "@/components/SymptomLogger";
import LfaAnalyzer from "@/components/LfaAnalyzer";

export default function Home() {
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* 상단 타이틀 */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          🏥 Rhini-Coach (테스트 문구: 현재앙 전용 버전)
        </h1>
        <p className="text-sm text-gray-600">
          이 문장이 보이면 진짜 새 버전이 맞음.
        </p>
      </header>

      {/* 1. 근처 약국/병원 찾기 */}
      <section>
        <NearbyFinder />
      </section>

      {/* 2. 증상 기록 */}
      <section>
        <SymptomLogger />
      </section>

      {/* 3. 판독기 열기/닫기 */}
      <section className="pt-2 border-t">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">📷 자가진단 키트 판독</h2>
            <p className="text-xs text-gray-600">
              스마트폰 카메라로 키트를 찍거나, 갤러리에서 사진을 선택해서
              C/T 라인을 자동 분석합니다.
            </p>
          </div>

          <button
            onClick={() => setShowAnalyzer((v) => !v)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
          >
            {showAnalyzer ? "🔙 판독 닫기" : "📷 판독 시작하기"}
          </button>
        </div>

        {showAnalyzer && (
          <div className="mt-4">
            <LfaAnalyzer />
          </div>
        )}
      </section>
    </div>
  );
}
