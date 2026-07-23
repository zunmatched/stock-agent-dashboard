"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api, type PredictionAccuracyRow } from "@/lib/api";
import { DailyAnalysisList } from "@/components/DailyAnalysisList";

export default function DailyPage() {
  const [rows, setRows] = useState<PredictionAccuracyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.predictionAccuracy(90).then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="page">
      <h1>每日分析結果</h1>
      <p className="muted">
        每個交易日 08:00 盤前／18:30 收盤兩次 AI 分析的大盤方向判斷、信心與事後結算。這裡是摘要版
        （方向/信心/實際結果/判斷錯誤時的檢討），不含個股 call 的完整推理正文——那部分請看
        <Link href="/calls">決策稽核鏈</Link>。
      </p>

      {error && <p className="warning">讀取失敗：{error}</p>}
      {rows && <DailyAnalysisList rows={rows} />}
    </main>
  );
}
