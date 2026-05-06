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

export async function parseMOFCSV(csvContent: string, userId: string) {
  // Clean up content: handle common email forwarding artifacts like '>' or leading spaces
  const cleanedContent = csvContent
    .split(/\r?\n/)
    .map(line => line.replace(/^[> \t*]+/, "").trim()) // Remove leading >, spaces, tabs, or *
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
      // M | 載具名稱 | 載具號碼 | 發票日期 | 商店統編 | 商店店名 | 發票號碼 | 總金額 | 發票狀態 |
      const rawDate = row[3]?.toString().trim() || ""; // 20260301
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
      // D | 發票號碼 | 小計 | 品項名稱 |
      const name = row[3]?.toString().trim() || "未知品項";
      const price = parseInt(row[2]?.toString().trim()) || 0;

      currentInvoice.items.push({ name, price });
    }
  }

  // Save to Firestore and Match
  for (const invoice of invoices) {
    // 延遲分類：現在有了完整品項，可以進行精準分類
    const itemNames = invoice.items.map(i => i.name);
    const { category, icon } = await classifyMerchant(invoice.store, itemNames, invoice.taxId);
    invoice.category = category;
    invoice.icon = icon;

    await saveAndMatchInvoice(invoice, userId);
  }

  return invoices;
}

import { classifyMerchant } from "./classifier";

async function saveAndMatchInvoice(invoice: Invoice, userId: string) {
  const db = getDb();
  if (!db) return;
  
  const batch = db.batch();
  
  // Search for potential manual entries
  const manualQuery = await db
    .collection("manual_expenses")
    .where("userId", "==", userId)
    .where("date", "==", invoice.date)
    .where("amount", "==", invoice.totalAmount)
    .where("matched", "==", false)
    .limit(1)
    .get();

  let matchedManualId = null;
  if (!manualQuery.empty) {
    matchedManualId = manualQuery.docs[0].id;
    const manualRef = db.collection("manual_expenses").doc(matchedManualId);
    batch.update(manualRef, { matched: true, matchedInvNum: invoice.invNum });
  }

  const invoiceRef = db.collection("invoices").doc();
  batch.set(invoiceRef, {
    ...invoice,
    userId,
    matchedManualId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
