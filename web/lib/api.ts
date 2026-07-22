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
};
