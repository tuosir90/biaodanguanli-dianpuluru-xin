from __future__ import annotations

import argparse
import subprocess
from datetime import datetime

from browser_clients import fetch_eleme_online_count, fetch_meituan_online_count
from config import DEFAULT_BASE_URL, DEFAULT_SOURCE, WEB_DIR, ensure_runtime_dirs
from dev_server import ensure_server_ready, verify_web_env
from excel_store import append_online_shop_row


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="采集美团和饿了么在线店铺数并同步到当前项目")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--no-auto-start-dev", action="store_true")
    return parser.parse_args()


def format_shanghai_now() -> tuple[str, str]:
    now = datetime.now().astimezone()
    stat_date = now.strftime("%Y-%m-%d")
    captured_at = now.isoformat(timespec="seconds")
    return stat_date, captured_at


def upload_counts(
    base_url: str,
    stat_date: str,
    captured_at: str,
    meituan_count: int,
    eleme_count: int,
) -> None:
    command = [
        "npm.cmd",
        "run",
        "upload:online-shop-counts",
        "--",
        f"--baseUrl={base_url}",
        f"--date={stat_date}",
        f"--capturedAt={captured_at}",
        f"--source={DEFAULT_SOURCE}",
        f"--meituanCount={meituan_count}",
        f"--elemeCount={eleme_count}",
    ]
    result = subprocess.run(
        command,
        cwd=str(WEB_DIR),
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip())


def main() -> None:
    args = parse_args()
    ensure_runtime_dirs()

    print("开始采集美团在线店铺数...")
    meituan_count = fetch_meituan_online_count(headed=args.headed)
    print(f"美团在线店铺数：{meituan_count}")

    print("开始采集饿了么在线店铺数...")
    eleme_count = fetch_eleme_online_count(headed=args.headed)
    print(f"饿了么在线店铺数：{eleme_count}")

    stat_date, captured_at = format_shanghai_now()
    if args.dry_run:
        print("dry-run 模式，不写 Excel、不上传数据库")
        print(
            {
                "statDate": stat_date,
                "capturedAt": captured_at,
                "meituanCount": meituan_count,
                "elemeCount": eleme_count,
            }
        )
        return

    workbook_path = append_online_shop_row(
        stat_date=stat_date,
        meituan_count=meituan_count,
        eleme_count=eleme_count,
        captured_at_text=captured_at,
    )
    print(f"已追加写入 Excel：{workbook_path}")

    verify_web_env()
    ensure_server_ready(args.base_url, auto_start=not args.no_auto_start_dev)
    upload_counts(
        base_url=args.base_url,
        stat_date=stat_date,
        captured_at=captured_at,
        meituan_count=meituan_count,
        eleme_count=eleme_count,
    )
    print("已上传云数据库，对应页面可直接查看最新数据")


if __name__ == "__main__":
    main()
