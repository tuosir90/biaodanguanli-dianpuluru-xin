"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// 轻量 Label，沿用 AntD 排版（通过全局字体），保持原 API
function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("v0-ui-label", className)}
      {...props}
    />
  )
}

export { Label }
