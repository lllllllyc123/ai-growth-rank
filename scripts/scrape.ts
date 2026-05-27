/**
 * 每周数据抓取 —— 拉取 GitHub Stars，更新 auto-data.json
 * 用法：npx tsx scripts/scrape.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

// 用相对路径（tsx 不支持 tsconfig paths）
const base = resolve(import.meta.dirname || __dirname, "..");
const manualPath = resolve(base, "src/data/tools-manual.ts");
const autoPath = resolve(base, "src/data/auto-data.json");
const snapDir = resolve(base, "data/snapshots");

// ---- 读取人工维护数据，提取有 GitHub 仓库的工具 ----
const manualRaw = readFileSync(manualPath, "utf-8");

// 匹配 JSON 格式的 "slug" 和 "githubRepo"
const slugRegex = /"slug":\s*"([^"]+)"/g;
const repoRegex = /"githubRepo":\s*"([^"]+)"/g;

// 提取所有匹配，按行号关联
interface ToolMeta { slug: string; repo?: string }
const allTools: ToolMeta[] = [];
for (const m of manualRaw.matchAll(slugRegex)) {
  allTools.push({ slug: m[1] });
}
for (const m of manualRaw.matchAll(repoRegex)) {
  // 找到此 githubRepo 之前最近的 slug
  let closest = "";
  for (const s of manualRaw.matchAll(slugRegex)) {
    if (s.index! < m.index!) closest = s[1];
    else break;
  }
  const tool = allTools.find((t) => t.slug === closest);
  if (tool) tool.repo = m[1];
}

const toolsWithRepo = allTools.filter((t) => t.repo);
console.log(`Found ${toolsWithRepo.length} tools with GitHub repos:`);
toolsWithRepo.forEach((t) => console.log(`  ${t.slug} -> ${t.repo}`));

// ---- 调 GitHub API ----
async function fetchStars(repo: string): Promise<number> {
  const url = `https://api.github.com/repos/${repo}`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "ai-growth-rank-scraper/1.0",
    },
  });
  if (!res.ok) {
    if (res.status === 403) {
      const reset = res.headers.get("x-ratelimit-reset");
      const waitSec = reset ? parseInt(reset) - Math.floor(Date.now() / 1000) + 1 : 60;
      console.log(`  Rate limited, waiting ${waitSec}s...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      return fetchStars(repo);
    }
    if (res.status === 404) {
      throw new Error(`404: ${repo} not found`);
    }
    throw new Error(`HTTP ${res.status} for ${repo}`);
  }
  const data = await res.json();
  return data.stargazers_count;
}

async function scrapeAll() {
  const results: { slug: string; stars?: number; error?: string }[] = [];
  let failures = 0;
  for (const tool of toolsWithRepo) {
    try {
      const stars = await fetchStars(tool.repo!);
      console.log(`  ${tool.slug}: ${stars.toLocaleString()} stars`);
      results.push({ slug: tool.slug, stars });
    } catch (e: any) {
      console.log(`  ${tool.slug}: FAILED - ${e.message}`);
      results.push({ slug: tool.slug, error: e.message });
      failures++;
    }
  }
  if (failures > toolsWithRepo.length / 2) {
    throw new Error(`Too many failures (${failures}/${toolsWithRepo.length})`);
  }
  return results;
}

// ---- 主流程 ----
async function main() {
  console.log("Scraping GitHub stars...");
  const results = await scrapeAll();

  // 生成 auto-data.json
  const entries: Record<string, { githubStars?: number }> = {};
  for (const r of results) {
    if (r.stars !== undefined) {
      entries[r.slug] = { githubStars: r.stars };
    }
  }

  const autoData = { syncedAt: new Date().toISOString(), entries };
  const autoJson = JSON.stringify(autoData, null, 2);

  // 保存旧版本用于回滚
  const oldAuto = existsSync(autoPath) ? readFileSync(autoPath, "utf-8") : "";
  writeFileSync(autoPath, autoJson, "utf-8");

  // 保存快照
  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,"0"), d = String(now.getDate()).padStart(2,"0");
  const snapFile = resolve(snapDir, `${y}-${m}-${d}.json`);
  mkdirSync(snapDir, { recursive: true });
  writeFileSync(snapFile, autoJson, "utf-8");

  console.log(`Done. Updated ${Object.keys(entries).length} tools.`);
  console.log(`Snapshot: data/snapshots/${y}-${m}-${d}.json`);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
