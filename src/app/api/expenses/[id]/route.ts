import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { category, icon, type } = await req.json(); // type: "manual" or "invoice"

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const collection = type === "invoice" ? "invoices" : "manual_expenses";
    await db.collection(collection).doc(id).update({
      category,
      icon,
      manualCategory: true // 標記為手動修改，避免被自動分類覆蓋
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "manual" or "invoice"

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const collection = type === "invoice" ? "invoices" : "manual_expenses";
    await db.collection(collection).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
