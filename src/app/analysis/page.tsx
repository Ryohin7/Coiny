"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, PieChart as PieChartIcon, TrendingUp, TrendingDown, ReceiptText } from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom SVG Pie Chart Component
interface ChartData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

const PieChart = ({ data }: { data: ChartData[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  if (total === 0) {
    return (
      <div className="relative w-64 h-64 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center text-muted-foreground text-sm">
          尚無資料
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90">
        {data.map((item, index) => {
          if (item.value === 0) return null;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += item.value / total;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = item.value / total > 0.5 ? 1 : 0;
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(" ");

          return (
            <motion.path
              key={item.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              d={pathData}
              fill={item.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          );
        })}
        {/* Inner circle for donut chart effect */}
        <circle cx="0" cy="0" r="0.6" fill="currentColor" className="text-white dark:text-[#050505]" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">總支出</span>
        <span className="text-2xl font-black">${total.toLocaleString()}</span>
      </div>
    </div>
  );
};

const COLORS = [
  "#000000", "#4B5563", "#9CA3AF", "#D1D5DB", "#1F2937", 
  "#374151", "#6B7280", "#E5E7EB", "#111827", "#4B5563"
];

const DARK_COLORS = [
  "#FFFFFF", "#E5E7EB", "#9CA3AF", "#4B5563", "#D1D5DB",
  "#F3F4F6", "#F9FAFB", "#6B7280", "#374151", "#1F2937"
];

export default function AnalysisPage() {
  const { userId } = useLiff();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<"month" | "year">("month");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/expenses?userId=${userId}`);
        const data = await res.json();
        setRecords(data.records || []);
      } catch (error) {
        console.error("Failed to fetch records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [userId]);

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const recDate = new Date(rec.date);
      if (viewType === "month") {
        return recDate.getFullYear() === selectedDate.getFullYear() && 
               recDate.getMonth() === selectedDate.getMonth();
      } else {
        return recDate.getFullYear() === selectedDate.getFullYear();
      }
    });
  }, [records, selectedDate, viewType]);

  const stats = useMemo(() => {
    const expenses: Record<string, { total: number; icon: string; items: any[] }> = {};
    const incomes: Record<string, { total: number; icon: string; items: any[] }> = {};
    let totalExpense = 0;
    let totalIncome = 0;

    filteredRecords.forEach(rec => {
      const isIncome = rec.isIncome || false;
      const amount = rec.totalAmount || rec.amount || 0;
      const cat = rec.category || "未分類";
      const icon = rec.icon || (rec.type === "invoice" ? "🧾" : "💰");

      if (isIncome) {
        if (!incomes[cat]) incomes[cat] = { total: 0, icon, items: [] };
        incomes[cat].total += amount;
        incomes[cat].items.push(rec);
        totalIncome += amount;
      } else {
        if (!expenses[cat]) expenses[cat] = { total: 0, icon, items: [] };
        expenses[cat].total += amount;
        expenses[cat].items.push(rec);
        totalExpense += amount;
      }
    });

    const expenseChartData: ChartData[] = Object.entries(expenses)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data], i) => ({
        name,
        value: data.total,
        color: COLORS[i % COLORS.length],
        icon: data.icon
      }));

    const incomeChartData: ChartData[] = Object.entries(incomes)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data], i) => ({
        name,
        value: data.total,
        color: COLORS[i % COLORS.length],
        icon: data.icon
      }));

    return { expenses, incomes, totalExpense, totalIncome, expenseChartData, incomeChartData };
  }, [filteredRecords]);

  const nextDate = () => {
    const next = new Date(selectedDate);
    if (viewType === "month") next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);
    setSelectedDate(next);
  };

  const prevDate = () => {
    const prev = new Date(selectedDate);
    if (viewType === "month") prev.setMonth(prev.getMonth() - 1);
    else prev.setFullYear(prev.getFullYear() - 1);
    setSelectedDate(prev);
  };

  const formatSelectedDate = () => {
    if (viewType === "month") {
      return `${selectedDate.getFullYear()}年 ${selectedDate.getMonth() + 1}月`;
    }
    return `${selectedDate.getFullYear()}年度`;
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Header */}
      <header className="space-y-4 pt-4">
        
        {/* Date Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <button onClick={prevDate} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm">{formatSelectedDate()}</span>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => setViewType("month")}
                className={cn("text-[10px] px-2 py-0.5 rounded-full transition-all", viewType === "month" ? "bg-black text-white dark:bg-white dark:text-black font-bold" : "text-muted-foreground")}
              >
                月度
              </button>
              <button 
                onClick={() => setViewType("year")}
                className={cn("text-[10px] px-2 py-0.5 rounded-full transition-all", viewType === "year" ? "bg-black text-white dark:bg-white dark:text-black font-bold" : "text-muted-foreground")}
              >
                年度
              </button>
            </div>
          </div>
          <button onClick={nextDate} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="animate-spin" />
          <p className="text-sm">分析數據中...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ReceiptText size={48} strokeWidth={1} className="opacity-30" />
          <p className="text-sm">此期間尚無記帳數據</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black text-white dark:bg-white dark:text-black p-4 rounded-[2rem] space-y-1 shadow-lg">
              <div className="flex items-center gap-1.5 opacity-70">
                <TrendingDown size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">總支出</span>
              </div>
              <p className="text-xl font-black">${stats.totalExpense.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-[2rem] space-y-1 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-green-500">
                <TrendingUp size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">總收入</span>
              </div>
              <p className="text-xl font-black">${stats.totalIncome.toLocaleString()}</p>
            </div>
          </div>

          {/* Pie Chart Section */}
          <div className="flex flex-col items-center gap-6">
             <PieChart data={stats.expenseChartData} />
             
             {/* Legend */}
             <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full px-2">
               {stats.expenseChartData.slice(0, 6).map((item) => (
                 <div key={item.name} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                   <div className="flex flex-col">
                     <span className="text-xs font-bold truncate max-w-[80px]">{item.name}</span>
                     <span className="text-[10px] text-muted-foreground">
                        {Math.round((item.value / stats.totalExpense) * 100)}%
                     </span>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Details List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold px-1">消費明細</h3>
            <div className="space-y-3">
              {Object.entries(stats.expenses)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([name, data]) => (
                <div key={name} className="glass overflow-hidden rounded-[2rem] transition-all duration-300">
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === name ? null : name)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-2xl text-lg">
                      {data.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-sm">{name}</h4>
                      <p className="text-[10px] text-muted-foreground">{data.items.length} 筆交易</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="font-bold text-sm">-${data.total.toLocaleString()}</p>
                      {expandedCategory === name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {expandedCategory === name && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800"
                      >
                        <div className="p-4 space-y-3">
                          {data.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.note || item.store || "無備註"}</span>
                                <span className="text-[9px] text-muted-foreground">{item.date}</span>
                              </div>
                              <span className="font-bold">${(item.totalAmount || item.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
