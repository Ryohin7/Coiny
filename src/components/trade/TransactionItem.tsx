"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TransactionItemProps {
  record: any;
  onClick: (record: any) => void;
}

export function TransactionItem({ record, onClick }: TransactionItemProps) {
  const isInvoice = record.type === "invoice";
  const amount = isInvoice ? record.totalAmount : record.amount;

  // Get description: if invoice, join items; if manual, use note
  let description = record.note || "";
  if (isInvoice && record.items) {
    description = record.items.map((i: any) => i.name).join("、");
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onClick(record)}
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
        <p className="text-xs text-muted-foreground truncate opacity-80">
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
}
