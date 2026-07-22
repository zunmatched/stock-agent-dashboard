"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api, type PredictionAccuracyRow, type RuleSummary } from "@/lib/api";
import { RuleCard } from "@/components/RuleCard";
import { PredictionAccuracyWidget } from "@/components/PredictionAccuracyWidget";

export default function RulesPage() {
  const [rules, setRules] = useState<RuleSummary[] | null>(null);
  const [accuracy, setAccuracy] = useState<PredictionAccuracyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.rules(), api.predictionAccuracy(30)])
      .then(([r, a]) => {
        setRules(r);
        setAccuracy(a);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="page">
      <p>
        <Link href="/">← 回管線健康</Link>
      </p>
      <h1>規則驗證 / Regime 趨勢</h1>
      <p className="muted">
        每條進場規則都先經過歷史回測驗證有正期望值才會被協議採用，之後定期在新的市場環境重新
        驗證，追蹤 edge 是否還在——不是驗證過一次就永遠相信。
      </p>

      {error && <p className="warning">讀取失敗：{error}</p>}

      {rules && (
        <section className="rule-grid">
          {rules.map((r) => (
            <RuleCard key={r.rule_name} rule={r} />
          ))}
        </section>
      )}

      <section>
        <h2>大盤方向預測準確率（近30天）</h2>
        <p className="muted">
          大盤方向只是分析輸出的 context，不是主要 KPI（主 KPI 是個股 call 的期望值，見
          <Link href="/calls">決策稽核鏈</Link>），但持續追蹤能看出模型有沒有系統性偏誤。
        </p>
        {accuracy && <PredictionAccuracyWidget rows={accuracy} />}
      </section>
    </main>
  );
}
