"use client";

import { ReceiptText } from "lucide-react";
import { TransactionItem } from "./TransactionItem";

interface TransactionListProps {
  isLoading: boolean;
  filteredRecords: any[];
  onRecordClick: (record: any) => void;
}

export function TransactionList({ isLoading, filteredRecords, onRecordClick }: TransactionListProps) {
  if (isLoading) {
    return (
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
    );
  }

  if (filteredRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
        <ReceiptText size={48} strokeWidth={1} className="opacity-30" />
        <p className="text-sm">本月還沒有任何記帳記錄</p>
        <p className="text-xs opacity-60">到 LINE 記一筆！</p>
      </div>
    );
  }

  const grouped = filteredRecords.reduce((groups: any, record: any) => {
    const date = record.date; // YYYY/MM/DD
    if (!groups[date]) groups[date] = { records: [], total: 0 };
    groups[date].records.push(record);

    if (!record.isIncome) {
      const amount = record.type === "invoice" ? record.totalAmount : record.amount;
      groups[date].total += (amount || 0);
    }

    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a: any, b: any) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {sortedDates.map((dateStr) => {
        const group = grouped[dateStr];
        const dateObj = new Date(dateStr);
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        const dayOfWeek = ["日", "一", "二", "三", "四", "五", "六"][dateObj.getDay()];

        return (
          <div key={dateStr} className="bg-white dark:bg-gray-900/50 rounded-[2rem] p-4 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-primary">{mm}/{dd}</span>
                <span className="text-xs font-bold opacity-40 uppercase">({dayOfWeek})</span>
              </div>
              {group.total > 0 && (
                <span className="text-xs font-black text-primary">
                  -{group.total.toLocaleString()}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {group.records.map((record: any) => (
                <TransactionItem 
                  key={record.id} 
                  record={record} 
                  onClick={onRecordClick} 
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
