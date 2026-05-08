import { NextResponse } from "next/server";
import { parseMOFCSV } from "@/lib/services/mof-parser";
import { getDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. 大小限制 (60KB)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 60 * 1024) {
      return NextResponse.json({ error: "Payload too large (Max 60KB)" }, { status: 413 });
    }

    const { userId: emailID, csvContent } = await req.json();

    if (!emailID || !csvContent) {
      console.warn("Email Webhook: Missing emailID or csvContent");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    // 2. 查找使用者並檢查權限與頻率
    const userSnapshot = await db.collection("users").where("emailID", "==", emailID).limit(1).get();
    
    if (userSnapshot.empty) {
      console.error(`Email Webhook: No user found for emailID ${emailID}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const lineUserId = userDoc.id;
    const isAdmin = userData.isAdmin === true;

    // 3. 頻率限制 (非 Admin 限制每 12 小時一次，對應財政部每月寄送的特性)
    if (!isAdmin) {
      const lastProcessedAt = userData.lastWebhookAt?.toDate?.() || 0;
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;
      
      if (now - lastProcessedAt < twelveHours) {
        console.warn(`Email Webhook: Rate limited for user ${emailID}`);
        return NextResponse.json({ error: "Too many requests. Please wait 12 hours." }, { status: 429 });
      }
    }

    console.log(`Email Webhook: Received CSV snippet: ${csvContent.substring(0, 100)}...`);

    const invoices = await parseMOFCSV(csvContent, lineUserId);

    // 更新最後處理時間
    await userDoc.ref.update({
      lastWebhookAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${invoices.length} invoices`,
      count: invoices.length,
    });
  } catch (error: any) {
    console.error("Email Webhook Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
