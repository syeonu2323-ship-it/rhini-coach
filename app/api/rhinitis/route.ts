// app/api/rhinitis/route.ts
import { NextResponse } from "next/server";

type Inputs = {
  pm25?: number; humidity?: number; wind?: number; temp?: number;
  precipitation?: number; month?: number; pollenIndex?: number;
};

function computeRisk(input: Inputs) {
  const { pm25 = 10, humidity = 50, wind = 2, temp = 20, precipitation = 0, month = 5, pollenIndex = 0 } = input;
  const seasonWeight = [3,4,5,8,9,10].includes(month!) ? 0.5 : 0;
  const pmScore = Math.min(3, Math.max(0, (pm25 ?? 0) / 33));
  const humidityScore = (humidity! < 40 || humidity! > 70) ? 1.0 : 0.2;
  const windScore = (wind ?? 0) >= 5 ? 1.0 : 0.2;
  const rainRelief = (precipitation ?? 0) > 0 ? -0.8 : 0;
  const tempScore = (temp! >= 10 && temp! <= 28) ? 0.2 : 0.5;
  const pollenScore = (pollenIndex ?? 0) * (2/5); // UPI(0~5) -> 0~2
  const raw = pmScore + humidityScore + windScore + tempScore + pollenScore + seasonWeight + rainRelief;
  const score = Math.max(0, Math.min(5, Number(raw.toFixed(2))));
  const level = score < 1.5 ? "낮음" : score < 3.0 ? "보통" : score < 4.0 ? "높음" : "매우 높음";
  const tips: string[] = [];
  if (level !== "낮음") tips.push("외출 시 마스크 권장");
  if ((pm25 ?? 0) >= 35) tips.push("실내 공기청정기 가동");
  if ((pollenIndex ?? 0) >= 3) tips.push("귀가 후 세안/코세척");
  if (level === "높음" || level === "매우 높음") tips.push("항히스타민/INCS 상비 고려");
  return { score, level, tips };
}

// fetch 타임아웃(3초)
async function timeoutFetch(url: string, ms = 3000, init?: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function fetchWeather(lat: number, lon: number) {
  const w = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&forecast_days=3&timezone=auto`;
  const a = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&forecast_days=3&timezone=auto`;
  const [wRes, aRes] = await Promise.all([timeoutFetch(w), timeoutFetch(a)]);
  const [wJson, aJson] = await Promise.all([wRes.json(), aRes.json()]);
  return { wJson, aJson };
}

// (선택) Google Pollen — 키 없으면 null
async function fetchPollen(lat: number, lon: number) {
  const key = process.env.GCP_POLLEN_API_KEY;
  if (!key) return null;
  try {
    const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${key}`;
    const body = { location: { latitude: lat, longitude: lon } };
    const res = await timeoutFetch(url, 3000, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat") ?? "37.5665");
  const lon = Number(searchParams.get("lon") ?? "126.9780");
  const dayOffset = Math.max(0, Math.min(2, Number(searchParams.get("dayOffset") ?? "0"))); // 0/1/2

  const month = new Date().getMonth() + 1;
  // 기본값 (외부 막히면 이 값으로 계산)
  const defaults = { pm25: 18, humidity: 55, wind: 2.5, temp: 22, precipitation: 0, pollenIndex: 0 };

  let wJson: any = null, aJson: any = null, pollen: any = null;
  try {
    const out = await fetchWeather(lat, lon);
    wJson = out.wJson; aJson = out.aJson;
    pollen = await fetchPollen(lat, lon);
  } catch {}

  // dayOffset 해당 24시간 인덱스
  const start = dayOffset * 24;
  const hours = Array.from({ length: 24 }, (_, i) => i + start);
  const safe = (arr: any[] | undefined, i: number, def: number) =>
    (Array.isArray(arr) && arr[i] != null ? Number(arr[i]) : def);

  // 시간대별 꽃가루 UPI(0~5) 추정 — 구조가 지역/버전에 따라 다를 수 있어 최대값 사용
  const pollenUPI: number[] = (() => {
    if (!pollen) return hours.map(() => 0);
    try {
      // 예시: hourlyInfo[hour].pollenTypeInfo[*].indexInfo.value
      const h = pollen?.hourlyInfo ?? [];
      return hours.map(hh => {
        const v = h[hh]?.pollenTypeInfo?.map((x: any) => Number(x?.indexInfo?.value ?? 0)) ?? [];
        return v.length ? Math.max(...v) : 0;
      });
    } catch { return hours.map(() => 0); }
  })();

  // 시간별 위험 계산 → 평균
  const perHour = hours.map((h, idx) => computeRisk({
    pm25: safe(aJson?.hourly?.pm2_5, h, defaults.pm25),
    humidity: safe(wJson?.hourly?.relative_humidity_2m, h, defaults.humidity),
    wind: safe(wJson?.hourly?.wind_speed_10m, h, defaults.wind),
    temp: safe(wJson?.hourly?.temperature_2m, h, defaults.temp),
    precipitation: safe(wJson?.hourly?.precipitation, h, defaults.precipitation),
    pollenIndex: pollenUPI[idx] ?? 0,
    month,
  }));

  const avgScore = Number((perHour.reduce((s, r) => s + r.score, 0) / perHour.length).toFixed(2));
  const level = avgScore < 1.5 ? "낮음" : avgScore < 3.0 ? "보통" : avgScore < 4.0 ? "높음" : "매우 높음";
  const tips = perHour.at(-1)?.tips ?? [];

  return NextResponse.json({
    coords: { lat, lon }, dayOffset, basis: "hourly-avg-24h+pollen",
    risk: { score: avgScore, level, tips }
  });
}

