"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, Smartphone, Receipt, Sparkles, 
  PieChart, ShieldCheck, Zap, Globe, Menu, X,
  UserPlus
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  } as const;

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  } as const;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F7F4] dark:bg-[#050505] text-[#1A1A1A] dark:text-[#E5E5E5] selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#F8F7F4]/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Coiny</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link href="/faq" className="text-sm font-bold hover:text-primary transition-colors">常見問題</Link>
            <Link href="/articles" className="text-sm font-bold hover:text-primary transition-colors">專欄文章</Link>
            <Link href="/trade" className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              立即開始
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-black dark:text-white">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-20 w-full bg-[#F8F7F4] dark:bg-[#050505] border-b border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-6 shadow-xl"
          >
            <Link href="/faq" className="text-lg font-bold">常見問題</Link>
            <Link href="/articles" className="text-lg font-bold">專欄文章</Link>
            <Link href="/trade" className="text-lg font-bold text-primary">立即開始</Link>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-12"
          >
            <motion.span variants={fadeIn} className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
              Innovative Wealth Management
            </motion.span>
            <motion.h1 variants={fadeIn} className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05]">
              重新定義<br />
              <span className="text-primary italic">您的金流美學</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
              Coiny 結合載具自動對帳與 LINE 隨手記帳，為追求質感的您，打造最簡約高級的財務管理體驗。
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
              <Link 
                href="/trade" 
                className="group w-full sm:w-auto bg-[#1A1A1A] dark:bg-white text-white dark:text-black px-12 py-6 rounded-full font-black text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/10"
              >
                開始免費使用
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="py-24 px-6 bg-white dark:bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-[3rem] overflow-hidden">
            <div className="bg-[#F8F7F4] dark:bg-[#050505] p-12 md:p-24 space-y-8 group hover:bg-white dark:hover:bg-black transition-colors duration-500">
              <Smartphone size={32} className="text-primary mb-8" />
              <h3 className="text-3xl font-black tracking-tighter">LINE 隨手記帳</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-lg">
                無需下載多餘 App，直接在 LINE 對話框輸入金額與項目。支援自動加減算法，讓您在忙碌中也能精確記錄每一筆開銷。
              </p>
            </div>
            <div className="bg-[#F8F7F4] dark:bg-[#050505] p-12 md:p-24 space-y-8 group hover:bg-white dark:hover:bg-black transition-colors duration-500">
              <Receipt size={32} className="text-primary mb-8" />
              <h3 className="text-3xl font-black tracking-tighter">財政部載具匯入</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-lg">
                串接財政部電子發票 API，消費明細自動同步。系統會聰明地幫您對帳，漏記的消費一鍵補上，確保帳務完整。
              </p>
            </div>
            <div className="bg-[#F8F7F4] dark:bg-[#050505] p-12 md:p-24 space-y-8 group hover:bg-white dark:hover:bg-black transition-colors duration-500">
              <PieChart size={32} className="text-primary mb-8" />
              <h3 className="text-3xl font-black tracking-tighter">視覺化數據分析</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-lg">
                透過精緻的圖表，一眼洞察您的收支流向。分類統計功能幫助您找出不必要的開支，優化您的財務分配。
              </p>
            </div>
            <div className="bg-[#F8F7F4] dark:bg-[#050505] p-12 md:p-24 space-y-8 group hover:bg-white dark:hover:bg-black transition-colors duration-500">
              <ShieldCheck size={32} className="text-primary mb-8" />
              <h3 className="text-3xl font-black tracking-tighter">Pro 會員制度</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-lg">
                升級 Pro 會員享受無限載具對帳、自定義分類圖示以及進階報告。提供一次性付費方案，給您永久的尊榮體驗。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-24">
          <div className="flex-1 space-y-12">
            <div className="inline-block p-5 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none">
              <Zap size={36} className="text-primary" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1]">
              記帳，不該是<br />生活的累贅
            </h2>
            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0" />
                <div>
                  <p className="font-black text-2xl mb-2">自動解析口語描述</p>
                  <p className="text-muted-foreground text-lg">輸入「中餐120 飲料35 優惠扣10」，系統自動精確運算存入 145 元。</p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0" />
                <div>
                  <p className="font-black text-2xl mb-2">智慧關鍵字匹配</p>
                  <p className="text-muted-foreground text-lg">根據消費行為自動將項目歸類至餐飲、交通或購物，無需手動選擇分類。</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-[4rem] aspect-[4/5] overflow-hidden relative group shadow-2xl border border-gray-100 dark:border-gray-800">
             <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent">
                <Smartphone className="w-40 h-40 text-primary opacity-10 group-hover:scale-110 transition-transform duration-1000 ease-out" />
             </div>
             <div className="absolute bottom-12 left-12 right-12 p-8 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Interface Preview</p>
                <p className="font-bold text-lg">簡約而不簡單的介面設計，專為移動端優化。</p>
             </div>
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="py-40 px-6 bg-[#1A1A1A] text-white rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto text-center space-y-24">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-8xl font-black tracking-tight leading-tight">解鎖全部潛力</h2>
            <p className="text-gray-400 text-xl md:text-2xl max-w-2xl mx-auto font-medium">
              專為追求極致理財效率的您設計。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-12 border border-gray-800 rounded-[3.5rem] hover:bg-gray-800/40 transition-all duration-500 text-left">
              <Globe size={48} className="text-primary mb-10" />
              <h4 className="text-3xl font-black mb-6 tracking-tight">無限同步</h4>
              <p className="text-gray-400 text-lg leading-relaxed">解除每日載具對帳頻率限制，隨時隨地同步最新財政部帳務資訊。</p>
            </div>
            <div className="p-12 border border-gray-800 rounded-[3.5rem] hover:bg-gray-800/40 transition-all duration-500 text-left">
              <UserPlus size={48} className="text-primary mb-10" />
              <h4 className="text-3xl font-black mb-6 tracking-tight">高度自訂</h4>
              <p className="text-gray-400 text-lg leading-relaxed">自定義分類關鍵字與完整的圖示庫，打造完全屬於您的記帳系統。</p>
            </div>
            <div className="p-12 border border-gray-800 rounded-[3.5rem] hover:bg-gray-800/40 transition-all duration-500 text-left">
              <Zap size={48} className="text-primary mb-10" />
              <h4 className="text-3xl font-black mb-6 tracking-tight">優先更新</h4>
              <p className="text-gray-400 text-lg leading-relaxed">享有優先的開發團隊支援服務，並第一時間獲得全新功能的搶先測試。</p>
            </div>
          </div>

          <div className="pt-12">
            <Link href="/trade" className="inline-block bg-white text-black px-16 py-7 rounded-full font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10">
              升級為 PRO 會員
            </Link>
            <p className="mt-8 text-gray-500 font-bold tracking-widest text-sm uppercase">One-time payment, lifetime access</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-gray-200 dark:border-gray-800 bg-[#F8F7F4] dark:bg-[#050505]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg" />
              <span className="text-2xl font-black tracking-tighter uppercase">Coiny</span>
            </Link>
            <p className="text-muted-foreground text-lg max-w-sm leading-relaxed font-medium">
              Coiny 致力於提供最直覺、最美觀的記帳工具。讓理財不再是一項任務，而是一種生活美學。
            </p>
          </div>
          <div>
            <h5 className="font-black mb-8 uppercase tracking-[0.2em] text-xs opacity-40">產品</h5>
            <ul className="space-y-6 text-lg font-black">
              <li><Link href="/faq" className="hover:text-primary transition-colors">常見問題</Link></li>
              <li><Link href="/articles" className="hover:text-primary transition-colors">專欄文章</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">隱私政策</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black mb-8 uppercase tracking-[0.2em] text-xs opacity-40">聯繫</h5>
            <ul className="space-y-6 text-lg font-black">
              <li><Link href="https://line.me" className="hover:text-primary transition-colors">LINE 客服</Link></li>
              <li><Link href="mailto:contact@coiny.tw" className="hover:text-primary transition-colors">合作洽談</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-32 flex flex-col md:flex-row justify-between text-[11px] font-black uppercase tracking-[0.4em] opacity-20">
          <p>© 2026 Coiny Team. All Rights Reserved.</p>
          <p>Excellence in simple finance.</p>
        </div>
      </footer>
    </div>
  );
}
