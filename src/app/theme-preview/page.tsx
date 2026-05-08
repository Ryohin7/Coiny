"use client";

import { motion } from "framer-motion";
import { CreditCard, ShoppingBag, Utensils, ReceiptText, ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";

const themes = [
  {
    id: "indigo",
    name: "活力極光 (Electric Indigo)",
    primary: "bg-indigo-600",
    text: "text-indigo-600",
    gradient: "from-indigo-600 to-violet-600",
    bgLight: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    id: "emerald",
    name: "薄荷森林 (Emerald Mint)",
    primary: "bg-emerald-600",
    text: "text-emerald-600",
    gradient: "from-emerald-600 to-teal-600",
    bgLight: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    id: "sunset",
    name: "夕陽活力 (Sunset Coral)",
    primary: "bg-orange-500",
    text: "text-orange-500",
    gradient: "from-orange-500 to-rose-500",
    bgLight: "bg-orange-50",
    border: "border-orange-100",
  },
];

export default function ThemePreviewPage() {
  return (
    <div className="p-8 space-y-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">配色方案預覽</h1>
        <p className="text-gray-500">請挑選您喜歡的主色調，選定後我將為您套用到全站。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {themes.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: any }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold">{theme.name}</h3>
        <div className="flex gap-2">
            <div className={`w-6 h-6 rounded-full ${theme.primary}`} />
            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${theme.gradient}`} />
        </div>
      </div>

      {/* Mock Phone UI */}
      <div className="bg-white rounded-[3rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden aspect-[9/19] flex flex-col relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-20" />
        
        <div className="p-6 space-y-6 pt-10">
          {/* Header */}
          <header className="flex justify-between items-end">
            <div>
              <p className="text-gray-400 text-[10px] font-medium">👋 你好，測試用戶</p>
              <h4 className={`text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${theme.gradient}`}>記帳明細</h4>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
              <ChevronLeft size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold">2024/05</span>
              <ChevronLeft size={14} className="text-gray-400 rotate-180" />
            </div>
          </header>

          {/* Summary Card */}
          <div className={`bg-gradient-to-br ${theme.gradient} p-5 rounded-[2rem] text-white space-y-4 shadow-lg`}>
            <div>
              <p className="opacity-70 text-[10px] font-medium">本月結餘</p>
              <h2 className="text-2xl font-bold tracking-tight">$24,850</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/20">
              <div>
                <p className="opacity-60 text-[8px] uppercase">總收入</p>
                <p className="text-xs font-bold">+$45,000</p>
              </div>
              <div>
                <p className="opacity-60 text-[8px] uppercase">總支出</p>
                <p className="text-xs font-bold">-$20,150</p>
              </div>
            </div>
          </div>

          {/* List Preview */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold">最近交易</h5>
            <div className="space-y-3">
              {[
                { cat: "餐飲", icon: "🍱", amount: 150, note: "午餐便當" },
                { cat: "交通", icon: "🚗", amount: 45, note: "公車" },
                { cat: "購物", icon: "🛍️", amount: 1200, note: "新衣服" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`${theme.bgLight} ${theme.text} w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold">{item.cat}</p>
                      <p className="text-[8px] text-gray-400">{item.note}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-800">-${item.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Add Button Mock */}
        <div className={`absolute bottom-6 right-6 ${theme.primary} text-white p-3 rounded-2xl shadow-xl`}>
          <Plus size={20} />
        </div>
      </div>
      
      <button 
        onClick={() => alert(`已選擇：${theme.name}`)}
        className={`w-full py-3 rounded-2xl font-bold text-white shadow-md hover:opacity-90 transition-all ${theme.primary}`}
      >
        選用此方案
      </button>
    </div>
  );
}
