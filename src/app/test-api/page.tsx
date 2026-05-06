"use client";

import { useState } from "react";
import { Search, Loader2, Building2, Tag, Info } from "lucide-react";

// 行業代碼對照表 (與 classifier.ts 同步)
const INDUSTRY_CODE_MAP: Record<string, { category: string; icon: string }> = {
  "4711": { category: "便利商店", icon: "🏪" },
  "4719": { category: "百貨", icon: "🏢" },
  "4729": { category: "超市", icon: "🛒" },
  "5611": { category: "餐飲", icon: "🍱" },
  "5631": { category: "餐飲", icon: "☕" },
  "4751": { category: "購物", icon: "👕" },
  "4741": { category: "購物", icon: "💻" },
  "4841": { category: "購物", icon: "📦" },
  "4731": { category: "交通", icon: "⛽" },
  "4781": { category: "醫療", icon: "🏥" },
};

export default function TestApiPage() {
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (taxId.length !== 8) {
      setError("請輸入 8 位數統編");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`https://company.g0v.ronny.tw/api/show/${taxId}`);
      const data = await res.json();
      
      if (data && data.data) {
        const fullIndustry = data.data["行業代號"]?.[0] || "無行業代號資料";
        const code = fullIndustry.substring(0, 4);
        const classification = INDUSTRY_CODE_MAP[code] || { category: "其他", icon: "💰" };

        setResult({
          name: data.data["公司名稱"] || data.data["商業名稱"] || "未知名稱",
          fullIndustry,
          code,
          classification,
          raw: data.data
        });
      } else {
        setError("找不到此統編的資料");
      }
    } catch (err) {
      setError("查詢失敗，請檢查網路連線或統編格式");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-8 font-sans">
      <header className="max-w-xl mx-auto text-center space-y-2 pt-10">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">API 測試實驗室</h1>
        <p className="text-muted-foreground text-sm">輸入統編測試商業司 API 與分類邏輯</p>
      </header>

      <main className="max-w-xl mx-auto space-y-6">
        {/* Search Box */}
        <div className="bg-white dark:bg-gray-900 p-2 rounded-3xl shadow-xl flex gap-2 border border-gray-100 dark:border-gray-800">
          <input 
            type="text" 
            maxLength={8}
            placeholder="輸入 8 位數統編 (例如: 22555003)"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 bg-transparent px-4 py-3 outline-none font-mono text-lg"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-black dark:bg-white text-white dark:text-black px-6 rounded-2xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            <span className="font-bold text-sm">查詢</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-500 p-4 rounded-2xl text-sm font-medium text-center border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Classification Result Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-100 text-white dark:text-black p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 dark:bg-black/10 p-4 rounded-3xl text-4xl">
                    {result.classification.icon}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">自動分類結果</p>
                    <h2 className="text-3xl font-black">{result.classification.category}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-white/5 dark:bg-black/5 p-4 rounded-2xl backdrop-blur-md">
                    <p className="text-[10px] opacity-60 mb-1">行業代碼 (前四碼)</p>
                    <p className="font-mono font-bold text-lg">{result.code}</p>
                  </div>
                  <div className="bg-white/5 dark:bg-black/5 p-4 rounded-2xl backdrop-blur-md">
                    <p className="text-[10px] opacity-60 mb-1">統一編號</p>
                    <p className="font-mono font-bold text-lg">{taxId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant Details */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground border-b border-gray-50 dark:border-gray-800 pb-4">
                <Building2 size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">商家資訊</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">公司名稱</p>
                  <p className="font-bold">{result.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">完整行業名稱與代號</p>
                  <p className="text-sm font-medium">{result.fullIndustry}</p>
                </div>
              </div>
            </div>

            {/* Raw JSON for Debugging */}
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-[2.5rem] space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">原始回傳資料 (DEBUG)</span>
              </div>
              <pre className="text-[10px] font-mono overflow-auto max-h-48 opacity-60">
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
