from fastapi import APIRouter, HTTPException

from app.queries import rules as q
from app.rule_metadata import RULE_METADATA
from app.schemas.rules import (
    HistoricalStats,
    PredictionAccuracyRow,
    RegimeHistoryPoint,
    RuleSummary,
)

router = APIRouter(prefix="/api", tags=["rules"])


@router.get("/rules", response_model=list[RuleSummary])
def list_rules():
    snapshot_by_rule = {r["rule_name"]: r for r in q.latest_regime_snapshot()}
    out = []
    for rule_name, meta in RULE_METADATA.items():
        snap = snapshot_by_rule.get(rule_name)
        out.append(RuleSummary(
            rule_name=rule_name,
            display_name=meta["display_name"],
            description=meta["description"],
            historical=HistoricalStats(**meta["historical"]),
            regime_run_date=snap["run_date"] if snap else None,
            regime_sample_n=snap["sample_n"] if snap else None,
            regime_win_rate=snap["win_rate"] if snap else None,
            regime_edge_vs_baseline=snap["edge_vs_baseline"] if snap else None,
        ))
    return out


@router.get("/rules/{rule_name}/history", response_model=list[RegimeHistoryPoint])
def rule_history(rule_name: str):
    if rule_name not in RULE_METADATA:
        raise HTTPException(status_code=404, detail=f"未知規則: {rule_name}")
    return q.regime_history(rule_name)


@router.get("/prediction-accuracy", response_model=list[PredictionAccuracyRow])
def prediction_accuracy(days: int = 30):
    return q.prediction_accuracy(days)
