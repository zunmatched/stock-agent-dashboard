"""
獨立、專屬於這個 dashboard API 的連線池 — 只連 dashboard_ro 角色，跟正式 stock_agent
系統自己的連線池完全分開，不共用、不搶連線數。
"""
from contextlib import contextmanager

from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

from app.config import DASHBOARD_DB_DSN

_pool: ThreadedConnectionPool | None = None


def _get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(1, 5, dsn=DASHBOARD_DB_DSN)
    return _pool


@contextmanager
def get_conn():
    pool = _get_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)


def query(sql: str, params: tuple = ()) -> list[dict]:
    """SELECT-only helper：回傳 list[dict]。dashboard_ro 角色本身連 SELECT 以外的操作都會被
    Postgres 拒絕，這裡不另外做語句層級的白名單檢查。"""
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]
