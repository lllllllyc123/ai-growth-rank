/**
 * 每周数据抓取 - 多源自动更新
 * 用法: npx tsx scripts/scrape.ts
 */
const fs = require("fs");
const path = require("path");

const base = path.resolve(__dirname, "..");
const manualPath = path.join(base, "src/data/tools-manual.ts");
const autoPath = path.join(base, "src/data/auto-data.json");
const snapDir = path.join(base, "data/snapshots");

// ---- 读取人工数据 ----
const manualRaw = fs.readFileSync(manualPath, "utf-8");

function extractFields(field) {
  const re = new RegExp('"' + field + '":\\s*"([^"]+)"', "g");
  const results = [];
  for (const m of manualRaw.matchAll(re)) {
    let slug = "";
    for (const s of manualRaw.matchAll(/"slug":\s*"([^"]+)"/g)) {
      if (s.index < m.index) slug = s[1];
      else break;
    }
    results.push({ slug, val: m[1] });
  }
  return results;
}

const repos = extractFields("githubRepo");
const subs = extractFields("redditSubreddit");
const hfModels = extractFields("huggingfaceModel");
console.log("Sources: " + repos.length + " GitHub, " + subs.length + " Reddit, " + hfModels.length + " HF");

// ---- API helpers ----
async function ghFetch(url) {
  const res = await fetch(url, { headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "ai-rank/1.0" } });
  if (!res.ok) throw new Error("GH " + res.status);
  return res.json();
}

async function redditFetch(sub) {
  const res = await fetch("https://www.reddit.com/r/" + sub + "/about.json", {
    headers: { "User-Agent": "ai-rank/1.0" },
  });
  if (!res.ok) throw new Error("Reddit " + res.status);
  const d = await res.json();
  return d.data ? d.data.subscribers : 0;
}

async function hfFetch(model) {
  const res = await fetch("https://huggingface.co/api/models/" + model, {
    headers: { "User-Agent": "ai-rank/1.0" },
  });
  if (!res.ok) throw new Error("HF " + res.status);
  const d = await res.json();
  return d.likes || 0;
}

// ---- 读上次快照 ----
function loadLastSnapshot() {
  if (!fs.existsSync(snapDir)) return { entries: {} };
  const files = fs.readdirSync(snapDir).filter(function(f) { return f.endsWith(".json"); }).sort();
  if (files.length === 0) return { entries: {} };
  return JSON.parse(fs.readFileSync(path.join(snapDir, files[files.length - 1]), "utf-8"));
}

// ---- 抓取 ----
async function main() {
  const entries = {};
  const last = loadLastSnapshot();

  // GitHub Stars
  for (const { slug, val: repo } of repos) {
    try {
      const data = await ghFetch("https://api.github.com/repos/" + repo);
      entries[slug] = Object.assign({}, entries[slug], { githubStars: data.stargazers_count });
      const prev = (last.entries[slug] && last.entries[slug].githubStars) || 0;
      entries[slug].githubStarGrowth = prev > 0 ? ((data.stargazers_count - prev) / prev) * 100 : 0;
      console.log("  " + slug + ": " + data.stargazers_count.toLocaleString() + " stars");
    } catch (e) { console.log("  " + slug + ": GH fail - " + e.message); }
  }

  // Reddit
  for (const { slug, val: sub } of subs) {
    try {
      const count = await redditFetch(sub);
      entries[slug] = Object.assign({}, entries[slug], { redditSubscribers: count });
      const prev = (last.entries[slug] && last.entries[slug].redditSubscribers) || 0;
      entries[slug].redditGrowth = prev > 0 ? ((count - prev) / prev) * 100 : 0;
      console.log("  " + slug + ": r/" + sub + " " + count.toLocaleString() + " subs");
    } catch (e) { console.log("  " + slug + ": Reddit fail - " + e.message); }
  }

  // HuggingFace
  for (const { slug, val: model } of hfModels) {
    try {
      const likes = await hfFetch(model);
      entries[slug] = Object.assign({}, entries[slug], { hfLikes: likes });
      console.log("  " + slug + ": HF " + likes.toLocaleString() + " likes");
    } catch (e) { console.log("  " + slug + ": HF fail - " + e.message); }
  }

  // Save
  const autoData = { syncedAt: new Date().toISOString(), entries: entries };
  const autoJson = JSON.stringify(autoData, null, 2);
  fs.writeFileSync(autoPath, autoJson, "utf-8");

  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,"0"), d = String(now.getDate()).padStart(2,"0");
  fs.mkdirSync(snapDir, { recursive: true });
  fs.writeFileSync(path.join(snapDir, y + "-" + m + "-" + d + ".json"), autoJson, "utf-8");

  console.log("Done. " + Object.keys(entries).length + " tools updated.");
}

main().catch(function(e) { console.error("FATAL:", e.message); process.exit(1); });
