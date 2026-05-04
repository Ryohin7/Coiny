import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { lineUserId, displayName, pictureUrl } = await req.json();

    if (!lineUserId) {
      return NextResponse.json({ error: "Missing lineUserId" }, { status: 400 });
    }

    const db = getDb();
    if (!db) throw new Error("DB not initialized");

    const userRef = db.collection("users").doc(lineUserId);
    const userDoc = await userRef.get();

    let emailID = "";

    if (!userDoc.exists) {
      // Generate unique 10-char emailID
      emailID = Math.random().toString(36).substring(2, 12).toUpperCase();
      
      // New User
      await userRef.set({
        lineUserId,
        displayName,
        pictureUrl,
        emailID,
        membershipLevel: "Free", // Default level
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      const userData = userDoc.data();
      emailID = userData?.emailID || Math.random().toString(36).substring(2, 12).toUpperCase();

      // Update existing user
      await userRef.update({
        displayName,
        pictureUrl,
        emailID,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, emailID });
  } catch (error: any) {
    console.error("User sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
