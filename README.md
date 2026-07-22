# stock-agent-dashboard

A read-only observability dashboard for [stock_agent](#about-stock_agent) — a private, always-on
system that runs ~28 scheduled data-collection jobs and an AI decision pipeline for Taiwan-market
equities. This repo is the public-facing half: a FastAPI service and a Next.js frontend that expose
curated, non-sensitive views into that system's health and track record.

**Status: work in progress.** Phase 1 (pipeline health dashboard) is live; the remaining phases
(decision audit trail, backtest/regime validation, supply-chain graph) are still being built.

## Why this exists

Most "stock dashboard" side projects wrap a price API and call it a day. This one is the public
surface of a system that:
- ingests from ~10 independent data sources (official exchange APIs, an options/futures feed, a
  memory-spot-price scraper, a forum-sentiment scraper, several news feeds) on a cron schedule
- turns a documented, versioned rule set into actual buy/sell/hold calls with entry/stop/target
  prices, then **automatically closes and scores every call** against the market benchmark
- validates those rules with an offline backtest engine before they're trusted, and re-validates
  them periodically to catch when a rule's edge decays in a new market regime

This repo is my attempt to make that discipline visible, not just claim it.

## Architecture

```
                     Postgres (production, localhost-only)
                            │
                     dashboard_ro role
              (SELECT-only, scoped to a `dashboard`
               schema of curated views — never the
               raw production tables)
                            │
                     ┌──────▼──────┐
                     │   FastAPI    │  api/
                     │ 127.0.0.1:8000
                     └──────┬──────┘
                            │  serves static export
                     ┌──────▼──────┐
                     │   Next.js    │  web/
                     └──────┬──────┘
                            │
                      Cloudflare Tunnel
                            │
                   https://dashboard.<domain>
```

This repo has **zero code coupling** to the private `stock_agent` codebase — no shared imports,
no submodule. The only integration point is a Postgres role scoped to read-only, curated SQL views.
Anyone cloning this repo can run it against their own seed data without ever touching my production
system or needing any of its credentials.

### What's deliberately excluded

Real position sizes, account balances, and personal financial context are not exposed anywhere in
the `dashboard` schema this API reads from — those live in tables this role has no grant on at all.

## About stock_agent

The private companion system this dashboard observes. It runs on a home server, tracks a watchlist
of Taiwan-listed stocks, and produces two daily AI-assisted analysis sessions (pre-market and
post-close) on top of ~28 scheduled Python jobs handling data collection, feature computation, and
recommendation lifecycle management. Not open source (contains personal trading data), but this
dashboard is how its engineering gets shown.

## Local development

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in a real DASHBOARD_DB_DSN
uvicorn app.main:app --reload --port 8000
```

`GET /api/health/overview`, `/api/health/jobs`, `/api/health/jobs/{job_name}/history`, and
`/api/health/news-sources` are live. Interactive API docs at `/docs`.

## Roadmap

- [x] Phase 1 — Pipeline health dashboard (job status, per-source news ingestion trends)
- [ ] Phase 2 — Decision audit trail (a call's full context: price window, institutional flow,
      the snapshot it was made from, and its eventual outcome)
- [ ] Phase 3 — Rule validation / regime trend (backtested edge over time per rule)
- [ ] Phase 4 — Supply-chain / ETF-membership graph visualization
