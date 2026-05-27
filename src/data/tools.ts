// 构建时合并人工数据与自动数据
import { manualEntries } from "./tools-manual";
import autoData from "./auto-data.json";
import type { AITool } from "./types";

type AutoData = {
  syncedAt: string;
  entries: Record<string, { githubStars?: number }>;
};

const data = autoData as AutoData;

export const tools: AITool[] = manualEntries.map((m) => ({
  ...m,
  githubStars: data.entries[m.slug]?.githubStars ?? m.githubStars,
}));

export { getToolsByCategory, getToolsByRank, searchTools } from "./tools-manual";
