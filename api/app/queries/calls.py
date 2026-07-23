from app.db import query


def list_calls(status: str | None, ticker: str | None, rec_type: str | None,
                limit: int) -> list[dict]:
    where = []
    params: list = []
    if status == "open":
        where.append("closed_reason IS NULL")
    elif status == "closed":
        where.append("closed_reason IS NOT NULL")
    if ticker:
        where.append("ticker = %s")
        params.append(ticker)
    if rec_type:
        where.append("rec_type = %s")
        params.append(rec_type)

    clause = f"WHERE {' AND '.join(where)}" if where else ""
    sql = f"""
        SELECT id, ticker, ticker_name, rec_date, rec_type, strength, price_at_rec,
               entry_low, entry_high, stop_loss, target1, target2,
               closed_reason, outcome_pct, excess_return, signal_tags,
               reward_risk_ratio, horizon_days
        FROM dashboard.v_stock_calls
        {clause}
        ORDER BY rec_date DESC, id DESC
        LIMIT %s
    """
    params.append(limit)
    return query(sql, tuple(params))


def get_call(call_id: int) -> dict | None:
    rows = query("SELECT * FROM dashboard.v_stock_calls WHERE id = %s", (call_id,))
    return rows[0] if rows else None


def price_window(ticker: str, center_date, n: int = 10) -> list[dict]:
    """center_date 前後各 n 個「有資料的交易日」（不是日曆天），前後兩段查詢再拼接，
    避免週末/假日讓固定日曆天窗口漏掉交易日。"""
    before = query(
        """
        SELECT date, open, high, low, close, volume, change_pct
        FROM dashboard.v_daily_prices
        WHERE ticker = %s AND date <= %s
        ORDER BY date DESC LIMIT %s
        """,
        (ticker, center_date, n),
    )
    after = query(
        """
        SELECT date, open, high, low, close, volume, change_pct
        FROM dashboard.v_daily_prices
        WHERE ticker = %s AND date > %s
        ORDER BY date ASC LIMIT %s
        """,
        (ticker, center_date, n),
    )
    return list(reversed(before)) + after


def institutional_window(ticker: str, center_date, n: int = 10) -> list[dict]:
    before = query(
        """
        SELECT date, foreign_net, trust_net, dealer_net, total_net
        FROM dashboard.v_institutional_flows
        WHERE ticker = %s AND date <= %s
        ORDER BY date DESC LIMIT %s
        """,
        (ticker, center_date, n),
    )
    after = query(
        """
        SELECT date, foreign_net, trust_net, dealer_net, total_net
        FROM dashboard.v_institutional_flows
        WHERE ticker = %s AND date > %s
        ORDER BY date ASC LIMIT %s
        """,
        (ticker, center_date, n),
    )
    return list(reversed(before)) + after


def snapshots_on(ticker: str, trade_date) -> list[dict]:
    """call 當天的盤中快照——_save_snapshot() 存的「當時 aggregator 看到的即時行情」。"""
    return query(
        """
        SELECT trade_date, session, price, open, high, low, volume, change_pct, captured_at
        FROM dashboard.v_intraday_snapshots
        WHERE ticker = %s AND trade_date = %s
        ORDER BY captured_at
        """,
        (ticker, trade_date),
    )


def calls_summary() -> list[dict]:
    """依 rec_type 分組的勝率/平均超額報酬（只算已結案的）。"""
    return query(
        """
        SELECT rec_type,
               COUNT(*) AS n,
               COUNT(*) FILTER (WHERE outcome_pct > 0) AS wins,
               ROUND(AVG(outcome_pct), 2) AS avg_outcome_pct,
               ROUND(AVG(excess_return), 2) AS avg_excess_return
        FROM dashboard.v_stock_calls
        WHERE closed_reason IS NOT NULL
        GROUP BY rec_type
        ORDER BY rec_type
        """
    )


def calls_summary_by_tag() -> list[dict]:
    """依 signal_tags 展開分組（一筆 call 可能有多個 tag，各自計入）。"""
    return query(
        """
        SELECT tag,
               COUNT(*) AS n,
               COUNT(*) FILTER (WHERE outcome_pct > 0) AS wins,
               ROUND(AVG(outcome_pct), 2) AS avg_outcome_pct,
               ROUND(AVG(excess_return), 2) AS avg_excess_return
        FROM dashboard.v_stock_calls, UNNEST(signal_tags) AS tag
        WHERE closed_reason IS NOT NULL
        GROUP BY tag
        ORDER BY tag
        """
    )
