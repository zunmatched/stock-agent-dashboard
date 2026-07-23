"use client";

import { useState } from "react";

import type { PredictionAccuracyRow } from "@/lib/api";

const DIRECTION_LABEL: Record<string, string> = {
  up: "↑ 偏多",
  down: "↓ 偏空",
  flat: "→ 持平",
};

const SESSION_ORDER: Record<string, number> = { "08:00": 0, "18:30": 1 };

function ResultBadge({ row }: { row: PredictionAccuracyRow }) {
  if (row.is_correct === null) {
    return <span className="badge badge-unknown">尚未結算</span>;
  }
  return row.is_correct ? (
    <span className="badge badge-ok">正確</span>
  ) : (
    <span className="badge badge-failed">錯誤</span>
  );
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

      {row.is_correct === false && (
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
      {row.is_correct === false && showNote && (
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

export function DailyAnalysisList({ rows }: { rows: PredictionAccuracyRow[] }) {
  if (rows.length === 0) {
    return <p className="muted">目前沒有分析紀錄。</p>;
  }

  const byDate = new Map<string, PredictionAccuracyRow[]>();
  for (const row of rows) {
    const list = byDate.get(row.trade_date) ?? [];
    list.push(row);
    byDate.set(row.trade_date, list);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div>
      {dates.map((date) => {
        const sessions = [...byDate.get(date)!].sort(
          (a, b) => (SESSION_ORDER[a.session] ?? 99) - (SESSION_ORDER[b.session] ?? 99)
        );
        return (
          <section key={date} className="daily-date-group">
            <h2 className="daily-date-heading">{date}</h2>
            {sessions.map((row) => (
              <SessionCard key={row.session} row={row} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
