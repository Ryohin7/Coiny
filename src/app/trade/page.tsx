"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, Search } from "lucide-react";
import { useLiff } from "@/components/providers/LiffProvider";
import { useEffect, useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// New Components
import { SummaryCard } from "@/components/trade/SummaryCard";
import { TransactionList } from "@/components/trade/TransactionList";
import { DetailModal } from "@/components/trade/DetailModal";
import { PendingImportModal } from "@/components/trade/PendingImportModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function HomePage() {
  const { profile, userId, idToken } = useLiff();
  
  // Authenticated fetcher
  const fetcher = useCallback((url: string) => {
    const headers: Record<string, string> = {};
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }
    return fetch(url, { headers }).then(r => r.json());
  }, [idToken]);

  const { data: recordsData, mutate: mutateRecords, isLoading: recordsLoading } = useSWR(
    (userId && idToken) ? `/api/expenses?userId=${userId}` : null, 
    fetcher,
    { 
      revalidateOnFocus: true,
      revalidateOnMount: true 
    }
  );
  
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

  const fetchPending = useCallback(async () => {
    if (!userId || !idToken) return;
    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${idToken}`
      };
      
      const res = await fetch(`/api/invoices/pending?userId=${userId}`, { headers });
      const data = await res.json();
      const pending = data.pendingInvoices || [];
      setPendingInvoices(pending);
      setSelectedPendingIds(pending.map((p: any) => p.id));
    } catch (error) {
      console.error("Failed to fetch pending invoices");
    }
  }, [userId, idToken]);

  useEffect(() => {
    if (userId && idToken) {
      fetchPending();
    }
  }, [userId, idToken, fetchPending]);

  const handleConfirmImport = async () => {
    if (selectedPendingIds.length === 0) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

      const res = await fetch("/api/invoices/confirm", {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, invoiceIds: selectedPendingIds }),
      });
      if (res.ok) {
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
    console.log(`[TradePage] Total records from API: ${records.length}`);
    const filtered = records.filter((rec: any) => {
      if (!rec.date) return false;
      // Handle YYYY/MM/DD or other formats
      const dateStr = rec.date.replace(/\//g, "-");
      const d = new Date(dateStr);
      const matchesDate = d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
      const matchesSearch = !searchTerm ||
        (rec.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.items || []).some((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.store || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    });
    console.log(`[TradePage] Filtered records for ${currentYear}/${currentMonth}: ${filtered.length}`);

    const allInvoices = records.filter((r: any) => r.type === "invoice");
    const result: any[] = [];
    const processedInvoiceIds = new Set();
    const processedManualIds = new Set();

    filtered.forEach((rec: any) => {
      const isManual = rec.type === "manual" || !rec.type;
      if (!isManual || processedManualIds.has(rec.id)) return;

      let matchedInv = null;
      if (rec.matched && rec.matchedInvoiceId) {
        matchedInv = allInvoices.find((inv: any) => inv.id === rec.matchedInvoiceId);
      }

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

    filtered.forEach((rec: any) => {
      if (rec.type === "invoice" && !processedInvoiceIds.has(rec.id)) {
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

  const totalExpense = useMemo(() => displayRecords.reduce((sum: number, rec: any) => {
    if (rec.isIncome) return sum;
    const amount = rec.type === "invoice" ? rec.totalAmount : (rec.isMatched ? rec.invoiceAmount : rec.amount);
    return sum + (amount || 0);
  }, 0), [displayRecords]);

  const totalIncome = useMemo(() => displayRecords.reduce((sum: number, rec: any) => {
    if (!rec.isIncome) return sum;
    return sum + (rec.amount || 0);
  }, 0), [displayRecords]);

  const monthlyBalance = totalIncome - totalExpense;

  useEffect(() => {
    if (userId && idToken) {
      const fetchAllCategories = async () => {
        try {
          const headers: Record<string, string> = {
            "Authorization": `Bearer ${idToken}`
          };
          
          const res = await fetch(`/api/categories?userId=${userId}`, { headers });
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
          const merged = [...defaults, ...(data.categories || []).map((c: any) => ({ name: c.name, icon: c.icon }))];
          const unique = merged.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
          setAvailableCategories([...unique, { name: "其他", icon: "💰" }]);
        } catch (error) {
          console.error("Failed to fetch categories");
        }
      };
      fetchAllCategories();
    }
  }, [userId, idToken]);

  const handleDelete = async () => {
    if (!selectedRecord || !confirm("確定要刪除這筆交易嗎？")) return;
    try {
      const headers: Record<string, string> = {};
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
      
      const res = await fetch(`/api/expenses/${selectedRecord.id}?type=${selectedRecord.type}`, {
        method: "DELETE",
        headers
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

      const res = await fetch(`/api/expenses/${selectedRecord.id}`, {
        method: "PATCH",
        headers,
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

      <SummaryCard 
        totalExpense={totalExpense} 
        totalIncome={totalIncome} 
        monthlyBalance={monthlyBalance} 
      />

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
              <Plus size={18} />
            </div>
            <div className="text-left">
              <p className="text-primary font-bold text-sm">有新的載具資料匯入</p>
              <p className="text-primary/60 text-[10px]">點擊查看並確認匯入 ({pendingInvoices.length} 筆)</p>
            </div>
          </div>
          <Plus size={20} className="rotate-180 text-primary" />
        </motion.button>
      )}

      <div className="space-y-6">
        <h3 className="text-lg font-semibold px-1">最近交易</h3>
        <TransactionList 
          isLoading={recordsLoading} 
          filteredRecords={displayRecords} 
          onRecordClick={setSelectedRecord} 
        />
      </div>

      <AnimatePresence>
        {selectedRecord && (
          <DetailModal
            selectedRecord={selectedRecord}
            isEditing={isEditing}
            availableCategories={availableCategories}
            onClose={() => { setSelectedRecord(null); setIsEditing(false); }}
            onEditToggle={setIsEditing}
            onDelete={handleDelete}
            onUpdateCategory={handleUpdateCategory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPendingModalOpen && (
          <PendingImportModal
            isOpen={isPendingModalOpen}
            onClose={() => setIsPendingModalOpen(false)}
            pendingInvoices={pendingInvoices}
            selectedPendingIds={selectedPendingIds}
            onToggleId={(id) => {
              if (selectedPendingIds.includes(id)) {
                setSelectedPendingIds(selectedPendingIds.filter(i => i !== id));
              } else {
                setSelectedPendingIds([...selectedPendingIds, id]);
              }
            }}
            onConfirm={handleConfirmImport}
            onDiscardAll={async () => {
              if (!confirm("確定要捨棄這些匯入資料嗎？")) return;
              const headers: Record<string, string> = { "Content-Type": "application/json" };
              if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
              
              await fetch("/api/invoices/confirm", {
                method: "DELETE",
                headers,
                body: JSON.stringify({ userId, invoiceIds: pendingInvoices.map(p => p.id) }),
              });
              setIsPendingModalOpen(false);
              fetchPending();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
