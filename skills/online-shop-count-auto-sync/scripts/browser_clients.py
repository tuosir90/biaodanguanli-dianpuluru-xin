from __future__ import annotations

import json
import re
from pathlib import Path

from playwright.sync_api import BrowserContext, Page, sync_playwright

from config import (
    DEFAULT_LOCALE,
    DEFAULT_TIMEZONE,
    DEFAULT_VIEWPORT,
    ELEME_FALLBACK_STATE,
    ELEME_LOCAL_STATE,
    ELEME_URL,
    MEITUAN_FALLBACK_COOKIES,
    MEITUAN_FALLBACK_STATE,
    MEITUAN_LOCAL_STATE,
    MEITUAN_URL,
)

MEITUAN_COUNT_PATTERN = re.compile(r"符合检索条件的数量：\s*(\d+)")
ELEME_COUNT_PATTERN = re.compile(r"共\s*(\d+)\s*条")


def _create_context(browser_type, state_path: Path | None, headed: bool) -> BrowserContext:
    browser = browser_type.launch(
        headless=not headed,
        ignore_default_args=["--enable-automation"],
        args=["--disable-blink-features=AutomationControlled"],
    )
    context_options = {
        "locale": DEFAULT_LOCALE,
        "timezone_id": DEFAULT_TIMEZONE,
        "viewport": DEFAULT_VIEWPORT,
    }
    if state_path and state_path.exists():
        context_options["storage_state"] = str(state_path)
    return browser.new_context(**context_options)


def _load_meituan_context(browser_type, headed: bool) -> BrowserContext:
    state_path = MEITUAN_LOCAL_STATE if MEITUAN_LOCAL_STATE.exists() else MEITUAN_FALLBACK_STATE
    context = _create_context(browser_type, state_path, headed)
    cookie_path = MEITUAN_FALLBACK_COOKIES
    if cookie_path.exists():
        with cookie_path.open("r", encoding="utf-8") as file:
            context.add_cookies(json.load(file))
    return context


def _load_eleme_context(browser_type, headed: bool) -> BrowserContext:
    state_path = ELEME_LOCAL_STATE if ELEME_LOCAL_STATE.exists() else ELEME_FALLBACK_STATE
    return _create_context(browser_type, state_path, headed)


def _extract_count(page: Page, pattern: re.Pattern[str]) -> int:
    text = page.locator("body").inner_text(timeout=10_000)
    matched = pattern.search(text)
    if not matched:
        raise RuntimeError("未找到数量文本")
    return int(matched.group(1))


def _ensure_not_login_page(page: Page, platform: str) -> None:
    current_url = page.url.lower()
    if "login" in current_url:
        raise RuntimeError(f"{platform} 登录态已失效，请先刷新登录状态")


def _persist_state(context: BrowserContext, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    context.storage_state(path=str(target))


def fetch_meituan_online_count(headed: bool = False) -> int:
    with sync_playwright() as playwright:
        context = _load_meituan_context(playwright.chromium, headed)
        try:
            page = context.new_page()
            page.goto(MEITUAN_URL, wait_until="domcontentloaded", timeout=60_000)
            page.wait_for_timeout(5_000)
            _ensure_not_login_page(page, "美团")
            page.locator(".client-top .filter-l .dropdown").first.click()
            page.wait_for_timeout(500)
            page.locator('.roo-popup .roo-dropdown-menu a[data-value="2"]').click()
            page.wait_for_timeout(500)
            page.get_by_role("button", name="查询").click()
            page.wait_for_timeout(5_000)
            count = _extract_count(page, MEITUAN_COUNT_PATTERN)
            _persist_state(context, MEITUAN_LOCAL_STATE)
            return count
        finally:
            context.close()


def fetch_eleme_online_count(headed: bool = False) -> int:
    with sync_playwright() as playwright:
        context = _load_eleme_context(playwright.chromium, headed)
        try:
            page = context.new_page()
            page.goto(ELEME_URL, wait_until="domcontentloaded", timeout=60_000)
            page.wait_for_timeout(5_000)
            _ensure_not_login_page(page, "饿了么")
            page.locator(".ant-select").filter(has_text="请输入合同状态").first.click()
            page.wait_for_timeout(500)
            page.locator(
                '.ant-select-dropdown .ant-select-item-option[title="生效中"]'
            ).click()
            page.wait_for_timeout(500)
            page.get_by_role("button", name=re.compile(r"^查\s*询$")).click()
            page.wait_for_timeout(6_000)
            count = _extract_count(page, ELEME_COUNT_PATTERN)
            _persist_state(context, ELEME_LOCAL_STATE)
            return count
        finally:
            context.close()
