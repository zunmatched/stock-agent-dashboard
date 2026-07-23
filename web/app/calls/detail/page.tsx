"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { api, type CallDetail } from "@/lib/api";
import { CallPriceChart } from "@/components/CallPriceChart";

function DetailBody() {
  const params = useSearchParams();
  const id = params.get("id");
  const [detail, setDetail] = useState<CallDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.callDetail(Number(id)).then(setDetail).catch((e: Error) => setError(e.message));
  }, [id]);

  if (!id) return <p className="warning">缺少 id 參數。</p>;
  if (error) return <p className="warning">讀取失敗：{error}</p>;
  if (!detail) return <p className="muted">載入中…</p>;

  const { call } = detail;

  return (
    <>
      <h1>
        {call.ticker}
        {call.ticker_name ? ` ${call.ticker_name}` : ""} · {call.rec_type} · {call.rec_date}
      </h1>

      <section className="summary-row">
        <div className="stat-card">
          <span className="stat-number">{call.price_at_rec ?? "—"}</span>
          <span className="stat-label">建議當下股價</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{call.reward_risk_ratio ?? "—"}</span>
          <span className="stat-label">R:R</span>
        </div>
        <div className={`stat-card ${call.closed_reason ? "" : "stat-warn"}`}>
          <span className="stat-number">{call.closed_reason ?? "未結案"}</span>
          <span className="stat-label">
            {call.outcome_pct !== null ? `${call.outcome_pct.toFixed(2)}%` : "結果"}
          </span>
        </div>
      </section>

      <section>
        <h2>進場條件</h2>
        <div className="table-scroll">
          <table className="job-table">
            <tbody>
              <tr>
                <td>進場區間</td>
                <td>
                  {call.entry_low ?? "—"} ~ {call.entry_high ?? "—"}
                </td>
              </tr>
              <tr>
                <td>停損 / 目標</td>
                <td>
                  {call.stop_loss ?? "—"} / {call.target1 ?? "—"}
                </td>
              </tr>
              <tr>
                <td>訊號標籤</td>
                <td>{(call.signal_tags ?? []).join("、") || "—"}</td>
              </tr>
              <tr>
                <td>Horizon</td>
                <td>{call.horizon_days ?? "—"} 個交易日</td>
              </tr>
              {call.excess_return !== null && (
                <tr>
                  <td>超額報酬（vs TAIEX）</td>
                  <td>{call.excess_return.toFixed(2)}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>股價與三大法人（rec_date 前後各 10 個交易日）</h2>
        <CallPriceChart
          priceWindow={detail.price_window}
          institutionalWindow={detail.institutional_window}
          recDate={call.rec_date}
        />
      </section>

      {detail.snapshots.length > 0 && (
        <section>
          <h2>當天盤中快照</h2>
          <div className="table-scroll">
            <table className="job-table">
              <thead>
                <tr>
                  <th>時段</th>
                  <th>即時價</th>
                  <th>漲跌%</th>
                  <th>擷取時間</th>
                </tr>
              </thead>
              <tbody>
                {detail.snapshots.map((s) => (
                  <tr key={s.session}>
                    <td>{s.session}</td>
                    <td>{s.price ?? "—"}</td>
                    <td>{s.change_pct ?? "—"}</td>
                    <td>{new Date(s.captured_at).toLocaleTimeString("zh-TW")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

export default function CallDetailPage() {
  return (
    <main className="page">
      <p>
        <Link href="/calls">← 回 call 列表</Link>
      </p>
      <Suspense fallback={<p className="muted">載入中…</p>}>
        <DetailBody />
      </Suspense>
    </main>
  );
}
