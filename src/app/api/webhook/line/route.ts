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

      // Improved Parser: Supports [Date] Category Amount [Remark] OR [Date] Amount Category [Remark]
      const tokens = text.split(/\s+/);
      let datePart: string | undefined;
      let categoryInput: string | undefined;
      let amount: number | undefined;
      let remark: string | undefined;

      // 1. Check if first token is Date (M/D)
      let startIndex = 0;
      if (tokens[0].match(/^\d{1,2}\/\d{1,2}$/)) {
        datePart = tokens[0];
        startIndex = 1;
      }

      // 2. Identify Amount and Category from remaining tokens
      const remainingTokens = tokens.slice(startIndex);
      
      // Try to find the first token that is a number (Amount)
      const amountIndex = remainingTokens.findIndex(t => /^\d+$/.test(t));
      
      if (amountIndex !== -1) {
        amount = parseInt(remainingTokens[amountIndex]);
        // Category is usually the other token
        if (amountIndex === 0 && remainingTokens.length > 1) {
          categoryInput = remainingTokens[1];
          remark = remainingTokens.slice(2).join(" ");
        } else if (amountIndex > 0) {
          categoryInput = remainingTokens[0];
          remark = remainingTokens.slice(1, amountIndex).concat(remainingTokens.slice(amountIndex + 1)).join(" ");
        }
      }

      if (categoryInput && amount !== undefined) {

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
