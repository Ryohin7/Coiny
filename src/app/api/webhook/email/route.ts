import { NextResponse } from "next/server";
import { parseMOFCSV } from "@/lib/services/mof-parser";

export async function POST(req: Request) {
  try {
    const { userId, csvContent } = await req.json();

    if (!userId || !csvContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const invoices = await parseMOFCSV(csvContent, userId);

    return NextResponse.json({
      success: true,
      count: invoices.length,
    });
  } catch (error) {
    console.error("Email webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
