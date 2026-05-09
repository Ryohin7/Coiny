"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, Check } from "lucide-react";

interface DetailModalProps {
  selectedRecord: any;
  isEditing: boolean;
  availableCategories: { name: string; icon: string }[];
  onClose: () => void;
  onEditToggle: (editing: boolean) => void;
  onDelete: () => void;
  onUpdateCategory: (name: string, icon: string) => void;
}

export function DetailModal({
  selectedRecord,
  isEditing,
  availableCategories,
  onClose,
  onEditToggle,
  onDelete,
  onUpdateCategory,
}: DetailModalProps) {
  if (!selectedRecord) return null;

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
                  onClick={() => onEditToggle(true)}
                  className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={onClose}
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
                onClick={onDelete}
                className="bg-red-50 dark:bg-red-950/30 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
              >
                <Trash2 size={18} /> 刪除
              </button>
              <button
                onClick={onClose}
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
              <button onClick={() => onEditToggle(false)} className="text-muted-foreground"><Plus size={20} className="rotate-45" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => onUpdateCategory(cat.name, cat.icon)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-200"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-bold text-sm">{cat.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => onEditToggle(false)}
              className="w-full py-4 text-muted-foreground font-bold text-sm"
            >
              取消修改
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
