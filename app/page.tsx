"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type SymptomCategory = "allergic" | "bacterial" | "mixed" | "unknown";

type SymptomResult = {
  category: SymptomCategory;
  message: string;
  meds: string[];
  tips: string[];
};

export default function Home() {
  const router = useRouter();

  // 증상 기록 UI 보일지 여부
  const [showSymptoms, setShowSymptoms] = useState(false);

  // 분석 결과
  const [symptomResult, setSymptomResult] = useState<SymptomResult | null>(null);

  // 체크박스 상태
  const [sneeze, setSneeze] = useState(false);      // 재채기
  const [itch, setItch] = useState(false);          // 코 가려움
  const [runny, setRunny] = useState(false);        // 맑은 콧물
  const [fever, setFever] = useState(false);        // 발열
  const [facialPain, setFacialPain] = useState(false); // 얼굴 통증
  const [thickMucus, setThickMucus] = useState(false); // 누런/끈적 콧물

  // 증상 분석 버튼 눌렀을 때
  const handleAnalyzeSymptoms = () => {
    let allergicScore = 0;
    let bacterialScore = 0;

    // 알레르기성 비염 지표
    if (sneeze) allergicScore++;
    if (itch) allergicScore++;
    if (runny) allergicScore++;

    // 세균성 비염/부비동염 지표
    if (fever) bacterialScore++;
    if (facialPain) bacterialScore++;
    if (thickMucus) bacterialScore++;

    let category: SymptomCategory = "unknown";
    if (allergicScore >= 2 && bacterialScore >= 2) category = "mixed";
    else if (allergicScore >= 2) category = "allergic";
    else if (bacterialScore >= 2) category = "bacterial";

    const resultMap: Record<SymptomCategory, SymptomResult> = {
      allergic: {
        category: "allergic",
        message: "알레르기성 비염 가능성이 높아요.",
        meds: ["항히스타민제", "비강 스테로이드 스프레이", "생리식염수 코세척"],
        tips: [
          "외출 후 생리식염수로 코 세척하기",
          "침구·커튼 자주 세탁하기",
          "먼지·꽃가루 많은 날 마스크 착용",
          "실내 공기청정기/청소 자주 하기",
        ],
      },
      bacterial: {
        category: "bacterial",
        message: "세균성 비염(부비동염) 가능성이 높아요.",
        meds: ["항생제(병원 처방 필요)", "진통·해열제", "비충혈 제거제(단기간 사용)"],
        tips: [
          "얼굴(볼, 이마) 따뜻하게 찜질하기",
          "충분한 수분 섭취",
          "증상이 1주 이상 지속되거나 심해지면 이비인후과 방문",
        ],
      },
      mixed: {
        category: "mixed",
        message: "알레르기 + 세균성 혼합형 가능성이 있어요.",
        meds: [
          "항히스타민제",
          "비강 스테로이드 스프레이",
          "항생제(병원 진료 후 처방)",
        ],
        tips: [
          "생리식염수 코세척 꾸준히 하기",
          "수분 섭취·충분한 휴식",
          "두통·안면통·고열이 지속되면 병원 꼭 방문",
        ],
      },
      unknown: {
        category: "unknown",
        message: "특정 유형으로 딱 잘라 말하긴 어려워요.",
        meds: ["증상 완화제(종합감기약 등)", "생리식염수 코세척"],
        tips: [
          "증상이 심해지거나 1주 이상 지속되면 병원 상담 권장",
          "무리하지 말고 휴식 충분히 취하기",
        ],
      },
    };

    setSymptomResult(resultMap[category]);
    setShowSymptoms(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-semibold mb-2">👃 Rhini-Coach</h1>
      <p className="text-gray-600 mb-6">
        비염 증상 기록 + 근처 병원·약국 찾기 + 키트 판독 연결까지 한 번에 도와주는 도우미입니다.
      </p>

      {/* 증상 분석 결과 카드 */}
      {symptomResult && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-left mb-6">
          <h2 className="text-lg font-semibold mb-2">{symptomResult.message}</h2>

          <p className="font-medium mt-2 text-purple-800">💊 추천 약(카테고리)</p>
          <ul className="list-disc ml-5 text-sm">
            {symptomResult.meds.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <p className="font-medium mt-3 text-purple-800">🌿 증상 완화 방법</p>
          <ul className="list-disc ml-5 text-sm">
            {symptomResult.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 증상 선택 UI */}
      {showSymptoms && (
        <div className="bg-gray-100 p-5 rounded-xl shadow-md text-left mb-6">
          <h2 className="text-lg font-semibold mb-3">📝 현재 증상 선택하기</h2>

          <div className="flex flex-col gap-2 text-sm">
            <label>
              <input
                type="checkbox"
                checked={sneeze}
                onChange={() => setSneeze(!sneeze)}
              />{" "}
              재채기가 반복된다
            </label>
            <label>
              <input
                type="checkbox"
                checked={itch}
                onChange={() => setItch(!itch)}
              />{" "}
              코 안이 가렵다
            </label>
            <label>
              <input
                type="checkbox"
                checked={runny}
                onChange={() => setRunny(!runny)}
              />{" "}
              맑은 콧물이 계속 난다
            </label>
            <label>
              <input
                type="checkbox"
                checked={fever}
                onChange={() => setFever(!fever)}
              />{" "}
              열이 난다
            </label>
            <label>
              <input
                type="checkbox"
                checked={facialPain}
                onChange={() => setFacialPain(!facialPain)}
              />{" "}
              얼굴(볼, 이마, 코 주변)이 아프다/묵직하다
            </label>
            <label>
              <input
                type="checkbox"
                checked={thickMucus}
                onChange={() => setThickMucus(!thickMucus)}
              />{" "}
              누렇고 끈적한 콧물이 나온다
            </label>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              onClick={handleAnalyzeSymptoms}
            >
              증상 분석하기
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm"
              onClick={() => setShowSymptoms(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 메인 버튼들 */}
      {!showSymptoms && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/analyze")}
            className="bg-indigo-600 text-white py-3 rounded-lg font-semibold"
          >
            🔍 키트 판독하러 가기
          </button>

          <button
            onClick={() => setShowSymptoms(true)}
            className="bg-amber-500 text-white py-3 rounded-lg font-semibold"
          >
            📝 증상 기록·분석하기
          </button>

          <button
            onClick={() => {
              const q = encodeURIComponent("약국");
              window.open(`https://map.naver.com/p/search/${q}`, "_blank");
            }}
            className="bg-emerald-600 text-white py-3 rounded-lg font-semibold"
          >
            💊 근처 약국 찾기 (네이버지도)
          </button>

          <button
            onClick={() => {
              const q = encodeURIComponent("이비인후과");
              window.open(`https://map.naver.com/p/search/${q}`, "_blank");
            }}
            className="bg-purple-600 text-white py-3 rounded-lg font-semibold"
          >
            🏥 근처 이비인후과 찾기 (네이버지도)
          </button>
        </div>
      )}
    </div>
  );
}
