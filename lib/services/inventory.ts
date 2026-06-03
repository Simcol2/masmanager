import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { InventoryItem } from "@/types";
import { Timestamp } from "firebase/firestore";

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) {
      out[key] = (out[key] as Timestamp).toDate();
    }
  }
  return out;
}

export async function getMasterInventoryItems(): Promise<InventoryItem[]> {
  const q = query(collection(db, "inventoryItems"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as InventoryItem);
}
