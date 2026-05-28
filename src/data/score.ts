// 全自动评分引擎 —— 所有数据来自 auto-data.json，零手动维护
import autoData from "./auto-data.json";

type Entry = {
  githubStars?: number;
  phVotes?: number;
  phReviews?: number;
  hfLikes?: number;
  hfDownloads?: number;
  chromeUsers?: number;
  npmDownloads?: number;
  dockerPulls?: number;
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
  let maxPhVotes = 1, maxPhReviews = 1, maxGhStars = 1, maxHfLikes = 1;
  let maxHfDownloads = 1, maxNpmDownloads = 1, maxDockerPulls = 1, maxChromeUsers = 1;
  for (const s of slugs) {
    const e = entries[s];
    if (e.phVotes && e.phVotes > maxPhVotes) maxPhVotes = e.phVotes;
    if (e.phReviews && e.phReviews > maxPhReviews) maxPhReviews = e.phReviews;
    if (e.githubStars && e.githubStars > maxGhStars) maxGhStars = e.githubStars;
    if (e.hfLikes && e.hfLikes > maxHfLikes) maxHfLikes = e.hfLikes;
    if (e.hfDownloads && e.hfDownloads > maxHfDownloads) maxHfDownloads = e.hfDownloads;
    if (e.chromeUsers && e.chromeUsers > maxChromeUsers) maxChromeUsers = e.chromeUsers;
    if (e.npmDownloads && e.npmDownloads > maxNpmDownloads) maxNpmDownloads = e.npmDownloads;
    if (e.dockerPulls && e.dockerPulls > maxDockerPulls) maxDockerPulls = e.dockerPulls;
  }

  // 维度权重
  const W = {
    phVotes: 0.20, phReviews: 0.08, ghStars: 0.15,
    hfLikes: 0.08, hfDownloads: 0.10, chrome: 0.14,
    npm: 0.15, docker: 0.10,
  };

  const scores: Record<string, number> = {};
  for (const s of slugs) {
    const e = entries[s];
    const phVoteScore = normalizeLog(e.phVotes ?? 0, maxPhVotes);
    const phReviewScore = normalizeLog(e.phReviews ?? 0, maxPhReviews);
    const ghScore = normalizeLog(e.githubStars ?? 0, maxGhStars);
    const hfLikeScore = normalizeLog(e.hfLikes ?? 0, maxHfLikes);
    const hfDownloadScore = normalizeLog(e.hfDownloads ?? 0, maxHfDownloads);
    const chromeScore = normalizeLog(e.chromeUsers ?? 0, maxChromeUsers);
    const npmScore = normalizeLog(e.npmDownloads ?? 0, maxNpmDownloads);
    const dockerScore = normalizeLog(e.dockerPulls ?? 0, maxDockerPulls);

    // 计算可用维度权重（只有真实有数据的维度才计入）
    let avail = 0;
    if ((e.phVotes ?? 0) > 0) avail += W.phVotes;
    if ((e.phReviews ?? 0) > 0) avail += W.phReviews;
    if ((e.githubStars ?? 0) > 0) avail += W.ghStars;
    if ((e.hfLikes ?? 0) > 0) avail += W.hfLikes;
    if ((e.hfDownloads ?? 0) > 0) avail += W.hfDownloads;
    if ((e.chromeUsers ?? 0) > 0) avail += W.chrome;
    if ((e.npmDownloads ?? 0) > 0) avail += W.npm;
    if ((e.dockerPulls ?? 0) > 0) avail += W.docker;
    // 最小可用权重 50%，防止单源数据过度放大
    avail = Math.max(avail, 0.50);

    const raw = phVoteScore * W.phVotes + phReviewScore * W.phReviews
      + ghScore * W.ghStars + hfLikeScore * W.hfLikes
      + hfDownloadScore * W.hfDownloads + chromeScore * W.chrome
      + npmScore * W.npm + dockerScore * W.docker;

    // 自适应归一化：可用维度少的工具按比例放大到 0-100
    scores[s] = Math.round(Math.min(100, raw / avail));
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
