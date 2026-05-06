"use client";

import { motion } from "framer-motion";
import { Plus, CreditCard, ShoppingBag, Utensils, ReceiptText, Loader2, Trash2, Edit3 } from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { profile, userId } = useLiff();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
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

    fetchRecords();
  }, [userId]);

  const totalAmount = records.reduce((sum, rec) => {
    // 僅加總未對帳的手動支出或所有發票支出 (避免重複計算)
    if (rec.type === "invoice" || (rec.type === "manual" && !rec.matched)) {
      return sum + (rec.amount || rec.totalAmount || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="p-6 space-y-8 pb-24">
      {/* Header */}
      <header className="flex justify-between items-end pt-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">👋 你好，{profile?.displayName || "用戶"}</p>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">記帳明細</h1>
        </div>
        <div className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform">
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
          <h2 className="text-4xl font-bold mt-1">${totalAmount.toLocaleString()}</h2>
          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 dark:bg-black/10 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md">
              {records.length} 筆記錄
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Loader2 className="animate-spin" />
              <p className="text-sm">載入資料中...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <ReceiptText size={48} strokeWidth={1} className="opacity-30" />
              <p className="text-sm">還沒有任何記帳記錄</p>
              <p className="text-xs opacity-60">用 LINE 傳送發票或手動新增吧！</p>
            </div>
          ) : (
            records.map((record, index) => {
              const isInvoice = record.type === "invoice";
              const amount = isInvoice ? record.totalAmount : record.amount;
              const storeName = isInvoice ? record.store : (record.matched ? "已對帳" : "手動記帳");
              
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedRecord(record)}
                  className="glass p-4 rounded-3xl flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl text-xl">
                    {record.icon || (isInvoice ? "🧾" : "📝")}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-semibold text-sm truncate">{storeName}</h4>
                    <p className="text-[10px] text-muted-foreground">{record.date} • {record.category || "未分類"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">-${amount.toLocaleString()}</p>
                    <p className={record.matched || isInvoice ? "text-[10px] text-green-500 font-medium" : "text-[10px] text-amber-500 font-medium"}>
                      {isInvoice ? "● 已彙整" : (record.matched ? "● 已對帳" : "○ 待對帳")}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!selectedRecord || !confirm("確定要刪除這筆交易嗎？")) return;
    try {
      const res = await fetch(`/api/expenses/${selectedRecord.id}?type=${selectedRecord.type}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecords(records.filter(r => r.id !== selectedRecord.id));
        setSelectedRecord(null);
      }
    } catch (error) {
      alert("刪除失敗");
    }
  };

  const handleUpdateCategory = async (newCategory: string, newIcon: string) => {
    if (!selectedRecord) return;
    try {
      const res = await fetch(`/api/expenses/${selectedRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory, icon: newIcon, type: selectedRecord.type }),
      });
      if (res.ok) {
        setRecords(records.map(r => r.id === selectedRecord.id ? { ...r, category: newCategory, icon: newIcon } : r));
        setSelectedRecord(null);
        setIsEditing(false);
      }
    } catch (error) {
      alert("更新失敗");
    }
  };

  // 內建分類選項供編輯使用
  const CATEGORY_OPTIONS = [
    { name: "餐飲", icon: "🍱" },
    { name: "超商", icon: "🏪" },
    { name: "生活雜貨", icon: "🧻" },
    { name: "交通", icon: "🚗" },
    { name: "購物", icon: "🛍️" },
    { name: "娛樂", icon: "🎮" },
    { name: "醫療", icon: "🏥" },
    { name: "其他", icon: "💰" },
  ];

  return (
    <div className="p-6 space-y-8 pb-24">
      {/* ... (Header and Summary Card code remains the same) */}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedRecord(null); setIsEditing(false); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] p-8 relative z-10 shadow-2xl overflow-hidden"
          >
            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{selectedRecord.icon || "💰"}</span>
                      <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-muted-foreground">
                        {selectedRecord.category || "未分類"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{selectedRecord.store || (selectedRecord.matched ? "對帳交易" : "手動記帳")}</h3>
                    <p className="text-muted-foreground text-sm">{selectedRecord.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl hover:bg-gray-200 transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => { setSelectedRecord(null); setIsEditing(false); }}
                      className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl"
                    >
                      <Plus size={18} className="rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-b border-gray-100 dark:border-gray-800 py-6 max-h-[40vh] overflow-y-auto space-y-4">
                  {selectedRecord.items && selectedRecord.items.length > 0 ? (
                    selectedRecord.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex-1 pr-4">{item.name}</span>
                        <span className={`font-medium ${item.price < 0 ? "text-red-500" : ""}`}>
                          {item.price < 0 ? "" : "$"}{item.price.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">尚無明細資料</p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-lg">總計金額</span>
                  <span className="text-2xl font-black">
                    ${(selectedRecord.totalAmount || selectedRecord.amount).toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleDelete}
                    className="bg-red-50 dark:bg-red-950/30 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={18} /> 刪除
                  </button>
                  <button 
                    onClick={() => setSelectedRecord(null)}
                    className="bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    關閉
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">修改分類</h3>
                <div className="grid grid-cols-4 gap-4">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleUpdateCategory(cat.name, cat.icon)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:scale-105 transition-transform"
                    >
                      <span className="text-3xl">{cat.icon}</span>
                      <span className="text-[10px] font-bold">{cat.name}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-gray-100 dark:bg-gray-800 py-4 rounded-2xl font-bold"
                >
                  取消
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
