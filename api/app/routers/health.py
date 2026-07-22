from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.job_cadence import EXPECTED_MAX_GAP_HOURS, JOB_DISPLAY_NAME
from app.queries import health as q
from app.schemas.health import HealthOverview, JobRun, JobStatus, NewsSourceRun

router = APIRouter(prefix="/api/health", tags=["health"])


def _is_overdue(job_name: str, last_run_at: datetime | None) -> bool:
    if last_run_at is None:
        return True
    max_gap = EXPECTED_MAX_GAP_HOURS.get(job_name)
    if max_gap is None:
        return False
    age_hours = (datetime.now(timezone.utc) - last_run_at).total_seconds() / 3600
    return age_hours > max_gap


def _build_job_statuses() -> list[JobStatus]:
    rows = {r["job_name"]: r for r in q.latest_run_per_job()}
    statuses = []
    for job_name, display_name in JOB_DISPLAY_NAME.items():
        row = rows.get(job_name)
        last_run_at = row["run_at"] if row else None
        statuses.append(JobStatus(
            job_name=job_name,
            display_name=display_name,
            last_run_at=last_run_at,
            last_status=row["status"] if row else None,
            last_duration_ms=row["duration_ms"] if row else None,
            is_overdue=_is_overdue(job_name, last_run_at),
        ))
    return statuses


@router.get("/overview", response_model=HealthOverview)
def overview():
    statuses = _build_job_statuses()
    return HealthOverview(
        jobs=statuses,
        overdue_count=sum(1 for s in statuses if s.is_overdue),
        failing_count=sum(1 for s in statuses if s.last_status == "failed"),
    )


@router.get("/jobs", response_model=list[JobStatus])
def jobs():
    return _build_job_statuses()


@router.get("/jobs/{job_name}/history", response_model=list[JobRun])
def job_history(job_name: str, days: int = 7):
    if job_name not in JOB_DISPLAY_NAME:
        raise HTTPException(status_code=404, detail=f"未追蹤的 job: {job_name}")
    return q.job_history(job_name, days)


@router.get("/news-sources", response_model=list[NewsSourceRun])
def news_sources(runs: int = 20):
    rows = q.news_source_runs(runs)
    return [
        NewsSourceRun(
            run_at=r["run_at"],
            source_counts=r["detail"].get("source_counts", {}),
            zero_sources=r["detail"].get("zero_sources", []),
        )
        for r in rows
    ]
