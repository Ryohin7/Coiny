import { NextResponse } from "next/server";
import { parseMOFCSV } from "@/lib/services/mof-parser";
import { getDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { messagingApi } from "@line/bot-sdk";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    const { userId: emailID, csvContent } = await req.json();

    if (!emailID || !csvContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. 查找使用者
    const userSnapshot = await db.collection("users").where("emailID", "==", emailID).limit(1).get();
    
    if (userSnapshot.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const lineUserId = userDoc.id;
    const isAdmin = userData.isAdmin === true;
    const isPro = userData.isPro === true;

    // 2. 大小限制 (非 Admin 限制 60KB)
    const contentLength = req.headers.get("content-length");
    if (!isAdmin && contentLength && parseInt(contentLength) > 60 * 1024) {
      return NextResponse.json({ error: "Payload too large (Max 60KB)" }, { status: 413 });
    }


    // 4. 計算匯入時間 (Pro 立即，一般隔日凌晨)
    // 使用台灣時間 (UTC+8)
    const now = new Date();
    const tzOffset = 8 * 60; // 台灣時間偏移 (分鐘)
    const twNow = new Date(now.getTime() + tzOffset * 60 * 1000);
    
    let availableAt = new Date(now.getTime());
    if (!isPro && !isAdmin) {
      // 設定為台灣時間的隔日凌晨 00:00
      availableAt = new Date(now.getTime());
      availableAt.setUTCHours(24 - 8, 0, 0, 0); // 24 - 8 = 16:00 UTC 是台灣的 00:00
      
      // 如果現在已經過了台灣時間 16:00 UTC (即台灣 00:00)，則再加一天
      if (availableAt <= now) {
        availableAt.setUTCDate(availableAt.getUTCDate() + 1);
      }
    }

    const invoices = await parseMOFCSV(csvContent, lineUserId, availableAt);

    // 5. 更新最後處理時間
    await userDoc.ref.update({
      lastWebhookAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 6. 發送 LINE 推送通知
    try {
      if (invoices.length > 0) {
        const message = isAdmin || isPro
          ? `✅ 載具發票匯入成功！\n偵測到 ${invoices.length} 筆新資料，已立即開放對帳。請至「交易」頁面查看。`
          : `✅ 載具發票已接收！\n共 ${invoices.length} 筆資料。由於您目前為一般會員，系統將於明日凌晨 (00:00) 開放對帳通知。`;

        await client.pushMessage({
          to: lineUserId,
          messages: [{ type: "text", text: message }],
        });
      }
    } catch (pushError) {
      console.error("LINE Push Notification Error:", pushError);
      // 不影響主流程，僅記錄錯誤
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${invoices.length} invoices. Available at: ${availableAt.toISOString()}`,
      count: invoices.length,
    });
  } catch (error: any) {
    console.error("Email Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
