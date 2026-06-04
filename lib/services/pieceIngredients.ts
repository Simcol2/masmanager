import {
  collection, getDocs, addDoc, deleteDoc,
  doc, query, where, serverTimestamp, Timestamp, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PieceIngredient } from "@/types";

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) out[key] = (out[key] as Timestamp).toDate();
  }
  return out;
}

export async function getPieceIngredients(masterPieceId: string): Promise<PieceIngredient[]> {
  const q = query(collection(db, "pieceIngredients"), where("masterPieceId", "==", masterPieceId));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }) as PieceIngredient);
  rows.sort((a, b) => {
    if (a.type !== b.type) return a.type === "supply" ? -1 : 1;
    const aName = a.gemSupplyName ?? a.appliqueName ?? "";
    const bName = b.gemSupplyName ?? b.appliqueName ?? "";
    return aName.localeCompare(bName);
  });
  return rows;
}

// Replaces all ingredients for a piece with the provided list
export async function savePieceIngredients(
  masterPieceId: string,
  pieceName: string,
  ingredients: Omit<PieceIngredient, "id" | "masterPieceId" | "pieceName" | "createdAt" | "updatedAt">[],
): Promise<void> {
  // Delete existing
  const existing = await getPieceIngredients(masterPieceId);
  if (existing.length > 0) {
    const batch = writeBatch(db);
    for (const ing of existing) batch.delete(doc(db, "pieceIngredients", ing.id));
    await batch.commit();
  }
  // Write new
  await Promise.all(
    ingredients.map(ing =>
      addDoc(collection(db, "pieceIngredients"), {
        ...ing,
        masterPieceId,
        pieceName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),
  );
}
