import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Simple safety check: check for a secret query param
  const { searchParams } = new URL(req.url);
  if (searchParams.get("confirm") !== "true") {
    return NextResponse.json({ error: "Please add ?confirm=true to the URL to clear all data" }, { status: 400 });
  }

  try {
    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    const collections = ["manual_expenses", "invoices"];
    let totalDeleted = 0;

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        totalDeleted += snapshot.size;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully deleted ${totalDeleted} documents.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
