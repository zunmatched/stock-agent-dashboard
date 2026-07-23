from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException

from app.job_cadence import (
    EXPECTED_MAX_GAP_HOURS,
    JOB_ACTIVE_WINDOW_HOURS,
    JOB_CADENCE_LABEL,
    JOB_DISPLAY_NAME,
)
from app.queries import health as q
from app.schemas.health import HealthOverview, JobRun, JobStatus, NewsSourceRun

router = APIRouter(prefix="/api/health", tags=["health"])

_TAIPEI = ZoneInfo("Asia/Taipei")


def _most_recent_window_start(now_taipei: datetime, start_hour: int) -> datetime:
    """最近一個已經過去、且落在平日的時段起始時間（不含週末）。"""
    candidate = now_taipei.replace(hour=start_hour, minute=0, second=0, microsecond=0)
    if now_taipei < candidate:
        candidate -= timedelta(days=1)
    while candidate.weekday() >= 5:  # 5=六, 6=日
        candidate -= timedelta(days=1)
    return candidate


def _is_overdue(job_name: str, last_run_at: datetime | None) -> bool:
    if last_run_at is None:
        return True
    max_gap = EXPECTED_MAX_GAP_HOURS.get(job_name)
    if max_gap is None:
        return False

    window = JOB_ACTIVE_WINDOW_HOURS.get(job_name)
    if window is not None:
        start_hour, end_hour = window
        now_taipei = datetime.now(_TAIPEI)
        if not (start_hour <= now_taipei.hour < end_hour):
            # 時段外（收盤後/週末）：只要最近一個已過去的平日時段開始後有跑過，就不算逾期，
            # 不用固定緩衝去量測跟現在的間隔（那段空窗本來就不排程）。
            window_start = _most_recent_window_start(now_taipei, start_hour)
            return last_run_at < window_start

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
            expected_cadence=JOB_CADENCE_LABEL.get(job_name, "—"),
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
