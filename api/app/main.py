from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routers import calls, health

app = FastAPI(title="stock-agent-dashboard API")

app.include_router(health.router)
app.include_router(calls.router)


@app.get("/api/ping")
def ping():
    return {"ok": True}


# web/ 的 Next.js 靜態匯出（output: 'export'）— 跟 API 同一個 process/origin serve，不需要 CORS。
# 開發初期 web/out 可能還沒 build 出來，這裡不強制要求存在。
_WEB_DIST = Path(__file__).resolve().parents[2] / "web" / "out"
if _WEB_DIST.is_dir():
    app.mount("/", StaticFiles(directory=_WEB_DIST, html=True), name="web")
