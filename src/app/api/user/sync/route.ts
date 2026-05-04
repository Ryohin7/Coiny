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

    if (!userDoc.exists) {
      // New User
      await userRef.set({
        lineUserId,
        displayName,
        pictureUrl,
        membershipLevel: "Free", // Default level
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing user
      await userRef.update({
        displayName,
        pictureUrl,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("User sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
