import { parse } from "csv-parse/sync";
import { getDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

interface InvoiceItem {
  name: string;
  price: number;
}

interface Invoice {
  date: string; // YYYY/MM/DD
  store: string;
  taxId?: string;
  invNum: string;
  items: InvoiceItem[];
  totalAmount: number;
  category?: string;
  icon?: string;
}

export async function parseMOFCSV(csvContent: string, userId: string, availableAt: Date) {
  // Clean up content
  const cleanedContent = csvContent
    .split(/\r?\n/)
    .map(line => line.replace(/^[> \t*]+/, "").trim())
    .filter(line => line.startsWith("M|") || line.startsWith("D|"))
    .join('\n');

  const records = parse(cleanedContent, {
    delimiter: "|",
    relax_column_count: true,
    skip_empty_lines: true,
  });

  const invoices: Invoice[] = [];
  let currentInvoice: Invoice | null = null;

  for (const row of records) {
    const type = row[0]?.toString().trim();

    if (type === "M") {
      const rawDate = row[3]?.toString().trim() || "";
      if (rawDate.length < 8) continue;
      
      const date = `${rawDate.substring(0, 4)}/${rawDate.substring(4, 6)}/${rawDate.substring(6, 8)}`;
      const taxId = row[4]?.toString().trim();
      const store = row[5]?.toString().trim() || "未知商店";
      const invNum = row[6]?.toString().trim();
      const totalAmount = parseInt(row[7]?.toString().trim()) || 0;

      currentInvoice = {
        date,
        store,
        taxId,
        invNum,
        items: [],
        totalAmount,
      };
      invoices.push(currentInvoice);
    } else if (type === "D" && currentInvoice) {
      const name = row[3]?.toString().trim() || "未知品項";
      const price = parseInt(row[2]?.toString().trim()) || 0;
      currentInvoice.items.push({ name, price });
    }
  }

  // Save to Firestore and Match
  for (const invoice of invoices) {
    const itemNames = invoice.items.map(i => i.name);
    const { category, icon } = await classifyMerchant(invoice.store, itemNames, invoice.taxId, userId);
    invoice.category = category;
    invoice.icon = icon;

    await saveAndMatchInvoice(invoice, userId, availableAt);
  }

  return invoices;
}

import { classifyMerchant } from "./classifier";

async function saveAndMatchInvoice(invoice: Invoice, userId: string, availableAt: Date) {
  const db = getDb();
  if (!db) return;

  // 1. Duplicate Check
  const existingInvoice = await db.collection("invoices")
    .where("userId", "==", userId)
    .where("invNum", "==", invoice.invNum)
    .limit(1)
    .get();
  
  if (!existingInvoice.empty) return;

  const existingPending = await db.collection("pending_invoices")
    .where("userId", "==", userId)
    .where("invNum", "==", invoice.invNum)
    .limit(1)
    .get();
  
  if (!existingPending.empty) return;
  
  // 2. Fuzzy Match Logic
  const targetDate = new Date(invoice.date);
  const prevDate = new Date(targetDate);
  prevDate.setDate(targetDate.getDate() - 1);
  const nextDate = new Date(targetDate);
  nextDate.setDate(targetDate.getDate() + 1);

  const dateStrings = [
    invoice.date,
    prevDate.toISOString().split("T")[0].replace(/-/g, "/"),
    nextDate.toISOString().split("T")[0].replace(/-/g, "/"),
  ];

  const manualQuery = await db
    .collection("manual_expenses")
    .where("userId", "==", userId)
    .where("date", "in", dateStrings)
    .where("amount", "==", invoice.totalAmount)
    .where("matched", "==", false)
    .get();

  let matchedManualInfo = null;
  if (!manualQuery.empty) {
    const sortedDocs = manualQuery.docs.sort((a, b) => {
      const distA = Math.abs(new Date(a.data().date).getTime() - targetDate.getTime());
      const distB = Math.abs(new Date(b.data().date).getTime() - targetDate.getTime());
      return distA - distB;
    });

    const doc = sortedDocs[0];
    const data = doc.data();
    matchedManualInfo = {
      id: doc.id,
      date: data.date,
      amount: data.amount,
      note: data.note || data.category,
    };
  }

  // 3. Save to PENDING collection
  await db.collection("pending_invoices").add({
    ...invoice,
    userId,
    matchedManualInfo,
    status: "pending",
    availableAt: admin.firestore.Timestamp.fromDate(availableAt),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
