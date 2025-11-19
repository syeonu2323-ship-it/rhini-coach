"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SymptomLogger from "@/components/SymptomLogger";

export default function Home() {
  const router = useRouter();
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [symptomResult, setSymptomResult] = useState<null | {
    category: "allergic" | "bacterial" | "mixed" | "unknown";
    message: string;
    meds: string[];
    tips: string[];
  }>(null);

  // -----------------------------
  // 증상 → 질환 추정 알고리즘
  // -----------------------------
  function analyzeSymptoms(symptoms: {
    sneeze: boolean;
    itch: boolean;
    runny: boolean;
    fever: boolean;
    facialPain: boolean;
    thickMucus: boolean;
  }) {
    let allergicScore = 0;
    let bacterialScore = 0;

    // 알레르기성 비염 지표
    if (symptoms.sneeze) allergicScore++;
    if (symptoms.itch) allergicScore++;
    if (symptoms.runny) allergicScore++;

    // 세균성 비염 지표
    if (symptoms.fever) bacterialScore++;
    if (symptoms.facialPain) bacterialScore++;
    if (symptoms.thickMucus) bacterialScore++;

    let category: "allergic" | "bacterial" | "mixed" | "unknown" = "unknown";

    if (allergicScore >= 2 && bacterialScore >= 2) category = "mixed";
    else if (allergicScore >= 2) category = "allergic";
    else if (bacterialScore >= 2) category = "bacterial";
    else category = "unknown";

    // 결과를 매핑
    const resultMap = {
      allergic: {
        message: "알레르기성 비염 가능성이 높아요.",
        meds: ["항히스타민제", "비강 스테로이드 스프레이", "생리식염수 세척"],
        tips: [
          "외출 후 코 세척하기",
          "침구류 주기적 세탁",
          "먼지·꽃가루 많은 날 마스크 착용",
          "실내 공기청정기 사용",
        ],
      },
      bacterial: {
        message: "세균성 비염(부비동염) 가능성이 높아요.",
        meds: ["항생제(병원처방)", "진통해열제", "비충혈 제거제(단기)"],
        tips: [
          "얼굴 찜질로 통증 완화",
          "실내 습도 유지(40~50%)",
          "증상 지속 시 이비인후과 방문",
        ],
      },
      mixed: {
        message: "알레르기 + 세균성 혼합형 가능성이 있어요.",
        meds: [
          "항히스타민제",
          "비강 스테로이드",
          "항생제(병원 진료 필요)",
        ],
        tips: [
          "생리식염수 세척",
          "충분한 수분 섭취",
          "통증·발열 지속 시 병원 방문",
        ],
      },
      unknown: {
        message: "특정 유형으로 판단하기 어려워요.",
        meds: ["증상 완화제(종합감기약)", "비강 세척"],
        tips: ["증상 심해지면 병원 방문", "휴식 충분히 취하기"],
      },
    };

    setSymptomResult(resultMap[category]);
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-semibold mb-4">👃 Rhini-Coach</h1>
      <p className="text-gray-600 mb-8">
        비염 증상 기록 및 근처 병원/약국 찾기 서비스입니다.
      </p>

      {/* --- 증상 기록 결과 표시 --- */}
      {symptomResult && (
        <div className="bg-purple-50 p-4 rounded-xl shadow mb-6 text-left">
          <h2 className="text-lg font-semibold mb-2">{symptomResult.message}</h2>

          <p className="font-medium mt-3 mb-1 text-purple-700">추천 약</p>
          <ul className="list-disc ml-5 text-sm">
            {symptomResult.meds.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <p className="font-medium mt-3 mb-1 text-purple-700">증상 완화 방법</p>
          <ul className="list-disc ml-5 text-sm">
            {symptomResult.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* --- 증상 기록 화면 표시 --- */}
      {showSymptoms && (
        <SymptomLogger
          onSubmit={(data) => {
            analyzeSymptoms(data);
            setShowSymptoms(false);
          }}
          onCancel={() => setShowSymptoms(false)}
        />
      )}

      {/* --- 초기 버튼 영역 --- */}
      {!showSymptoms && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/analyze")}
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            🔍 키트 판독하러 가기
          </button>

          <button
            onClick={() => setShowSymptoms(true)}
            className="bg-yellow-500 text-white py-3 rounded-lg font-semibold"
          >
            📝 증상 기록하기
          </button>

          <button
            onClick={() => {
              const q = encodeURIComponent("약국");
              window.open(`https://map.naver.com/p/search/${q}`, "_blank");
            }}
            className="bg-green-600 text-white py-3 rounded-lg font-semibold"
          >
            💊 근처 약국 찾기
          </button>

          <button
            onClick={() => {
              const q = encodeURIComponent("이비인후과");
              window.open(`https://map.naver.com/p/search/${q}`, "_blank");
            }}
            className="bg-purple-600 text-white py-3 rounded-lg font-semibold"
          >
            🏥 근처 병원 찾기
          </button>
        </div>
      )}
    </div>
  );
}
