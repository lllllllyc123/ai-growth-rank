"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { tools, getToolsByCategory, searchTools } from "@/data/tools";
import { CATEGORY_LABELS, PRICING_LABELS, type Category, type AITool } from "@/data/types";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function Home() {
  const [category, setCategory] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"totalScore" | "visitGrowth" | "monthlyVisits">("totalScore");

  const filtered = useMemo(() => {
    let result = search.trim() ? searchTools(search) : getToolsByCategory(category);
    return [...result].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [category, search, sortBy]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          🚀 AI 增长榜单
        </h1>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          每周汇总 AI 工具的增长数据，为开发者、投资人与 AI 爱好者提供决策参考
        </p>
        <p className="mt-1 text-xs text-slate-500">
          更新时间：2026-05-27 · 收录 {tools.length} 款产品
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

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>排序：</span>
          {([
            ["totalScore", "综合评分"],
            ["visitGrowth", "月增长"],
            ["monthlyVisits", "月访问量"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`rounded px-2.5 py-1 transition ${
                sortBy === key
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
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
              <th className="py-3 pr-4 text-right">综合评分</th>
              <th className="py-3 pr-4 text-right hidden md:table-cell">月访问量</th>
              <th className="py-3 pr-4 text-right">月增长</th>
              <th className="py-3 pr-4 hidden lg:table-cell">定价</th>
              <th className="py-3 pr-4 hidden lg:table-cell text-right">排名变化</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  没有匹配的结果
                </td>
              </tr>
            ) : (
              filtered.map((tool, i) => (
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
                    <ScoreBadge score={tool.totalScore} />
                  </td>
                  <td className="py-3 pr-4 text-right hidden md:table-cell">
                    <span className="text-slate-300">{formatVisits(tool.monthlyVisits)}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <GrowthBadge value={tool.visitGrowth} />
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell">
                    <span className="text-xs text-slate-400">{PRICING_LABELS[tool.pricing]}</span>
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell text-right">
                    <RankChange change={tool.rankChange} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
        <p>AI增长榜 · 每周五更新 · 数据来源：公开平台指标、流量监测工具、用户反馈</p>
        <p className="mt-1">评分规则：增长速度 40% + 用户反馈 30% + 创新度 30%</p>
      </footer>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? "text-green-400 bg-green-400/10" :
    score >= 80 ? "text-blue-400 bg-blue-400/10" :
    score >= 70 ? "text-yellow-400 bg-yellow-400/10" :
    "text-slate-400 bg-slate-400/10";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

function GrowthBadge({ value }: { value: number }) {
  const isUp = value > 0;
  const cls = isUp
    ? value > 50 ? "text-emerald-400" : "text-green-400"
    : value < 0 ? "text-red-400" : "text-slate-400";
  const arrow = isUp ? "▲" : value < 0 ? "▼" : "→";
  return (
    <span className={`text-xs font-medium ${cls}`}>
      {arrow} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function RankChange({ change }: { change?: number }) {
  if (change === undefined) return <span className="text-slate-600 text-xs">NEW</span>;
  if (change === 0) return <span className="text-slate-500 text-xs">—</span>;
  const isUp = change > 0;
  return (
    <span className={`text-xs font-medium ${isUp ? "text-green-400" : "text-red-400"}`}>
      {isUp ? "↑" : "↓"} {Math.abs(change)}
    </span>
  );
}

function formatVisits(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
