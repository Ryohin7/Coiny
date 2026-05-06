/**
 * Coiny 支出分類引擎
 * 採用多層級判斷：關鍵字字典 -> 統編對照 -> AI (預留)
 */

interface MerchantRule {
  keywords: string[];
  category: string;
  icon: string;
}

const MERCHANT_RULES: MerchantRule[] = [
  {
    keywords: ["統一超商", "７－ＥＬＥＶＥＮ", "7-11", "７－１１", "萬和"],
    category: "便利商店",
    icon: "🏪",
  },
  {
    keywords: ["全家", "精誠"],
    category: "便利商店",
    icon: "🏪",
  },
  {
    keywords: ["萊爾富", "來來超商"],
    category: "便利商店",
    icon: "🏪",
  },
  {
    keywords: ["星巴克", "悠旅生活", "路易莎", "ＣＡＭＡ", "咖啡"],
    category: "餐飲",
    icon: "☕",
  },
  {
    keywords: ["麥當勞", "和德昌", "摩斯漢堡", "安心食品", "肯德基", "必勝客"],
    category: "餐飲",
    icon: "🍔",
  },
  {
    keywords: ["中油", "台亞", "加油站", "加油"],
    category: "交通",
    icon: "⛽",
  },
  {
    keywords: ["台灣鐵路", "高鐵", "台灣高速鐵路", "捷運", "悠遊卡", "一卡通"],
    category: "交通",
    icon: "🚄",
  },
  {
    keywords: ["睿能", "GOGORO", "GOSHARE", "和雲行動", "IRENT", "UBIKE"],
    category: "交通",
    icon: "🛵",
  },
  {
    keywords: ["全聯", "家樂福", "大潤發", "美廉社", "好市多", "COSTCO", "惠康"],
    category: "超市",
    icon: "🛒",
  },
  {
    keywords: ["蝦皮", "樂購蝦皮", "網路購物", "富邦媒體", "MOMO", "網購"],
    category: "購物",
    icon: "📦",
  },
  {
    keywords: ["新光三越", "遠東百貨", "微風", "誠品", "百貨", "購物中心"],
    category: "百貨",
    icon: "🏢",
  },
  {
    keywords: ["健保", "醫院", "診所", "藥局", "藥妝"],
    category: "醫療",
    icon: "🏥",
  },
  {
    keywords: ["停車", "車庫", "嘟嘟房", "城市車旅"],
    category: "交通",
    icon: "🅿️",
  }
];

export function classifyMerchant(storeName: string, taxId?: string): { category: string; icon: string } {
  const normalizedName = storeName.toUpperCase();

  // 1. 商家名稱字典比對
  for (const rule of MERCHANT_RULES) {
    if (rule.keywords.some(keyword => normalizedName.includes(keyword))) {
      return { category: rule.category, icon: rule.icon };
    }
  }

  // 2. 這裡可以預留統編 API 查詢
  // ...

  // 預設分類
  return { category: "其他", icon: "💰" };
}
