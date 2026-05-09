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
  isIncome: boolean;
}

const DEFAULT_CATEGORIES = [
  { name: "餐飲", icon: "🍱", isIncome: false, keywords: ["咖啡", "麵包", "早餐", "飲料", "珍奶", "午餐", "晚餐", "宵夜"] },
  { name: "超商", icon: "🏪", isIncome: false, keywords: ["統一超商", "全家", "7-11", "小7"] },
  { name: "生活雜貨", icon: "🧻", isIncome: false, keywords: ["衛生紙", "洗衣精", "沐浴乳"] },
  { name: "交通", icon: "🚗", isIncome: false, keywords: ["停車費", "GOGORO", "加油", "悠遊卡", "TPASS", "停車", "公車", "電池服務費", "IRENT", "GOSHARE"] },
  { name: "購物", icon: "🛍️", isIncome: false, keywords: ["衣服", "鞋子", "蝦皮", "雜貨"] },
  { name: "醫療", icon: "🏥", isIncome: false, keywords: ["診所", "藥局", "看病", "領藥"] },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "薪水", icon: "💰", isIncome: true, keywords: ["薪資", "薪水", "SALARY"] },
  { name: "獎金", icon: "🧧", isIncome: true, keywords: ["獎金", "分紅", "BONUS"] },
  { name: "投資", icon: "📈", isIncome: true, keywords: ["股票", "股息", "投資", "利息"] },
  { name: "交易", icon: "🤝", isIncome: true, keywords: ["賣出", "二手", "轉帳"] },
];

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [newCat, setNewCat] = useState({ name: "", icon: "💰", keywords: "" });
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const { userId, idToken, isPro, isAdmin } = useLiff();

  const handleFetchAISuggestions = async () => {
    if (!isPro && !isAdmin) {
      alert("此功能為 Pro 會員專屬功能，請先升級會員。");
      return;
    }
    if (!userId || !idToken) return;
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/categories/ai-suggest", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.suggestions) {
        // 預設全部勾選
        setSuggestions(data.suggestions.map((s: any) => ({ ...s, selected: true })));
        setIsSuggestModalOpen(true);
      } else {
        alert(data.error || "暫時無法取得建議，請稍後再試。");
      }
    } catch (error) {
      alert("AI 分析失敗");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleConfirmSuggestions = async () => {
    const selectedOnes = suggestions.filter(s => s.selected);
    if (selectedOnes.length === 0) {
      setIsSuggestModalOpen(false);
      return;
    }

    setLoading(true);
    try {
      const headers = { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      };

      for (const cat of selectedOnes) {
        await fetch("/api/categories", {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            userId, 
            name: cat.name, 
            icon: cat.icon, 
            keywords: cat.keywords,
            isIncome: false // AI 建議預設為支出
          }),
        });
      }
      alert(`成功新增 ${selectedOnes.length} 個分類！`);
      fetchCategories();
    } catch (error) {
      alert("部分新增失敗");
    } finally {
      setIsSuggestModalOpen(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && idToken) fetchCategories();
  }, [userId, idToken]);

  const fetchCategories = async () => {
    if (!userId || !idToken) return;
    try {
      const res = await fetch(`/api/categories?userId=${userId}`, {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      const data = await res.json();

      const userCats = data.categories as Category[];
      const combinedDefaults = [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

      if (userCats.length === 0) {
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
    if (!userId || !idToken) return;
    try {
      const headers = { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      };

      const combinedDefaults = [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

      for (const cat of combinedDefaults) {
        await fetch("/api/categories", {
          method: "POST",
          headers,
          body: JSON.stringify({ userId, ...cat }),
        });
      }

      // 重新整理頁面資料
      const finalRes = await fetch(`/api/categories?userId=${userId}`, {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      const finalData = await finalRes.json();
      setCategories(finalData.categories);
    } catch (error) {
      console.error("Seeding failed");
    }
  };

  const handleAddCategory = async () => {
    if (!newCat.name || !userId || !idToken) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId,
          name: newCat.name,
          icon: newCat.icon,
          isIncome: activeTab === "income",
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
    if (!confirm("確定要刪除此分類嗎？") || !idToken) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      if (res.ok) fetchCategories();
    } catch (error) {
      alert("刪除失敗");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCat || !idToken) return;
    try {
      const res = await fetch(`/api/categories/${editingCat.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name: editingCat.name,
          icon: editingCat.icon,
          keywords: editingCat.keywords,
          isIncome: editingCat.isIncome
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
        <div className="space-y-6">
          {/* AI Suggestion Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFetchAISuggestions}
            disabled={isSuggesting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 p-[2px] rounded-[2.5rem] shadow-lg shadow-purple-500/20"
          >
            <div className="bg-white dark:bg-gray-950 w-full h-full rounded-[2.4rem] py-5 flex items-center justify-center gap-3">
              {isSuggesting ? (
                <Loader2 size={20} className="animate-spin text-purple-600" />
              ) : (
                <Smile size={20} className="text-purple-600" />
              )}
              <span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                {isSuggesting ? "AI 正在分析您的消費習慣..." : "AI 智慧建議新分類"}
              </span>
            </div>
          </motion.button>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("expense")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "expense" ? "bg-white dark:bg-gray-800 shadow-sm text-primary" : "text-muted-foreground"}`}
            >
              支出分類
            </button>
            <button
              onClick={() => setActiveTab("income")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "income" ? "bg-white dark:bg-gray-800 shadow-sm text-primary" : "text-muted-foreground"}`}
            >
              收入分類
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {categories
                .filter(cat => activeTab === "income" ? cat.isIncome : !cat.isIncome)
                .map((cat, index) => (
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
                      {((cat.keywords && cat.keywords.length > 0) ? cat.keywords : (
                        [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].find(d => d.name === cat.name)?.keywords || []
                      )).map((kw, i) => (
                        <span key={i} className="text-xs font-bold px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full text-muted-foreground">
                          #{kw}
                        </span>
                      ))}
                      {((cat.keywords && cat.keywords.length > 0) ? cat.keywords : (
                        [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].find(d => d.name === cat.name)?.keywords || []
                      )).length === 0 && (
                        <span className="text-xs text-muted-foreground italic">無關鍵字，點擊編輯新增</span>
                      )}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] text-muted-foreground font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all"
          >
            <Plus size={20} /> 新增分類
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
                <h3 className="text-xl font-black">{editingCat ? "編輯分類" : (activeTab === "income" ? "新增收入分類" : "新增支出分類")}</h3>
                <div className={`text-3xl ${activeTab === "income" ? "bg-orange-50 dark:bg-orange-950/30" : "bg-gray-50 dark:bg-gray-800"} w-16 h-16 flex items-center justify-center rounded-2xl`}>
                  {editingCat ? editingCat.icon : newCat.icon}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">圖示</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editingCat ? editingCat.icon : newCat.icon}
                      onChange={(e) => editingCat ? setEditingCat({ ...editingCat, icon: e.target.value }) : setNewCat({ ...newCat, icon: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 text-center outline-none focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">分類名稱</label>
                    <input
                      type="text"
                      value={editingCat ? editingCat.name : newCat.name}
                      onChange={(e) => editingCat ? setEditingCat({ ...editingCat, name: e.target.value }) : setNewCat({ ...newCat, name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 outline-none focus:ring-2 ring-primary transition-all"
                      placeholder="例如：主子開銷"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">自動判定關鍵字 (用逗號隔開)</label>
                  <textarea
                    value={editingCat ? editingCat.keywords.join(", ") : newCat.keywords}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingCat) setEditingCat({ ...editingCat, keywords: val.split(",").map(k => k.trim()).filter(k => k) });
                      else setNewCat({ ...newCat, keywords: val });
                    }}
                    className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mt-1 outline-none focus:ring-2 ring-primary h-24 resize-none"
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
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold"
                >
                  確認
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* AI Suggestion Modal */}
      <AnimatePresence>
        {isSuggestModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSuggestModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 relative z-10 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black">AI 智慧建議</h3>
                <p className="text-sm text-muted-foreground">根據您最近的消費，為您推薦以下分類：</p>
              </div>

              <div className="space-y-4">
                {suggestions.map((s, idx) => (
                  <label key={idx} className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${s.selected ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20" : "border-gray-100 dark:border-gray-800"}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{s.icon}</span>
                      <div>
                        <h4 className="font-bold text-lg">{s.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.keywords.map((kw: string, i: number) => (
                            <span key={i} className="text-xs bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-muted-foreground">#{kw}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={s.selected} 
                      onChange={() => {
                        const newS = [...suggestions];
                        newS[idx].selected = !newS[idx].selected;
                        setSuggestions(newS);
                      }}
                      className="w-6 h-6 rounded-full border-2 border-purple-500 accent-purple-500"
                    />
                  </label>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsSuggestModalOpen(false)}
                  className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSuggestions}
                  className="flex-1 py-5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20"
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
