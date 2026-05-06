import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import { classifyMerchant } from "@/lib/services/classifier";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    // 取得該用戶所有分類為「其他」或未分類的紀錄
    const manualRef = db.collection("manual_expenses").where("userId", "==", userId);
    const invoiceRef = db.collection("invoices").where("userId", "==", userId);

    const [manualSnap, invoiceSnap] = await Promise.all([manualRef.get(), invoiceRef.get()]);
    
    let count = 0;
    const batch = db.batch();

    // 處理手動記帳
    for (const doc of manualSnap.docs) {
      const data = doc.data();
      const { category, icon } = await classifyMerchant(data.note || "手動記帳");
      if (category !== "其他") {
        batch.update(doc.ref, { category, icon });
        count++;
      }
    }

    // 處理發票
    for (const doc of invoiceSnap.docs) {
      const data = doc.data();
      const { category, icon } = await classifyMerchant(data.store, data.taxId);
      if (category !== "其他") {
        batch.update(doc.ref, { category, icon });
        count++;
      }
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: `已更新 ${count} 筆交易分類` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
