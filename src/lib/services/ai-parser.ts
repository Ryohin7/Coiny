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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const prompt = `你是一個專業的記帳助理，負責將使用者的口語化描述轉換為精確的 JSON 數據。

### 當前日期資訊：
- 今天是：${todayStr}
- 昨天是：${yesterdayStr}

### 解析規則：
1. **日期 (date)**: 
   - 如果提到「昨天」，日期設為 "${yesterdayStr}"。
   - 如果提到「今天」或未提到日期，日期設為 "${todayStr}"。
   - 格式必須為 "YYYY/MM/DD"。
2. **金額 (amount)**: 提取純數字。
3. **收支判定 (isIncome)**: 
   - 收入：領薪水、獎金、中獎、賣東西、收到轉帳、利息。
   - 支出：買東西、吃飯、交通、付錢、繳費。
4. **備註 (note)**: 簡短描述內容，例如「午餐麥當勞」。

### 範例：
- 輸入: "昨天吃晚餐花 200"
  輸出: {"amount": 200, "category": "餐飲", "date": "${yesterdayStr.replace(/-/g, '/')}", "note": "晚餐", "isIncome": false}
- 輸入: "領薪水 50000"
  輸出: {"amount": 50000, "category": "收入", "date": "${todayStr.replace(/-/g, '/')}", "note": "領薪水", "isIncome": true}

### 請處理以下輸入：
"${text}"

要求：只回傳 JSON，不要解釋。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 增加到 10 秒

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
        temperature: 0.1,
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
      amount: typeof result.amount === 'string' ? parseInt(result.amount) : Number(result.amount),
      category: result.category || "其他",
      date: (result.date || "").replace(/-/g, "/"),
      note: result.note || text,
      isIncome: result.isIncome === true || String(result.isIncome).toLowerCase() === 'true'
    };
  } catch (error) {
    console.error("[AI-Parser] 錯誤:", error);
    return null;
  }
}
