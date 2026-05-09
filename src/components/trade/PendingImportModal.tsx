"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, CreditCard, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PendingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingInvoices: any[];
  selectedPendingIds: string[];
  onToggleId: (id: string) => void;
  onConfirm: () => void;
  onDiscardAll: () => void;
}

export function PendingImportModal({
  isOpen,
  onClose,
  pendingInvoices,
  selectedPendingIds,
  onToggleId,
  onConfirm,
  onDiscardAll,
}: PendingImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
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
          <button onClick={onClose} className="text-muted-foreground"><Plus size={24} className="rotate-45" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
          {pendingInvoices.map((inv) => (
            <div
              key={inv.id}
              className={cn(
                "p-4 rounded-3xl border transition-all cursor-pointer",
                selectedPendingIds.includes(inv.id)
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-gray-50 dark:bg-gray-800/50 border-transparent opacity-60"
              )}
              onClick={() => onToggleId(inv.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{inv.icon || "🧾"}</span>
                  <div>
                    <h4 className="font-bold text-sm">{inv.store}</h4>
                    <p className="text-xs text-muted-foreground">{inv.date}</p>
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
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">發現相符的手動記帳</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.matchedManualInfo.date === inv.date ? "當日" : (inv.matchedManualInfo.date < inv.date ? "前一日" : "後一日")} • ${inv.matchedManualInfo.amount} • {inv.matchedManualInfo.note}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground px-1 italic">未發現相符的手動記帳</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6">
          <button
            onClick={onDiscardAll}
            className="bg-gray-100 dark:bg-gray-800 text-muted-foreground py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
          >
            全部捨棄
          </button>
          <button
            onClick={onConfirm}
            disabled={selectedPendingIds.length === 0}
            className="bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
          >
            匯入選取資料 ({selectedPendingIds.length})
          </button>
        </div>
      </motion.div>
    </div>
  );
}
