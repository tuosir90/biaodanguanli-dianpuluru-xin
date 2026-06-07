"use client"

import * as React from "react"
import { Select as AntSelect } from "antd"

import { cn } from "@/lib/utils"

/**
 * 兼容原 shadcn (Radix) 的 Select 复合组件 API：
 *   <Select value onValueChange>
 *     <SelectTrigger><SelectValue placeholder /></SelectTrigger>
 *     <SelectContent>
 *       <SelectItem value="a">A</SelectItem>
 *     </SelectContent>
 *   </Select>
 *
 * 内部用 antd Select 渲染，通过遍历 children 收集 SelectItem 为 options。
 */

type SelectContextValue = {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  setPlaceholder: (p?: string) => void
  triggerClassName?: string
  setTriggerClassName: (c?: string) => void
  triggerSize?: "sm" | "default"
  setTriggerSize: (s?: "sm" | "default") => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

type Option = { value: string; label: React.ReactNode; disabled?: boolean }

// 从 children 树中提取 SelectItem
function collectOptions(children: React.ReactNode): Option[] {
  const options: Option[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const el = child as React.ReactElement<{
      value?: string
      children?: React.ReactNode
      disabled?: boolean
    }>
    const isItem =
      (el.type as { __isSelectItem?: boolean })?.__isSelectItem === true
    if (isItem && typeof el.props.value === "string") {
      options.push({
        value: el.props.value,
        label: el.props.children,
        disabled: el.props.disabled,
      })
    } else if (el.props?.children) {
      options.push(...collectOptions(el.props.children))
    }
  })
  return options
}

function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const [placeholder, setPlaceholder] = React.useState<string | undefined>()
  const [triggerClassName, setTriggerClassName] = React.useState<
    string | undefined
  >()
  const [triggerSize, setTriggerSize] = React.useState<
    "sm" | "default" | undefined
  >("default")
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue
  )

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const options = React.useMemo(() => collectOptions(children), [children])

  const handleChange = (val: string) => {
    if (!isControlled) setInternalValue(val)
    onValueChange?.(val)
  }

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange,
        disabled,
        placeholder,
        setPlaceholder,
        triggerClassName,
        setTriggerClassName,
        triggerSize,
        setTriggerSize,
      }}
    >
      {/* 渲染 children 以便 SelectTrigger / SelectContent 注册配置 */}
      <span style={{ display: "none" }}>{children}</span>
      <AntSelect
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        options={options.map((o) => ({
          value: o.value,
          label: o.label,
          disabled: o.disabled,
        }))}
        size={triggerSize === "sm" ? "small" : "middle"}
        className={cn("v0-ui-select", triggerClassName)}
        popupMatchSelectWidth={false}
        data-slot="select"
      />
    </SelectContext.Provider>
  )
}

// 注册触发器配置（className / size）到 context，不渲染额外 DOM
function SelectTrigger({
  className,
  size = "default",
  children,
}: {
  className?: string
  size?: "sm" | "default"
  children?: React.ReactNode
}) {
  const ctx = React.useContext(SelectContext)
  React.useEffect(() => {
    ctx?.setTriggerClassName(className)
    ctx?.setTriggerSize(size)
  }, [className, size, ctx])
  return <>{children}</>
}

// 注册 placeholder
function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)
  React.useEffect(() => {
    if (placeholder !== undefined) ctx?.setPlaceholder(placeholder)
  }, [placeholder, ctx])
  return null
}

// SelectContent 仅作为 SelectItem 的容器透传
function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

// SelectItem：被 collectOptions 通过 __isSelectItem 标记识别
function SelectItem({
  value,
  children,
  disabled,
}: {
  value: string
  children?: React.ReactNode
  disabled?: boolean
}) {
  void value
  void disabled
  return <>{children}</>
}
;(SelectItem as unknown as { __isSelectItem: boolean }).__isSelectItem = true

function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}
function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}
function SelectSeparator() {
  return null
}
function SelectScrollUpButton() {
  return null
}
function SelectScrollDownButton() {
  return null
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
