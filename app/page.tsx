"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

// --- 위치 훅 + 네이버/카카오 링크 ---
function useGeo() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setErr("이 브라우저에서는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLoading(true);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLoading(false);
      },
      (e) => {
        setErr(e.message || "위치 정보를 가져오지 못했습니다.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  return { lat, lng, loading, err, request };
}

function naverSearchUrl(q: string, lat?: number | null, lng?: number | null) {
  const query = encodeURIComponent(q);
  if (lat != null && lng != null) {
    const c = `${lng},${lat},15,0,0,0,d`;
    return `https://map.naver.com/v5/search/${query}?c=${c}`;
  }
  return `https://map.naver.com/v5/search/${query}`;
}

function kakaoSearchUrl(q: string, lat?: number | null, lng?: number | null) {
  const query = encodeURIComponent(q);
  if (lat != null && lng != null)
    return `https://map.kakao.com/link/search/${query}?x=${lng}&y=${lat}`;
  return `https://map.kakao.com/?q=${query}`;
}

function NearbyFinderHome() {
  const { lat, lng, loading, err, request } = useGeo();

  const openBoth = (q: string) => {
    window.open(naverSearchUrl(q, lat, lng), "_blank");
    window.open(kakaoSearchUrl(q, lat, lng), "_blank");
  };

  return (
    <div className="mt-4 p-4 rounded-2xl border bg-emerald-50 border-emerald-300">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold">📍 근처 약국·병원 찾기</span>
        <button
          onClick={request}
          className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
          disabled={loading}
        >
          {loading
            ? "위치 불러오는 중…"
            : lat && lng
            ? "내 위치 새로고침"
            : "내 위치로 찾기"}
        </button>
      </div>
      {err && (
        <div className="text-xs text-red-600 mb-2">위치 오류: {err}</div>
      )}
      {lat && lng && (
        <div className="text-xs text-gray-500 mb-2">
          내 위치: {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => openBoth("약국")}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
        >
          약국 찾기 (네이버/카카오)
        </button>
        <button
          onClick={() => openBoth("이비인후과")}
          className="px-3 py-1.5 rounded-lg bg-white border text-sm"
        >
          이비인후과 찾기
        </button>
        <button
          onClick={() => openBoth("호흡기내과")}
          className="px-3 py-1.5 rounded-lg bg-white border text-sm"
        >
          호흡기내과 찾기
        </button>
        <button
          onClick={() => openBoth("응급실")}
          className="px-3 py-1.5 rounded-lg bg-white border text-sm"
        >
          응급실 찾기
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        * HTTPS 환경에서 위치 권한을 허용해야 정확한 검색이 가능합니다.
      </p>
    </div>
  );
}

// --- 홈 페이지 ---
export default function Home() {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-2">LFA QuickCheck 홈</h1>
      <p className="text-sm text-gray-600 mb-4">
        먼저 내 주변 약국·병원을 확인하고, 필요하면 키트 사진으로 결과를
        판독해 보세요.
      </p>

      <NearbyFinderHome />

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
