import { parse } from "csv-parse/sync";
import { db } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

interface InvoiceItem {
  name: string;
  price: number;
}

interface Invoice {
  date: string; // YYYY/MM/DD
  store: string;
  invNum: string;
  items: InvoiceItem[];
  totalAmount: number;
}

export async function parseMOFCSV(csvContent: string, userId: string) {
  const records = parse(csvContent, {
    delimiter: "|",
    relax_column_count: true,
    skip_empty_lines: true,
  });

  const invoices: Invoice[] = [];
  let currentInvoice: Invoice | null = null;

  for (const row of records) {
    const type = row[0];

    if (type === "M") {
      // M | Date | Store | InvNum
      const rawDate = row[1]; // 20260301
      const date = `${rawDate.substring(0, 4)}/${rawDate.substring(4, 6)}/${rawDate.substring(6, 8)}`;
      const store = row[2];
      const invNum = row[3];

      currentInvoice = {
        date,
        store,
        invNum,
        items: [],
        totalAmount: 0,
      };
      invoices.push(currentInvoice);
    } else if (type === "D" && currentInvoice) {
      // D | ItemName | Price
      const name = row[1];
      const price = parseInt(row[2]) || 0;

      currentInvoice.items.push({ name, price });
      currentInvoice.totalAmount += price;
    }
  }

  // Save to Firestore and Match
  for (const invoice of invoices) {
    await saveAndMatchInvoice(invoice, userId);
  }

  return invoices;
}

async function saveAndMatchInvoice(invoice: Invoice, userId: string) {
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
