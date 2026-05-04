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

    // Fetch manual expenses
    const manualSnapshot = await db
      .collection("manual_expenses")
      .where("userId", "==", userId)
      .get();

    const manualExpenses = manualSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: "manual",
    }));

    // Fetch invoices
    const invoiceSnapshot = await db
      .collection("invoices")
      .where("userId", "==", userId)
      .get();

    const invoices = invoiceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: "invoice",
    }));

    // Combine and sort by createdAt (Handle potential nulls)
    const allRecords = [...manualExpenses, ...invoices].sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt?._seconds * 1000) || 0;
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt?._seconds * 1000) || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ records: allRecords });
  } catch (error: any) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
