"use client";

import { Fragment, useState } from "react";

import type { PredictionAccuracyRow } from "@/lib/api";

export function PredictionAccuracyWidget({ rows }: { rows: PredictionAccuracyRow[] }) {
  const evaluated = rows.filter((r) => r.is_correct !== null);
  const correct = evaluated.filter((r) => r.is_correct).length;
  const rate = evaluated.length ? correct / evaluated.length : null;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>
      <p>
        近 {rows.length} 筆預測中，{evaluated.length} 筆已有結果
        {rate !== null && (
          <>
            ，準確率 <strong>{(rate * 100).toFixed(0)}%</strong>
          </>
        )}
        。
      </p>
      <div className="table-scroll">
        <table className="job-table prediction-table">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "42%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>日期</th>
              <th>時段</th>
              <th>預測</th>
              <th>信心</th>
              <th>實際</th>
              <th>結果</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((r, i) => {
              const key = `${r.trade_date}-${r.session}-${i}`;
              const isOpen = expanded.has(key);
              return (
                <Fragment key={key}>
                  <tr>
                    <td>{r.trade_date}</td>
                    <td>{r.session}</td>
                    <td>{r.predicted_direction ?? "—"}</td>
                    <td>{r.confidence ?? "—"}</td>
                    <td>{r.actual_direction ?? "尚未結算"}</td>
                    <td>
                      {r.is_correct === null ? (
                        <span className="badge badge-unknown">待定</span>
                      ) : r.is_correct ? (
                        r.review_note ? (
                          <span className="review-toggle-cell">
                            <span className="badge badge-ok-flawed">正確・過程有瑕疵</span>
                            <button
                              type="button"
                              className="review-toggle-btn"
                              onClick={() => toggle(key)}
                              aria-expanded={isOpen}
                            >
                              {isOpen ? "收合檢討 ▴" : "查看檢討 ▾"}
                            </button>
                          </span>
                        ) : (
                          <span className="badge badge-ok">正確</span>
                        )
                      ) : (
                        <span className="review-toggle-cell">
                          <span className="badge badge-failed">錯誤</span>
                          <button
                            type="button"
                            className="review-toggle-btn"
                            onClick={() => toggle(key)}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? "收合檢討 ▴" : "查看檢討 ▾"}
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {isOpen && (r.is_correct === false || (r.is_correct === true && r.review_note)) && (
                    <tr className="review-note-row">
                      <td colSpan={6}>
                        {r.review_note ? (
                          <>
                            <span className="review-note-label">檢討：</span>
                            {r.review_note}
                          </>
                        ) : (
                          <span className="muted">尚未補記失準原因與改進建議。</span>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
