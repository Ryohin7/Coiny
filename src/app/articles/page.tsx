"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ArrowRight, Clock, BookOpen, Calendar } from "lucide-react";

const ARTICLES = [
  {
    id: "smart-tracking",
    title: "為什麼口語記帳是未來？探索 Coiny 的設計哲學",
    date: "2026.05.10",
    category: "設計思維",
    excerpt: "傳統記帳 App 往往因為過於繁雜的介面讓人放棄。在 Coiny，我們相信最好的記帳方式就是不需要學習，直接對著 LINE 說話即可完成...",
    readTime: "5 min"
  },
  {
    id: "invoice-automation",
    title: "財政部載具自動對帳完全指南",
    date: "2026.05.08",
    category: "功能教學",
    excerpt: "漏掉發票就像丟掉錢。了解如何設定自動 Email 轉寄規則，讓 Coiny 每分每秒都在幫您自動整理支出明細，打造無感記帳環境。",
    readTime: "8 min"
  },
  {
    id: "pro-membership-benefits",
    title: "解鎖高級理財：Pro 會員功能深度解析",
    date: "2026.05.05",
    category: "產品更新",
    excerpt: "除了無限次同步，Pro 會員還能獲得哪些專屬報表？這篇文章將帶您一覽所有專屬於菁英會員的高階功能與權限設定。",
    readTime: "4 min"
  },
  {
    id: "saving-tips",
    title: "如何利用分類統計找出您的消費漏洞",
    date: "2026.05.01",
    category: "理財觀點",
    excerpt: "記帳只是第一步，分析才是關鍵。透過 Coiny 的視覺化圖表，我們可以輕鬆找出哪些是「想要」而非「需要」，優化每個月的財務結構。",
    readTime: "6 min"
  }
];

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#050505] text-[#1A1A1A] dark:text-[#E5E5E5] pb-32">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-[#F8F7F4]/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-black uppercase tracking-widest">返回首頁</span>
          </Link>
          <span className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Coiny Journal</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-24 space-y-24">
        <header className="space-y-6 max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter">專欄文章</h1>
          <p className="text-xl text-muted-foreground font-medium">
            深入探討理財美學、產品設計初衷，以及幫助您更好管理財務的小技巧。
          </p>
        </header>

        {/* Featured Article (First one) */}
        <section className="relative group">
          <Link href={`/articles/${ARTICLES[0].id}`} className="block">
            <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] p-12 md:p-20 border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative">
              <div className="flex flex-col md:flex-row gap-12 relative z-10">
                <div className="flex-1 space-y-8">
                  <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary">
                    <span className="bg-primary/10 px-3 py-1 rounded-md">{ARTICLES[0].category}</span>
                    <span className="opacity-40">{ARTICLES[0].date}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {ARTICLES[0].title}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed font-medium line-clamp-3">
                    {ARTICLES[0].excerpt}
                  </p>
                  <div className="flex items-center gap-6 pt-6 font-black text-sm uppercase tracking-widest">
                    <div className="flex items-center gap-2 opacity-40">
                      <Clock size={16} />
                      {ARTICLES[0].readTime}
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      閱讀全文
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
                <div className="md:w-1/3 aspect-square bg-gray-50 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center">
                  <BookOpen size={64} className="text-primary opacity-20" />
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ARTICLES.slice(1).map((article, idx) => (
            <Link key={idx} href={`/articles/${article.id}`} className="group">
              <article className="h-full bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-xl shadow-gray-100/50 dark:shadow-none flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1.5 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{article.date}</span>
                </div>
                <h3 className="text-2xl font-black mb-6 leading-tight group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-10 flex-grow line-clamp-4">
                  {article.excerpt}
                </p>
                <div className="pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between font-black text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-2 opacity-30">
                    <Clock size={12} />
                    {article.readTime}
                  </div>
                  <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                    View Post
                    <ArrowRight size={14} />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>

      <footer className="mt-40 py-20 px-6 border-t border-gray-200 dark:border-gray-800 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 opacity-20">
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">© 2026 Coiny Journal.</p>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.5em]">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
