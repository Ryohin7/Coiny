"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Smartphone, Receipt, Sparkles, PieChart } from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden relative w-full">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm md:max-w-4xl lg:max-w-5xl flex flex-col md:flex-row items-center justify-center z-10 gap-12 md:gap-20"
      >
        {/* Left side: Header & CTA */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 w-full">
          <motion.div variants={itemVariants} className="space-y-6 flex flex-col items-center md:items-start">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-tr from-primary to-[#F4A261] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-6 hover:rotate-0 transition-transform duration-500">
              <span className="text-5xl md:text-6xl drop-shadow-md">🪙</span>
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mt-4 mb-4 text-gradient leading-tight">Coiny</h1>
              <p className="text-base md:text-xl font-bold text-muted-foreground tracking-wide">你的專屬智能記帳管家</p>
              <p className="text-sm md:text-base text-muted-foreground/80 mt-4 max-w-xs md:max-w-sm">
                全自動載具對帳、LINE 隨手記帳與強大 AI 分類，讓管理財務變得前所未有的簡單與高級。
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full max-w-xs pt-8 md:pt-12">
            <Link 
              href="/trade"
              className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              進入記帳
              <ArrowRight size={20} />
            </Link>
            <p className="text-xs md:text-xs text-muted-foreground mt-6 md:mt-8 uppercase tracking-widest font-bold opacity-50 md:text-left text-center">Smart Expense Tracking</p>
          </motion.div>
        </div>

        {/* Right side: Feature Cards */}
        <motion.div variants={itemVariants} className="flex-1 w-full grid grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/40 dark:border-gray-800 text-left space-y-4 hover:border-primary/50 hover:shadow-lg transition-all group">
            <div className="bg-orange-50 dark:bg-orange-900/20 w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Smartphone size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="font-bold text-sm md:text-lg">LINE 記帳</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">隨手傳送，即時記錄。支援文字與圖片快速記帳。</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/40 dark:border-gray-800 text-left space-y-4 hover:border-primary/50 hover:shadow-lg transition-all group translate-y-0 md:translate-y-8">
            <div className="bg-orange-50 dark:bg-orange-900/20 w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Receipt size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="font-bold text-sm md:text-lg">載具匯入</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">綁定財政部手機條碼，消費明細自動匯入對帳。</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/40 dark:border-gray-800 text-left space-y-4 hover:border-primary/50 hover:shadow-lg transition-all group">
            <div className="bg-orange-50 dark:bg-orange-900/20 w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Sparkles size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="font-bold text-sm md:text-lg">智能分類</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">AI 幫你自動歸類消費項目，省去繁瑣的手動設定。</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-white/40 dark:border-gray-800 text-left space-y-4 hover:border-primary/50 hover:shadow-lg transition-all group translate-y-0 md:translate-y-8">
            <div className="bg-orange-50 dark:bg-orange-900/20 w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <PieChart size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="font-bold text-sm md:text-lg">圖表分析</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">一眼看懂收支流向，精緻的視覺化圖表幫助理財。</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
