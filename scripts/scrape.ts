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
        } else { reject(new Error(u.hostname + " " + res.statusCode)); }
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
        } else { reject(new Error(u.hostname + " " + res.statusCode)); }
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
  hfModels = extract("huggingfaceModel"),
  chromeExts = extract("chromeExtensionId"),
  npmPkgs = extract("npmPackage"),
  dockerImgs = extract("dockerImage");
console.log("Sources: " + repos.length + " GH, " + phSlugs.length + " PH, " + hfModels.length + " HF, " + chromeExts.length + " Chrome, " + npmPkgs.length + " npm, " + dockerImgs.length + " Docker");

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
  const data = await httpPost("https://api.producthunt.com/v2/api/graphql", query, {
    headers: {
      Authorization: "Bearer " + PRODUCT_HUNT_TOKEN,
      "Content-Type": "application/json",
      "User-Agent": "ai-growth-rank/1.0",
    },
  });
  if (!data.data || !data.data.post) throw new Error("PH post not found: " + slug);
  return { votes: data.data.post.votesCount, reviews: data.data.post.reviewsCount };
}

// HuggingFace
async function hfFetch(model) {
  const d = await httpGet("https://huggingface.co/api/models/" + model);
  return { likes: d.likes || 0, downloads: d.downloads || 0 };
}

function loadLast() {
  if (!fs.existsSync(snapDir)) return { entries: {} };
  const files = fs.readdirSync(snapDir).filter(f => f.endsWith(".json")).sort();
  if (files.length === 0) return { entries: {} };
  return JSON.parse(fs.readFileSync(path.join(snapDir, files[files.length - 1]), "utf-8"));
}

// Chrome Web Store (graceful: fast fail if unreachable)
async function chromeFetch(extId) {
  try {
    const html = await httpGet("https://chrome.google.com/webstore/detail/test/" + extId + "?hl=en", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    const m = html.match(/"userCount"[:s]*(d+)/) || html.match(/"interactionCount"[:s]*"(d+)"/);
    return m ? parseInt(m[1]) : 0;
  } catch (e) {
    return 0;
  }
}

// npm downloads
async function npmFetch(pkg) {
  const d = await httpGet("https://api.npmjs.org/downloads/point/last-week/" + encodeURIComponent(pkg));
  return d.downloads || 0;
}

// Docker Hub pulls
async function dockerFetch(image) {
  const d = await httpGet("https://hub.docker.com/v2/repositories/" + image + "/");
  return d.pull_count || 0;
}

async function main() {
  const existing = (() => { try { return JSON.parse(fs.readFileSync(autoPath, "utf-8")).entries || {}; } catch(e) { return {}; } })();
  const entries = Object.assign({}, existing), last = loadLast();

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
      entries[slug] = Object.assign({}, entries[slug], { phVotes: ph.votes, phReviews: ph.reviews });
      console.log("  " + slug + ": PH " + ph.votes.toLocaleString() + " votes, " + ph.reviews + " reviews");
    } catch (e) { console.log("  " + slug + ": PH fail - " + e.message); }
  }

  // HuggingFace (likes + downloads)
  for (const { slug, val: model } of hfModels) {
    try {
      await sleep(200);
      const hf = await hfFetch(model);
      entries[slug] = Object.assign({}, entries[slug], { hfLikes: hf.likes, hfDownloads: hf.downloads });
      console.log("  " + slug + ": HF " + hf.likes.toLocaleString() + " likes, " + hf.downloads.toLocaleString() + " downloads");
    } catch (e) { console.log("  " + slug + ": HF fail - " + e.message); }
  }

  const ad = { syncedAt: new Date().toISOString(), entries };
  fs.writeFileSync(autoPath, JSON.stringify(ad, null, 2), "utf-8");
  const n = new Date();
  fs.mkdirSync(snapDir, { recursive: true });
  fs.writeFileSync(
    path.join(snapDir, n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0") + ".json"),
    JSON.stringify(ad, null, 2), "utf-8"
  );
    // Chrome Web Store
  for (const { slug, val: extId } of chromeExts) {
    if (!extId || extId === "") continue;
    try {
      await sleep(500);
      const users = await chromeFetch(extId);
      if (users > 0) {
        entries[slug] = Object.assign({}, entries[slug], { chromeUsers: users });
        console.log("  " + slug + ": Chrome " + users.toLocaleString() + " users");
      }
    } catch (e) { console.log("  " + slug + ": Chrome fail - " + e.message); }
  }

    // npm downloads
  for (const { slug, val: pkg } of npmPkgs) {
    if (!pkg || pkg === "") continue;
    try {
      await sleep(200);
      const dl = await npmFetch(pkg);
      if (dl > 0) {
        entries[slug] = Object.assign({}, entries[slug], { npmDownloads: dl });
        console.log("  " + slug + ": npm " + dl.toLocaleString() + " /week");
      }
    } catch (e) { console.log("  " + slug + ": npm fail - " + e.message); }
  }

  // Docker Hub
  for (const { slug, val: image } of dockerImgs) {
    if (!image || image === "") continue;
    try {
      await sleep(200);
      const pulls = await dockerFetch(image);
      if (pulls > 0) {
        entries[slug] = Object.assign({}, entries[slug], { dockerPulls: pulls });
        console.log("  " + slug + ": docker " + pulls.toLocaleString() + " pulls");
      }
    } catch (e) { console.log("  " + slug + ": docker fail - " + e.message); }
  }

  console.log("Done. " + Object.keys(entries).length + " tools.");
}
main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
