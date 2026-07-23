"""
各 job 的預期執行週期（抄自 stock_agent 私有 repo 的 scheduler.py 排程設定，只留跟這個
dashboard 有追蹤的 8 個核心 job；這裡只需要「多久算逾期」的粗略數字，不需要精確 cron 表達式）。
"""

# job_name -> 預期最大間隔（小時），超過就視為逾期
EXPECTED_MAX_GAP_HOURS: dict[str, float] = {
    "news_update": 3,          # 平日 07-17 每小時一次，留一點緩衝
    "premarket": 30,           # 平日一天一次
    "opening": 30,
    "midday": 30,
    "daily_update": 30,
    "rec_closer": 30,
    "regime_check": 24 * 9,    # 每週五一次
    "backtest_refresh": 24 * 100,  # 每季一次
    # crontab 直接呼叫 claude CLI 的真正 AI 分析（scripts/run_analysis.sh），跟 scheduler.py
    # 追蹤的 job 是兩條不同路徑，2026-07-23 前完全沒被 dashboard 追蹤過
    "ai_premarket_analysis": 30,
    "ai_closing_analysis": 30,
}

JOB_DISPLAY_NAME: dict[str, str] = {
    # premarket/opening/midday 都只是排程自動推送的資料摘要（抓聚合資料+發 Telegram），
    # 不呼叫 AI——2026-07-23 曾被誤讀成「AI 盤前決策分析」耗時才774ms 很可疑，其實真正
    # 全天決策權重最高的那次 AI 分析是 crontab 直接呼叫 claude CLI（scripts/run_analysis.sh），
    # 跟這裡追蹤的 scheduler.py job 完全是兩條不同路徑，所以命名要避免用「預測/分析」字眼，
    # 真正的 AI 分析耗時另外用 ai_premarket_analysis/ai_closing_analysis 這兩個 job_name 追蹤
    "news_update": "新聞更新",
    "premarket": "08:00 盤前資料摘要",
    "opening": "09:30 開盤匯報",
    "midday": "11:30 盤中匯報",
    "daily_update": "16:10 每日資料更新",
    "rec_closer": "16:45 推薦結案",
    "regime_check": "新環境樣本外驗證",
    "backtest_refresh": "季度回測重跑",
    "ai_premarket_analysis": "08:00 AI 盤前決策分析",
    "ai_closing_analysis": "18:30 AI 收盤主分析",
}
