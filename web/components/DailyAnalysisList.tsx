"use client";

import { useMemo, useState } from "react";

import type { PredictionAccuracyRow } from "@/lib/api";

const DIRECTION_LABEL: Record<string, string> = {
  up: "↑ 偏多",
  down: "↓ 偏空",
  flat: "→ 持平",
};

const SESSION_ORDER: Record<string, number> = { "08:00": 0, "18:30": 1 };

const WEEKDAY_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

// 用 UTC 組日期避免字串直接丟給 Date() 解析時被當地時區偏移，算出錯誤的星期幾
function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return WEEKDAY_LABEL[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

const DATES_PER_PAGE = 10;

function ResultBadge({ row }: { row: PredictionAccuracyRow }) {
  if (row.is_correct === null) {
    return <span className="badge badge-unknown">尚未結算</span>;
  }
  if (row.is_correct) {
    return row.review_note ? (
      <span className="badge badge-ok-flawed">正確・過程有瑕疵</span>
    ) : (
      <span className="badge badge-ok">正確</span>
    );
  }
  return <span className="badge badge-failed">錯誤</span>;
}

function SessionCard({ row }: { row: PredictionAccuracyRow }) {
  const [showNote, setShowNote] = useState(false);
  const changeCls = (row.actual_change_pct ?? 0) >= 0 ? "positive" : "negative";

  return (
    <div className="daily-session-card">
      <div className="daily-session-head">
        <span className="badge badge-closed">{row.session}</span>
        {row.predicted_direction && (
          <strong>{DIRECTION_LABEL[row.predicted_direction] ?? row.predicted_direction}</strong>
        )}
        {row.confidence !== null && (
          <span className="muted">信心 {(row.confidence * 100).toFixed(0)}%</span>
        )}
        <ResultBadge row={row} />
        {row.actual_direction && (
          <span className="muted">
            實際：{DIRECTION_LABEL[row.actual_direction] ?? row.actual_direction}
            {row.actual_change_pct !== null && (
              <span className={changeCls}> {row.actual_change_pct.toFixed(2)}%</span>
            )}
          </span>
        )}
      </div>

      {row.prediction_text && <p className="daily-session-text">{row.prediction_text}</p>}

      {(row.is_correct === false || (row.is_correct === true && row.review_note)) && (
        <div className="review-toggle-cell">
          <button
            type="button"
            className="review-toggle-btn"
            onClick={() => setShowNote((v) => !v)}
            aria-expanded={showNote}
          >
            {showNote ? "收合檢討 ▴" : "查看檢討 ▾"}
          </button>
        </div>
      )}
      {(row.is_correct === false || (row.is_correct === true && row.review_note)) && showNote && (
        <p className="daily-session-text">
          {row.review_note ? (
            <>
              <span className="review-note-label">檢討：</span>
              {row.review_note}
            </>
          ) : (
            <span className="muted">尚未補記失準原因與改進建議。</span>
          )}
        </p>
      )}
    </div>
  );
}

function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="daily-pager">
      <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)}>
        ← 較新
      </button>
      <span className="muted">
        第 {page + 1} / {pageCount} 頁
      </span>
      <button type="button" disabled={page === pageCount - 1} onClick={() => onChange(page + 1)}>
        較舊 →
      </button>
    </div>
  );
}

export function DailyAnalysisList({ rows }: { rows: PredictionAccuracyRow[] }) {
  const [page, setPage] = useState(0);

  const byDate = useMemo(() => {
    const m = new Map<string, PredictionAccuracyRow[]>();
    for (const row of rows) {
      const list = m.get(row.trade_date) ?? [];
      list.push(row);
      m.set(row.trade_date, list);
    }
    return m;
  }, [rows]);

  const dates = useMemo(
    () => Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : -1)),
    [byDate]
  );

  if (dates.length === 0) {
    return <p className="muted">目前沒有分析紀錄。</p>;
  }

  const pageCount = Math.ceil(dates.length / DATES_PER_PAGE);
  const safePage = Math.min(page, pageCount - 1);
  const pagedDates = dates.slice(safePage * DATES_PER_PAGE, (safePage + 1) * DATES_PER_PAGE);

  return (
    <div>
      <Pager page={safePage} pageCount={pageCount} onChange={setPage} />
      {pagedDates.map((date) => {
        const sessions = [...byDate.get(date)!].sort(
          (a, b) => (SESSION_ORDER[a.session] ?? 99) - (SESSION_ORDER[b.session] ?? 99)
        );
        return (
          <section key={date} className="daily-date-group">
            <h2 className="daily-date-heading">
              {date} <span className="daily-weekday">週{weekdayLabel(date)}</span>
            </h2>
            {sessions.map((row) => (
              <SessionCard key={row.session} row={row} />
            ))}
          </section>
        );
      })}
      <Pager page={safePage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
