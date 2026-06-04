import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, where, serverTimestamp, Timestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BodywearRecipe, CostumeType } from "@/types";

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if (out[key] instanceof Timestamp) out[key] = (out[key] as Timestamp).toDate();
  }
  return out;
}

export async function getBodywearRecipes(bodywearSupplyId: string): Promise<BodywearRecipe[]> {
  const q = query(collection(db, "bodywearRecipes"), where("bodywearSupplyId", "==", bodywearSupplyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => fromFirestore({ id: d.id, ...d.data() }) as BodywearRecipe);
}

export async function getBodywearRecipeForType(
  bodywearSupplyId: string,
  costumeType: CostumeType,
): Promise<BodywearRecipe | null> {
  const all = await getBodywearRecipes(bodywearSupplyId);
  return all.find(r => r.costumeType === costumeType) ?? null;
}

export async function saveBodywearRecipe(
  bodywearSupplyId: string,
  bodywearName: string,
  costumeType: CostumeType,
  ingredients: BodywearRecipe["ingredients"],
): Promise<void> {
  const totalCost = +ingredients.reduce((s, i) => s + i.lineCost, 0).toFixed(4);
  const existing = await getBodywearRecipeForType(bodywearSupplyId, costumeType);
  if (existing) {
    await updateDoc(doc(db, "bodywearRecipes", existing.id), {
      ingredients, totalCost, updatedAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, "bodywearRecipes"), {
      bodywearSupplyId, bodywearName, costumeType,
      ingredients, totalCost,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteBodywearRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, "bodywearRecipes", id));
}
