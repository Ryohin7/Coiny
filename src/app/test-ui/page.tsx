"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, CreditCard, ShoppingBag, Utensils, ReceiptText, Loader2, Trash2, Edit3, Check, ChevronLeft, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";
import { useEffect, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TestUIPage() {
  const { profile, userId } = useLiff();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<{name: string, icon: string}[]>([]);

  const fetchRecords = async () => {
    if (!userId) return;
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

  useEffect(() => {
    if (userId) fetchRecords();
  }, [userId]);

  const totalExpense = records.reduce((sum, rec) => {
    if (rec.isIncome) return sum;
    if (rec.type === "invoice" || (rec.type === "manual" && !rec.matched)) {
      return sum + (rec.amount || rec.totalAmount || 0);
    }
    return sum;
  }, 0);

  const totalIncome = records.reduce((sum, rec) => {
    if (rec.isIncome) return sum + (rec.amount || 0);
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-[#1A1A1A] dark:text-[#F8F9FA] font-sans pb-32">
      {/* Top Bar */}
      <header className="p-6 flex justify-between items-center bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 sticky top-0 z-30">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {profile?.displayName?.charAt(0) || "U"}
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Welcome back</p>
                <h1 className="text-sm font-black">{profile?.displayName || "User"}</h1>
            </div>
        </div>
        <Link href="/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ReceiptText size={20} />
        </Link>
      </header>

      <main className="p-6 space-y-8 max-w-2xl mx-auto">
        {/* Bento Summary Grid */}
        <div className="grid grid-cols-2 gap-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-2 bg-blue-600 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl shadow-blue-500/20"
            >
                <div className="relative z-10 space-y-1">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Current Balance</p>
                    <h2 className="text-4xl font-black">${(totalIncome - totalExpense).toLocaleString()}</h2>
                </div>
                <Wallet className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#151515] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-between"
            >
                <div className="bg-green-500/10 w-10 h-10 rounded-2xl flex items-center justify-center text-green-500 mb-4">
                    <ArrowDownLeft size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Income</p>
                    <p className="text-xl font-black text-green-500">${totalIncome.toLocaleString()}</p>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#151515] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-between"
            >
                <div className="bg-red-500/10 w-10 h-10 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                    <ArrowUpRight size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Expense</p>
                    <p className="text-xl font-black text-red-500">${totalExpense.toLocaleString()}</p>
                </div>
            </motion.div>
        </div>

        {/* Transactions Section */}
        <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black italic tracking-tight">Timeline</h3>
                <span className="text-[10px] font-bold px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full">Last 30 Days</span>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="text-xs font-bold text-muted-foreground">Synchronizing...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {records.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-[#151515] rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                            <p className="text-muted-foreground font-bold">No data found</p>
                        </div>
                    ) : (
                        Object.entries(
                            records.reduce((groups: any, record) => {
                                const date = record.date;
                                if (!groups[date]) groups[date] = [];
                                groups[date].push(record);
                                return groups;
                            }, {})
                        ).sort((a, b) => b[0].localeCompare(a[0])).map(([dateStr, groupRecords]: [string, any]) => {
                            const dateObj = new Date(dateStr);
                            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
                            const dd = String(dateObj.getDate()).padStart(2, "0");
                            
                            return (
                                <div key={dateStr} className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-black border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground leading-none mb-1">{mm}</span>
                                            <span className="text-sm font-black leading-none">{dd}</span>
                                        </div>
                                        <div className="h-[2px] flex-1 bg-gray-100 dark:bg-gray-900 rounded-full" />
                                    </div>

                                    <div className="grid gap-3">
                                        {groupRecords.map((record: any, idx: number) => (
                                            <motion.div
                                                key={record.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group bg-white dark:bg-[#151515] p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:border-blue-500/50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-black flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                        {record.icon || "💰"}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-sm truncate">{record.category || "General"}</h4>
                                                            {record.type === "invoice" && (
                                                                <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-sm uppercase">Auto</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground truncate font-medium">
                                                            {record.type === "invoice" 
                                                                ? record.items?.map((i: any) => i.name).join(", ") 
                                                                : record.note || "No remark"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className={cn(
                                                        "text-lg font-black tracking-tight",
                                                        record.isIncome ? "text-green-500" : "text-[#1A1A1A] dark:text-white"
                                                    )}>
                                                        {record.isIncome ? "+" : "-"}${ (record.amount || record.totalAmount || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
        <button className="bg-blue-600 text-white p-6 rounded-full shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all flex items-center gap-3 font-black tracking-tight px-8">
            <Plus size={24} strokeWidth={3} />
            ADD RECORD
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-900 flex items-center justify-around px-8 z-30">
        <Link href="/test-ui" className="flex flex-col items-center gap-1 text-blue-600">
            <Wallet size={24} strokeWidth={2.5} />
            <span className="text-[8px] font-black uppercase">Home</span>
        </Link>
        <Link href="/analysis" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-blue-600 transition-colors">
            <ReceiptText size={24} />
            <span className="text-[8px] font-black uppercase">Stats</span>
        </Link>
      </nav>
    </div>
  );
}
