// AI工具数据类型定义
export interface AITool {
  slug: string;
  name: string;
  url: string;
  description: string;
  category: Category;
  monthlyVisits: number;
  visitGrowth: number;
  userRating: number;
  githubStars?: number;
  githubRepo?: string;
  phSlug?: string;  // Product Hunt 产品页 slug，如 "chatgpt"
  huggingfaceModel?: string;  // "deepseek-ai/DeepSeek-V3"
  pricing: Pricing;
  foundedAt: string;
  country: string;
  growthScore: number;
  feedbackScore: number;
  innovationScore: number;
  totalScore: number;
  trend: "up" | "down" | "stable";
  rankChange?: number;
  tags: string[];
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
