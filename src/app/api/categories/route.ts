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

import { z } from "zod";

const categorySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional().default("💰"),
  keywords: z.array(z.string()).optional().default([]),
  isIncome: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = categorySchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { userId, name, icon, keywords, isIncome } = result.data;

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const docRef = await db.collection("categories").add({
      userId,
      name,
      icon,
      keywords,
      isIncome,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
