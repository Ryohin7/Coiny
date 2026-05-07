"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ChevronLeft, Trash2, Tag,
  Settings2, Check, X, Loader2, Edit2, Smile
} from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

const DEFAULT_CATEGORIES = [
  { name: "餐飲", icon: "🍱", keywords: ["咖啡", "麵包", "早餐", "飲料", "珍奶", "午餐", "晚餐", "宵夜"] },
  { name: "超商", icon: "🏪", keywords: ["統一超商", "全家", "7-11", "小7"] },
  { name: "生活雜貨", icon: "🧻", keywords: ["衛生紙", "洗衣精", "沐浴乳"] },
  { name: "交通", icon: "🚗", keywords: ["停車費", "GOGORO", "加油", "悠遊卡", "TPASS", "停車", "公車", "電池服務費", "IRENT", "GOSHARE"] },
  { name: "購物", icon: "🛍️", keywords: ["衣服", "鞋子", "蝦皮", "雜貨"] },
  { name: "醫療", icon: "🏥", keywords: ["診所", "藥局", "看病", "領藥"] },
];

export default function CategoryManagementPage() {
  const { userId } = useLiff();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [newCat, setNewCat] = useState({ name: "", icon: "💰", keywords: "" });

  useEffect(() => {
    if (userId) fetchCategories();
  }, [userId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories?userId=${userId}`);
      const data = await res.json();

      const userCats = data.categories as Category[];

      // 檢查是否缺少基礎類別 (依名稱比對)
      const missingDefaults = DEFAULT_CATEGORIES.filter(
        def => !userCats.some(userCat => userCat.name === def.name)
      );

      if (missingDefaults.length > 0 && userCats.length === 0) {
        // 如果完全沒資料，執行全面種子化
        await seedDefaultCategories();
      } else {
        setCategories(userCats);
      }
    } catch (error) {
      console.error("Fetch Categories Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultCategories = async (onlyMissing = false) => {
    try {
      const currentRes = await fetch(`/api/categories?userId=${userId}`);
      const currentData = await currentRes.json();
      const currentNames = currentData.categories.map((c: any) => c.name);

      for (const cat of DEFAULT_CATEGORIES) {
        if (onlyMissing && currentNames.includes(cat.name)) continue;

        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...cat }),
        });
      }

      // 重新整理頁面資料
      const finalRes = await fetch(`/api/categories?userId=${userId}`);
      const finalData = await finalRes.json();
      setCategories(finalData.categories);
    } catch (error) {
      console.error("Seeding failed");
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

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("確定要刪除此分類嗎？")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
    } catch (error) {
      alert("刪除失敗");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCat) return;
    try {
      const res = await fetch(`/api/categories/${editingCat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCat.name,
          icon: editingCat.icon,
          keywords: editingCat.keywords,
        }),
      });
      if (res.ok) {
        fetchCategories();
        setEditingCat(null);
      }
    } catch (error) {
      alert("更新失敗");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 pb-24 font-sans text-gray-900 dark:text-gray-100">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/settings" className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">分類管理</h1>
          <p className="text-muted-foreground text-xs font-medium">自訂您的分類名稱與圖示</p>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm text-muted-foreground">載入個人化設定中...</p>
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
                    <button
                      onClick={() => setEditingCat(cat)}
                      className="text-muted-foreground p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cat.keywords.map((kw, i) => (
                    <span key={i} className="text-[10px] font-bold px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-muted-foreground">
                      #{kw}
                    </span>
                  ))}
                  {cat.keywords.length === 0 && (
                    <span className="text-[10px] text-muted-foreground italic">無關鍵字，點擊編輯新增</span>
                  )}
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

          <button
            onClick={() => seedDefaultCategories(true)}
            className="w-full py-4 text-xs text-muted-foreground font-bold flex items-center justify-center gap-2 hover:text-blue-500 transition-colors"
          >
            <Loader2 size={14} className="animate-spin-slow" /> 補齊/還原基礎分類
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAdding || editingCat) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingCat(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">{editingCat ? "編輯分類" : "新增分類"}</h3>
                <div className="text-3xl bg-gray-50 dark:bg-gray-800 w-16 h-16 flex items-center justify-center rounded-2xl">
                  {editingCat ? editingCat.icon : newCat.icon}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">圖示</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editingCat ? editingCat.icon : newCat.icon}
                      onChange={(e) => editingCat ? setEditingCat({ ...editingCat, icon: e.target.value }) : setNewCat({ ...newCat, icon: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 text-center outline-none focus:ring-2 ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">分類名稱</label>
                    <input
                      type="text"
                      value={editingCat ? editingCat.name : newCat.name}
                      onChange={(e) => editingCat ? setEditingCat({ ...editingCat, name: e.target.value }) : setNewCat({ ...newCat, name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 transition-all"
                      placeholder="例如：主子開銷"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">自動判定關鍵字 (用逗號隔開)</label>
                  <textarea
                    value={editingCat ? editingCat.keywords.join(", ") : newCat.keywords}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingCat) setEditingCat({ ...editingCat, keywords: val.split(",").map(k => k.trim()).filter(k => k) });
                      else setNewCat({ ...newCat, keywords: val });
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 outline-none focus:ring-2 ring-blue-500 h-24 resize-none"
                    placeholder="例如：罐頭, 飼料, 貓砂"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setIsAdding(false); setEditingCat(null); }}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold"
                >
                  取消
                </button>
                <button
                  onClick={editingCat ? handleUpdateCategory : handleAddCategory}
                  className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold"
                >
                  確認
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
