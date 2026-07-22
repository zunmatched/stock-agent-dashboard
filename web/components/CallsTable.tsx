import Link from "next/link";

import type { StockCall } from "@/lib/api";

function RecTypeBadge({ recType }: { recType: string }) {
  return <span className={`badge badge-rec-${recType}`}>{recType}</span>;
}

function OutcomeCell({ call }: { call: StockCall }) {
  if (!call.closed_reason) {
    return <span className="badge badge-unknown">open</span>;
  }
  const cls = (call.outcome_pct ?? 0) >= 0 ? "positive" : "negative";
  return (
    <span>
      <span className="badge badge-closed">{call.closed_reason}</span>{" "}
      {call.outcome_pct !== null && (
        <span className={cls}>{call.outcome_pct.toFixed(2)}%</span>
      )}
    </span>
  );
}

export function CallsTable({ calls }: { calls: StockCall[] }) {
  if (calls.length === 0) {
    return <p className="muted">沒有符合條件的 call。</p>;
  }
  return (
    <table className="job-table">
      <thead>
        <tr>
          <th>日期</th>
          <th>代號</th>
          <th>類型</th>
          <th>訊號</th>
          <th>結果</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {calls.map((c) => (
          <tr key={c.id}>
            <td>{c.rec_date}</td>
            <td>{c.ticker}</td>
            <td>
              <RecTypeBadge recType={c.rec_type} />
            </td>
            <td className="muted">{(c.signal_tags ?? []).join(", ")}</td>
            <td>
              <OutcomeCell call={c} />
            </td>
            <td>
              <Link href={`/calls/detail?id=${c.id}`}>細節 →</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
