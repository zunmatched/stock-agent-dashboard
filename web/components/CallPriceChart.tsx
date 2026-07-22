"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InstitutionalFlow, PriceBar } from "@/lib/api";

export function CallPriceChart({
  priceWindow,
  institutionalWindow,
  recDate,
}: {
  priceWindow: PriceBar[];
  institutionalWindow: InstitutionalFlow[];
  recDate: string;
}) {
  const institutionalByDate = new Map(institutionalWindow.map((f) => [f.date, f]));

  const data = priceWindow.map((p) => {
    const flow = institutionalByDate.get(p.date);
    return {
      date: p.date,
      close: p.close,
      total_net: flow?.total_net ?? null,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="price" tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
        <YAxis yAxisId="flow" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <ReferenceLine yAxisId="price" x={recDate} stroke="#dc2626" strokeDasharray="4 2" label="call" />
        <Bar yAxisId="flow" dataKey="total_net" name="三大法人合計(張)" fill="#93c5fd" />
        <Line yAxisId="price" type="monotone" dataKey="close" name="收盤價" stroke="#4f46e5" dot={false} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
