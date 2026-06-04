import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SeasonPieceStep, ProductionTask, CostumeType } from "@/types";

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt", "dueDate"]) {
    if (out[key] instanceof Timestamp) {
      out[key] = (out[key] as Timestamp).toDate();
    }
  }
  return out;
}

// ── Season Piece Steps (collection: seasonPieceSteps) ─────────────────────────

export async function getSeasonPieceSteps(seasonId: string): Promise<SeasonPieceStep[]> {
  const q = query(
    collection(db, "seasonPieceSteps"),
    where("seasonId", "==", seasonId),
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as SeasonPieceStep);
  results.sort((a, b) => {
    if (a.costumeType !== b.costumeType) return a.costumeType.localeCompare(b.costumeType);
    if (a.pieceName !== b.pieceName) return a.pieceName.localeCompare(b.pieceName);
    return a.sortOrder - b.sortOrder;
  });
  return results;
}

// Replace all steps for a (seasonId, costumeType, pieceName) combination
export async function saveSeasonPieceSteps(
  seasonId: string,
  costumeType: CostumeType,
  pieceName: string,
  stepNames: string[],
): Promise<SeasonPieceStep[]> {
  const existing = await getSeasonPieceSteps(seasonId);
  const toDelete = existing.filter(
    (s) => s.costumeType === costumeType && s.pieceName === pieceName,
  );

  if (toDelete.length > 0) {
    const batch = writeBatch(db);
    for (const step of toDelete) {
      batch.delete(doc(db, "seasonPieceSteps", step.id));
    }
    await batch.commit();
  }

  const created = await Promise.all(
    stepNames.map((stepName, i) =>
      addDoc(collection(db, "seasonPieceSteps"), {
        seasonId,
        costumeType,
        pieceName,
        stepName,
        sortOrder: i,
        status: "not_started",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),
  );

  return stepNames.map((stepName, i) => ({
    id: created[i].id,
    seasonId,
    costumeType,
    pieceName,
    stepName,
    sortOrder: i,
    status: "not_started" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export async function updateStepStatus(
  stepId: string,
  status: SeasonPieceStep["status"],
): Promise<void> {
  await updateDoc(doc(db, "seasonPieceSteps", stepId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ── Production Tasks (collection: productionTasks) ────────────────────────────

export async function getProductionTasks(seasonId: string): Promise<ProductionTask[]> {
  const q = query(
    collection(db, "productionTasks"),
    where("seasonId", "==", seasonId),
    orderBy("createdAt"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as ProductionTask);
}

export async function createProductionTask(
  data: Omit<ProductionTask, "id" | "createdAt" | "updatedAt">,
): Promise<ProductionTask> {
  const ref = await addDoc(collection(db, "productionTasks"), {
    ...data,
    dueDate: data.dueDate ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...data, id: ref.id, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateProductionTask(
  id: string,
  data: Partial<Omit<ProductionTask, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await updateDoc(doc(db, "productionTasks", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProductionTask(id: string): Promise<void> {
  await deleteDoc(doc(db, "productionTasks", id));
}
