"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, type RegimeHistoryPoint, type RuleSummary } from "@/lib/api";

function RegimeStatus({ rule }: { rule: RuleSummary }) {
  if (rule.regime_sample_n === null) {
    return <p className="muted">新環境樣本外驗證：尚未開始追蹤。</p>;
  }
  if (rule.regime_sample_n === 0) {
    return (
      <p className="muted">
        新環境樣本外驗證（{rule.regime_run_date}）：0 筆觸發，樣本仍在累積中。
      </p>
    );
  }
  const decaying =
    rule.regime_edge_vs_baseline !== null && rule.regime_edge_vs_baseline < 0.3;
  return (
    <p className={decaying ? "warning" : ""}>
      新環境樣本外驗證（{rule.regime_run_date}）：{rule.regime_sample_n} 筆、
      勝率 {rule.regime_win_rate !== null ? `${(rule.regime_win_rate * 100).toFixed(0)}%` : "—"}、
      edge {rule.regime_edge_vs_baseline?.toFixed(2) ?? "—"}
      {decaying && "（低於衰退門檻 +0.3，需人工複查）"}
    </p>
  );
}

export function RuleCard({ rule }: { rule: RuleSummary }) {
  const [history, setHistory] = useState<RegimeHistoryPoint[] | null>(null);

  useEffect(() => {
    api.ruleHistory(rule.rule_name).then(setHistory).catch(() => setHistory([]));
  }, [rule.rule_name]);

  const h = rule.historical;

  return (
    <div className="rule-card">
      <h3>{rule.display_name}</h3>
      <p>{rule.description}</p>

      <div className="table-scroll">
        <table className="job-table">
          <tbody>
            <tr>
              <td>驗證期間</td>
              <td>{h.window}</td>
            </tr>
            <tr>
              <td>樣本 / 勝率</td>
              <td>
                {h.sample_n.toLocaleString()} 筆 / {(h.win_rate * 100).toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td>期望值 / vs Baseline</td>
              <td>
                {h.expectancy_pct.toFixed(2)}% / {h.edge_vs_baseline >= 0 ? "+" : ""}
                {h.edge_vs_baseline.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>判定</td>
              <td>{h.verdict}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <RegimeStatus rule={rule} />

      {history && history.some((p) => p.sample_n > 0) && (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="run_date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <ReferenceLine y={0.3} stroke="#f59e0b" strokeDasharray="4 2" label="衰退門檻" />
            <Line type="monotone" dataKey="edge_vs_baseline" stroke="#4f46e5" dot />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
