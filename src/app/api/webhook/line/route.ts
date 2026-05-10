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
      if (!userId) continue;

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

      // 2. 金額與內容解析 (強化型 Regex 運算)
      const segments = text.split(/(\d+)/); // 按數字切分文字
      let totalAmount = 0;
      const negativeKeywords = ["折扣", "扣除", "減", "回饋", "折抵", "優惠", "退款", "找零"];

      // 遍歷切分後的內容，索引 1, 3, 5... 為數字
      for (let i = 1; i < segments.length; i += 2) {
        const val = parseInt(segments[i]);
        const prefix = segments[i - 1]; // 數字前方的文字
        
        // 如果前方文字包含負面關鍵字，則相減
        const isNegative = negativeKeywords.some(kw => prefix.includes(kw));
        totalAmount += isNegative ? -val : val;
      }

      if (totalAmount === 0 && segments.length <= 1) continue; // 沒抓到數字則跳過

      const amount = Math.abs(totalAmount);
      const categoryInput = text.replace(/\d+/g, "").trim() || "其他";
      const finalDateStr = dateStr;

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
        // 如果運算結果是負數 (例如：退款 100)，則視為收入
        const isIncome = totalAmount < 0 || (matchedCat?.isIncome || incomeKeywords.some(kw => categoryInput.includes(kw)));

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
                text: `✅ 已記錄${isIncome ? "收入" : "支出"}：${amount} 元\n📅 日期：${finalDateStr}\n🏷️ 項目：${categoryInput}\n📁 分類：${finalCategory}`,
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
