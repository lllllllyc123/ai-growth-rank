# AI 增长榜 · 维护手册

> 全自动评分系统 v2.0 · 8 个数据维度 · 每周自动更新

---

## 一、自动部分（每周一 UTC 00:00）

GitHub Actions 自动运行，抓取并更新 `src/data/auto-data.json`：

| 维度 | 来源 | API | 覆盖 |
|------|------|-----|------|
| GitHub Stars | `api.github.com` | 免费 | 8/20 |
| Product Hunt 票数 | PH API v2 GraphQL | 需 Token | 19/20 |
| Product Hunt 评论 | 同上 | 同上 | 14/20 |
| HuggingFace Likes | `huggingface.co/api` | 免费 | 5/20 |
| HuggingFace 下载 | 同上 | 同上 | 5/20 |
| npm 周下载 | `api.npmjs.org` | 免费 | 12/20 |
| Docker 拉取 | `hub.docker.com` | 免费（有时连不上） | 0/20 |
| Chrome 扩展用户 | 不支持自动抓取 | — | 手动 |

**评分公式**（`src/data/score.ts`）：

```
PH 票数 20% + PH 评论 8% + GitHub 15% + HF Likes 8%
+ HF 下载 10% + npm 15% + Docker 10% + Chrome 14%
= 100%
```

自适应归一化：工具只有部分维度数据时，权重按比例放大（最小地板 50%）。

---

## 二、手动部分（每周一，2 分钟）

### 2.1 更新 Chrome 扩展用户数（唯一必须手动）

Chrome Web Store 不支持自动抓取。每 1-2 周检查一次这 5 个扩展的用户数：

| 工具 | 链接 |
|------|------|
| ChatGPT | <https://chromewebstore.google.com/detail/test/iimdmhmbedafhnjdccafpegfkadhkpoj> |
| Claude | <https://chromewebstore.google.com/detail/test/fcoeoabgfenejglbffodgkkbkcdhcgfn> |
| GitHub Copilot | <https://chromewebstore.google.com/detail/test/fpnodhlacbkbgnblhkcbjdlijfdppilo> |
| Perplexity | <https://chromewebstore.google.com/detail/test/bnaffjbjpgiagpondjlnneblepbdchol> |
| Notion | <https://chromewebstore.google.com/detail/test/knheggckgoiihginacbkhaalnibhilkk> |

打开每个链接 → 记下"用户数"→ 直接改 `src/data/auto-data.json`：

```json
"chatgpt": { "chromeUsers": 20000 },
"claude": { "chromeUsers": 8000000 },
```

### 2.2 添加新工具

1. 在 `src/data/tools-manual.ts` 新增条目（仿照已有格式）
2. 确保填了 `phSlug`、`githubRepo`（如有）、`npmPackage`（如有）、`chromeExtensionId`（如有）
3. 推送 → Actions 自动抓取数据
4. 如果是 npm/Chrome 维度，手动补充到 `auto-data.json`

### 2.3 修数据源映射

如果某个工具的 PH 票数太低（可能是错的 slug），在 `tools-manual.ts` 中改 `phSlug`，再触发 Actions 重抓。

---

## 三、数据流

```
tools-manual.ts (映射)
    ↓
scrape.ts (抓取)
    ↓
auto-data.json (数据)
    ↓
score.ts (评分)
    ↓
page.tsx (展示)
```

**重要**：scraper 现在是**合并模式**，不会覆盖手动填的 npm/Chrome 数据。每次 Actions 运行只更新它自己能抓到的维度。

---

## 四、命令速查

```bash
# 本地运行 scraper（需 PH Token）
$env:PRODUCT_HUNT_TOKEN="xxx"; npx tsx scripts/scrape.ts

# 本地构建
npm run build

# 手动触发 Actions
# 打开 https://github.com/lllllllyc123/ai-growth-rank/actions
# → Update Data → Run workflow

# 推送到 GitHub（如果 git push 超时，用 GitHub API 推）
```

---

## 五、文件索引

| 文件 | 作用 |
|------|------|
| `src/data/tools-manual.ts` | 工具定义 + 数据源映射（phSlug, githubRepo, npmPackage 等） |
| `src/data/auto-data.json` | 自动抓取的数据（GitHub Stars, PH 票数, HF, npm, Chrome） |
| `src/data/score.ts` | 评分引擎（8 维度加权 + 自适应归一化） |
| `src/data/types.ts` | 类型定义 |
| `scripts/scrape.ts` | 数据抓取脚本 |
| `.github/workflows/update-data.yml` | 每周自动更新 CI |
| `src/app/page.tsx` | 首页榜单 |
| `src/app/tool/[slug]/page.tsx` | 工具详情页 |

---

## 六、故障排查

| 问题 | 解决 |
|------|------|
| Actions 报错 | 打开 Actions 日志看具体错误 |
| PH API 返回 null | PH slug 可能错了，在 tools-manual.ts 改 slug |
| npm 数据为空 | 检查 npmPackage 是否正确，scraper 已自动抓取 npm |
| 评分不合理 | 检查 auto-data.json 数据是否完整，权重在 score.ts 调整 |
| Vercel 部署报错 | 检查 `vercel.json` 是否有效 JSON |
| 生产域名还是旧版 | Vercel Dashboard → Deployments → Promote to Production |
