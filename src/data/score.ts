// 全自动评分引擎 —— 所有数据来自 auto-data.json，零手动维护
import autoData from "./auto-data.json";

type Entry = {
  githubStars?: number;
  phVotes?: number;
  phReviews?: number;
  hfLikes?: number;
  hfDownloads?: number;
  chromeUsers?: number;
};

type AutoEntries = Record<string, Entry>;

function getEntries(): AutoEntries {
  return (autoData as { entries?: AutoEntries }).entries ?? {};
}

// 归一化到 0-100（用对数压缩极端值）
function normalizeLog(value: number, max: number): number {
  if (value <= 0) return 0;
  const logVal = Math.log10(value + 1);
  const logMax = Math.log10(max + 1);
  return Math.min(100, (logVal / logMax) * 100);
}

// 计算所有工具的热度分
export function computeAllScores(): Record<string, number> {
  const entries = getEntries();
  const slugs = Object.keys(entries);
  if (slugs.length === 0) return {};

  // 收集各维度最大值用于归一化
  let maxPhVotes = 1, maxPhReviews = 1, maxGhStars = 1, maxHfLikes = 1, maxHfDownloads = 1, maxChromeUsers = 1;
  for (const s of slugs) {
    const e = entries[s];
    if (e.phVotes && e.phVotes > maxPhVotes) maxPhVotes = e.phVotes;
    if (e.phReviews && e.phReviews > maxPhReviews) maxPhReviews = e.phReviews;
    if (e.githubStars && e.githubStars > maxGhStars) maxGhStars = e.githubStars;
    if (e.hfLikes && e.hfLikes > maxHfLikes) maxHfLikes = e.hfLikes;
    if (e.hfDownloads && e.hfDownloads > maxHfDownloads) maxHfDownloads = e.hfDownloads;
    if (e.chromeUsers && e.chromeUsers > maxChromeUsers) maxChromeUsers = e.chromeUsers;
  }

  const scores: Record<string, number> = {};
  for (const s of slugs) {
    const e = entries[s];
    // PH票数 25% + PH评论 10% + GitHub 20% + HF Likes 10% + HF下载 15% + Chrome 20%
    const phVoteScore = normalizeLog(e.phVotes ?? 0, maxPhVotes);
    const phReviewScore = normalizeLog(e.phReviews ?? 0, maxPhReviews);
    const ghScore = normalizeLog(e.githubStars ?? 0, maxGhStars);
    const hfLikeScore = normalizeLog(e.hfLikes ?? 0, maxHfLikes);
    const hfDownloadScore = normalizeLog(e.hfDownloads ?? 0, maxHfDownloads);
    const chromeScore = normalizeLog(e.chromeUsers ?? 0, maxChromeUsers);

    scores[s] = Math.round(
      phVoteScore * 0.30 +
      phReviewScore * 0.10 +
      ghScore * 0.25 +
      hfLikeScore * 0.15 +
      hfDownloadScore * 0.20
    );
  }
  return scores;
}

// 单个工具的热度分
export function getScore(slug: string): number {
  const scores = computeAllScores();
  return scores[slug] ?? 0;
}

// 按热度排序
export function getRankedSlugs(): string[] {
  const scores = computeAllScores();
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => slug);
}

// 获取某个工具的原始数据
export function getEntryData(slug: string): Entry | undefined {
  return getEntries()[slug];
}
