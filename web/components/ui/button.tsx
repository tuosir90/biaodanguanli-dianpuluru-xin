"use client"

import * as React from "react"
import { Button as AntButton } from "antd"
import type { ButtonProps as AntButtonProps } from "antd"

import { cn } from "@/lib/utils"

// 兼容原 shadcn Button API 的变体与尺寸定义
type Variant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
type Size =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg"

// 将 shadcn 变体映射到 antd 的 type / variant / color
function mapVariant(variant: Variant): Partial<AntButtonProps> {
  switch (variant) {
    case "default":
      return { type: "primary" }
    case "destructive":
      return { danger: true, type: "primary" }
    case "outline":
      return { type: "default" }
    case "secondary":
      return { type: "default" }
    case "ghost":
      return { type: "text" }
    case "link":
      return { type: "link" }
    default:
      return { type: "default" }
  }
}

function mapSize(size: Size): {
  antSize: AntButtonProps["size"]
  iconOnly: boolean
} {
  switch (size) {
    case "xs":
    case "sm":
    case "icon-xs":
    case "icon-sm":
      return { antSize: "small", iconOnly: size.startsWith("icon") }
    case "lg":
    case "icon-lg":
      return { antSize: "large", iconOnly: size.startsWith("icon") }
    case "icon":
      return { antSize: "middle", iconOnly: true }
    default:
      return { antSize: "middle", iconOnly: false }
  }
}

export type ButtonProps = Omit<
  React.ComponentProps<"button">,
  "type" | "color"
> & {
  variant?: Variant
  size?: Size
  asChild?: boolean
  htmlType?: AntButtonProps["htmlType"]
  type?: React.ComponentProps<"button">["type"]
  loading?: boolean
  icon?: React.ReactNode
  block?: boolean
}

// 用于将 className 风格信息保留作 data 属性（便于测试与样式覆盖）
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type,
  htmlType,
  children,
  ...props
}: ButtonProps) {
  const variantProps = mapVariant(variant)
  const { antSize, iconOnly } = mapSize(size)

  // asChild：用于包裹 <Link> 等元素，渲染为带样式的内联元素
  if (asChild) {
    return (
      <AntButton
        {...variantProps}
        size={antSize}
        shape={iconOnly ? "default" : undefined}
        data-variant={variant}
        data-size={size}
        className={cn("v0-ui-button", className)}
        // antd Button 支持以子元素作为内容
        {...(props as object)}
      >
        {children}
      </AntButton>
    )
  }

  // 原生 type（submit/reset/button）映射到 antd 的 htmlType
  const resolvedHtmlType: AntButtonProps["htmlType"] =
    htmlType ?? (type as AntButtonProps["htmlType"]) ?? "button"

  return (
    <AntButton
      {...variantProps}
      size={antSize}
      htmlType={resolvedHtmlType}
      shape={iconOnly ? "default" : undefined}
      data-variant={variant}
      data-size={size}
      className={cn("v0-ui-button", iconOnly && "v0-ui-button-icon", className)}
      {...(props as object)}
    >
      {children}
    </AntButton>
  )
}

export { Button }

// 兼容旧 API：部分组件（如 calendar）仍引用 buttonVariants 生成类名。
// 这里返回轻量的占位类名，保证类型与构建兼容。
export function buttonVariants(opts?: {
  variant?: Variant
  size?: Size
  className?: string
}): string {
  return cn("v0-ui-button", opts?.className)
}
