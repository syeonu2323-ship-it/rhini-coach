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

  // 증상 기록 UI
  const [showSymptoms, setShowSymptoms] = useState(false);

  // 분석 결과
  const [symptomResult, setSymptomResult] = useState<SymptomResult | null>(null);

  // 체크박스 상태
  const [sneeze, setSneeze] = useState(false);
  const [itch, setItch] = useState(false);
  const [runny, setRunny] = useState(false);
  const [fever, setFever] = useState(false);
  const [facialPain, setFacialPain] = useState(false);
  const [thickMucus, setThickMucus] = useState(false);

  // ⭐ 추가: 기타 증상 체크 + 내용
  const [otherCheck, setOtherCheck] = useState(false);
  const [otherText, setOtherText] = useState("");

  // 증상 분석 버튼
  const handleAnalyzeSymptoms = () => {
    let allergicScore = 0;
    let bacterialScore = 0;

    // 알레르기성 비염 지표
    if (sneeze) allergicScore++;
    if (itch) allergicScore++;
    if (runny) allergicScore++;

    // 세균성 비염 지표
    if (fever) bacterialScore++;
    if (facialPain) bacterialScore++;
    if (thickMucus) bacterialScore++;

    // ⭐ 기타 증상 점수 반영 (중립점수 → unknown 유지)
    let category: SymptomCategory = "unknown";

    if (allergicScore >= 2 && bacterialScore >= 2) category = "mixed";
    else if (allergicScore >= 2) category = "allergic";
    else if (bacterialScore >= 2) category = "bacterial";
    else category = "unknown";

    // 결과 데이터
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
          "얼굴 따뜻하게 찜질하기",
          "수분 충분히 섭취",
          "증상 1주 이상 지속되면 병원 방문",
        ],
      },
      mixed: {
        category: "mixed",
        message: "알레르기 + 세균성 혼합형 가능성이 있어요.",
        meds: [
          "항히스타민제",
          "비강 스테로이드 스프레이",
          "항생제(병원 처방)",
        ],
        tips: [
          "코세척 꾸준히 하기",
          "휴식·수분 섭취",
          "두통/고열 지속 시 병원 방문",
        ],
      },
      unknown: {
        category: "unknown",
        message: `특정 유형으로 딱 말하기 어려워요.${
          otherCheck && otherText.trim() ? ` (기타 증상: ${otherText})` : ""
        }`,
        meds: ["증상 완화제", "생리식염수 코세척"],
        tips: ["증상 심해지거나 지속 시 병원 방문 권장"],
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

      {/* 분석 결과 카드 */}
      {symptomResult && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-left mb-6">
          <h2 className="text-lg font-semibold mb-2">{symptomResult.message}</h2>

          <p className="font-medium mt-2 text-purple-800">💊 추천 약</p>
          <ul className="list-disc ml-5 text-sm">
            {symptomResult.meds.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <p className="font-medium mt-3 text-purple-800">🌿 완화 팁</p>
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
            <label><input type="checkbox" checked={sneeze} onChange={() => setSneeze(!sneeze)} /> 재채기가 반복된다</label>
            <label><input type="checkbox" checked={itch} onChange={() => setItch(!itch)} /> 코 안이 가렵다</label>
            <label><input type="checkbox" checked={runny} onChange={() => setRunny(!runny)} /> 맑은 콧물이 난다</label>
            <label><input type="checkbox" checked={fever} onChange={() => setFever(!fever)} /> 열이 난다</label>
            <label><input type="checkbox" checked={facialPain} onChange={() => setFacialPain(!facialPain)} /> 얼굴이 아프다</label>
            <label><input type="checkbox" checked={thickMucus} onChange={() => setThickMucus(!thickMucus)} /> 누렇고 끈적한 콧물</label>

            {/* ⭐ 기타 항목 */}
            <label>
              <input
                type="checkbox"
                checked={otherCheck}
                onChange={() => setOtherCheck(!otherCheck)}
              />{" "}
              기타 증상이 있다
            </label>

            {/* ⭐ 기타 입력창 */}
            {otherCheck && (
              <input
                className="border rounded-md p-2 mt-2 text-sm"
                placeholder="기타 증상을 입력하세요"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
              />
            )}
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

      {/* 메인 버튼 */}
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
            onClick={() => window.open(`https://map.naver.com/p/search/${encodeURIComponent("약국")}`, "_blank")}
            className="bg-emerald-600 text-white py-3 rounded-lg font-semibold"
          >
            💊 근처 약국 찾기
          </button>

          <button
            onClick={() => window.open(`https://map.naver.com/p/search/${encodeURIComponent("이비인후과")}`, "_blank")}
            className="bg-purple-600 text-white py-3 rounded-lg font-semibold"
          >
            🏥 근처 이비인후과 찾기
          </button>
        </div>
      )}
    </div>
  );
}
