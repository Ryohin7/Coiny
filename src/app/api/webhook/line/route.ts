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

      // --- 1. 顯示 Loading 動畫 ---
      try {
        await fetch("https://api.line.me/v2/bot/chat/loading/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.channelAccessToken}`,
          },
          body: JSON.stringify({
            chatId: userId,
            loadingSeconds: 5
          })
        });
      } catch (err) {
        console.error("Loading Animation Error:", err);
      }

      // --- 2. 金額與內容解析 (強化型明細拆解) ---
      const segments = text.split(/(\d+)/); 
      let totalAmount = 0;
      const parsedItems: { name: string; price: number }[] = [];
      const negativeKeywords = ["折扣", "扣除", "減", "回饋", "折抵", "優惠", "退款", "找零"];

      for (let i = 1; i < segments.length; i += 2) {
        const val = parseInt(segments[i]);
        let name = segments[i - 1].trim();
        if (!name && i === 1) name = "一般支出";
        if (!name) name = "項目 " + Math.floor(i/2 + 1);
        
        const isNegative = negativeKeywords.some(kw => name.includes(kw));
        const price = isNegative ? -val : val;
        totalAmount += price;
        parsedItems.push({ name, price });
      }

      if (totalAmount === 0 && segments.length <= 1) continue; 

      const amount = Math.abs(totalAmount);
      const categoryInput = parsedItems[0]?.name || "其他";
      const finalDateStr = dateStr;

      try {
        const db = getDb();
        if (!db) continue;

        // 3. 取得用戶自訂分類進行匹配
        const catSnapshot = await db.collection("categories").where("userId", "==", userId).get();
        const userCats = catSnapshot.docs.map(doc => doc.data());
        
        const matchedCat = userCats.find(c => c.name === categoryInput) || 
                           userCats.find(c => c.keywords && c.keywords.some((k: string) => categoryInput.toUpperCase().includes(k.toUpperCase())));

        const finalCategory = matchedCat ? matchedCat.name : "其他";
        const icon = matchedCat ? (matchedCat.icon || "💰") : "💰";

        const incomeKeywords = ["收入", "薪資", "獎金", "利息", "中獎", "投資"];
        const isIncome = totalAmount < 0 || (matchedCat?.isIncome || incomeKeywords.some(kw => categoryInput.includes(kw)));

        const expenseData: any = {
          userId,
          amount,
          date: finalDateStr,
          note: text,
          category: finalCategory,
          icon: icon,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          matched: false,
          originalText: event.message.text,
          isIncome,
          items: parsedItems
        };

        const docRef = await db.collection("manual_expenses").add(expenseData);

        if ("replyToken" in event && event.replyToken) {
          const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/trade?id=${docRef.id}`;

          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "flex",
                altText: `RECORDED: ${finalCategory} ${amount.toLocaleString()}`,
                contents: {
                  type: "bubble",
                  size: "mega",
                  header: {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#FFFFFF",
                    paddingTop: "24px",
                    paddingBottom: "12px",
                    contents: [
                      {
                        type: "text",
                        text: isIncome ? "INCOME RECORDED" : "EXPENSE RECORDED",
                        weight: "bold",
                        size: "xs",
                        color: "#2563EB",
                        tracking: "0.2em"
                      },
                      {
                        type: "separator",
                        margin: "md",
                        color: "#2563EB"
                      }
                    ]
                  },
                  body: {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#FFFFFF",
                    contents: [
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          {
                            type: "text",
                            text: finalCategory.toUpperCase(),
                            weight: "bold",
                            size: "xxl",
                            color: "#111827",
                            flex: 1
                          }
                        ]
                      },
                      {
                        type: "text",
                        text: finalDateStr,
                        size: "xs",
                        color: "#9CA3AF",
                        margin: "sm",
                        weight: "bold"
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        margin: "xxl",
                        spacing: "md",
                        contents: parsedItems.map(item => ({
                          type: "box",
                          layout: "horizontal",
                          contents: [
                            {
                              type: "text",
                              text: item.name,
                              size: "sm",
                              color: "#4B5563",
                              flex: 4
                            },
                            {
                              type: "text",
                              text: item.price.toLocaleString(),
                              size: "sm",
                              color: "#111827",
                              align: "end",
                              flex: 2,
                              weight: "bold"
                            }
                          ]
                        }))
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        margin: "xxl",
                        paddingTop: "20px",
                        borderWidth: "1px",
                        borderColor: "#F3F4F6",
                        borderTop: "1px",
                        contents: [
                          {
                            type: "text",
                            text: "TOTAL",
                            size: "xs",
                            weight: "black",
                            color: "#9CA3AF",
                            gravity: "center"
                          },
                          {
                            type: "text",
                            text: `${amount.toLocaleString()}`,
                            size: "xxl",
                            weight: "black",
                            align: "end",
                            color: "#2563EB"
                          }
                        ]
                      }
                    ]
                  },
                  footer: {
                    type: "box",
                    layout: "horizontal",
                    spacing: "md",
                    backgroundColor: "#FFFFFF",
                    paddingTop: "12px",
                    contents: [
                      {
                        type: "button",
                        action: {
                          type: "uri",
                          label: "EDIT DETAILS",
                          uri: liffUrl
                        },
                        style: "primary",
                        height: "md",
                        color: "#2563EB"
                      }
                    ]
                  },
                  styles: {
                    footer: {
                      separator: false
                    }
                  }
                }
              }
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
