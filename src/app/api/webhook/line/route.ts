import { messagingApi, webhook } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getDb } from "@/lib/firebase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
};

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") || "";

  // Verify signature
  const hash = crypto
    .createHmac("sha256", config.channelSecret)
    .update(body)
    .digest("base64");

  if (hash !== signature) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const events: webhook.Event[] = JSON.parse(body).events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      let text = event.message.text.trim();
      const userId = event.source?.userId;
      const db = getDb();
      if (!db) continue;

      // 取得用戶狀態 (確認是否為 Pro)
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const userIsPro = userData?.isPro || userData?.isAdmin || false;

      let targetDate = new Date();
      
      // 1. 智慧日期解析 (Regex 預處理)
      const dateKeywords: Record<string, number> = {
        "大前天": -3,
        "前天": -2,
        "昨天": -1,
        "今天": 0,
        "明天": 1,
        "後天": 2,
        "大後天": 3
      };

      for (const [kw, offset] of Object.entries(dateKeywords)) {
        if (text.includes(kw)) {
          targetDate.setDate(targetDate.getDate() + offset);
          text = text.replace(kw, "").trim();
          break;
        }
      }

      // 支援 MM/DD 格式
      const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
      if (dateMatch) {
        const month = parseInt(dateMatch[1]) - 1;
        const day = parseInt(dateMatch[2]);
        targetDate.setMonth(month);
        targetDate.setDate(day);
        text = text.replace(dateMatch[0], "").trim();
      }

      const dateStr = targetDate.toISOString().split("T")[0].replace(/-/g, "/");

      // --- AI 測試區塊 (Pro 會員專屬) ---
      let aiResult = null;
      if (process.env.AI_ENABLED === "true" && userIsPro) {
        const { parseWithAI } = await import("@/lib/services/ai-parser");
        aiResult = await parseWithAI(event.message.text);
      }
      // --------------------------------

      // 2. 金額與內容解析
      let amount: number;
      let categoryInput: string;
      let finalDateStr = dateStr;
      let isIncomeFallback = false;

      if (aiResult) {
        // 使用 AI 解析結果
        amount = aiResult.amount;
        categoryInput = aiResult.note || aiResult.category;
        finalDateStr = aiResult.date || dateStr;
        isIncomeFallback = aiResult.isIncome;
      } else {
        // 回退至原本的正規表達式解析
        const amountMatch = text.match(/(\d+)/);
        if (!amountMatch) continue; 
        amount = parseInt(amountMatch[0]);
        categoryInput = text.replace(amountMatch[0], "").trim() || "其他";
      }

      try {
        const db = getDb();
        if (!db) continue;

        // 3. 取得用戶自訂分類進行匹配
        const catSnapshot = await db.collection("categories").where("userId", "==", userId).get();
        const userCats = catSnapshot.docs.map(doc => doc.data());
        
        // 優先比對名稱，再比對關鍵字
        const matchedCat = userCats.find(c => c.name === categoryInput) || 
                           userCats.find(c => c.keywords && c.keywords.some((k: string) => categoryInput.toUpperCase().includes(k.toUpperCase())));

        const finalCategory = matchedCat ? matchedCat.name : "其他";
        const icon = matchedCat ? (matchedCat.icon || "💰") : "💰";
        const finalRemark = categoryInput;

        // 判斷是否為收入
        const incomeKeywords = ["收入", "薪資", "獎金", "利息", "中獎", "投資"];
        const isIncome = aiResult ? isIncomeFallback : (matchedCat?.isIncome || incomeKeywords.some(kw => categoryInput.includes(kw)));

        const expenseData: any = {
          userId,
          amount,
          date: finalDateStr,
          note: finalRemark,
          category: finalCategory,
          icon: icon,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          matched: false,
          originalText: event.message.text,
          isIncome,
          items: [{ name: finalRemark, price: amount }]
        };

        await db.collection("manual_expenses").add(expenseData);

        if ("replyToken" in event && event.replyToken) {
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: `✅ 已記錄${isIncome ? "收入" : "支出"}：${amount} 元\n📅 日期：${finalDateStr}\n🏷️ 項目：${categoryInput}\n📁 分類：${finalCategory}${aiResult ? "\n🤖 (由 AI 解析)" : ""}`,
              },
            ],
          });
        }
      } catch (error) {
        console.error("Error saving expense:", error);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
