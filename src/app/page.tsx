"use client";

import { motion } from "framer-motion";
import { Plus, CreditCard, ShoppingBag, Utensils, ReceiptText } from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";

const expenses: { id: number; store: string; amount: number; date: string; items: string[]; matched: boolean }[] = [];

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
          <h2 className="text-4xl font-bold mt-1">$0</h2>
          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 dark:bg-black/10 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md">
              尚無支出記錄
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
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <ReceiptText size={48} strokeWidth={1} className="opacity-30" />
              <p className="text-sm">還沒有任何記帳記錄</p>
              <p className="text-xs opacity-60">用 LINE 傳送發票或手動新增吧！</p>
            </div>
          ) : (
            expenses.map((expense, index) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
