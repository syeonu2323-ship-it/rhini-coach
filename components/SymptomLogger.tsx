"use client";
import React, { useState, useEffect } from "react";

type SymptomLog = { ts: number; text: string };
const KEY = "symptom_logs_v1";

export default function SymptomLogger() {
  const [text, setText] = useState("");
  const [logs, setLogs] = useState<SymptomLog[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setLogs(JSON.parse(raw));
  }, []);

  const save = () => {
    const newLog = { ts: Date.now(), text };
    const updated = [newLog, ...logs].slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(updated));
    setLogs(updated);
    setText("");
  };

  return (
    <div className="p-4 bg-rose-50 border rounded-2xl">
      <h2 className="font-semibold text-rose-700 mb-2">📝 증상 기록</h2>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full p-2 border rounded-md mb-2 text-sm"
        placeholder="현재 증상을 입력하세요."
      />
      <button onClick={save} className="px-4 py-2 bg-rose-600 text-white rounded-lg">기록</button>

      <div className="mt-3 text-sm text-gray-600">
        <h3 className="font-medium mb-1">📂 최근 기록</h3>
        {logs.map((l, i) => (
          <div key={i} className="mb-1">
            <div>{l.text}</div>
            <div className="text-xs">{new Date(l.ts).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
