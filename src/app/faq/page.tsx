"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronDown, Plus, Minus, Search, HelpCircle } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    category: "記帳與邏輯",
    questions: [
      {
        q: "如何使用多品項記帳功能？",
        a: "您只需在 LINE 對話框中一次輸入品項與金額，例如「晚餐150 飲料35」，系統會自動拆解為兩個品項並計算總額為 185 元。若有折扣，可輸入「折扣20」，系統會自動進行減法運算。"
      },
      {
        q: "系統如何判定消費分類？",
        a: "Coiny 內建智慧關鍵字匹配系統。我們會根據您輸入的內容（如「飯」、「車」、「買」）自動對應到您設定的分類。您也可以在設定頁面自定義每個分類的關鍵字。"
      }
    ]
  },
  {
    category: "載具與發票",
    questions: [
      {
        q: "為什麼我的發票沒有自動出現？",
        a: "財政部發票同步通常有 24-48 小時的延遲。此外，請確認您已正確設定 Email 轉寄規則，將財政部的電子發票通知轉寄至系統指定的 Webhook 地址。"
      },
      {
        q: "載具對帳功能是如何運作的？",
        a: "系統收到財政部發票資料後，會比對您手動記錄的交易。若日期與金額相符，系統會自動標記為「已對帳」，避免重複記錄並確保帳務精確。"
      }
    ]
  },
  {
    category: "會員與權限",
    questions: [
      {
        q: "Pro 會員與一般會員有什麼不同？",
        a: "Pro 會員享有無限次的載具對帳同步、更深度的財務報表分析、自定義分類圖示库，以及優先的技術支援服務。"
      },
      {
        q: "這是一次性付費還是訂閱制？",
        a: "目前 Coiny Pro 提供一次性買斷方案。只要支付一次費用，即可永久享有 Pro 會員的所有功能與後續更新。"
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#050505] text-[#1A1A1A] dark:text-[#E5E5E5] pb-32">
      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-[#F8F7F4]/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-black uppercase tracking-widest">返回首頁</span>
          </Link>
          <span className="text-sm font-black uppercase tracking-[0.3em] opacity-40">FAQ Center</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-24 space-y-24">
        <header className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">常見問題</h1>
          <p className="text-lg text-muted-foreground font-medium max-w-xl">
            如果您在使用過程中遇到任何疑問，這裡有最詳細的解答。如果仍未解決，歡迎透過 LINE 聯繫開發團隊。
          </p>
        </header>

        <div className="space-y-20">
          {FAQS.map((group, groupIdx) => (
            <section key={groupIdx} className="space-y-8">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary bg-primary/5 inline-block px-4 py-2 rounded-full">
                {group.category}
              </h2>
              <div className="border-t border-gray-200 dark:border-gray-800">
                {group.questions.map((faq, faqIdx) => {
                  const id = `${groupIdx}-${faqIdx}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={faqIdx} className="border-b border-gray-100 dark:border-gray-900">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                        className="w-full py-8 flex items-center justify-between text-left group"
                      >
                        <span className={`text-xl font-bold transition-colors ${isOpen ? "text-primary" : "group-hover:text-primary"}`}>
                          {faq.q}
                        </span>
                        <div className={`flex-shrink-0 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`}>
                          <Plus size={24} className={isOpen ? "text-primary" : "text-gray-300"} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="pb-10 text-muted-foreground text-lg leading-relaxed font-medium">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Support CTA */}
        <section className="bg-white dark:bg-gray-900 p-12 rounded-[3rem] border border-gray-100 dark:border-gray-800 text-center space-y-8 shadow-xl shadow-gray-200/50 dark:shadow-none">
          <HelpCircle size={40} className="mx-auto text-primary" />
          <div className="space-y-2">
            <h3 className="text-2xl font-black">仍有其他疑問？</h3>
            <p className="text-muted-foreground font-medium">我們的開發團隊隨時準備為您提供支援。</p>
          </div>
          <Link href="https://line.me" className="inline-block bg-[#1A1A1A] dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-black text-sm hover:scale-105 transition-all">
            聯繫 LINE 客服
          </Link>
        </section>
      </main>

      <footer className="mt-40 py-20 px-6 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20">© 2026 Coiny. Designed for perfection.</p>
      </footer>
    </div>
  );
}
