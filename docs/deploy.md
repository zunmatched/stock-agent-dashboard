# 部署 runbook（草稿，尚未實際執行）

## 1. 建立獨立 OS 使用者（防護：萬一 API/依賴套件出問題不會碰到主帳號的 SSH key / stock_agent 的 .env）

```bash
sudo useradd -m -s /bin/bash dashboarduser
sudo -u dashboarduser git clone git@github.com:zunmatched/stock-agent-dashboard.git \
    /home/dashboarduser/stock-agent-dashboard
```

## 2. 建 Python venv + 安裝依賴

```bash
cd /home/dashboarduser/stock-agent-dashboard/api
sudo -u dashboarduser python3 -m venv .venv
sudo -u dashboarduser .venv/bin/pip install -r requirements.txt
```

## 3. 放 .env（DASHBOARD_DB_DSN，只有 dashboard_ro 帳密，見 stock_agent 私有 repo 的
   `db/dashboard_readonly.sql` 產生方式）

```bash
sudo -u dashboarduser tee /home/dashboarduser/stock-agent-dashboard/.env <<'EOF'
DASHBOARD_DB_DSN=postgresql://dashboard_ro:<實際密碼>@127.0.0.1:5432/stock_agent
EOF
```

## 4. 前端靜態匯出（web/ 完成後）

```bash
cd web && npm run build
# next.config.js 設 output: 'export'，匯出結果由 FastAPI 的 StaticFiles serve
```

## 5. systemd

```bash
sudo cp infra/dashboard-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now dashboard-api.service
```

## 6. Cloudflare Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create dashboard
cloudflared tunnel route dns dashboard dashboard.<你的網域>
# infra/cloudflared/config.yml 設定 ingress 指向 http://127.0.0.1:8000
sudo cloudflared service install
```

## 驗證

- `curl http://127.0.0.1:8000/api/ping` 本機正常
- 外部（行動網路，非家用 WiFi）連 `https://dashboard.<網域>` 正常
- 對家用 IP 掃 port 5432/7474/7687，確認全部 filtered/closed（Postgres/Neo4j 不該從外部連得到）
