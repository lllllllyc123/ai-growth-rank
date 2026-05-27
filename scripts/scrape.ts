const fs = require("fs");
const path = require("path");
const https = require("https");
const base = path.resolve(__dirname, "..");
const manualPath = path.join(base, "src/data/tools-manual.ts");
const autoPath = path.join(base, "src/data/auto-data.json");
const snapDir = path.join(base, "data/snapshots");

// 代理
let agent = undefined;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
if (proxyUrl) {
  const { HttpsProxyAgent } = require("https-proxy-agent");
  agent = new HttpsProxyAgent(proxyUrl);
  console.log("Proxy: " + proxyUrl);
}

// 符合 Reddit API 规则的 User-Agent
const USER_AGENT = "web:ai-growth-rank:v1.0 (by /u/ai-growth-rank)";

// node:https 请求封装
function httpGet(url, opts) {
  return new Promise((resolve, reject) => {
    opts = opts || {}; opts.agent = agent;
    opts.headers = opts.headers || {};
    opts.headers["User-Agent"] = USER_AGENT;
    const u = new URL(url);
    opts.hostname = u.hostname; opts.path = u.pathname + u.search; opts.protocol = u.protocol;
    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
        } else {
          reject(new Error(url.split("/")[2] + " " + res.statusCode));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const manualRaw = fs.readFileSync(manualPath, "utf-8");
function extract(field) {
  const re = new RegExp('"' + field + '":\\s*"([^"]+)"', "g");
  const out = [];
  for (const m of manualRaw.matchAll(re)) {
    let s = "";
    for (const x of manualRaw.matchAll(/"slug":\s*"([^"]+)"/g)) { if (x.index < m.index) s = x[1]; else break; }
    out.push({ slug: s, val: m[1] });
  }
  return out;
}
const repos = extract("githubRepo"), subs = extract("redditSubreddit"), hfModels = extract("huggingfaceModel");
console.log("Sources: " + repos.length + " GH, " + subs.length + " Reddit, " + hfModels.length + " HF");

async function ghFetch(repo) {
  return httpGet("https://api.github.com/repos/" + repo,
    { headers: { Accept: "application/vnd.github.v3+json" } });
}
async function redditFetch(sub) {
  // 优先用 www.reddit.com 的 about.json API
  try {
    const d = await httpGet("https://www.reddit.com/r/" + sub + "/about.json");
    if (d.data && d.data.subscribers) return d.data.subscribers;
  } catch(e) {
    // 回退到 old.reddit.com
    try {
      const d2 = await httpGet("https://old.reddit.com/r/" + sub + "/about.json");
      if (d2.data && d2.data.subscribers) return d2.data.subscribers;
    } catch(e2) {
      // 最后尝试 HTML 页面提取
      const html = await httpGet("https://old.reddit.com/r/" + sub + "/", {});
      const m = (typeof html === "string" ? html : "").match(/<span class="number">([\d,]+)<\/span>/);
      if (m) return parseInt(m[1].replace(/,/g, ""));
      throw new Error("Reddit parse fail");
    }
  }
  throw new Error("Reddit parse fail");
}
async function hfFetch(model) {
  const d = await httpGet("https://huggingface.co/api/models/" + model);
  return d.likes || 0;
}
function loadLast() {
  if (!fs.existsSync(snapDir)) return { entries: {} };
  const files = fs.readdirSync(snapDir).filter(f => f.endsWith(".json")).sort();
  if (files.length === 0) return { entries: {} };
  return JSON.parse(fs.readFileSync(path.join(snapDir, files[files.length - 1]), "utf-8"));
}

async function main() {
  const entries = {}, last = loadLast();
  for (const { slug, val: repo } of repos) {
    try {
      const d = await ghFetch(repo);
      entries[slug] = Object.assign({}, entries[slug], { githubStars: d.stargazers_count });
      const p = (last.entries[slug] && last.entries[slug].githubStars) || 0;
      entries[slug].githubStarGrowth = p > 0 ? ((d.stargazers_count - p) / p) * 100 : 0;
      console.log("  " + slug + ": " + d.stargazers_count.toLocaleString() + " stars");
    } catch (e) { console.log("  " + slug + ": GH fail - " + e.message); }
  }
  for (const { slug, val: sub } of subs) {
    try {
      await sleep(500); // Reddit 请求间隔，避免被限流
      const c = await redditFetch(sub);
      entries[slug] = Object.assign({}, entries[slug], { redditSubscribers: c });
      const p = (last.entries[slug] && last.entries[slug].redditSubscribers) || 0;
      entries[slug].redditGrowth = p > 0 ? ((c - p) / p) * 100 : 0;
      console.log("  " + slug + ": r/" + sub + " " + c.toLocaleString() + " subs");
    } catch (e) { console.log("  " + slug + ": Reddit fail - " + e.message); }
  }
  for (const { slug, val: model } of hfModels) {
    try { const likes = await hfFetch(model); entries[slug] = Object.assign({}, entries[slug], { hfLikes: likes }); console.log("  " + slug + ": HF " + likes.toLocaleString() + " likes"); }
    catch (e) { console.log("  " + slug + ": HF fail - " + e.message); }
  }
  const ad = { syncedAt: new Date().toISOString(), entries };
  fs.writeFileSync(autoPath, JSON.stringify(ad, null, 2), "utf-8");
  const n = new Date();
  fs.mkdirSync(snapDir, { recursive: true });
  fs.writeFileSync(path.join(snapDir, n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")+".json"), JSON.stringify(ad, null, 2), "utf-8");
  console.log("Done. " + Object.keys(entries).length + " tools.");
}
main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
