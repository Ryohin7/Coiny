import { messagingApi, webhook } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getDb } from "@/lib/firebase/admin";
import crypto from "crypto";
import { classifyMerchant } from "@/lib/services/classifier";

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
      const text = event.message.text.trim();
      const userId = event.source?.userId;

      if (!userId) continue;

      // Match: [Date] [Category] [Amount] [Remark]
      // Regex: Optional Date (M/D), Mandatory Category (non-space), Mandatory Amount (digits), Optional Remark (anything)
      const commandMatch = text.match(/^(?:(\d{1,2}\/\d{1,2})\s+)?(\S+)\s+(\d+)(?:\s+(.+))?$/);

      if (commandMatch) {
        const datePart = commandMatch[1];
        const categoryInput = commandMatch[2];
        const amount = parseInt(commandMatch[3]);
        const remark = commandMatch[4]?.trim() || "";

        let dateStr: string;
        const now = new Date();
        const currentYear = now.getFullYear();

        if (datePart) {
          const [m, d] = datePart.split("/").map(Number);
          // Set to current year, specific month/day
          const targetDate = new Date(currentYear, m - 1, d);
          dateStr = targetDate.toISOString().split("T")[0].replace(/-/g, "/");
        } else {
          dateStr = now.toISOString().split("T")[0].replace(/-/g, "/");
        }

        try {
          const db = getDb();
          if (!db) {
            console.error("Database not initialized");
            continue;
          }

          // 1. 取得用戶自訂分類
          const catSnapshot = await db.collection("categories").where("userId", "==", userId).get();
          const userCats = catSnapshot.docs.map(doc => doc.data());
          
          // 2. 尋找匹配的分類 (名稱或關鍵字)
          // 優先比對名稱，再比對關鍵字
          const matchedCat = userCats.find(c => c.name === categoryInput) || 
                             userCats.find(c => c.keywords && c.keywords.some((k: string) => k.toUpperCase() === categoryInput.toUpperCase()));

          if (!matchedCat) {
            if ("replyToken" in event && event.replyToken) {
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: "text", text: `❌ 沒有「${categoryInput}」這個分類，請先至分類管理設定。` }],
              });
            }
            continue;
          }

          const finalCategory = matchedCat.name;
          const icon = matchedCat.icon || "💰";
          let finalRemark = remark;

          // 如果輸入的是關鍵字而不是分類名稱，自動將關鍵字轉入備註
          if (finalCategory !== categoryInput) {
            finalRemark = remark ? `${categoryInput} (${remark})` : categoryInput;
          }

          // Determine if it's income (heuristic)
          const incomeKeywords = ["收入", "薪資", "獎金", "利息", "中獎", "投資"];
          const isIncome = incomeKeywords.some(kw => finalCategory.includes(kw) || categoryInput.includes(kw));

          const expenseData: any = {
            userId,
            amount,
            date: dateStr,
            note: finalRemark || "手動記帳",
            category: finalCategory,
            icon: icon,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            matched: false,
            originalText: text,
            isIncome,
          };

          // Update items for details view
          if (finalRemark) {
            expenseData.items = [{ name: finalRemark, price: amount }];
          }

          await db.collection("manual_expenses").add(expenseData);

          if ("replyToken" in event && event.replyToken) {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: "text",
                  text: `✅ 已記錄${isIncome ? "收入" : "支出"}：${amount} 元 (${dateStr})\n分類：${finalCategory}${finalCategory !== categoryInput ? ` (${categoryInput})` : ""}\n${finalRemark ? `備註：${finalRemark}` : ""}`,
                },
              ],
            });
          }
        } catch (error) {
          console.error("Error saving expense:", error);
        }
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
