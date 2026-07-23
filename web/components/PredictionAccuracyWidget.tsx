import type { PredictionAccuracyRow } from "@/lib/api";

export function PredictionAccuracyWidget({ rows }: { rows: PredictionAccuracyRow[] }) {
  const evaluated = rows.filter((r) => r.is_correct !== null);
  const correct = evaluated.filter((r) => r.is_correct).length;
  const rate = evaluated.length ? correct / evaluated.length : null;

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
        <table className="job-table">
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
            {rows.slice(0, 12).map((r, i) => (
              <tr key={`${r.trade_date}-${r.session}-${i}`}>
                <td>{r.trade_date}</td>
                <td>{r.session}</td>
                <td>{r.predicted_direction ?? "—"}</td>
                <td>{r.confidence ?? "—"}</td>
                <td>{r.actual_direction ?? "尚未結算"}</td>
                <td>
                  {r.is_correct === null ? (
                    <span className="badge badge-unknown">待定</span>
                  ) : r.is_correct ? (
                    <span className="badge badge-ok">正確</span>
                  ) : (
                    <span className="badge badge-failed">錯誤</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
