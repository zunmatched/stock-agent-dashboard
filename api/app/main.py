from fastapi import FastAPI

from app.routers import health

app = FastAPI(title="stock-agent-dashboard API")

app.include_router(health.router)


@app.get("/api/ping")
def ping():
    return {"ok": True}
