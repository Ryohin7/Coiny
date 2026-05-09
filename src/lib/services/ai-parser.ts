/**
 * AI 記帳解析服務 (優化 Prompt 版)
 */
export async function parseWithAI(text: string) {
  console.log(`[AI-Parser] 收到解析請求: "${text}"`);
  
  if (process.env.AI_ENABLED !== "true") {
    return null;
  }

  try {
    const apiUrl = process.env.AI_API_URL;
    if (!apiUrl) return null;

    const d = new Date(today);
    const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '/');
    
    const dates = {
      today: formatDate(d),
      yesterday: formatDate(new Date(d.getTime() - 86400000)),
      beforeYesterday: formatDate(new Date(d.getTime() - 172800000)),
      dayBeforeYesterday: formatDate(new Date(d.getTime() - 259200000)),
      tomorrow: formatDate(new Date(d.getTime() + 86400000)),
    };

    const prompt = `你是一個專業的記帳助理，負責將使用者的口語化描述轉換為精確的 JSON 數據。

### 當前日期參考 (台灣時間 UTC+8)：
- 今天是：${dates.today}
- 昨天是：${dates.yesterday}
- 前天是：${dates.beforeYesterday}
- 大前天是：${dates.dayBeforeYesterday}
- 明天是：${dates.tomorrow}

### 解析與計算規則：
1. **日期 (date)**: 根據描述推算日期，格式為 "YYYY/MM/DD"。未提到則預設為 "${dates.today}"。
2. **多品項計算 (Math Logic)**:
   - 如果描述中包含多個金額，請根據語意進行加減計算。
   - 範例：「買蘋果30、香蕉60、媽媽給我50」 -> 支出(30+60) - 收入(50) = 淨支出 40。
   - **amount**: 最終計算出的「淨額」（絕對值）。
   - **isIncome**: 如果最後是淨收入則為 true，淨支出則為 false。
3. **明細列表 (items)**: 請將識別到的所有品項拆解。
4. **備註 (note)**: 將所有品項與其金額組合成易讀的字串，例如：「蘋果30、香蕉60、媽媽給我50」。
5. **分類 (category)**: 根據整體描述選擇一個最適合的分類（如：餐飲、購物、收入、其他）。

### 範例：
- 輸入: "我今天買了一顆蘋果30 一串香蕉60 ，我媽給我50"
  輸出: {
    "amount": 40,
    "category": "餐飲",
    "date": "${dates.today}",
    "note": "一顆蘋果30元、一串香蕉60元、媽媽給我50元",
    "isIncome": false,
    "items": [
      {"name": "一顆蘋果", "price": 30},
      {"name": "一串香蕉", "price": 60},
      {"name": "媽媽給我", "price": -50}
    ]
  }

### 請處理以下輸入：
"${text}"

要求：只回傳 JSON，不要解釋。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEY || ""}`,
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "local-model",
        messages: [{ role: "user", content: prompt }],
        temperature: 0, // 降低隨機性，確保計算精確
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);
    
    console.log("[AI-Parser] 解析成功:", result);

    return {
      amount: Math.abs(Number(result.amount)),
      category: result.category || "其他",
      date: (result.date || dates.today).replace(/-/g, "/"),
      note: result.note || text,
      isIncome: result.isIncome === true || String(result.isIncome).toLowerCase() === 'true',
      items: result.items || []
    };
  } catch (error) {
    console.error("[AI-Parser] 錯誤:", error);
    return null;
  }
}
