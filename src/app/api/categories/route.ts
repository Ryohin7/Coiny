import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const snapshot = await db.collection("categories").where("userId", "==", userId).get();
    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        isIncome: data.isIncome ?? false // 預設為支出
      };
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, name, icon, keywords, isIncome } = await req.json();
    if (!userId || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const docRef = await db.collection("categories").add({
      userId,
      name,
      icon,
      keywords: keywords || [],
      isIncome: isIncome ?? false,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
