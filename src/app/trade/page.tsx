"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, CreditCard, ShoppingBag, Utensils, ReceiptText, Loader2, Trash2, Edit3, Check, ChevronLeft, Search } from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function HomePage() {
  const { profile, userId } = useLiff();
  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data: recordsData, mutate: mutateRecords, isLoading: recordsLoading } = useSWR(userId ? `/api/expenses?userId=${userId}` : null, fetcher);
  const records = recordsData?.records || [];

  const [loading, setLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<{ name: string, icon: string }[]>([]);

  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);

  const fetchRecords = () => mutateRecords();

  const fetchPending = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/invoices/pending?userId=${userId}`);
      const data = await res.json();
      const pending = data.pendingInvoices || [];
      setPendingInvoices(pending);
      setSelectedPendingIds(pending.map((p: any) => p.id));
    } catch (error) {
      console.error("Failed to fetch pending invoices");
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPending();
    }
  }, [userId]);

  const handleConfirmImport = async () => {
    if (selectedPendingIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/invoices/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, invoiceIds: selectedPendingIds }),
      });
      if (res.ok) {
        const others = pendingInvoices.filter(p => !selectedPendingIds.includes(p.id));
        if (others.length > 0) {
          await fetch("/api/invoices/confirm", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, invoiceIds: others.map(p => p.id) }),
          });
        }
        setIsPendingModalOpen(false);
        fetchRecords();
        fetchPending();
      }
    } catch (error) {
      alert("匯入失敗");
    } finally {
      setLoading(false);
    }
  };

  const displayRecords = useMemo(() => {
    // 1. 先進行基礎的日期與搜尋過濾
    const filtered = records.filter((rec: any) => {
      const d = new Date(rec.date);
      const matchesDate = d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
      const matchesSearch = !searchTerm ||
        (rec.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.items || []).some((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.store || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    });

    // 2. 準備所有紀錄以便匹配（包含非當月的）
    const allInvoices = records.filter((r: any) => r.type === "invoice");
    const result: any[] = [];
    const processedInvoiceIds = new Set();
    const processedManualIds = new Set();

    // 3. 第一階段：處理手動紀錄並尋找匹配（正式匹配 + 自動模糊匹配）
    filtered.forEach((rec: any) => {
      const isManual = rec.type === "manual" || !rec.type;
      if (!isManual || processedManualIds.has(rec.id)) return;

      let matchedInv = null;

      // A. 先找正式匹配
      if (rec.matched && rec.matchedInvoiceId) {
        matchedInv = allInvoices.find((inv: any) => inv.id === rec.matchedInvoiceId);
      }

      // B. 如果沒正式匹配，嘗試自動模糊匹配（日期 + 金額）
      if (!matchedInv) {
        matchedInv = allInvoices.find((inv: any) =>
          !processedInvoiceIds.has(inv.id) &&
          inv.date === rec.date &&
          inv.totalAmount === rec.amount &&
          !inv.isIncome && !rec.isIncome
        );
      }

      if (matchedInv) {
        result.push({
          ...rec,
          invoiceItems: matchedInv.items,
          invoiceStore: matchedInv.store,
          invoiceAmount: matchedInv.totalAmount,
          isMatched: true
        });
        processedInvoiceIds.add(matchedInv.id);
        processedManualIds.add(rec.id);
      } else {
        result.push(rec);
        processedManualIds.add(rec.id);
      }
    });

    // 4. 第二階段：處理剩餘的發票（未被手動紀錄匹配的）
    filtered.forEach((rec: any) => {
      if (rec.type === "invoice" && !processedInvoiceIds.has(rec.id)) {
        // 檢查這張發票是否其實有對應的手動紀錄（可能在其他月份或尚未處理）
        const hasManualMatch = records.some((r: any) =>
          (r.type === "manual" || !r.type) &&
          (r.matchedInvoiceId === rec.id || (r.date === rec.date && r.amount === rec.totalAmount))
        );

        if (!hasManualMatch) {
          result.push(rec);
          processedInvoiceIds.add(rec.id);
        }
      }
    });

    return result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, currentYear, currentMonth, searchTerm]);

  const filteredRecords = displayRecords;

  const totalExpense = displayRecords.reduce((sum: number, rec: any) => {
    if (rec.isIncome) return sum;
    const amount = rec.type === "invoice" ? rec.totalAmount : (rec.isMatched ? rec.invoiceAmount : rec.amount);
    return sum + (amount || 0);
  }, 0);

  const totalIncome = filteredRecords.reduce((sum: number, rec: any) => {
    if (!rec.isIncome) return sum;
    return sum + (rec.amount || 0);
  }, 0);

  const monthlyBalance = totalIncome - totalExpense;

  useEffect(() => {
    if (userId) {
      const fetchAllCategories = async () => {
        try {
          const res = await fetch(`/api/categories?userId=${userId}`);
          const data = await res.json();
          const defaults = [
            { name: "餐飲", icon: "🍱" },
            { name: "超商", icon: "🏪" },
            { name: "生活雜貨", icon: "🧻" },
            { name: "交通", icon: "🚗" },
            { name: "購物", icon: "🛍️" },
            { name: "娛樂", icon: "🎮" },
            { name: "醫療", icon: "🏥" },
            { name: "訂閱", icon: "📺" },
            { name: "房租", icon: "🏠" },
            { name: "旅行", icon: "✈️" },
          ];
          const merged = [...defaults, ...data.categories.map((c: any) => ({ name: c.name, icon: c.icon }))];
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
          setAvailableCategories([...unique, { name: "其他", icon: "💰" }]);
        } catch (error) {
          console.error("Failed to fetch categories");
        }
      };
      fetchAllCategories();
    }
  }, [userId]);

  const handleDelete = async () => {
    if (!selectedRecord || !confirm("確定要刪除這筆交易嗎？")) return;
    try {
      const res = await fetch(`/api/expenses/${selectedRecord.id}?type=${selectedRecord.type}`, {
        method: "DELETE",
      });
      if (res.ok) {
        mutateRecords();
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
        mutateRecords();
        setSelectedRecord(null);
        setIsEditing(false);
      }
    } catch (error) {
      alert("更新失敗");
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="space-y-4 pt-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-muted-foreground text-sm font-medium">👋 你好，{profile?.displayName || "用戶"}</p>
          </div>
        </div>

        {/* Date & Search Row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsDatePickerOpen(!isDatePickerOpen);
              if (!isDatePickerOpen) setIsSearchOpen(false);
            }}
            className="flex-1 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl transition-all active:scale-[0.98] border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <span className="font-black text-sm">{currentYear}年 {String(currentMonth).padStart(2, "0")}月</span>
            <ChevronLeft size={18} className={cn("transition-transform duration-300", isDatePickerOpen ? "-rotate-90" : "rotate-180")} />
          </button>

          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) setIsDatePickerOpen(false);
            }}
            className={cn(
              "p-4 rounded-2xl transition-all shadow-sm active:scale-[0.98]",
              isSearchOpen ? "bg-primary text-white" : "bg-white dark:bg-gray-800 text-muted-foreground border border-gray-100 dark:border-gray-800 shadow-sm"
            )}
          >
            {isSearchOpen ? <Plus size={20} className="rotate-45" /> : <Search size={20} />}
          </button>
        </div>

        {/* Date Picker Expandable */}
        <AnimatePresence>
          {isDatePickerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <button onClick={() => setCurrentYear(currentYear - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-lg font-black tracking-tight">{currentYear}年度</span>
                  <button onClick={() => setCurrentYear(currentYear + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                    <ChevronLeft size={20} className="rotate-180" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setCurrentMonth(m);
                        setIsDatePickerOpen(false);
                      }}
                      className={cn(
                        "h-12 rounded-xl text-sm font-bold transition-all",
                        currentMonth === m
                          ? "bg-primary text-white shadow-lg"
                          : "bg-white dark:bg-gray-800/50 text-muted-foreground hover:bg-orange-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {m}月
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Input Expandable */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  placeholder="搜尋明細、備註或分類..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/80 dark:bg-gray-800 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black dark:hover:text-white"
                  >
                    <Plus size={18} className="rotate-45" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Summary Card */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary text-white p-5 rounded-[2rem] shadow-lg relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <p className="opacity-70 text-[10px] font-medium uppercase tracking-wider mb-0.5 text-white">本月總支出</p>
                <p className="text-2xl font-black text-white">{totalExpense.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="opacity-70 text-[10px] font-medium uppercase tracking-wider mb-0.5 text-white">本月總收入</p>
                <p className="text-2xl font-black text-white">{totalIncome.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center">
              <p className="opacity-80 text-[10px] font-bold uppercase tracking-widest text-white">結餘</p>
              <p className="text-sm font-black tracking-tight text-white">{monthlyBalance.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Pending Invoices Notification */}
        {pendingInvoices.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsPendingModalOpen(true)}
            className="w-full bg-orange-50 dark:bg-primary/10 border border-orange-100 dark:border-orange-800 p-4 rounded-3xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-white">
                <CreditCard size={18} />
              </div>
              <div className="text-left">
                <p className="text-primary font-bold text-sm">有新的載具資料匯入</p>
                <p className="text-primary/60 text-[10px]">點擊查看並確認匯入 ({pendingInvoices.length} 筆)</p>
              </div>
            </div>
            <Plus size={20} className="rotate-180 text-primary" />
          </motion.button>
        )}
      </div>

      {/* Expense List */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold px-1">最近交易</h3>
        <div className="space-y-8">
          {recordsLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900/50 rounded-[2rem] p-4 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 animate-pulse">
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-12"></div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map(j => (
                      <div key={j} className="p-3 flex items-center justify-between">
                        <div className="flex-1 space-y-2 pr-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <ReceiptText size={48} strokeWidth={1} className="opacity-30" />
              <p className="text-sm">本月還沒有任何記帳記錄</p>
              <p className="text-xs opacity-60">到 LINE 記一筆！</p>
            </div>
          ) : (
            Object.entries(
              filteredRecords.reduce((groups: any, record: any) => {
                const date = record.date; // YYYY/MM/DD
                if (!groups[date]) groups[date] = { records: [], total: 0 };
                groups[date].records.push(record);

                // Calculate daily total (only expenses)
                if (!record.isIncome) {
                  const amount = record.type === "invoice" ? record.totalAmount : record.amount;
                  groups[date].total += (amount || 0);
                }

                return groups;
              }, {})
            ).sort((a: any, b: any) => b[0].localeCompare(a[0])).map(([dateStr, group]: [string, any]) => {
              const dateObj = new Date(dateStr);
              const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
              const dd = String(dateObj.getDate()).padStart(2, "0");
              const dayOfWeek = ["日", "一", "二", "三", "四", "五", "六"][dateObj.getDay()];

              return (
                <div key={dateStr} className="bg-white dark:bg-gray-900/50 rounded-[2rem] p-4 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-primary">{mm}/{dd}</span>
                      <span className="text-[10px] font-bold opacity-40 uppercase">{dayOfWeek}</span>
                    </div>
                    {group.total > 0 && (
                      <span className="text-[11px] font-black text-primary">
                        -{group.total.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {group.records.map((record: any) => {
                      const isInvoice = record.type === "invoice";
                      const amount = isInvoice ? record.totalAmount : record.amount;

                      // Get description: if invoice, join items; if manual, use note
                      let description = record.note || "";
                      if (isInvoice && record.items) {
                        description = record.items.map((i: any) => i.name).join("、");
                      }

                      return (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setSelectedRecord(record)}
                          className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-bold text-sm truncate">{record.category || "未分類"}</h4>
                              {isInvoice && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-white dark:bg-gray-800 text-primary rounded-md font-bold border border-orange-100 dark:border-orange-900/50">載具</span>
                              )}
                              {record.isMatched && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-primary rounded-md font-bold flex items-center gap-1">
                                  <Check size={10} /> 已對帳
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {record.isMatched ? `${record.note} (${record.invoiceStore})` : (description || "尚無明細")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn("font-bold text-sm", record.isIncome ? "text-green-500" : "text-black dark:text-white")}>
                              {record.isIncome ? "+" : "-"}${(record.isMatched ? record.invoiceAmount : amount).toLocaleString()}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
            className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] p-8 pb-32 sm:pb-8 relative z-10 shadow-2xl overflow-hidden"
          >
            {!isEditing ? (
              <div className="space-y-6">
                {selectedRecord.isMatched && (
                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 p-4 rounded-3xl flex items-center gap-4">
                    <div className="bg-orange-500 p-2 rounded-2xl text-white">
                      <Check size={20} />
                    </div>
                    <div>
                      <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">對帳成功</p>
                      <p className="text-orange-500/60 dark:text-orange-400/60 text-[10px]">此筆紀錄已與載具發票完全匹配</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{selectedRecord.icon || "💰"}</span>
                      <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-muted-foreground">
                        {selectedRecord.category || "未分類"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">
                      {selectedRecord.isMatched ? selectedRecord.note : (selectedRecord.store || selectedRecord.note || "手動記帳")}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-muted-foreground text-sm">{selectedRecord.date}</p>
                      {selectedRecord.isMatched && (
                        <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                          已對帳: {selectedRecord.invoiceStore}
                        </span>
                      )}
                    </div>
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
                  {(selectedRecord.invoiceItems || selectedRecord.items || []).length > 0 ? (
                    (selectedRecord.invoiceItems || selectedRecord.items).map((item: any, i: number) => (
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
                    ${(selectedRecord.invoiceAmount || selectedRecord.totalAmount || selectedRecord.amount).toLocaleString()}
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
                    className="bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    關閉
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">修改分類</h3>
                  <button onClick={() => setIsEditing(false)} className="text-muted-foreground"><Plus size={20} className="rotate-45" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleUpdateCategory(cat.name, cat.icon)}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-200"
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-bold text-sm">{cat.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full py-4 text-muted-foreground font-bold text-sm"
                >
                  取消修改
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
      {/* Pending Import Modal */}
      <AnimatePresence>
        {isPendingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPendingModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] p-8 relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">載具資料匯入</h3>
                  <p className="text-xs text-muted-foreground">勾選您要匯入的資料</p>
                </div>
                <button onClick={() => setIsPendingModalOpen(false)} className="text-muted-foreground"><Plus size={24} className="rotate-45" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
                {pendingInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className={cn(
                      "p-4 rounded-3xl border transition-all",
                      selectedPendingIds.includes(inv.id)
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        : "bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-60"
                    )}
                    onClick={() => {
                      if (selectedPendingIds.includes(inv.id)) {
                        setSelectedPendingIds(selectedPendingIds.filter(id => id !== inv.id));
                      } else {
                        setSelectedPendingIds([...selectedPendingIds, inv.id]);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{inv.icon || "🧾"}</span>
                        <div>
                          <h4 className="font-bold text-sm">{inv.store}</h4>
                          <p className="text-[10px] text-muted-foreground">{inv.date}</p>
                        </div>
                      </div>
                      <p className="font-bold text-sm">${inv.totalAmount.toLocaleString()}</p>
                    </div>

                    {inv.matchedManualInfo ? (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-2xl flex items-center gap-3 border border-blue-100 dark:border-blue-900/50">
                        <div className="bg-blue-500/10 p-1.5 rounded-lg text-blue-500">
                          <Check size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">發現相符的手動記帳</p>
                          <p className="text-[9px] text-muted-foreground">
                            {inv.matchedManualInfo.date === inv.date ? "當日" : (inv.matchedManualInfo.date < inv.date ? "前一日" : "後一日")} • ${inv.matchedManualInfo.amount} • {inv.matchedManualInfo.note}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-[9px] text-muted-foreground px-1 italic">未發現相符的手動記帳</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <button
                  onClick={async () => {
                    if (!confirm("確定要捨棄這些匯入資料嗎？")) return;
                    await fetch("/api/invoices/confirm", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId, invoiceIds: pendingInvoices.map(p => p.id) }),
                    });
                    setIsPendingModalOpen(false);
                    fetchPending();
                  }}
                  className="bg-gray-100 dark:bg-gray-800 text-muted-foreground py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  全部捨棄
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={selectedPendingIds.length === 0}
                  className="bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
                >
                  匯入選取資料 ({selectedPendingIds.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

