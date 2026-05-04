import { getDb } from "../src/lib/firebase/admin";
import * as dotenv from "dotenv";

dotenv.config();

async function deleteAllData() {
  const db = getDb();
  if (!db) {
    console.error("Failed to initialize DB.");
    process.exit(1);
  }

  const collections = ["manual_expenses", "invoices"];

  for (const collectionName of collections) {
    console.log(`Deleting all documents in ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`No documents found in ${collectionName}.`);
      continue;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} documents from ${collectionName}.`);
  }

  process.exit(0);
}

deleteAllData().catch(console.error);
