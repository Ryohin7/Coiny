"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, ChevronLeft, Trash2, Tag, 
  Settings2, Check, X, Loader2 
} from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

// 系統預設分類
const DEFAULT_CATEGORIES = [
  { name: "餐飲", icon: "🍱", keywords: ["咖啡", "麵包", "早餐", "飲料", "珍奶"] },
  { name: "超商", icon: "🏪", keywords: ["統一超商", "全家", "7-11"] },
  { name: "生活雜貨", icon: "🧻", keywords: ["衛生紙", "洗衣精", "沐浴乳"] },
  { name: "交通", icon: "🚗", keywords: ["停車費", "GOGORO", "加油"] },
  { name: "購物", icon: "🛍️", keywords: ["衣服", "鞋子", "蝦皮"] },
  { name: "醫療", icon: "🏥", keywords: ["診所", "藥局", "看病"] },
];

export default function CategoryManagementPage() {
  const { userId } = useLiff();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "💰", keywords: "" });

  useEffect(() => {
    if (userId) fetchCategories();
  }, [userId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories?userId=${userId}`);
      const data = await res.json();
      
      // 如果用戶還沒有自訂分類，先顯示預設的
      if (data.categories.length === 0) {
        setCategories(DEFAULT_CATEGORIES.map((c, i) => ({ id: `default-${i}`, ...c })));
      } else {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Fetch Categories Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCat.name) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: newCat.name,
          icon: newCat.icon,
          keywords: newCat.keywords.split(",").map(k => k.trim()).filter(k => k),
        }),
      });
      if (res.ok) {
        fetchCategories();
        setIsAdding(false);
        setNewCat({ name: "", icon: "💰", keywords: "" });
      }
    } catch (error) {
      alert("新增失敗");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 pb-24 font-sans">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <Link href="/settings" className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">分類管理</h1>
          <p className="text-muted-foreground text-xs font-medium">自訂您的自動判定關鍵字</p>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm text-muted-foreground">載入分類中...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <h3 className="font-black text-xl">{cat.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-muted-foreground p-2 hover:bg-gray-50 rounded-xl">
                      <Settings2 size={18} />
                    </button>
                    {!cat.id.startsWith("default") && (
                      <button className="text-red-500 p-2 hover:bg-red-50 rounded-xl">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cat.keywords.length > 0 ? (
                    cat.keywords.map((kw, i) => (
                      <span key={i} className="text-[10px] font-bold px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-muted-foreground">
                        #{kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">尚無關鍵字</span>
                  )}
                  <button className="text-[10px] font-black px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full">
                    + 新增
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] text-muted-foreground font-bold flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-500 transition-all"
          >
            <Plus size={20} /> 新增分類
          </button>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 shadow-2xl space-y-6"
            >
              <h3 className="text-xl font-black">新增自訂分類</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">分類名稱</label>
                  <input 
                    type="text" 
                    value={newCat.name}
                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 transition-all"
                    placeholder="例如：寵物用品"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">判定關鍵字 (用逗號隔開)</label>
                  <textarea 
                    value={newCat.keywords}
                    onChange={(e) => setNewCat({ ...newCat, keywords: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 h-24 resize-none"
                    placeholder="例如：罐頭, 飼料, 貓砂"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold"
                >
                  取消
                </button>
                <button 
                  onClick={handleAddCategory}
                  className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold"
                >
                  確認新增
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
