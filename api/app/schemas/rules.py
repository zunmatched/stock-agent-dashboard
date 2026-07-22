from datetime import date

from pydantic import BaseModel


class HistoricalStats(BaseModel):
    window: str
    sample_n: int
    win_rate: float
    expectancy_pct: float
    edge_vs_baseline: float
    verdict: str


class RuleSummary(BaseModel):
    rule_name: str
    display_name: str
    description: str
    historical: HistoricalStats
    regime_run_date: date | None
    regime_sample_n: int | None
    regime_win_rate: float | None
    regime_edge_vs_baseline: float | None


class RegimeHistoryPoint(BaseModel):
    run_date: date
    sample_n: int
    win_rate: float | None
    avg_excess: float | None
    edge_vs_baseline: float | None


class PredictionAccuracyRow(BaseModel):
    trade_date: date
    session: str
    predicted_direction: str | None
    confidence: float | None
    actual_direction: str | None
    is_correct: bool | None
