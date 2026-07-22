from app.db import query


def latest_regime_snapshot() -> list[dict]:
    return query(
        """
        SELECT DISTINCT ON (rule_name)
            rule_name, run_date, sample_n, win_rate, avg_excess,
            expectancy, edge_vs_baseline, historical_edge
        FROM dashboard.v_regime_backtest
        ORDER BY rule_name, run_date DESC
        """
    )


def regime_history(rule_name: str) -> list[dict]:
    return query(
        """
        SELECT run_date, sample_n, win_rate, avg_excess, edge_vs_baseline
        FROM dashboard.v_regime_backtest
        WHERE rule_name = %s
        ORDER BY run_date ASC
        """,
        (rule_name,),
    )


def prediction_accuracy(days: int) -> list[dict]:
    return query(
        """
        SELECT trade_date, session, predicted_direction, confidence,
               actual_direction, is_correct
        FROM dashboard.v_prediction_accuracy
        WHERE trade_date >= CURRENT_DATE - %s
        ORDER BY trade_date DESC, session DESC
        """,
        (days,),
    )
