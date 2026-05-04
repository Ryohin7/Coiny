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
      .orderBy("createdAt", "desc")
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
      .orderBy("createdAt", "desc")
      .get();

    const invoices = invoiceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: "invoice",
    }));

    // Combine and sort by date/createdAt
    const allRecords = [...manualExpenses, ...invoices].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return NextResponse.json({ records: allRecords });
  } catch (error: any) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
