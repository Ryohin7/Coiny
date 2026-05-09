import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { userId, invoiceIds } = await req.json();

    if (!userId || !invoiceIds || !Array.isArray(invoiceIds)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Verify authentication
    const decodedToken = await verifyAuth(req);
    if (!decodedToken || (decodedToken.uid !== userId && decodedToken.sub !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    const results = { confirmed: 0, skipped: 0 };

    for (const id of invoiceIds) {
      const docRef = db.collection("pending_invoices").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        results.skipped++;
        continue;
      }

      const data = doc.data();
      if (!data || data.userId !== userId) {
        results.skipped++;
        continue;
      }

      const batch = db.batch();

      // 1. Create the real invoice record
      const invoiceRef = db.collection("invoices").doc();
      const { status, matchedManualInfo, ...invoiceData } = data;
      
      batch.set(invoiceRef, {
        ...invoiceData,
        matchedManualId: matchedManualInfo?.id || null,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Update manual record if matched
      if (matchedManualInfo?.id) {
        const manualRef = db.collection("manual_expenses").doc(matchedManualInfo.id);
        batch.update(manualRef, { 
          matched: true, 
          matchedInvNum: data.invNum 
        });
      }

      // 3. Delete from pending
      batch.delete(docRef);

      results.confirmed++;
    }

    await batch.commit();

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Confirm invoices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
      const { userId, invoiceIds } = await req.json();
  
      if (!userId || !invoiceIds || !Array.isArray(invoiceIds)) {
        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
      }

      // Verify authentication
      const decodedToken = await verifyAuth(req);
      if (!decodedToken || (decodedToken.uid !== userId && decodedToken.sub !== userId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const db = getDb();
      if (!db) throw new Error("DB not initialized");
  
      const batch = db.batch();
      for (const id of invoiceIds) {
        const docRef = db.collection("pending_invoices").doc(id);
        batch.delete(docRef);
      }
      await batch.commit();
  
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
