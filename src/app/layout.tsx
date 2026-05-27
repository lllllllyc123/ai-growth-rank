import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI增长榜 — AI工具增长排名与趋势追踪",
  description: "定期汇总、评测AI相关工具与产品的流量、用户增长、行业热度并给出排名，为开发者、投资人与AI爱好者提供决策参考。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
