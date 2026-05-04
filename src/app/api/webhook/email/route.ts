import { NextResponse } from "next/server";
import { parseMOFCSV } from "@/lib/services/mof-parser";
import { getDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId: emailID, csvContent } = await req.json();

    if (!emailID || !csvContent) {
      console.warn("Email Webhook: Missing emailID or csvContent");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    // Debug: Log the first 100 chars of CSV content to verify encoding
    console.log(`Email Webhook: Received CSV snippet: ${csvContent.substring(0, 100)}...`);

    // Resolve real lineUserId from emailID
    const userSnapshot = await db.collection("users").where("emailID", "==", emailID).limit(1).get();
    
    if (userSnapshot.empty) {
      console.error(`Email Webhook: No user found for emailID ${emailID}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const lineUserId = userSnapshot.docs[0].id;
    console.log(`Email Webhook: Resolved emailID ${emailID} to lineUserId ${lineUserId}`);

    const invoices = await parseMOFCSV(csvContent, lineUserId);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${invoices.length} invoices`,
      count: invoices.length,
    });
  } catch (error: any) {
    console.error("Email Webhook Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
