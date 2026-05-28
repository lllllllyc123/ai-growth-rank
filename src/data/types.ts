// AI工具数据类型定义
export interface AITool {
  slug: string;
  name: string;
  url: string;
  description: string;
  category: Category;
  // 数据源映射
  githubStars?: number;
  githubRepo?: string;
  phSlug?: string;
  huggingfaceModel?: string;
  chromeExtensionId?: string;
  npmPackage?: string;
  dockerImage?: string;
  // 静态字段
  pricing: Pricing;
  foundedAt: string;
  country: string;
  tags: string[];
  // 以下为兼容旧数据，新评分系统不再使用
  monthlyVisits?: number;
  visitGrowth?: number;
  userRating?: number;
  redditSubreddit?: string;
  growthScore?: number;
  feedbackScore?: number;
  innovationScore?: number;
  totalScore?: number;
  trend?: string;
  rankChange?: number;
}

export type Category =
  | "ai-chat"
  | "ai-image"
  | "ai-video"
  | "ai-code"
  | "ai-audio"
  | "ai-writing"
  | "ai-search"
  | "ai-agent"
  | "ai-data"
  | "ai-other";

export const CATEGORY_LABELS: Record<Category, string> = {
  "ai-chat": "AI 对话",
  "ai-image": "AI 图像",
  "ai-video": "AI 视频",
  "ai-code": "AI 编程",
  "ai-audio": "AI 音频",
  "ai-writing": "AI 写作",
  "ai-search": "AI 搜索",
  "ai-agent": "AI Agent",
  "ai-data": "AI 数据分析",
  "ai-other": "其他",
};

export type Pricing = "free" | "freemium" | "paid" | "open-source";

export const PRICING_LABELS: Record<Pricing, string> = {
  free: "免费",
  freemium: "免费增值",
  paid: "付费",
  "open-source": "开源",
};
