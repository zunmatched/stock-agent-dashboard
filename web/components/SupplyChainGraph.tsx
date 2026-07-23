"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Graph } from "@/lib/api";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const LABEL_COLORS: Record<string, string> = {
  Stock: "#4f46e5",
  Company: "#0ea5e9",
  ETF: "#16a34a",
  Sector: "#ca8a04",
  EventType: "#db2777",
};

export function SupplyChainGraph({ graph }: { graph: Graph }) {
  const graphData = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.edges.map((e) => ({
        source: e.source_id,
        target: e.target_id,
        rel_type: e.rel_type,
        edge_label: e.edge_label,
      })),
    }),
    [graph]
  );

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
          return `${node.display_name}（${node.label}）`;
        }}
        nodeColor={(n: unknown) => LABEL_COLORS[(n as { label: string }).label] ?? "#9ca3af"}
        nodeRelSize={4}
        linkLabel={(l: unknown) => {
          const link = l as { rel_type: string; edge_label?: string };
          return link.edge_label ? `${link.rel_type}: ${link.edge_label}` : link.rel_type;
        }}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkColor={() => "rgba(148, 163, 184, 0.6)"}
      />
    </div>
  );
}
