import type { ProgressItem } from "./types";

export const ALL_OPERATORS = "__ALL__";
export const DETAIL_WINDOW_DAYS = 30;
export const DETAIL_PAGE_SIZE = 15;
export const PATROL_ALERT_PAGE_SIZE = 15;
export const WORKFLOW_BATCH_SIZE = 300;
export const RECENT_SIGNED_WINDOW_DAYS = 10;
export const RECENT_SIGNED_WINDOW_LABEL = `签约${RECENT_SIGNED_WINDOW_DAYS}天内`;
export const DAILY_PATROL_LABEL = "增加每日巡店（包含商家的要求和新的评价解释和发券）";

export const progressItems: ProgressItem[] = [
  { key: "market_plan", label: "市场调查四套方案" },
  { key: "category_opt", label: "分类栏优化" },
  { key: "image_pack", label: "图片三件套" },
  { key: "new_store_privilege", label: "开启新店特权" },
  { key: "window_display", label: "橱窗展示" },
  { key: "video_sign", label: "视频店招" },
  { key: "image_wall", label: "图片墙制作" },
  { key: "campaign_plan", label: "外卖活动方案" },
  { key: "dish_1_10", label: "菜品图（1-10张）" },
  { key: "dish_11_20", label: "菜品图（11-20张）" },
  { key: "dish_21_30", label: "菜品图（21-30张）" },
  { key: "dish_31_40", label: "菜品图（31-40张）" },
  { key: "dish_40_plus", label: "菜品图（40张以上）" },
  { key: "mt_detail", label: "美团外卖详情页图" },
  { key: "title_keyword", label: "标题关键词优化" },
  { key: "dish_desc", label: "菜品描述撰写" },
  { key: "review_appeal", label: "评价解释差评申诉" },
  { key: "brand_story", label: "美团品牌故事" },
  { key: "coupon_marketing", label: "精准营销发券" },
  { key: "weekly_report", label: "可视化数据周报分析" },
  { key: "store_score", label: "店铺分解析" },
  { key: "new_product", label: "新品上线" },
  { key: "paid_tuning", label: "付费调试" },
  { key: "store_analysis", label: "店铺数据分析" },
  { key: "daily_patrol", label: DAILY_PATROL_LABEL },
];

export const ELEME_HIDDEN_PROGRESS_KEYS = new Set([
  "video_sign",
  "image_wall",
  "mt_detail",
  "brand_story",
]);

export const FLOW_PROGRESS_ITEMS = progressItems.filter(
  (item) => item.key !== "daily_patrol"
);

export const ELEME_FLOW_PROGRESS_ITEMS = FLOW_PROGRESS_ITEMS.filter(
  (item) => !ELEME_HIDDEN_PROGRESS_KEYS.has(item.key)
);
