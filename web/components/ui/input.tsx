"use client"

import * as React from "react"
import { Input as AntInput } from "antd"

import { cn } from "@/lib/utils"

// 兼容原 shadcn Input 的 API（原生 input 属性）
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // 密码框使用 antd 专用组件以获得显隐切换
  if (type === "password") {
    return (
      <AntInput.Password
        data-slot="input"
        className={cn("v0-ui-input", className)}
        {...(props as object)}
      />
    )
  }

  return (
    <AntInput
      type={type}
      data-slot="input"
      className={cn("v0-ui-input", className)}
      {...(props as object)}
    />
  )
}

export { Input }
