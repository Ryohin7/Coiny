/**
 * Coiny 進階支出分類引擎 v2
 * 支援品項比對、強大的內建庫
 */
import { getDb } from "../firebase/admin";

interface CategoryRule {
  name: string;
  icon: string;
  keywords: string[];
}

// 龐大的內建分類庫
const SYSTEM_CATEGORIES: CategoryRule[] = [
  {
    name: "餐飲",
    icon: "🍱",
    keywords: ["咖啡", "麵包", "早餐", "飲料", "珍奶", "飯糰", "便當", "麵", "壽司", "火鍋", "燒肉", "速食", "漢堡", "披薩", "蛋餅", "吐司", "三明治", "雞排", "便當", "午餐", "晚餐", "美食", "星巴克", "路易莎", "麥當勞", "摩斯", "肯德基", "必勝客"],
  },
  {
    name: "生活雜貨",
    icon: "🧻",
    keywords: ["衛生紙", "洗衣精", "沐浴乳", "洗髮精", "牙膏", "牙刷", "洗碗精", "抹布", "垃圾袋", "紙巾", "肥皂", "尿布", "濕紙巾", "保潔墊", "清潔劑", "日用品", "屈臣氏", "康是美", "寶雅"],
  },
  {
    name: "交通",
    icon: "🚗",
    keywords: ["停車費", "GOGORO", "電池", "GOSHARE", "IRENT", "加油", "高鐵", "捷運", "悠遊卡", "一卡通", "租車", "停車", "中油", "台亞", "客運", "計程車", "UBER", "LINE TAXI"],
  },
  {
    name: "超商",
    icon: "🏪",
    keywords: ["統一超商", "全家", "萊爾富", "OK超商", "7-ELEVEN", "7-11"],
  },
  {
    name: "超市",
    icon: "🛒",
    keywords: ["全聯", "家樂福", "大潤發", "美廉社", "好市多", "COSTCO", "超市"],
  },
  {
    name: "購物",
    icon: "🛍️",
    keywords: ["衣服", "鞋子", "襯衫", "裙子", "褲子", "外套", "包包", "手錶", "飾品", "化妝品", "保養品", "蝦皮", "MOMO", "網購", "百貨", "新光三越", "SOGO"],
  },
  {
    name: "娛樂",
    icon: "🎮",
    keywords: ["電影", "KTV", "遊戲", "門票", "訂閱", "NETFLIX", "SPOTIFY", "迪士尼", "演唱會", "展覽"],
  },
  {
    name: "醫療",
    icon: "🏥",
    keywords: ["診所", "藥局", "掛號", "感冒", "牙醫", "醫院", "健保", "看病", "口罩"],
  },
];

// 行業代碼對照表
const INDUSTRY_CODE_MAP: Record<string, { category: string; icon: string }> = {
  "4711": { category: "超商", icon: "🏪" },
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

function normalizeText(text: string): string {
  return text
    .replace(/[\uFF01-\uFF5E]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, " ")
    .toUpperCase()
    .trim();
}

async function fetchIndustryByCategory(taxId: string): Promise<{ category: string; icon: string } | null> {
  if (!taxId || taxId.length !== 8) return null;
  try {
    const res = await fetch(`https://company.g0v.ronny.tw/api/show/${taxId}`);
    const data = await res.json();
    if (data && data.data) {
      const d = data.data;
      let code = "";
      if (d["行業代號"]?.[0]) code = d["行業代號"][0].substring(0, 4);
      else if (d["財政部"]?.["行業"]?.[0]?.[0]) code = d["財政部"]["行業"][0][0].substring(0, 4);

      if (code && INDUSTRY_CODE_MAP[code]) return INDUSTRY_CODE_MAP[code];
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 核心分類邏輯
 * @param storeName 商店名稱
 * @param items 品項名稱清單
 * @param taxId 統編
 */
export async function classifyMerchant(
  storeName: string, 
  items: string[] = [], 
  taxId?: string,
  userId?: string
): Promise<{ category: string; icon: string }> {
  
  const normalizedStore = normalizeText(storeName);
  const normalizedItems = items.map(i => normalizeText(i));

  // 0. 用戶自訂規則 - 絕對優先
  if (userId) {
    try {
      const db = getDb();
      if (db) {
        const snapshot = await db.collection("categories").where("userId", "==", userId).get();
        const userCategories = snapshot.docs.map(doc => doc.data() as { name: string, icon: string, keywords: string[] });
        
        // A. 優先檢查是否直接符合「分類名稱」
        for (const cat of userCategories) {
          const normCatName = normalizeText(cat.name);
          if (normalizedStore.includes(normCatName) || normalizedItems.some(item => item.includes(normCatName))) {
            return { category: cat.name, icon: cat.icon };
          }
        }

        // B. 檢查是否符合「用戶自訂關鍵字」
        for (const cat of userCategories) {
          if (cat.keywords && cat.keywords.length > 0) {
            for (const kw of cat.keywords) {
              const normKw = normalizeText(kw);
              if (normalizedStore.includes(normKw) || normalizedItems.some(item => item.includes(normKw))) {
                return { category: cat.name, icon: cat.icon };
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("User category matching failed:", e);
    }
  }

  // 1. 系統預設規則 (Item-based)
  for (const rule of SYSTEM_CATEGORIES) {
    for (const item of normalizedItems) {
      if (rule.keywords.some(kw => item.includes(normalizeText(kw)))) {
        return { category: rule.name, icon: rule.icon };
      }
    }
  }

  // 2. 系統預設規則 (Store-based)
  for (const rule of SYSTEM_CATEGORIES) {
    if (rule.keywords.some(kw => normalizedStore.includes(normalizeText(kw)))) {
      return { category: rule.name, icon: rule.icon };
    }
  }

  // 3. 透過統編查詢
  if (taxId) {
    const industryResult = await fetchIndustryByCategory(taxId);
    if (industryResult) return industryResult;
  }

  return { category: "其他", icon: "💰" };
}
