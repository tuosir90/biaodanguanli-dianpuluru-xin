"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { RECENT_SIGNED_REMINDER_MESSAGE } from "../recent-signed-reminder-message";

export function RecentSignedReminderCopyBox() {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopyReminderMessage() {
    try {
      await navigator.clipboard.writeText(RECENT_SIGNED_REMINDER_MESSAGE);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = RECENT_SIGNED_REMINDER_MESSAGE;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mb-4 rounded-xl border border-sky-200/70 bg-sky-50/70 p-4 dark:border-sky-800/40 dark:bg-sky-900/10">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-text-100">群发提醒话术</div>
          <p className="text-xs text-text-200">点击下方整段话术即可复制到剪切板</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            copied
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-white text-text-200 dark:bg-bg-100"
          }`}
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "已复制" : "点击复制"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => void handleCopyReminderMessage()}
        className="w-full rounded-xl border border-dashed border-sky-200 bg-white/90 px-4 py-3 text-left text-sm leading-7 text-text-100 transition hover:border-sky-300 hover:bg-white dark:border-sky-800/40 dark:bg-bg-100/80 dark:hover:border-sky-700/60"
        title="点击复制群发提醒话术"
      >
        {RECENT_SIGNED_REMINDER_MESSAGE}
      </button>
    </div>
  );
}
