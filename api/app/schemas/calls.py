from datetime import date, datetime

from pydantic import BaseModel


class StockCall(BaseModel):
    id: int
    ticker: str
    ticker_name: str | None
    rec_date: date
    rec_type: str
    strength: str | None
    price_at_rec: float | None
    entry_low: float | None
    entry_high: float | None
    stop_loss: float | None
    target1: float | None
    target2: float | None
    closed_reason: str | None
    outcome_pct: float | None
    excess_return: float | None
    signal_tags: list[str] | None
    reward_risk_ratio: float | None
    horizon_days: int | None


class PriceBar(BaseModel):
    date: date
    open: float | None
    high: float | None
    low: float | None
    close: float | None
    volume: int | None
    change_pct: float | None


class InstitutionalFlow(BaseModel):
    date: date
    foreign_net: int | None
    trust_net: int | None
    dealer_net: int | None
    total_net: int | None


class IntradaySnapshot(BaseModel):
    trade_date: date
    session: str
    price: float | None
    open: float | None
    high: float | None
    low: float | None
    volume: int | None
    change_pct: float | None
    captured_at: datetime


class CallDetail(BaseModel):
    call: StockCall
    price_window: list[PriceBar]
    institutional_window: list[InstitutionalFlow]
    snapshots: list[IntradaySnapshot]


class CallSummaryRow(BaseModel):
    group: str
    n: int
    wins: int
    win_rate: float
    avg_outcome_pct: float | None
    avg_excess_return: float | None


class CallsSummary(BaseModel):
    by_rec_type: list[CallSummaryRow]
    by_signal_tag: list[CallSummaryRow]
