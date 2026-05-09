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

    const snapshot = await db
      .collection("pending_invoices")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .where("availableAt", "<=", now) // 只抓取「時間已到」的資料
      .orderBy("availableAt", "asc")
      .get();

    const pendingInvoices = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      // 額外的資料完整性檢查
      .filter((inv: any) => 
        inv.invNum && 
        inv.totalAmount !== undefined && 
        inv.store && 
        inv.date
      );

    return NextResponse.json({ pendingInvoices });
  } catch (error: any) {
    console.error("Fetch pending invoices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
