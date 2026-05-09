"use client";

import { motion } from "framer-motion";

interface SummaryCardProps {
  totalExpense: number;
  totalIncome: number;
  monthlyBalance: number;
}

export function SummaryCard({ totalExpense, totalIncome, monthlyBalance }: SummaryCardProps) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary text-white p-5 rounded-[2rem] shadow-lg relative overflow-hidden group"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <p className="opacity-70 text-xs font-bold uppercase tracking-wider mb-1 text-white">本月總支出</p>
              <p className="text-2xl font-black text-white">{totalExpense.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="opacity-70 text-xs font-bold uppercase tracking-wider mb-1 text-white">本月總收入</p>
              <p className="text-2xl font-black text-white">{totalIncome.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center">
            <p className="opacity-80 text-xs font-bold uppercase tracking-widest text-white">結餘</p>
            <p className="text-sm font-black tracking-tight text-white">{monthlyBalance.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
