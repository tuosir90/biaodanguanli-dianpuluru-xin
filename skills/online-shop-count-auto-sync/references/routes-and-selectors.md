# 在线店铺数采集路由与选择器

## 美团

### 页面路由

- 合同管理页：
  - `https://partner.waimai.meituan.com/#/client/list`

### 关键筛选

- `签约状态` 下拉：
  - `.client-top .filter-l .dropdown`
- `已签约` 选项：
  - `.roo-popup .roo-dropdown-menu a[data-value="2"]`
- `查询` 按钮：
  - `button:has-text("查询")`

### 结果文本

- 数量文案：
  - `符合检索条件的数量：925`
- 正则：
  - `符合检索条件的数量：\s*(\d+)`

## 饿了么

### 页面路由

- 管理后台首页：
  - `https://open.shop.ele.me/manager/base/home`
- 商家合同页：
  - `https://open.shop.ele.me/manager/agent/contract-list`

### 菜单关系

- 一级菜单：
  - `代运营`
- 二级菜单：
  - `客户管理`
- 子项：
  - `商家合同`

### 关键筛选

- `合同状态` 下拉：
  - `.ant-select` 且包含文本 `请输入合同状态`
- `生效中` 选项：
  - `.ant-select-dropdown .ant-select-item-option[title="生效中"]`
- `查询` 按钮：
  - 角色按钮，名称匹配 `查 询`

### 结果文本

- 数量文案：
  - `共 353 条`
- 正则：
  - `共\s*(\d+)\s*条`

## 说明

- 以上选择器已在真实页面上验证可用。
- 若平台前端升级导致类名变化，优先保留页面路由，重新定位筛选控件即可。
