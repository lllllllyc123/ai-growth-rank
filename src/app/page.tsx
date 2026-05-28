"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { tools, getToolsByCategory, searchTools } from "@/data/tools";
import { computeAllScores, getEntryData } from "@/data/score";
import { CATEGORY_LABELS, PRICING_LABELS, type Category } from "@/data/types";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function Home() {
  const [category, setCategory] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");

  const scores = useMemo(() => computeAllScores(), []);

  const filtered = useMemo(() => {
    let result = search.trim() ? searchTools(search) : getToolsByCategory(category);
    return [...result].sort((a, b) => (scores[b.slug] ?? 0) - (scores[a.slug] ?? 0));
  }, [category, search, scores]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          🚀 AI 增长榜单
        </h1>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          每周自动汇总 AI 工具的多维度增长数据，零手动维护
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {tools.length} 款产品 · 全自动评分 · 每周一更新
        </p>
      </header>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCategory("all"); }}
            placeholder="搜索工具名、描述或标签…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setCategory("all"); setSearch(""); }}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              category === "all" && !search
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            全部 ({tools.length})
          </button>
          {ALL_CATEGORIES.filter((c) => tools.some((t) => t.category === c)).map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setSearch(""); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                category === cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {CATEGORY_LABELS[cat]} ({tools.filter((t) => t.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs text-slate-400">
              <th className="py-3 pl-4 pr-2 w-12">#</th>
              <th className="py-3 pr-4">产品</th>
              <th className="py-3 pr-4 hidden sm:table-cell">分类</th>
              <th className="py-3 pr-4 text-right">热度分</th>
              <th className="py-3 pr-4 text-right">PH 票数</th>
              <th className="py-3 pr-4 text-right hidden md:table-cell">GitHub</th>
              <th className="py-3 pr-4 text-right hidden lg:table-cell">Chrome</th>
              <th className="py-3 pr-4 hidden lg:table-cell">定价</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  没有匹配的结果
                </td>
              </tr>
            ) : (
              filtered.map((tool, i) => {
                const data = getEntryData(tool.slug);
                const score = scores[tool.slug] ?? 0;
                return (
                  <tr
                    key={tool.slug}
                    className="border-b border-slate-800/50 transition hover:bg-slate-800/50"
                  >
                    <td className="py-3 pl-4 pr-2 text-slate-500 font-mono text-xs">
                      {i + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="group">
                        <div className="flex items-center gap-2">
                          <Link href={`/tool/${tool.slug}`} className="font-medium text-white hover:text-blue-400 transition">
                            {tool.name}
                          </Link>
                          <a href={tool.url} target="_blank" rel="noopener noreferrer"
                            className="text-slate-600 hover:text-slate-400 transition"
                            title="访问官网"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500 line-clamp-1 max-w-xs">
                          {tool.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                        {CATEGORY_LABELS[tool.category]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <ScoreBadge score={score} />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-xs text-slate-300 font-mono">
                        {data?.phVotes?.toLocaleString() ?? "-"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right hidden md:table-cell">
                      {data?.githubStars ? (
                        <span className="text-xs text-slate-300 font-mono">
                          ⭐ {data.githubStars.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{PRICING_LABELS[tool.pricing]}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
        <p>AI增长榜 · 每周一自动更新 · 数据来源：Product Hunt · GitHub · HuggingFace · Chrome Web Store</p>
        <p className="mt-1">评分规则：PH 票数 30% + PH 评论 10% + GitHub Stars 25% + HF Likes 15% + HF 下载 15% + Chrome 用户 20%</p>
      </footer>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 60 ? "text-emerald-400 bg-emerald-400/10" :
    score >= 40 ? "text-blue-400 bg-blue-400/10" :
    score >= 20 ? "text-yellow-400 bg-yellow-400/10" :
    "text-slate-500 bg-slate-400/10";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold font-mono ${color}`}>
      {score}
    </span>
  );
}
