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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MasterPiece, SeasonPieceConfig, CostumeType } from "@/types";
import {
  DEFAULT_PIECE_NAMES,
  DEFAULT_PIECE_SIZE_GROUPS,
  PieceCategory,
} from "@/types";

// ── Timestamp helpers ────────────────────────────────────────────────────────

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) {
      out[key] = (out[key] as Timestamp).toDate();
    }
  }
  return out;
}

// ── Master Piece Library (collection: masterPieces) ──────────────────────────

export async function getMasterPieces(): Promise<MasterPiece[]> {
  const q = query(collection(db, "masterPieces"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as MasterPiece);
}

export async function createMasterPiece(
  data: Omit<MasterPiece, "id" | "createdAt" | "updatedAt">
): Promise<MasterPiece> {
  const ref = await addDoc(collection(db, "masterPieces"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return fromFirestore({ id: snap.id, ...snap.data() }) as MasterPiece;
}

export async function updateMasterPiece(
  id: string,
  data: Partial<Omit<MasterPiece, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, "masterPieces", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMasterPiece(id: string): Promise<void> {
  await deleteDoc(doc(db, "masterPieces", id));
}

// Seed the default pieces if the collection is empty
export async function seedDefaultPieces(): Promise<void> {
  const snap = await getDocs(collection(db, "masterPieces"));
  if (!snap.empty) return;

  const categoryMap: Record<string, MasterPiece["category"]> = {
    "Arm Bands":   "bands",
    "Leg Bands":   "bands",
    "Thigh Bands": "bands",
    "Shorts":      "tops_bottoms",
    "Top":         "tops_bottoms",
    "Half Skirt":  "skirts_tutus",
    "Tutu":        "skirts_tutus",
    "Belt":        "accessories",
    "Chest Piece": "accessories",
    "Collar":      "collars",
    "Backpack":    "backpacks",
    "Head Piece":  "headpieces",
    "Necklace":    "jewelry",
    "Shoes":       "footwear",
  };

  await Promise.all(
    DEFAULT_PIECE_NAMES.map((name) =>
      addDoc(collection(db, "masterPieces"), {
        name,
        category: categoryMap[name] ?? "accessories",
        sizeGroup: DEFAULT_PIECE_SIZE_GROUPS[name] ?? "none",
        isDefault: true,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
}

// ── Season Piece Config (collection: seasonPieceConfigs) ─────────────────────

export async function getSeasonPieceConfigs(seasonId: string): Promise<SeasonPieceConfig[]> {
  const q = query(
    collection(db, "seasonPieceConfigs"),
    orderBy("costumeType"),
    orderBy("pieceName")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => fromFirestore({ id: d.id, ...d.data() }) as SeasonPieceConfig)
    .filter((c) => c.seasonId === seasonId);
}

export async function upsertSeasonPieceConfig(
  data: Omit<SeasonPieceConfig, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  // Check if a config for this season+costumeType+piece already exists
  const all = await getSeasonPieceConfigs(data.seasonId);
  const existing = all.find(
    (c) => c.costumeType === data.costumeType && c.masterPieceId === data.masterPieceId
  );

  if (existing) {
    await updateDoc(doc(db, "seasonPieceConfigs", existing.id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, "seasonPieceConfigs"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteSeasonPieceConfig(id: string): Promise<void> {
  await deleteDoc(doc(db, "seasonPieceConfigs", id));
}

export async function getConfigsForCostumeType(
  seasonId: string,
  costumeType: CostumeType
): Promise<SeasonPieceConfig[]> {
  const all = await getSeasonPieceConfigs(seasonId);
  return all.filter((c) => c.costumeType === costumeType);
}
