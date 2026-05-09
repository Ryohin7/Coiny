import { NextResponse } from "next/server";
import { parseMOFCSV } from "@/lib/services/mof-parser";
import { getDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

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

    // 3. 頻率限制 (非 Admin 限制每 12 小時一次)
    if (!isAdmin) {
      const lastProcessedAt = userData.lastWebhookAt?.toDate?.() || 0;
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;
      
      if (now - lastProcessedAt < twelveHours) {
        return NextResponse.json({ error: "Too many requests. Please wait 12 hours." }, { status: 429 });
      }
    }

    // 4. 計算匯入時間 (Pro 立即，一般隔日凌晨)
    let availableAt = new Date();
    if (!isPro && !isAdmin) {
      availableAt.setDate(availableAt.getDate() + 1);
      availableAt.setHours(0, 0, 0, 0); // 明日凌晨
    }

    const invoices = await parseMOFCSV(csvContent, lineUserId, availableAt);

    // 更新最後處理時間
    await userDoc.ref.update({
      lastWebhookAt: admin.firestore.FieldValue.serverTimestamp()
    });

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
