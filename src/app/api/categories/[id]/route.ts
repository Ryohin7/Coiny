import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, icon, keywords } = await req.json();

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    await db.collection("categories").doc(id).update({
      name,
      icon,
      keywords,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    await db.collection("categories").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
