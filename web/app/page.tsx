"use client";

import { useEffect, useState } from "react";

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
          <h2>新聞來源每次抓取筆數</h2>
          <p className="muted">
            每個來源這次抓取「回傳了幾筆」（多數來源固定回傳最新一頁，筆數本來就會穩定不變），
            重點是看有沒有某個來源掉到 0——那才是來源真的掛掉的訊號，不是用來看新聞量趨勢的。
          </p>
          <NewsSourceChart runs={newsSources} />
        </section>
      )}
    </main>
  );
}
