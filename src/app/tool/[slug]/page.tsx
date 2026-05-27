import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { tools } from "@/data/tools";
import { CATEGORY_LABELS, PRICING_LABELS, type Category } from "@/data/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return { title: "未找到" };
  return {
    title: `${tool.name} — AI增长榜`,
    description: tool.description,
  };
}

function formatVisits(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition"
      >
        ← 返回榜单
      </Link>

      {/* Hero */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{tool.name}</h1>
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 transition"
          >
            访问官网 ↗
          </a>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tool.tags.map((tag) => (
            <span key={tag} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* Score Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{tool.totalScore.toFixed(1)}</div>
          <div className="mt-1 text-xs text-slate-500">综合评分</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
          <GrowthValue value={tool.visitGrowth} />
          <div className="mt-1 text-xs text-slate-500">月环比增长</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
          <div className="text-xl font-bold text-slate-200">{formatVisits(tool.monthlyVisits)}</div>
          <div className="mt-1 text-xs text-slate-500">月访问量</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
          <div className="text-xl font-bold text-yellow-400">{tool.userRating.toFixed(1)}</div>
          <div className="mt-1 text-xs text-slate-500">用户评分 / 5</div>
        </div>
      </div>

      {/* Detail breakdown */}
      <div className="mb-8 space-y-6">
        {/* Score Breakdown */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-300">评分明细</h2>
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <ScoreBar label="增长速度 (40%)" value={tool.growthScore} max={100} color="bg-blue-500" />
            <ScoreBar label="用户反馈 (30%)" value={tool.feedbackScore} max={100} color="bg-emerald-500" />
            <ScoreBar label="创新度 (30%)" value={tool.innovationScore} max={100} color="bg-purple-500" />
          </div>
        </section>

        {/* Info */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoItem label="分类" value={CATEGORY_LABELS[tool.category]} />
          <InfoItem label="定价" value={PRICING_LABELS[tool.pricing]} />
          <InfoItem label="国家" value={tool.country} />
          <InfoItem label="上线时间" value={tool.foundedAt} />
        </section>

        {tool.githubStars && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-300">GitHub</h2>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <span className="text-slate-400 text-sm">⭐ {tool.githubStars.toLocaleString()} Stars</span>
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-800 pt-6">
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          ← 返回榜单首页
        </Link>
      </footer>
    </div>
  );
}

function GrowthValue({ value }: { value: number }) {
  const isUp = value > 0;
  return (
    <div className={`text-xl font-bold ${isUp ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-slate-400"}`}>
      {isUp ? "+" : ""}{value.toFixed(1)}%
    </div>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-200">{value}</div>
    </div>
  );
}
