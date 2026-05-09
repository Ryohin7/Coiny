import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth";
import { parseWithAI } from "@/lib/services/ai-parser";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const decodedToken = await verifyAuth(req);
    if (!decodedToken || (decodedToken.uid !== userId && decodedToken.sub !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    // 1. 抓取最近消費資料 (品項名稱)
    const expensesSnapshot = await db.collection("manual_expenses")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    
    // 這裡我們假設載具發票也會同步到某處，或者直接抓載具
    const invoiceSnapshot = await db.collection("pending_invoices")
      .where("userId", "==", userId)
      .limit(50)
      .get();

    const items: string[] = [];
    expensesSnapshot.forEach(doc => items.push(doc.data().note || doc.data().category));
    invoiceSnapshot.forEach(doc => {
      const inv = doc.data();
      if (inv.items) inv.items.forEach((it: any) => items.push(it.name));
    });

    const uniqueItems = Array.from(new Set(items)).slice(0, 50);

    // 2. 抓取現有分類
    const categoriesSnapshot = await db.collection("categories")
      .where("userId", "==", userId)
      .get();
    const existingNames = categoriesSnapshot.docs.map(doc => doc.data().name);

    if (process.env.AI_ENABLED !== "true") {
      return NextResponse.json({ error: "AI service not enabled" }, { status: 400 });
    }

    // 3. 呼叫 AI 進行分析
    const prompt = `你是一個財務分析師。以下是用戶最近購買的品項清單：
    [${uniqueItems.join(", ")}]

    用戶目前已經有的分類：
    [${existingNames.join(", ")}]

    請根據購買清單，建議 3 個「用戶目前還沒有」但非常需要的分類。
    請回傳以下格式的純 JSON 陣列：
    [
      {
        "name": "分類名稱",
        "icon": "一個 Emoji",
        "keywords": ["關鍵字1", "關鍵字2", "關鍵字3"]
      }
    ]
    注意：只回傳 JSON，不要有其他文字。不要建議已經存在的分類。`;

    const apiUrl = process.env.AI_API_URL;
    const response = await fetch(apiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEY || ""}`,
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "local-model",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) throw new Error("AI Request failed");
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const suggestions = JSON.parse(content.replace(/```json|```/g, ""));

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("AI Suggest Categories Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
