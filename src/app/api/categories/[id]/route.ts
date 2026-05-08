import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, icon, keywords, isIncome } = await req.json();
    
    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    await db.collection("categories").doc(id).update({
      name,
      icon,
      keywords,
      isIncome: isIncome ?? false,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    // 1. 獲取分類名稱
    const catDoc = await db.collection("categories").doc(id).get();
    if (!catDoc.exists) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    const catName = catDoc.data()?.name;

    // 2. 計算關聯資料數量 (手動記帳 + 發票)
    const manualSnapshot = await db.collection("manual_expenses")
      .where("userId", "==", userId)
      .where("category", "==", catName)
      .get();
    
    const invoiceSnapshot = await db.collection("invoices")
      .where("userId", "==", userId)
      .where("category", "==", catName)
      .get();

    return NextResponse.json({ 
      name: catName,
      count: manualSnapshot.size + invoiceSnapshot.size 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    // 1. 獲取分類名稱
    const catDoc = await db.collection("categories").doc(id).get();
    if (!catDoc.exists) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    const catName = catDoc.data()?.name;

    // 2. 刪除分類
    await db.collection("categories").doc(id).delete();

    // 3. 一併刪除關聯資料
    const manualSnapshot = await db.collection("manual_expenses")
      .where("userId", "==", userId)
      .where("category", "==", catName)
      .get();
    
    const invoiceSnapshot = await db.collection("invoices")
      .where("userId", "==", userId)
      .where("category", "==", catName)
      .get();

    const batch = db.batch();
    manualSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    invoiceSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
