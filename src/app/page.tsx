"use client";

import { motion } from "framer-motion";
import { Plus, CreditCard, ShoppingBag, Utensils } from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";

const expenses = [
  { id: 1, store: "和樂家居", amount: 378, date: "2026/03/01", items: ["不鏽鋼咖啡杯", "環保購物袋"], matched: true },
  { id: 2, store: "手動記帳", amount: 69, date: "2026/03/01", items: [], matched: false },
  { id: 3, store: "全家便利商店", amount: 45, date: "2026/02/28", items: ["拿鐵咖啡"], matched: true },
];

export default function HomePage() {
  const { profile } = useLiff();

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-end pt-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">👋 你好，{profile?.displayName || "用戶"}</p>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">記帳明細</h1>
        </div>
        <div className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-2xl shadow-lg">
          <Plus size={24} />
        </div>
      </header>

      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black dark:bg-white text-white dark:text-black p-6 rounded-[2.5rem] space-y-4 shadow-2xl relative overflow-hidden group"
      >
        <div className="relative z-10">
          <p className="opacity-70 text-sm font-medium">本月總支出</p>
          <h2 className="text-4xl font-bold mt-1">$12,450</h2>
          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 dark:bg-black/10 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md">
              ↑ 12% vs 上月
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <CreditCard size={120} strokeWidth={1} />
        </div>
      </motion.div>

      {/* Expense List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold px-1">最近交易</h3>
        <div className="space-y-3">
          {expenses.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-4 rounded-3xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl">
                {expense.store.includes("食") ? <Utensils size={20} /> : <ShoppingBag size={20} />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{expense.store}</h4>
                <p className="text-xs text-muted-foreground">{expense.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">-${expense.amount}</p>
                <p className={expense.matched ? "text-[10px] text-green-500 font-medium" : "text-[10px] text-amber-500 font-medium"}>
                  {expense.matched ? "● 已對帳" : "○ 待對帳"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
