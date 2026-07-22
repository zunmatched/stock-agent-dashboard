"""
極簡設定 — 只需要一個唯讀 DB 連線字串，不依賴 stock_agent 私有 repo 的任何 secret。
"""
import os

from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv(usecwd=True))

DASHBOARD_DB_DSN = os.environ["DASHBOARD_DB_DSN"]
