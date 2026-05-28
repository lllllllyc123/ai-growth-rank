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

const PRODUCT_HUNT_TOKEN = process.env.PRODUCT_HUNT_TOKEN || "";
if (!PRODUCT_HUNT_TOKEN) console.log("WARNING: PRODUCT_HUNT_TOKEN not set");

function httpGet(url, opts) {
  return new Promise((resolve, reject) => {
    opts = opts || {}; opts.agent = agent;
    opts.headers = opts.headers || {};
    opts.method = "GET";
    const u = new URL(url);
    opts.hostname = u.hostname; opts.path = u.pathname + u.search; opts.protocol = u.protocol;
    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
        } else {
          reject(new Error(u.hostname + " " + res.statusCode));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}

function httpPost(url, body, opts) {
  return new Promise((resolve, reject) => {
    opts = opts || {}; opts.agent = agent;
    opts.headers = opts.headers || {};
    opts.method = "POST";
    const u = new URL(url);
    opts.hostname = u.hostname; opts.path = u.pathname + u.search; opts.protocol = u.protocol;
    const req = https.request(opts, (res) => {
      let rb = "";
      res.on("data", d => rb += d);
      res.on("end", () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(rb)); } catch(e) { resolve(rb); }
        } else {
          reject(new Error(u.hostname + " " + res.statusCode + ": " + rb.substring(0, 200)));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(typeof body === "string" ? body : JSON.stringify(body));
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
    for (const x of manualRaw.matchAll(/"slug":\s*"([^"]+)"/g)) {
      if (x.index < m.index) s = x[1]; else break;
    }
    out.push({ slug: s, val: m[1] });
  }
  return out;
}
const repos = extract("githubRepo"),
  phSlugs = extract("phSlug"),
  hfModels = extract("huggingfaceModel");
console.log("Sources: " + repos.length + " GH, " + phSlugs.length + " PH, " + hfModels.length + " HF");

// GitHub
async function ghFetch(repo) {
  return httpGet("https://api.github.com/repos/" + repo, {
    headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "ai-rank/1.0" },
  });
}

// Product Hunt API v2 (GraphQL)
async function phFetch(slug) {
  const query = {
    query: `{ post(slug: "${slug}") { id name votesCount reviewsCount } }`,
  };
  const data = await httpPost(
    "https://api.producthunt.com/v2/api/graphql",
    query,
    {
      headers: {
        Authorization: "Bearer " + PRODUCT_HUNT_TOKEN,
        "Content-Type": "application/json",
        "User-Agent": "ai-growth-rank/1.0",
      },
    }
  );
  if (!data.data || !data.data.post) {
    throw new Error("PH post not found: " + slug);
  }
  return {
    votes: data.data.post.votesCount,
    reviews: data.data.post.reviewsCount,
  };
}

// HuggingFace
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

  // GitHub Stars
  for (const { slug, val: repo } of repos) {
    try {
      const d = await ghFetch(repo);
      entries[slug] = Object.assign({}, entries[slug], { githubStars: d.stargazers_count });
      const p = (last.entries[slug] && last.entries[slug].githubStars) || 0;
      entries[slug].githubStarGrowth = p > 0 ? ((d.stargazers_count - p) / p) * 100 : 0;
      console.log("  " + slug + ": " + d.stargazers_count.toLocaleString() + " stars");
    } catch (e) { console.log("  " + slug + ": GH fail - " + e.message); }
  }

  // Product Hunt
  for (const { slug, val: phSlug } of phSlugs) {
    try {
      await sleep(500);
      const ph = await phFetch(phSlug);
      entries[slug] = Object.assign({}, entries[slug], {
        phVotes: ph.votes,
        phReviews: ph.reviews,
      });
      console.log("  " + slug + ": PH " + ph.votes.toLocaleString() + " votes, " + ph.reviews + " reviews");
    } catch (e) { console.log("  " + slug + ": PH fail - " + e.message); }
  }

  // HuggingFace Likes
  for (const { slug, val: model } of hfModels) {
    try {
      const likes = await hfFetch(model);
      entries[slug] = Object.assign({}, entries[slug], { hfLikes: likes });
      console.log("  " + slug + ": HF " + likes.toLocaleString() + " likes");
    } catch (e) { console.log("  " + slug + ": HF fail - " + e.message); }
  }

  const ad = { syncedAt: new Date().toISOString(), entries };
  fs.writeFileSync(autoPath, JSON.stringify(ad, null, 2), "utf-8");
  const n = new Date();
  fs.mkdirSync(snapDir, { recursive: true });
  fs.writeFileSync(
    path.join(snapDir, n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0") + ".json"),
    JSON.stringify(ad, null, 2),
    "utf-8"
  );
  console.log("Done. " + Object.keys(entries).length + " tools.");
}
main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
