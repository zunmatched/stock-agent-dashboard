from datetime import date

from fastapi import APIRouter, HTTPException

from app.queries import calls as q
from app.schemas.calls import (
    CallDetail,
    CallsSummary,
    CallSummaryRow,
    StockCall,
)

router = APIRouter(prefix="/api/calls", tags=["calls"])


def _to_summary_row(row: dict, group_key: str) -> CallSummaryRow:
    n = row["n"]
    wins = row["wins"]
    return CallSummaryRow(
        group=row[group_key],
        n=n,
        wins=wins,
        win_rate=round(wins / n, 3) if n else 0.0,
        avg_outcome_pct=row["avg_outcome_pct"],
        avg_excess_return=row["avg_excess_return"],
    )


@router.get("", response_model=list[StockCall])
def list_calls(
    status: str | None = None,
    ticker: str | None = None,
    rec_type: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    limit: int = 200,
):
    if status is not None and status not in ("open", "closed"):
        raise HTTPException(status_code=400, detail="status 只能是 open 或 closed")
    return q.list_calls(status, ticker, rec_type, from_date, to_date, limit)


@router.get("/summary", response_model=CallsSummary)
def summary(from_date: date | None = None, to_date: date | None = None):
    return CallsSummary(
        by_rec_type=[_to_summary_row(r, "rec_type") for r in q.calls_summary(from_date, to_date)],
        by_signal_tag=[_to_summary_row(r, "tag") for r in q.calls_summary_by_tag(from_date, to_date)],
    )


@router.get("/{call_id}", response_model=CallDetail)
def get_call(call_id: int):
    call = q.get_call(call_id)
    if call is None:
        raise HTTPException(status_code=404, detail=f"找不到 call id={call_id}")
    return CallDetail(
        call=call,
        price_window=q.price_window(call["ticker"], call["rec_date"]),
        institutional_window=q.institutional_window(call["ticker"], call["rec_date"]),
        snapshots=q.snapshots_on(call["ticker"], call["rec_date"]),
    )
