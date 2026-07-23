from datetime import datetime

from pydantic import BaseModel


class JobStatus(BaseModel):
    job_name: str
    display_name: str
    expected_cadence: str
    last_run_at: datetime | None
    last_status: str | None
    last_duration_ms: int | None
    is_overdue: bool


class HealthOverview(BaseModel):
    jobs: list[JobStatus]
    overdue_count: int
    failing_count: int


class JobRun(BaseModel):
    run_at: datetime
    status: str
    duration_ms: int | None
    error_text: str | None


class NewsSourceRun(BaseModel):
    run_at: datetime
    source_counts: dict[str, int]
    zero_sources: list[str]
