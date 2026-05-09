import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { category, icon, type } = await req.json(); // type: "manual" or "invoice"

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const collection = type === "invoice" ? "invoices" : "manual_expenses";
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const data = doc.data();
    const userId = data?.userId;

    // Verify authentication and ownership
    const decodedToken = await verifyAuth(req);
    if (!decodedToken || (decodedToken.uid !== userId && decodedToken.sub !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await docRef.update({
      category,
      icon,
      manualCategory: true // 標記為手動修改，避免被自動分類覆蓋
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "manual" or "invoice"

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const collection = type === "invoice" ? "invoices" : "manual_expenses";
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const data = doc.data();
    const userId = data?.userId;

    // Verify authentication and ownership
    const decodedToken = await verifyAuth(req);
    if (!decodedToken || (decodedToken.uid !== userId && decodedToken.sub !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
