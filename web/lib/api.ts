const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export type JobStatus = {
  job_name: string;
  display_name: string;
  last_run_at: string | null;
  last_status: "success" | "failed" | null;
  last_duration_ms: number | null;
  is_overdue: boolean;
};

export type HealthOverview = {
  jobs: JobStatus[];
  overdue_count: number;
  failing_count: number;
};

export type JobRun = {
  run_at: string;
  status: string;
  duration_ms: number | null;
  error_text: string | null;
};

export type NewsSourceRun = {
  run_at: string;
  source_counts: Record<string, number>;
  zero_sources: string[];
};

export type StockCall = {
  id: number;
  ticker: string;
  rec_date: string;
  rec_type: string;
  strength: string | null;
  price_at_rec: number | null;
  entry_low: number | null;
  entry_high: number | null;
  stop_loss: number | null;
  target1: number | null;
  target2: number | null;
  closed_reason: string | null;
  outcome_pct: number | null;
  excess_return: number | null;
  signal_tags: string[] | null;
  reward_risk_ratio: number | null;
  horizon_days: number | null;
};

export type PriceBar = {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  change_pct: number | null;
};

export type InstitutionalFlow = {
  date: string;
  foreign_net: number | null;
  trust_net: number | null;
  dealer_net: number | null;
  total_net: number | null;
};

export type IntradaySnapshot = {
  trade_date: string;
  session: string;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  change_pct: number | null;
  captured_at: string;
};

export type CallDetail = {
  call: StockCall;
  price_window: PriceBar[];
  institutional_window: InstitutionalFlow[];
  snapshots: IntradaySnapshot[];
};

export type CallSummaryRow = {
  group: string;
  n: number;
  wins: number;
  win_rate: number;
  avg_outcome_pct: number | null;
  avg_excess_return: number | null;
};

export type CallsSummary = {
  by_rec_type: CallSummaryRow[];
  by_signal_tag: CallSummaryRow[];
};

export type HistoricalStats = {
  window: string;
  sample_n: number;
  win_rate: number;
  expectancy_pct: number;
  edge_vs_baseline: number;
  verdict: string;
};

export type RuleSummary = {
  rule_name: string;
  display_name: string;
  description: string;
  historical: HistoricalStats;
  regime_run_date: string | null;
  regime_sample_n: number | null;
  regime_win_rate: number | null;
  regime_edge_vs_baseline: number | null;
};

export type RegimeHistoryPoint = {
  run_date: string;
  sample_n: number;
  win_rate: number | null;
  avg_excess: number | null;
  edge_vs_baseline: number | null;
};

export type GraphNode = {
  id: string;
  label: string;
  display_name: string;
};

export type GraphEdge = {
  source_id: string;
  target_id: string;
  rel_type: string;
  edge_label: string | null;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type PredictionAccuracyRow = {
  trade_date: string;
  session: string;
  predicted_direction: string | null;
  confidence: number | null;
  actual_direction: string | null;
  is_correct: boolean | null;
};

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`${path} → HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  overview: () => getJSON<HealthOverview>("/api/health/overview"),
  jobHistory: (jobName: string, days = 7) =>
    getJSON<JobRun[]>(`/api/health/jobs/${jobName}/history?days=${days}`),
  newsSources: (runs = 20) =>
    getJSON<NewsSourceRun[]>(`/api/health/news-sources?runs=${runs}`),
  listCalls: (params: { status?: string; ticker?: string; rec_type?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.ticker) qs.set("ticker", params.ticker);
    if (params.rec_type) qs.set("rec_type", params.rec_type);
    qs.set("limit", String(params.limit ?? 50));
    return getJSON<StockCall[]>(`/api/calls?${qs.toString()}`);
  },
  callDetail: (id: number) => getJSON<CallDetail>(`/api/calls/${id}`),
  callsSummary: () => getJSON<CallsSummary>("/api/calls/summary"),
  rules: () => getJSON<RuleSummary[]>("/api/rules"),
  ruleHistory: (ruleName: string) =>
    getJSON<RegimeHistoryPoint[]>(`/api/rules/${encodeURIComponent(ruleName)}/history`),
  predictionAccuracy: (days = 30) =>
    getJSON<PredictionAccuracyRow[]>(`/api/prediction-accuracy?days=${days}`),
  graph: () => getJSON<Graph>("/api/graph"),
};
