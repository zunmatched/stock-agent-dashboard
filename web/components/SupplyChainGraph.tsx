"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Graph, GraphEdge, GraphNode } from "@/lib/api";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const LABEL_COLORS: Record<string, string> = {
  Stock: "#4f46e5",
  Company: "#0ea5e9",
  ETF: "#16a34a",
  Sector: "#ca8a04",
  EventType: "#db2777",
};

// 關係類型 → 顏色/中文說明，同時用來畫圖上的連線顏色跟下面的圖例，
// 讓「哪種關係」不用滑鼠精準停在細線上才看得到。
const EDGE_TYPE_META: Record<string, { label: string; color: string }> = {
  SUPPLIES_TO:     { label: "供應鏈",        color: "#2563eb" },
  COMPETES_WITH:   { label: "競爭",          color: "#dc2626" },
  CAN_REPLACE:     { label: "可替代",        color: "#ea580c" },
  HOLDS:           { label: "ETF 持股",      color: "#16a34a" },
  BELONGS_TO:      { label: "所屬產業",      color: "#9ca3af" },
  IMPACTS_SECTOR:  { label: "事件影響產業",  color: "#db2777" },
  IMPACTS_STOCK:   { label: "事件影響個股",  color: "#9333ea" },
  MENTIONS_SUPPLY: { label: "新聞提及（弱關係）", color: "#94a3b8" },
};

type SelectedNode = { kind: "node"; node: GraphNode };
type SelectedEdge = { kind: "edge"; edge: GraphEdge };
type Selected = SelectedNode | SelectedEdge;

export function SupplyChainGraph({ graph }: { graph: Graph }) {
  const nodesById = useMemo(() => {
    const m = new Map<string, GraphNode>();
    graph.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [graph]);

  const graphData = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.edges.map((e) => ({ ...e, source: e.source_id, target: e.target_id })),
    }),
    [graph]
  );

  const [selected, setSelected] = useState<Selected | null>(null);

  // react-force-graph-2d 沒給 width 時是用 window 尺寸，不會乖乖跟著容器寬度走，
  // 這會讓這一頁的實際版面比其他頁面寬（頁面寬度忽寬忽窄的元凶）。改用 ResizeObserver
  // 量容器實際寬度，強制它跟其他頁面一樣受 .page 的 max-width 約束。
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div className="legend-row">
        {Object.entries(EDGE_TYPE_META).map(([relType, meta]) => (
          <span key={relType} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: meta.color, borderRadius: "2px", width: "1rem", height: "0.2rem" }}
            />
            {meta.label}
          </span>
        ))}
      </div>

      <div
        ref={containerRef}
        style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden" }}
      >
        <ForceGraph2D
          graphData={graphData}
          width={width || undefined}
          height={520}
          nodeId="id"
          // react-force-graph-2d's accessor generics don't survive next/dynamic's inference,
          // so these callbacks are typed loosely against the shape we know graphData has.
          nodeLabel={(n: unknown) => {
            const node = n as { display_name: string; label: string };
            return `${node.display_name}（${node.label}）— 點擊看詳細`;
          }}
          nodeColor={(n: unknown) => LABEL_COLORS[(n as { label: string }).label] ?? "#9ca3af"}
          nodeRelSize={4}
          linkLabel={(l: unknown) => {
            const link = l as GraphEdge;
            const meta = EDGE_TYPE_META[link.rel_type];
            return `${meta?.label ?? link.rel_type}${link.edge_label ? "：" + link.edge_label : ""} — 點擊看詳細`;
          }}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkColor={(l: unknown) => {
            const link = l as GraphEdge;
            return EDGE_TYPE_META[link.rel_type]?.color ?? "rgba(148, 163, 184, 0.6)";
          }}
          linkWidth={(l: unknown) => {
            const link = l as GraphEdge;
            return link.magnitude ? 1 + link.magnitude : 1.5;
          }}
          onNodeClick={(n: unknown) => {
            const node = n as GraphNode;
            setSelected({ kind: "node", node });
          }}
          onLinkClick={(l: unknown) => {
            const link = l as GraphEdge;
            setSelected({ kind: "edge", edge: link });
          }}
          onBackgroundClick={() => setSelected(null)}
        />
      </div>

      {selected && (
        <DetailPanel
          selected={selected}
          nodesById={nodesById}
          edges={graph.edges}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function DetailPanel({
  selected,
  nodesById,
  edges,
  onClose,
}: {
  selected: Selected;
  nodesById: Map<string, GraphNode>;
  edges: GraphEdge[];
  onClose: () => void;
}) {
  return (
    <div className="graph-detail-panel">
      <button type="button" className="graph-detail-close" onClick={onClose} aria-label="關閉">
        ✕
      </button>
      {selected.kind === "node" ? (
        <NodeDetail node={selected.node} nodesById={nodesById} edges={edges} />
      ) : (
        <EdgeDetail edge={selected.edge} nodesById={nodesById} />
      )}
    </div>
  );
}

function NodeDetail({
  node,
  nodesById,
  edges,
}: {
  node: GraphNode;
  nodesById: Map<string, GraphNode>;
  edges: GraphEdge[];
}) {
  const related = edges.filter((e) => e.source_id === node.id || e.target_id === node.id);
  return (
    <div>
      <p>
        <strong>{node.display_name}</strong>{" "}
        <span className="muted">（{node.label}）</span>
      </p>
      {related.length > 0 && (
        <ul className="graph-detail-related">
          {related.map((e, i) => {
            const outgoing = e.source_id === node.id;
            const other = nodesById.get(outgoing ? e.target_id : e.source_id);
            const meta = EDGE_TYPE_META[e.rel_type];
            return (
              <li key={i}>
                {outgoing ? "→" : "←"}{" "}
                <span style={{ color: meta?.color ?? "#6b7280" }}>{meta?.label ?? e.rel_type}</span>
                {" "}
                {other?.display_name ?? (outgoing ? e.target_id : e.source_id)}
                {e.edge_label ? `（${e.edge_label}）` : ""}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EdgeDetail({ edge, nodesById }: { edge: GraphEdge; nodesById: Map<string, GraphNode> }) {
  const meta = EDGE_TYPE_META[edge.rel_type];
  const src = nodesById.get(edge.source_id);
  const dst = nodesById.get(edge.target_id);
  return (
    <div>
      <p>
        <strong>{src?.display_name ?? edge.source_id}</strong>
        {" → "}
        <span style={{ color: meta?.color ?? "#6b7280", fontWeight: 600 }}>
          {meta?.label ?? edge.rel_type}
        </span>
        {" → "}
        <strong>{dst?.display_name ?? edge.target_id}</strong>
      </p>
      {edge.edge_label && (
        <p>
          <span className="review-note-label">標籤：</span>
          {edge.edge_label}
        </p>
      )}
      {edge.magnitude !== null && (
        <p>
          <span className="review-note-label">強度：</span>
          {"★".repeat(edge.magnitude)}
          {"☆".repeat(Math.max(0, 3 - edge.magnitude))}
        </p>
      )}
      {edge.rationale && (
        <p>
          <span className="review-note-label">說明：</span>
          {edge.rationale}
        </p>
      )}
    </div>
  );
}
