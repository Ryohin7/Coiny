import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import { classifyMerchant } from "@/lib/services/classifier";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Verify authentication
    const decodedToken = await verifyAuth(req);
    if (!decodedToken || (decodedToken.uid !== userId && decodedToken.sub !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    // 取得該用戶所有紀錄
    const manualRef = db.collection("manual_expenses").where("userId", "==", userId);
    const invoiceRef = db.collection("invoices").where("userId", "==", userId);

    const [manualSnap, invoiceSnap] = await Promise.all([manualRef.get(), invoiceRef.get()]);
    
    let count = 0;
    const batch = db.batch();

    // 處理手動記帳
    for (const doc of manualSnap.docs) {
      const data = doc.data();
      // 只有當用戶沒有手動設定過分類時才自動重新分類
      if (data.manualCategory) continue;

      const { category, icon } = await classifyMerchant(data.note || "手動記帳", [], undefined, userId);
      if (category !== (data.category || "其他")) {
        batch.update(doc.ref, { category, icon });
        count++;
      }
    }

    // 處理發票
    for (const doc of invoiceSnap.docs) {
      const data = doc.data();
      if (data.manualCategory) continue;

      const { category, icon } = await classifyMerchant(data.store, data.items?.map((i: any) => i.name) || [], data.taxId, userId);
      if (category !== (data.category || "其他")) {
        batch.update(doc.ref, { category, icon });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return NextResponse.json({ success: true, message: `已更新 ${count} 筆交易分類` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
