import type { CallSummaryRow } from "@/lib/api";

export function CallsSummaryTable({ rows, groupLabel }: { rows: CallSummaryRow[]; groupLabel: string }) {
  if (rows.length === 0) {
    return <p className="muted">還沒有已結案的 call 可以統計。</p>;
  }
  return (
    <div className="table-scroll">
      <table className="job-table">
        <thead>
          <tr>
            <th>{groupLabel}</th>
            <th>筆數</th>
            <th>勝率</th>
            <th>平均報酬</th>
            <th>平均超額報酬</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.group}>
              <td>{r.group}</td>
              <td>{r.n}</td>
              <td>{(r.win_rate * 100).toFixed(0)}%</td>
              <td>{r.avg_outcome_pct !== null ? `${r.avg_outcome_pct.toFixed(2)}%` : "—"}</td>
              <td>{r.avg_excess_return !== null ? `${r.avg_excess_return.toFixed(2)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
