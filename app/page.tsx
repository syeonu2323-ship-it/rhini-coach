"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="w-full max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-semibold mb-4">👃 Rhini-Coach</h1>

      <p className="text-gray-600 mb-8">
        비염 증상 기록 및 근처 병원/약국 찾기 서비스입니다.
      </p>

      {/* 버튼 영역 */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push("/analyze")}
          className="bg-blue-600 text-white py-3 rounded-lg font-semibold"
        >
          🔍 키트 판독하러 가기
        </button>

        <button
          onClick={() => {
            const q = encodeURIComponent("약국");
            window.open(
              `https://map.naver.com/p/search/${q}`,
              "_blank"
            );
          }}
          className="bg-green-600 text-white py-3 rounded-lg font-semibold"
        >
          💊 근처 약국 찾기
        </button>

        <button
          onClick={() => {
            const q = encodeURIComponent("이비인후과");
            window.open(
              `https://map.naver.com/p/search/${q}`,
              "_blank"
            );
          }}
          className="bg-purple-600 text-white py-3 rounded-lg font-semibold"
        >
          🏥 근처 병원 찾기
        </button>
      </div>
    </div>
  );
}
