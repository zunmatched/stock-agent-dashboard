"use client";

import { useEffect, useState } from "react";

import { api, type Graph } from "@/lib/api";
import { SupplyChainGraph } from "@/components/SupplyChainGraph";

const LEGEND: { label: string; color: string }[] = [
  { label: "Stock", color: "#4f46e5" },
  { label: "Company", color: "#0ea5e9" },
  { label: "ETF", color: "#16a34a" },
  { label: "Sector", color: "#ca8a04" },
  { label: "EventType", color: "#db2777" },
];

export default function GraphPage() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.graph().then(setGraph).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="page">
      <h1>供應鏈 / ETF / 競爭 / 事件影響圖</h1>
      <p className="muted">
        來自私有系統 Neo4j 圖資料庫的每日匯出快照（最多 24 小時舊）。這裡只顯示主動建立的
        關係（供應鏈、ETF 成分股、競爭替代、事件影響），刻意排除「同產業別」這種全市場兩兩配對
        （27,000+ 條邊，只是分類副產物，畫出來看不出任何洞見）。
      </p>

      <div className="legend-row">
        {LEGEND.map((l) => (
          <span key={l.label} className="legend-item">
            <span className="legend-dot" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {error && <p className="warning">讀取失敗：{error}</p>}
      {graph && (
        <>
          <p className="muted">
            {graph.nodes.length} 個節點、{graph.edges.length} 條關係。點擊節點或連線看詳細內容
            （事件影響類的連線會顯示強度與原因），可拖曳、滾輪縮放。
          </p>
          <SupplyChainGraph graph={graph} />
        </>
      )}
    </main>
  );
}
