import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteFileByURL } from "@/lib/services/storage";
import type { SeasonAsset } from "@/types";

function toFirestore(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) {
      out[key] = (out[key] as Timestamp).toDate();
    }
  }
  return out;
}

export async function getSeasonAssets(seasonId: string): Promise<SeasonAsset[]> {
  const q = query(collection(db, "seasonAssets"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => fromFirestore({ id: d.id, ...d.data() }) as SeasonAsset)
    .filter((asset) => asset.seasonId === seasonId);
}

export async function createSeasonAsset(
  data: Omit<SeasonAsset, "id" | "createdAt" | "updatedAt">
): Promise<SeasonAsset> {
  const ref = await addDoc(collection(db, "seasonAssets"), {
    ...toFirestore(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return fromFirestore({ id: snap.id, ...snap.data() }) as SeasonAsset;
}

export async function deleteSeasonAsset(id: string, fileURL?: string): Promise<void> {
  if (fileURL) {
    await deleteFileByURL(fileURL);
  }
  await deleteDoc(doc(db, "seasonAssets", id));
}
