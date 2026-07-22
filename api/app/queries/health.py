from app.db import query


def latest_run_per_job() -> list[dict]:
    """每個 job_name 最新一筆執行紀錄。"""
    sql = """
        SELECT DISTINCT ON (job_name)
            job_name, run_at, status, duration_ms
        FROM dashboard.v_pipeline_runs
        ORDER BY job_name, run_at DESC
    """
    return query(sql)


def job_history(job_name: str, days: int) -> list[dict]:
    sql = """
        SELECT run_at, status, duration_ms, error_text
        FROM dashboard.v_pipeline_runs
        WHERE job_name = %s AND run_at >= NOW() - (%s || ' days')::interval
        ORDER BY run_at DESC
    """
    return query(sql, (job_name, days))


def news_source_runs(limit: int) -> list[dict]:
    sql = """
        SELECT run_at, detail
        FROM dashboard.v_pipeline_runs
        WHERE job_name = 'news_update' AND detail IS NOT NULL
        ORDER BY run_at DESC
        LIMIT %s
    """
    return query(sql, (limit,))
