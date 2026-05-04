import { middleware, messagingApi, WebhookEvent } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { db } from "@/lib/firebase/admin";
import crypto from "crypto";

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

  const events: WebhookEvent[] = JSON.parse(body).events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text.trim();
      const userId = event.source.userId;

      // Regex to match "載具 69元" or "記帳 69"
      const match = text.match(/^(載具|記帳)\s*(\d+)/i);

      if (match) {
        const amount = parseInt(match[2]);
        const date = new Date();
        const dateStr = date.toISOString().split("T")[0].replace(/-/g, "/"); // YYYY/MM/DD

        try {
          await db.collection("manual_expenses").add({
            userId,
            amount,
            date: dateStr,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            matched: false,
            originalText: text,
          });

          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: `✅ 已記錄：${amount} 元 (${dateStr})\n待財政部資料彙整後將自動對帳。`,
              },
            ],
          });
        } catch (error) {
          console.error("Error saving expense:", error);
        }
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
