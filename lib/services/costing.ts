import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc, deleteDoc,
  query, where, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  PieceSourcing, CostumePricing, AppSettings, CostumeType,
} from "@/types";

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) out[key] = (out[key] as Timestamp).toDate();
  }
  return out;
}
function toFirestore(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

// ── Piece sourcing (collection: pieceSourcings) ──────────────────────────────
export async function getPieceSourcings(seasonId: string): Promise<PieceSourcing[]> {
  const q = query(collection(db, "pieceSourcings"), where("seasonId", "==", seasonId));
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }) as PieceSourcing);
}

export async function upsertPieceSourcing(
  data: Omit<PieceSourcing, "id" | "createdAt" | "updatedAt">,
): Promise<void> {
  const all = await getPieceSourcings(data.seasonId);
  const existing = all.find(
    s => s.costumeType === data.costumeType && s.masterPieceId === data.masterPieceId,
  );
  if (existing) {
    await updateDoc(doc(db, "pieceSourcings", existing.id), {
      ...toFirestore(data as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, "pieceSourcings"), {
      ...toFirestore(data as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deletePieceSourcing(id: string): Promise<void> {
  await deleteDoc(doc(db, "pieceSourcings", id));
}

// ── Costume pricing (collection: costumePricings) ────────────────────────────
export async function getCostumePricings(seasonId: string): Promise<CostumePricing[]> {
  const q = query(collection(db, "costumePricings"), where("seasonId", "==", seasonId));
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }) as CostumePricing);
}

export async function upsertCostumePricing(
  seasonId: string, costumeType: CostumeType, sellingPrice: number,
): Promise<void> {
  const all = await getCostumePricings(seasonId);
  const existing = all.find(p => p.costumeType === costumeType);
  if (existing) {
    await updateDoc(doc(db, "costumePricings", existing.id), {
      sellingPrice, updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, "costumePricings"), {
      seasonId, costumeType, sellingPrice,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }
}

// ── App settings (collection: appSettings, single "global" doc) ──────────────
const DEFAULT_SETTINGS: Omit<AppSettings, "updatedAt"> = {
  id: "global",
  modelPolicyType: "discount",
  modelDiscountAmount: 150,
  includeEmbellishmentsInPieceCost: true,
  defaultFabricPricePerYard: 0,
};

export async function getAppSettings(): Promise<AppSettings> {
  const ref = doc(db, "appSettings", "global");
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULT_SETTINGS, updatedAt: new Date() };
  return fromFirestore({ id: snap.id, ...snap.data() }) as AppSettings;
}

export async function saveAppSettings(
  data: Partial<Omit<AppSettings, "id" | "updatedAt">>,
): Promise<void> {
  const ref = doc(db, "appSettings", "global");
  await setDoc(ref, { ...toFirestore(data as Record<string, unknown>), updatedAt: serverTimestamp() }, { merge: true });
}
