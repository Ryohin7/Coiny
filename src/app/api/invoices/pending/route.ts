import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Verify authentication
  const decodedToken = await verifyAuth(req);
  if (!decodedToken || (decodedToken.uid !== userId && decodedToken.sub !== userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    const now = admin.firestore.Timestamp.now();

    // 先抓取所有 pending 的資料，避免需要複雜的複合索引
    const snapshot = await db
      .collection("pending_invoices")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .get();

    const pendingInvoices = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      // 在記憶體中過濾：1. 完整性檢查 2. 時間已到 (針對一般會員的限制)
      .filter((inv: any) => {
        const isComplete = inv.invNum && inv.totalAmount !== undefined && inv.store && inv.date;
        const availableAt = inv.availableAt ? (inv.availableAt.toDate ? inv.availableAt.toDate() : new Date(inv.availableAt)) : null;
        
        // 如果沒有設定 availableAt，預設為可見 (相容舊資料)
        const isAvailable = !availableAt || availableAt <= now.toDate();
        
        return isComplete && isAvailable;
      })
      // 排序：按建立時間
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || 0;
        const dateB = b.createdAt?.toDate?.() || 0;
        return dateB - dateA;
      });

    return NextResponse.json({ pendingInvoices });
  } catch (error: any) {
    console.error("Fetch pending invoices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
