"use client";

import { useEffect, useState } from "react";

import { api, type CallsSummary, type StockCall } from "@/lib/api";
import { CallsTable } from "@/components/CallsTable";
import { CallsSummaryTable } from "@/components/CallsSummaryTable";

export default function CallsPage() {
  const [calls, setCalls] = useState<StockCall[] | null>(null);
  const [summary, setSummary] = useState<CallsSummary | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.callsSummary().then(setSummary).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    api
      .listCalls({ status: status || undefined, limit: 50 })
      .then(setCalls)
      .catch((e: Error) => setError(e.message));
  }, [status]);

  return (
    <main className="page">
      <h1>決策稽核鏈</h1>
      <p className="muted">每一筆個股 call 的完整脈絡：進場理由、當時股價/籌碼、最終結果。</p>

      {error && <p className="warning">讀取失敗：{error}</p>}

      {summary && (
        <>
          <section>
            <h2>依類型統計（已結案）</h2>
            <CallsSummaryTable rows={summary.by_rec_type} groupLabel="類型" />
          </section>
          <section>
            <h2>依訊號標籤統計（已結案）</h2>
            <CallsSummaryTable rows={summary.by_signal_tag} groupLabel="標籤" />
          </section>
        </>
      )}

      <section>
        <h2>所有 Call</h2>
        <div className="filter-row">
          <label>
            狀態：
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">全部</option>
              <option value="open">未結案</option>
              <option value="closed">已結案</option>
            </select>
          </label>
        </div>
        {calls && <CallsTable calls={calls} />}
      </section>
    </main>
  );
}
