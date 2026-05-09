import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { lineUserId, displayName, pictureUrl } = await req.json();

    if (!lineUserId) {
      return NextResponse.json({ error: "Missing lineUserId" }, { status: 400 });
    }

    // Verify authentication
    const decodedToken = await verifyAuth(req);
    if (!decodedToken || (decodedToken.uid !== lineUserId && decodedToken.sub !== lineUserId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    const userRef = db.collection("users").doc(lineUserId);
    const userDoc = await userRef.get();

    let emailID = "";
    let isPro = false;
    let isAdmin = false;

    if (!userDoc.exists) {
      // Generate unique 10-char emailID
      emailID = Math.random().toString(36).substring(2, 12).toUpperCase();
      
      // New User
      await userRef.set({
        lineUserId,
        displayName,
        pictureUrl,
        emailID,
        isPro: false,
        isAdmin: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const userData = userDoc.data();
      emailID = userData?.emailID || Math.random().toString(36).substring(2, 12).toUpperCase();
      isPro = userData?.isPro || false;
      isAdmin = userData?.isAdmin || false;

      // Update existing user
      await userRef.update({
        displayName,
        pictureUrl,
        emailID,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, emailID, isPro, isAdmin });
  } catch (error: any) {
    console.error("User sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
