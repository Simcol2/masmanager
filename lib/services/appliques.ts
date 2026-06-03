import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Applique, AppliqueUsage, CostumeType } from "@/types";

// ── Timestamp helper ─────────────────────────────────────────────────────────

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) {
      out[key] = (out[key] as Timestamp).toDate();
    }
  }
  return out;
}

// ── Item number generator ────────────────────────────────────────────────────
// Reads the current highest APL-XXXX number and returns the next one.

async function generateItemNumber(): Promise<string> {
  const snap = await getDocs(collection(db, "appliques"));
  let max = 0;
  snap.docs.forEach((d) => {
    const num = parseInt((d.data().itemNumber as string)?.replace("APL-", "") ?? "0", 10);
    if (!isNaN(num) && num > max) max = num;
  });
  return `APL-${String(max + 1).padStart(4, "0")}`;
}

// ── Applique CRUD ────────────────────────────────────────────────────────────

export async function getAppliques(): Promise<Applique[]> {
  const q = query(collection(db, "appliques"), orderBy("itemNumber"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as Applique);
}

export async function getApplique(id: string): Promise<Applique | null> {
  const snap = await getDoc(doc(db, "appliques", id));
  if (!snap.exists()) return null;
  return fromFirestore({ id: snap.id, ...snap.data() }) as Applique;
}

export async function createApplique(
  data: Omit<Applique, "id" | "itemNumber" | "createdAt" | "updatedAt">
): Promise<Applique> {
  // Generate item number inside a transaction to avoid races
  let created: Applique | null = null;
  await runTransaction(db, async (tx) => {
    const itemNumber = await generateItemNumber();
    const ref = doc(collection(db, "appliques"));
    tx.set(ref, {
      ...data,
      itemNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // We can't read the server timestamp inside the transaction, so we'll
    // do a follow-up read after commit.
    created = { ...data, id: ref.id, itemNumber, createdAt: new Date(), updatedAt: new Date() };
  });
  return created!;
}

export async function updateApplique(
  id: string,
  data: Partial<Omit<Applique, "id" | "itemNumber" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "appliques", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApplique(id: string): Promise<void> {
  // Delete all usage records for this applique first
  const usages = await getAppliqueUsagesByApplique(id);
  await Promise.all(usages.map((u) => deleteDoc(doc(db, "appliqueUsages", u.id))));
  await deleteDoc(doc(db, "appliques", id));
}

// ── Applique Usage CRUD ──────────────────────────────────────────────────────

export async function getAppliqueUsages(seasonId: string): Promise<AppliqueUsage[]> {
  const q = query(
    collection(db, "appliqueUsages"),
    where("seasonId", "==", seasonId),
    orderBy("costumeType"),
    orderBy("pieceName")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as AppliqueUsage);
}

export async function getAppliqueUsagesByApplique(appliqueId: string): Promise<AppliqueUsage[]> {
  const q = query(
    collection(db, "appliqueUsages"),
    where("appliqueId", "==", appliqueId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as AppliqueUsage);
}

export async function getAppliqueUsagesForPiece(
  seasonId: string,
  costumeType: CostumeType,
  masterPieceId: string
): Promise<AppliqueUsage[]> {
  const all = await getAppliqueUsages(seasonId);
  return all.filter(
    (u) => u.costumeType === costumeType && u.masterPieceId === masterPieceId
  );
}

export async function upsertAppliqueUsage(
  data: Omit<AppliqueUsage, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  // One record per applique+season+costumeType+piece combination
  const existing = await getAppliqueUsagesByApplique(data.appliqueId);
  const match = existing.find(
    (u) =>
      u.seasonId === data.seasonId &&
      u.costumeType === data.costumeType &&
      u.masterPieceId === data.masterPieceId
  );

  if (match) {
    await updateDoc(doc(db, "appliqueUsages", match.id), {
      quantityPerCostume: data.quantityPerCostume,
      costPerCostume: data.costPerCostume,
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, "appliqueUsages"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteAppliqueUsage(id: string): Promise<void> {
  await deleteDoc(doc(db, "appliqueUsages", id));
}

// ── Aggregate helpers ────────────────────────────────────────────────────────

/**
 * Returns total appliques needed and total cost for a season+costumeType+piece,
 * given the number of registered dancers for that costume type.
 */
export function calcAppliqueNeeds(
  usages: AppliqueUsage[],
  registrationCount: number
): { totalUnits: number; totalCost: number } {
  const totalUnits = usages.reduce((sum, u) => sum + u.quantityPerCostume * registrationCount, 0);
  const totalCost = usages.reduce((sum, u) => sum + u.costPerCostume * registrationCount, 0);
  return { totalUnits, totalCost };
}
