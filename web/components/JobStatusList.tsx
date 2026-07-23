import type { JobStatus } from "@/lib/api";

function StatusBadge({ job }: { job: JobStatus }) {
  if (job.last_status === null) {
    return <span className="badge badge-unknown">尚未有紀錄</span>;
  }
  if (job.last_status === "failed") {
    return <span className="badge badge-failed">失敗</span>;
  }
  if (job.is_overdue) {
    return <span className="badge badge-overdue">逾期</span>;
  }
  return <span className="badge badge-ok">正常</span>;
}

function formatDuration(ms: number | null) {
  if (ms === null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function formatTime(iso: string | null) {
  if (!iso) return "從未執行";
  return new Date(iso).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JobStatusList({ jobs }: { jobs: JobStatus[] }) {
  return (
    <div className="table-scroll">
      <table className="job-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>狀態</th>
            <th>最後執行</th>
            <th>耗時</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.job_name}>
              <td>{job.display_name}</td>
              <td>
                <StatusBadge job={job} />
              </td>
              <td>{formatTime(job.last_run_at)}</td>
              <td>{formatDuration(job.last_duration_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
