from __future__ import annotations

from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SKILL_DIR.parents[1]
WEB_DIR = REPO_ROOT / "web"
DATA_DIR = SKILL_DIR / "data"
LOG_DIR = SKILL_DIR / "logs"
BROWSER_STATE_DIR = DATA_DIR / "browser_states"
WORKBOOK_PATH = DATA_DIR / "在线店铺数统计.xlsx"
EXPECTED_MONGODB_PORT = "39056"
EXPECTED_MONGODB_DB_NAME = "test"

MEITUAN_URL = "https://partner.waimai.meituan.com/#/client/list"
ELEME_URL = "https://open.shop.ele.me/manager/agent/contract-list"

MEITUAN_LOCAL_STATE = BROWSER_STATE_DIR / "meituan_state.json"
ELEME_LOCAL_STATE = BROWSER_STATE_DIR / "eleme_state.json"

MEITUAN_FALLBACK_STATE = Path(
    r"F:\tuosir90-claude-code\美团饿了么解约数据统计\storage_state.json"
)
MEITUAN_FALLBACK_COOKIES = Path(
    r"F:\tuosir90-claude-code\美团饿了么解约数据统计\cookies.json"
)
ELEME_FALLBACK_STATE = Path(
    r"F:\tuosir90-claude-code\美团饿了么解约数据统计\饿了么解约数据统计\eleme_storage_state.json"
)

DEFAULT_VIEWPORT = {"width": 1440, "height": 900}
DEFAULT_LOCALE = "zh-CN"
DEFAULT_TIMEZONE = "Asia/Shanghai"
DEFAULT_BASE_URL = "http://localhost:3000"
DEFAULT_SOURCE = "online-shop-count-auto-sync"


def ensure_runtime_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    BROWSER_STATE_DIR.mkdir(parents=True, exist_ok=True)
