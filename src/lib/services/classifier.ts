/**
 * Coiny 支出分類引擎
 * 採用多層級判斷：商家名稱關鍵字 -> 統編行業代碼 -> 預設分類
 */

interface MerchantRule {
  keywords: string[];
  category: string;
  icon: string;
}

// 行業代碼對照表 (基於中華民國行業標準分類)
const INDUSTRY_CODE_MAP: Record<string, { category: string; icon: string }> = {
  "4711": { category: "便利商店", icon: "🏪" }, // 飲食品零售 (超商)
  "4719": { category: "百貨", icon: "🏢" },    // 其他綜合零售 (百貨、量販)
  "4729": { category: "超市", icon: "🛒" },    // 其他食品零售 (超市)
  "5611": { category: "餐飲", icon: "🍱" },    // 餐館
  "5631": { category: "餐飲", icon: "☕" },    // 飲料店
  "4751": { category: "購物", icon: "👕" },    // 布疋服飾零售
  "4741": { category: "購物", icon: "💻" },    // 電腦及其週邊零售
  "4841": { category: "購物", icon: "📦" },    // 無店面零售 (網購)
  "4731": { category: "交通", icon: "⛽" },    // 燃料零售 (加油站)
  "4781": { category: "醫療", icon: "🏥" },    // 藥品醫療零售
};

const MERCHANT_RULES: MerchantRule[] = [
  { keywords: ["統一超商", "7-ELEVEN", "7-11"], category: "便利商店", icon: "🏪" },
  { keywords: ["全家"], category: "便利商店", icon: "🏪" },
  { keywords: ["星巴克", "咖啡"], category: "餐飲", icon: "☕" },
  { keywords: ["加油站", "中油", "台亞"], category: "交通", icon: "⛽" },
  { keywords: ["停車", "車庫"], category: "交通", icon: "🅿️" },
  { keywords: ["醫院", "診所", "藥局"], category: "醫療", icon: "🏥" },
];

function normalizeText(text: string): string {
  return text
    .replace(/[\uFF01-\uFF5E]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, " ")
    .toUpperCase()
    .trim();
}

/**
 * 透過統編查詢行業別 (使用 g0v API)
 */
async function fetchIndustryByCategory(taxId: string): Promise<{ category: string; icon: string } | null> {
  if (!taxId || taxId.length !== 8) return null;

  try {
    const res = await fetch(`https://company.g0v.ronny.tw/api/show/${taxId}`);
    const data = await res.json();
    
    if (data && data.data) {
      const d = data.data;
      let code = "";

      // 1. 嘗試從「公司」格式抓取 (行業代號 陣列)
      if (d["行業代號"] && Array.isArray(d["行業代號"]) && d["行業代號"].length > 0) {
        code = d["行業代號"][0].substring(0, 4);
      } 
      // 2. 嘗試從「商號/財政部」格式抓取 (財政部.行業 巢狀陣列)
      else if (d["財政部"]?.["行業"]?.[0]?.[0]) {
        code = d["財政部"]["行業"][0][0].substring(0, 4);
      }

      if (code && INDUSTRY_CODE_MAP[code]) {
        console.log(`TaxID ${taxId} matched industry: ${code}`);
        return INDUSTRY_CODE_MAP[code];
      }
    }
    return null;
  } catch (error) {
    console.error("Fetch Industry Error:", error);
    return null;
  }
}

export async function classifyMerchant(storeName: string, taxId?: string): Promise<{ category: string; icon: string }> {
  const normalizedName = normalizeText(storeName);

  // 優先級 1: 商家名稱關鍵字比對 (最快)
  for (const rule of MERCHANT_RULES) {
    if (rule.keywords.some(keyword => normalizedName.includes(normalizeText(keyword)))) {
      return { category: rule.category, icon: rule.icon };
    }
  }

  // 優先級 2: 如果有名稱沒命中，嘗試透過統編查詢 (最準)
  if (taxId) {
    const industryResult = await fetchIndustryByCategory(taxId);
    if (industryResult) return industryResult;
  }

  // 預設分類
  return { category: "其他", icon: "💰" };
}
