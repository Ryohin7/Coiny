import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    const snapshot = await db
      .collection("pending_invoices")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    const pendingInvoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ pendingInvoices });
  } catch (error: any) {
    console.error("Fetch pending invoices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
