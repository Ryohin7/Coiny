"use client";

import { motion } from "framer-motion";
import { PieChart, TrendingUp, ArrowUpRight } from "lucide-react";

const categories = [
  { name: "餐飲食品", amount: 4500, color: "bg-blue-500", percentage: 45 },
  { name: "居家生活", amount: 2800, color: "bg-purple-500", percentage: 28 },
  { name: "交通運輸", amount: 1500, color: "bg-pink-500", percentage: 15 },
  { name: "休閒娛樂", amount: 1200, color: "bg-amber-500", percentage: 12 },
];

export default function AnalysisPage() {
  return (
    <div className="p-6 space-y-8">
      <header className="pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">支出分析</h1>
        <p className="text-muted-foreground text-sm">2026年 3月</p>
      </header>

      {/* Chart Mockup */}
      <div className="flex justify-center items-center py-10 relative">
        <div className="w-64 h-64 rounded-full border-[20px] border-gray-100 dark:border-gray-900 relative flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Total</p>
            <p className="text-3xl font-bold">$12,450</p>
          </div>
          {/* Mockup Slices */}
          <div className="absolute inset-[-20px] rounded-full border-[20px] border-blue-500 border-r-transparent border-b-transparent border-l-transparent rotate-[20deg]" />
          <div className="absolute inset-[-20px] rounded-full border-[20px] border-purple-500 border-t-transparent border-b-transparent border-l-transparent rotate-[110deg]" />
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 gap-4">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass p-5 rounded-[2rem] flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${cat.color}`} />
              <div>
                <h4 className="font-semibold text-sm">{cat.name}</h4>
                <p className="text-[10px] text-muted-foreground">{cat.percentage}% 的總支出</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">${cat.amount}</p>
              <div className="flex items-center justify-end text-green-500 gap-0.5">
                <ArrowUpRight size={10} />
                <span className="text-[10px] font-medium">5%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} />
          <h4 className="font-bold text-sm">理財建議</h4>
        </div>
        <p className="text-xs opacity-80 leading-relaxed">
          您的「餐飲食品」支出比例較高。建議可以多利用載具發票領獎金，或調整外食頻率。
        </p>
      </div>
    </div>
  );
}
