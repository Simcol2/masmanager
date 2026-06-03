import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ParentShirt } from "@/types";

function toFirestore(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) out[key] = (out[key] as Timestamp).toDate();
  }
  return out;
}

export async function getParentShirts(seasonId: string): Promise<ParentShirt[]> {
  const q = query(collection(db, "parentShirts"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => fromFirestore({ id: d.id, ...d.data() }) as ParentShirt)
    .filter(s => s.seasonId === seasonId);
}

export async function createParentShirt(
  data: Omit<ParentShirt, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "parentShirts"), {
    ...toFirestore(data as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateParentShirt(
  id: string,
  data: Partial<Omit<ParentShirt, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "parentShirts", id), {
    ...toFirestore(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteParentShirt(id: string): Promise<void> {
  await deleteDoc(doc(db, "parentShirts", id));
}

export async function seedParentShirts(): Promise<void> {
  const existing = await getDocs(collection(db, "parentShirts"));
  if (!existing.empty) return;

  const SEED = [
    { parentName: "Cheryl",      style: "Ghana Jersey",   size: "L", quantity: 1 },
    { parentName: "Aunty Angie", style: "Yellow T-Shirt", size: "M", quantity: 1 },
  ];

  await Promise.all(
    SEED.map(s =>
      addDoc(collection(db, "parentShirts"), {
        ...toFirestore({
          seasonId: "2026",
          parentName: s.parentName,
          participantName: null,
          style: s.style,
          size: s.size,
          quantity: s.quantity,
        }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
}
