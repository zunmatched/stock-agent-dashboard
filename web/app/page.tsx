"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api, type HealthOverview, type NewsSourceRun } from "@/lib/api";
import { JobStatusList } from "@/components/JobStatusList";
import { NewsSourceChart } from "@/components/NewsSourceChart";

export default function HomePage() {
  const [overview, setOverview] = useState<HealthOverview | null>(null);
  const [newsSources, setNewsSources] = useState<NewsSourceRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.overview(), api.newsSources()])
      .then(([ov, ns]) => {
        setOverview(ov);
        setNewsSources(ns);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="page">
      <h1>stock_agent — 管線健康儀表板</h1>
      <p className="muted">
        一個私有台股分析系統的唯讀觀測面板：排程 job 是否正常執行、各新聞來源的抓取健康度。
      </p>
      <p>
        <Link href="/calls">→ 決策稽核鏈（個股 call 的完整脈絡與結果）</Link>
      </p>
      <p>
        <Link href="/rules">→ 規則驗證 / Regime 趨勢</Link>
      </p>
      <p>
        <Link href="/graph">→ 供應鏈 / ETF / 競爭 / 事件影響圖</Link>
      </p>

      {error && <p className="warning">讀取失敗：{error}</p>}

      {overview && (
        <>
          <section className="summary-row">
            <div className="stat-card">
              <span className="stat-number">{overview.jobs.length}</span>
              <span className="stat-label">追蹤中的 job</span>
            </div>
            <div className={`stat-card ${overview.overdue_count > 0 ? "stat-warn" : ""}`}>
              <span className="stat-number">{overview.overdue_count}</span>
              <span className="stat-label">逾期</span>
            </div>
            <div className={`stat-card ${overview.failing_count > 0 ? "stat-bad" : ""}`}>
              <span className="stat-number">{overview.failing_count}</span>
              <span className="stat-label">失敗</span>
            </div>
          </section>

          <section>
            <h2>Job 狀態</h2>
            <JobStatusList jobs={overview.jobs} />
          </section>
        </>
      )}

      {newsSources && (
        <section>
          <h2>新聞來源抓取趨勢</h2>
          <NewsSourceChart runs={newsSources} />
        </section>
      )}
    </main>
  );
}
