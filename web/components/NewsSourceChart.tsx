"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { NewsSourceRun } from "@/lib/api";

const COLORS = [
  "#4f46e5", "#0ea5e9", "#16a34a", "#ea580c",
  "#db2777", "#7c3aed", "#0891b2", "#ca8a04",
];

export function NewsSourceChart({ runs }: { runs: NewsSourceRun[] }) {
  if (runs.length === 0) {
    return <p className="muted">還沒有新聞來源執行紀錄。</p>;
  }

  const sourceNames = Array.from(
    new Set(runs.flatMap((r) => Object.keys(r.source_counts)))
  );

  const chartData = [...runs]
    .reverse()
    .map((r) => ({
      time: new Date(r.run_at).toLocaleString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      ...r.source_counts,
    }));

  const latestZero = runs[0]?.zero_sources ?? [];

  return (
    <div>
      {latestZero.length > 0 && (
        <p className="warning">
          ⚠️ 最近一次執行零筆來源：{latestZero.join("、")}
        </p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {sourceNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
