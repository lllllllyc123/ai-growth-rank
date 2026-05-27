# 🚀 AI 增长榜

> 每周汇总 AI 工具的增长数据，为开发者、投资人与 AI 爱好者提供决策参考。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](../LICENSE)

---

## ✨ 功能

- **综合排名** — 基于增长速度（40%）、用户反馈（30%）、创新度（30%）的加权评分
- **分类筛选** — AI 对话 / 图像 / 视频 / 编程 / 音频 / 写作 / 搜索 / Agent / 数据分析
- **实时搜索** — 按产品名、描述、标签搜索
- **三种排序** — 综合评分 / 月增长 / 月访问量
- **产品详情页** — 评分明细条、增长趋势、GitHub Stars
- **全静态生成** — 20 个详情页 SSG 预渲染，部署后秒开
- **暗色主题** — 响应式适配移动端

---

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 渲染 | SSG（静态站点生成） |
| 部署 | Vercel / Netlify / Cloudflare Pages |

---

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/<your-username>/ai-growth-rank.git
cd ai-growth-rank

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
# 打开 http://localhost:3000

# 4. 生产构建
npm run build
# 部署到 Vercel 可直接导入项目；或配 output: 'export' 导出静态文件到 out/
```

---

## 📁 项目结构

```
ai-growth-rank/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── layout.tsx          # 根布局（SEO 元数据）
│   │   ├── page.tsx            # 榜单首页
│   │   ├── globals.css         # 全局样式
│   │   └── tool/[slug]/        # 产品详情页（SSG）
│   │       └── page.tsx
│   └── data/
│       ├── types.ts            # 数据类型定义
│       └── tools.ts            # 工具数据 + 筛选/搜索函数
├── public/                     # 静态资源
├── next.config.ts
├── package.json
└── README.md
```

---

## 📊 数据更新流程

冷启动阶段数据为手写维护，存储在 `src/data/tools.ts`。每周按以下 SOP 更新：

### 更新步骤

1. **编辑数据文件** — 打开 `src/data/tools.ts`
2. **更新指标** — 修改每个工具的 `monthlyVisits`、`visitGrowth`、`totalScore` 等字段
3. **更新排名变化** — 修改 `rankChange`（正数上升、负数下降）
4. **运行构建验证** — `npm run build` 确认无报错
5. **部署上线** — 推送到 Vercel/Netlify 自动部署

### 数据来源（后续自动化）

| 指标 | 数据源 | 方式 |
|---|---|---|
| 月访问量 | SimilarWeb | 页面手动查询 |
| GitHub Stars | GitHub API | `GET /repos/:owner/:repo` |
| 用户评分 | Product Hunt / G2 | 手动汇总 |
| 讨论热度 | Reddit / 知乎 | 搜索 API |

### 添加新工具

在 `src/data/tools.ts` 的 `tools` 数组中追加对象，`slug` 决定详情页路由（`/tool/<slug>`），执行 `npm run build` 后自动生成静态页面：

```ts
{
  slug: "new-tool",           // 唯一标识 → 路由 /tool/new-tool
  name: "新工具名",
  url: "https://...",
  description: "一句话描述…",
  category: "ai-chat",        // 见 src/data/types.ts CATEGORY_LABELS
  monthlyVisits: 1000000,
  visitGrowth: 15.5,
  userRating: 4.5,
  pricing: "freemium",        // free | freemium | paid | open-source
  foundedAt: "2025-01-01",
  country: "中国",
  growthScore: 87,            // 增长速度评分 (0-100)
  feedbackScore: 85,          // 用户反馈评分 (0-100)
  innovationScore: 84,        // 创新度评分 (0-100)
  totalScore: 85.5,           // = 87×0.4 + 85×0.3 + 84×0.3
  trend: "up",                // up | down | stable
  rankChange: undefined,      // 新上榜 → 显示 "NEW"
  tags: ["标签1", "标签2"],
}
```

---

## 🗺 路线图

### MVP（当前）

- [x] 榜单首页 + 分类筛选 + 搜索 + 排序
- [x] 20 个工具的产品详情页（SSG）
- [x] 手写静态数据
- [x] 暗色主题 + 响应式

### v1.0 — 数据自动化

- [ ] 接入 SimilarWeb API 自动拉取月访问量
- [ ] 接入 GitHub API 自动拉取 Stars
- [ ] 自动计算环比增长率
- [ ] 数据缓存层（减少 API 调用）

### v2.0 — 用户系统

- [ ] 用户订阅特定分类 + 推送通知
- [ ] 积分体系（签到 + 提交新品线索）
- [ ] 会员体系（提前看榜单、导出 Excel）

### v3.0 — 商业化

- [ ] 广告位管理系统
- [ ] 付费报告自动生成（PDF）
- [ ] B 端厂商合作后台

---

## 💰 商业模式

详细内容参见 [ch0095 — AI 站点增长榜单](https://github.com/XiaomingX/ai-money-maker-handbook)

| 阶段 | 变现方式 | 预估月收入 |
|---|---|---|
| 初期（月访问 5 万） | 广告位 + 付费报告 + 轻量会员 | ¥10,000 – ¥20,000 |
| 成长期（月访问 10 万+） | CPS 分佣 + B 端收录费 + 企业报告 | ¥20,000 – ¥50,000 |
| 成熟期 | 培训课程 + 定制咨询 + FA 撮合 | 上不封顶 |

---

## 🤝 贡献

欢迎提交 Issue 或 PR：

- **新增工具** — 按上方「添加新工具」格式提交 `tools.ts` 变更
- **功能建议** — 开 Issue 描述需求
- **数据纠错** — 直接提 PR 修正数据

---

## 📄 许可

MIT
