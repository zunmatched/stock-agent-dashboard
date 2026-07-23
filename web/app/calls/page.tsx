"use client";

import { useEffect, useState } from "react";

import { api, type CallsSummary, type CallSummaryRow, type StockCall } from "@/lib/api";
import { CallsTable } from "@/components/CallsTable";
import { CallsSummaryTable } from "@/components/CallsSummaryTable";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toISODate(d);
}

function briefSummary(rows: CallSummaryRow[]): string {
  if (rows.length === 0) return "區間內尚無已結案資料。";
  return rows
    .map((r) => `${r.group} ${r.n}筆・${(r.win_rate * 100).toFixed(0)}%勝率`)
    .join("　｜　");
}

function CollapsibleSummary({
  title,
  rows,
  groupLabel,
}: {
  title: string;
  rows: CallSummaryRow[];
  groupLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <h2>{title}</h2>
      <p className="muted">
        {briefSummary(rows)}{" "}
        <button
          type="button"
          className="review-toggle-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "收合 ▴" : "展開完整表格 ▾"}
        </button>
      </p>
      {open && <CallsSummaryTable rows={rows} groupLabel={groupLabel} />}
    </section>
  );
}

export default function CallsPage() {
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(toISODate(new Date()));
  const [calls, setCalls] = useState<StockCall[] | null>(null);
  const [summary, setSummary] = useState<CallsSummary | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .callsSummary({ from_date: fromDate || undefined, to_date: toDate || undefined })
      .then(setSummary)
      .catch((e: Error) => setError(e.message));
  }, [fromDate, toDate]);

  useEffect(() => {
    api
      .listCalls({
        status: status || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      })
      .then(setCalls)
      .catch((e: Error) => setError(e.message));
  }, [status, fromDate, toDate]);

  return (
    <main className="page">
      <h1>決策稽核鏈</h1>
      <p className="muted">每一筆個股 call 的完整脈絡：進場理由、當時股價/籌碼、最終結果。</p>

      <div className="filter-row">
        <label>
          從：
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>{" "}
        <label>
          到：
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>{" "}
        <span className="muted">（預設近 30 天）</span>
      </div>

      {error && <p className="warning">讀取失敗：{error}</p>}

      {summary && (
        <>
          <CollapsibleSummary title="依類型統計（已結案）" rows={summary.by_rec_type} groupLabel="類型" />
          <CollapsibleSummary
            title="依訊號標籤統計（已結案）"
            rows={summary.by_signal_tag}
            groupLabel="標籤"
          />
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
