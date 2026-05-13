from __future__ import annotations

import os
import subprocess
import time
from pathlib import Path
from urllib.parse import urlparse

import requests

from config import (
    DEFAULT_BASE_URL,
    EXPECTED_MONGODB_DB_NAME,
    EXPECTED_MONGODB_PORT,
    LOG_DIR,
    WEB_DIR,
)

DEV_LOG_PATH = LOG_DIR / "online-shop-dev-server.log"


def _read_env_mongodb_uri(env_path: Path) -> str:
    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.startswith("MONGODB_URI="):
            return stripped.split("=", 1)[1].strip()
    raise RuntimeError("web/.env.local 中缺少 MONGODB_URI")


def _verify_mongodb_uri(uri: str, source: str) -> None:
    parsed = urlparse(uri)
    db_name = parsed.path.lstrip("/")

    if str(parsed.port or "") != EXPECTED_MONGODB_PORT:
        raise RuntimeError(f"{source} 中的 MONGODB_URI 不是 {EXPECTED_MONGODB_PORT} 端口")

    if db_name != EXPECTED_MONGODB_DB_NAME:
        raise RuntimeError(
            f"{source} 中的 MONGODB_URI 数据库名不是 {EXPECTED_MONGODB_DB_NAME}"
        )


def verify_web_env() -> None:
    env_path = WEB_DIR / ".env.local"
    if not env_path.exists():
        raise RuntimeError("未找到 web/.env.local，无法确认云数据库配置")

    env_uri = _read_env_mongodb_uri(env_path)
    _verify_mongodb_uri(env_uri, "web/.env.local")

    system_env_uri = os.environ.get("MONGODB_URI")
    if system_env_uri:
        _verify_mongodb_uri(system_env_uri, "系统环境变量 MONGODB_URI")


def _build_probe_urls(base_url: str) -> list[str]:
    month = time.strftime("%Y-%m")
    normalized = base_url.rstrip("/")
    return [normalized, f"{normalized}/api/online-shop-counts?month={month}"]


def is_server_ready(base_url: str = DEFAULT_BASE_URL) -> bool:
    for url in _build_probe_urls(base_url):
        try:
            response = requests.get(url, timeout=10)
            if response.ok or response.status_code < 500:
                return True
        except requests.RequestException:
            continue
    return False


def start_dev_server(base_url: str) -> subprocess.Popen[str]:
    parsed = urlparse(base_url)
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    command = ["npm.cmd" if os.name == "nt" else "npm", "run", "dev"]
    env = os.environ.copy()
    env["PORT"] = str(port)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file = DEV_LOG_PATH.open("a", encoding="utf-8")
    return subprocess.Popen(
        command,
        cwd=str(WEB_DIR),
        env=env,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        text=True,
    )


def ensure_server_ready(base_url: str, auto_start: bool) -> subprocess.Popen[str] | None:
    if is_server_ready(base_url):
        return None
    if not auto_start:
        raise RuntimeError("在线店铺数 API 不可达，且已禁用自动启动开发服务")

    process = start_dev_server(base_url)
    deadline = time.time() + 180
    while time.time() < deadline:
        if is_server_ready(base_url):
            return process
        time.sleep(2)
    raise RuntimeError("自动启动 web 开发服务超时，未能连通在线店铺数 API")
