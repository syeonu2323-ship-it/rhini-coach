"use client";

import React from "react";
import NearbyFinder from "@/components/NearbyFinder"; // 경로는 네 프로젝트 구조에 맞게 조절 필요
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">📍 LFA QuickCheck 홈</h1>
      <p className="text-sm text-gray-600 mb-6">
        근처 약국/병원을 먼저 확인하거나, 키트 판독 페이지로 이동하세요.
      </p>

      {/* 근처 찾기 */}
      <NearbyFinder />

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push("/analyze")}
          className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-lg hover:bg-indigo-700"
        >
          📷 키트 판독하러 가기
        </button>
      </div>
    </div>
  );
}
