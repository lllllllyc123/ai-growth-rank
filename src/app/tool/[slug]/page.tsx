import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { tools } from "@/data/tools";
import { getScore, getEntryData } from "@/data/score";
import { CATEGORY_LABELS, PRICING_LABELS } from "@/data/types";

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
  return { title: `${tool.name} — AI增长榜`, description: tool.description };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) notFound();

  const score = getScore(slug);
  const data = getEntryData(slug);
  const hasData = !!(data?.phVotes || data?.githubStars || data?.hfLikes);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
        ← 返回榜单
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{tool.name}</h1>
          <a href={tool.url} target="_blank" rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 transition">
            访问官网 ↗
          </a>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tool.tags.map((tag) => (
            <span key={tag} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{tag}</span>
          ))}
        </div>
      </header>

      {/* Score Card */}
      <div className="mb-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <div className="text-4xl font-bold text-emerald-400">{score}</div>
          <div className="mt-1 text-sm text-slate-500">热度分（满分 100）</div>
          <p className="mt-2 text-xs text-slate-600">
            基于 Product Hunt · GitHub · HuggingFace 自动计算
          </p>
        </div>
      </div>

      {/* Info Grid */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoItem label="分类" value={CATEGORY_LABELS[tool.category]} />
        <InfoItem label="定价" value={PRICING_LABELS[tool.pricing]} />
        <InfoItem label="国家" value={tool.country} />
        <InfoItem label="上线时间" value={tool.foundedAt} />
      </section>

      {/* Auto Data */}
      {hasData && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">社区数据（自动抓取）</h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            {data?.phVotes !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">🏆 Product Hunt</span>
                <span className="text-slate-200 font-mono">
                  {data.phVotes.toLocaleString()} 票
                  {data.phReviews !== undefined && (
                    <span className="ml-1 text-xs text-slate-500">· {data.phReviews} 评论</span>
                  )}
                  {tool.phSlug && (
                    <a href={`https://www.producthunt.com/products/${tool.phSlug}`} target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-xs text-slate-500 hover:text-orange-400 transition">PH →</a>
                  )}
                </span>
              </div>
            )}
            {data?.githubStars && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">⭐ GitHub Stars</span>
                <span className="text-slate-200 font-mono">
                  {data.githubStars.toLocaleString()}
                  {tool.githubRepo && (
                    <a href={`https://github.com/${tool.githubRepo}`} target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-xs text-slate-500 hover:text-blue-400 transition">{tool.githubRepo}</a>
                  )}
                </span>
              </div>
            )}
            {data?.hfLikes !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">🤗 HuggingFace</span>
                <span className="text-slate-200 font-mono">
                  {data.hfLikes.toLocaleString()} likes
                  {data.hfDownloads !== undefined && (
                    <span className="ml-1 text-xs text-slate-500">· {data.hfDownloads.toLocaleString()} 下载</span>
                  )}
                  {tool.huggingfaceModel && (
                    <a href={`https://huggingface.co/${tool.huggingfaceModel}`} target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-xs text-slate-500 hover:text-yellow-400 transition">{tool.huggingfaceModel}</a>
                  )}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="border-t border-slate-800 pt-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition">
          ← 返回榜单首页
        </Link>
      </footer>
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
