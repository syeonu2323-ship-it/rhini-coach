"use client";
import React from "react";
import NearbyFinder from "@/components/NearbyFinder";
import SymptomLogger from "@/components/SymptomLogger";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🏥 Rhini-Coach 홈</h1>

      {/* 근처 약국/병원 */}
      <NearbyFinder />

      {/* 증상 기록 */}
      <div className="mt-6">
        <SymptomLogger />
      </div>

      {/* 검사하러 가기 */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push("/analyze")}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-lg shadow hover:bg-indigo-700"
        >
          📷 자가진단 검사하러 가기
        </button>
      </div>
    </div>
  );
}
