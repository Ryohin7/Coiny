/**
 * AI 記帳解析服務 (具備詳細診斷日誌)
 */
export async function parseWithAI(text: string) {
  console.log(`[AI-Parser] 收到解析請求: "${text}"`);
  
  if (process.env.AI_ENABLED !== "true") {
    console.log("[AI-Parser] AI 模式未開啟 (AI_ENABLED != true)");
    return null;
  }

  try {
    const apiUrl = process.env.AI_API_URL;
    if (!apiUrl) {
      console.error("[AI-Parser] 錯誤: 未設定 AI_API_URL");
      return null;
    }

    console.log(`[AI-Parser] 正在連線至: ${apiUrl}`);

    const prompt = `你是一個專業的記帳助理。請將以下使用者的輸入解析為 JSON 格式。
    輸入內容： "${text}"
    今天日期： "${new Date().toISOString().split('T')[0]}"

    請回傳以下格式的純 JSON，不要包含任何解釋：
    {
      "amount": 數字,
      "category": "分類名稱",
      "date": "YYYY/MM/DD",
      "note": "備註內容",
      "isIncome": 布林值
    }
    
    注意：只回傳 JSON 對象本身，不要包裹在 \`\`\`json 標籤中。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超時

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    };

    if (process.env.AI_API_KEY && 
        process.env.AI_API_KEY !== "" && 
        process.env.AI_API_KEY !== "lm-studio" && 
        process.env.AI_API_KEY !== "optional") {
      headers["Authorization"] = `Bearer ${process.env.AI_API_KEY}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: process.env.AI_MODEL || "local-model",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI-Parser] API 回報錯誤 (${response.status}):`, errorText.substring(0, 200));
      return null;
    }

    const data = await response.json();
    console.log("[AI-Parser] AI 原始回傳內容:", JSON.stringify(data).substring(0, 200));

    const content = data.choices[0].message.content.trim();
    // 移除可能存在的 Markdown 標籤
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);
    
    console.log("[AI-Parser] 解析成功:", result);

    return {
      amount: typeof result.amount === 'string' ? parseInt(result.amount) : Number(result.amount),
      category: result.category,
      date: (result.date || "").replace(/-/g, "/"),
      note: result.note,
      isIncome: result.isIncome === true || String(result.isIncome).toLowerCase() === 'true'
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("[AI-Parser] 錯誤: AI 回應超時 (超過 8 秒)");
    } else {
      console.error("[AI-Parser] 解析過程中發生異常:", error.message);
    }
    return null;
  }
}
