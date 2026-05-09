import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

import { verifyAuth } from "@/lib/auth";

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

    // Fetch manual expenses and invoices in parallel
    const [manualSnapshot, invoiceSnapshot] = await Promise.all([
      db.collection("manual_expenses")
        .where("userId", "==", userId)
        .get(),
      db.collection("invoices")
        .where("userId", "==", userId)
        .get()
    ]);

    const manualExpenses = manualSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: "manual",
    }));

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
