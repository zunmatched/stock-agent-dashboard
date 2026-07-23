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

# job_name -> (起始時, 結束時) 台北時間平日內才會執行的時段（結束時是排他上界）。
# 2026-07-23 發現 news_update 這種「時段內每小時」的 job 用 EXPECTED_MAX_GAP_HOURS 的
# 固定緩衝（3小時）會在收盤後到隔天開盤前這段本來就不排程的空窗一路顯示假逾期警報。
# 有設定這個窗口的 job，逾期判斷改成「時段內用正常緩衝，時段外只看『最近一個已經過去的
# 平日時段開始時間』之後有沒有跑過」，不受夜間/週末空窗誤判；其餘只跑一天一次的 job
# 不用設定，直接用 EXPECTED_MAX_GAP_HOURS 的緩衝就足夠涵蓋一整天。
JOB_ACTIVE_WINDOW_HOURS: dict[str, tuple[int, int]] = {
    "news_update": (7, 18),
}

# job_name -> 人看得懂的預期執行頻率（不是 EXPECTED_MAX_GAP_HOURS 那個判斷逾期用的緩衝數字，
# 是實際排程週期本身），讓使用者一眼看出「今天沒更新」是正常還是有問題——
# 2026-07-23 使用者反映光看逾期燈號不夠，需要知道每個 job 本來多久跑一次
JOB_CADENCE_LABEL: dict[str, str] = {
    "news_update": "平日每小時一次（07-17點）",
    "premarket": "平日每天 08:00",
    "opening": "平日每天 09:30",
    "midday": "平日每天 11:30",
    "daily_update": "平日每天 16:10",
    "rec_closer": "平日每天 16:45",
    "regime_check": "每週五 17:00",
    "backtest_refresh": "每季一次（1/4/7/10月2日）",
    "ai_premarket_analysis": "平日每天 08:00",
    "ai_closing_analysis": "平日每天 18:30",
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
