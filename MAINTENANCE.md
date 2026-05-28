# AI 增长榜 · 数据更新维护手册

> 每周一更新，5 分钟完成。自动抓取 + 手动查询 + 自动计算。

---

## 一、自动化部分（无需操作）

每周一 UTC 08:00，GitHub Actions 自动运行 `scripts/scrape.ts`，抓取以下数据并存入 `src/data/auto-data.json`：

| 数据 | 来源 | 覆盖率 |
|---|---|---|
| GitHub Stars + 增长率 | GitHub API | 3/20（bolt-new、deepseek、dify） |
| Product Hunt Votes + Reviews | PH API v2 | 17/20 |
| HuggingFace Likes | HF API | 1/20（deepseek） |

> 可在 <https://github.com/lllllllyc123/ai-growth-rank/actions> 查看运行状态。

---

## 二、手动部分（每周一，5 分钟）

### 2.1 查询月访问量

1. 打开 <https://www.similarweb.com>
2. 搜索框输入工具域名，查看 **Total Visits**（月访问量）
3. 填入 `src/data/tools-manual.ts` 中对应工具的 `monthlyVisits`

| 工具 | 域名 | 查什么 |
|---|---|---|
| ChatGPT | chat.openai.com | 月访问量 |
| Claude | claude.ai | 月访问量 |
| Gemini | gemini.google.com | 月访问量 |
| Midjourney | midjourney.com | 月访问量 |
| Cursor | cursor.sh | 月访问量 |
| GitHub Copilot | github.com/features/copilot | 月访问量 |
| Perplexity | perplexity.ai | 月访问量 |
| Runway | runway.ml | 月访问量 |
| Sora | openai.com/sora | 月访问量 |
| Suno | suno.ai | 月访问量 |
| Notion AI | notion.so | 月访问量 |
| Lovable | lovable.dev | 月访问量 |
| Bolt.new | bolt.new | 月访问量 |
| DeepSeek | chat.deepseek.com | 月访问量 |
| Kimi | kimi.moonshot.cn | 月访问量 |
| Gamma | gamma.app | 月访问量 |
| ElevenLabs | elevenlabs.io | 月访问量 |
| v0 by Vercel | v0.dev | 月访问量 |
| Dify | dify.ai | 月访问量 |
| Coze | coze.com | 月访问量 |

### 2.2 计算月增长

```
visitGrowth = (本月 monthlyVisits - 上月 monthlyVisits) / 上月 monthlyVisits × 100
```

### 2.3 微调创新度评分（可选）

`innovationScore` 是主观评分（0-100），根据：
- 是否有重大版本更新
- 是否推出突破性功能
- 是否引领行业趋势

### 2.4 示例：改 ChatGPT 数据

```ts
// 打开 src/data/tools-manual.ts，找到 chatgpt：
{
  slug: "chatgpt",
  // ...
  monthlyVisits: 4200000000,   // ← 改：从 SimilarWeb 查
  visitGrowth: 8.5,            // ← 改：算环比
  userRating: 4.8,             // ← 改：综合 PH/G2 评分
  growthScore: 88,             // ← 改：增长速度评分
  feedbackScore: 96,           // ← 改：用户反馈评分（可参考 PH Votes）
  innovationScore: 92,         // ← 改：创新度评分（可选）
  totalScore: 91.6,            // ← 系统自动算
  trend: "up",                 // ← 改：up / down / stable
  rankChange: 0,               // ← 改：正数上升，负数下降
}
```

---

## 三、系统自动计算

以下字段**不需要手动填**，推送到 GitHub 后 Actions 会自动计算：

| 字段 | 计算公式 |
|---|---|
| `totalScore` | `growthScore × 0.4 + feedbackScore × 0.3 + innovationScore × 0.3` |

> 注意：`totalScore` 目前在 `tools-manual.ts` 中手写。未来版本会改为脚本自动计算，届时只需更新子评分即可。

---

## 四、验证与发布

### 4.1 本地验证

```bash
cd ai-growth-rank
npm run build
```

确保无报错。

### 4.2 推送到 GitHub

```bash
git add src/data/tools-manual.ts
git commit -m "data: weekly update"
git push origin main
```

### 4.3 查看线上效果

Vercel 自动部署完成后刷新：

- 预览地址：<https://ai-growth-rank-git-main-lllllllyc123s-projects.vercel.app>

---

## 五、更新频率对照

| 频率 | 做什么 | 花多久 |
|---|---|---|
| 每周一 | 查月访问量 + 改 tools-manual.ts + push | 5 分钟 |
| 每月初 | 回顾趋势，微调 innovationScore | 2 分钟 |
| 有新产品上线 | 按 README 格式新增工具条目 | 3 分钟 |

---

## 六、文件索引

| 文件 | 作用 |
|---|---|
| `src/data/tools-manual.ts` | 手动维护：评分、访问量、描述、分类 |
| `src/data/auto-data.json` | 自动抓取：GitHub Stars、PH Votes、HF Likes |
| `src/data/types.ts` | 数据类型定义 |
| `scripts/scrape.ts` | 数据抓取脚本 |
| `.github/workflows/update-data.yml` | CI 定时任务 |
