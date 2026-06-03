import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Registration } from "@/types";

function toFirestore(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt", "registrationDate"]) {
    if (out[key] instanceof Timestamp) out[key] = (out[key] as Timestamp).toDate();
  }
  return out;
}

export async function getRegistrations(seasonId: string): Promise<Registration[]> {
  const q = query(collection(db, "registrations"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => fromFirestore({ id: d.id, ...d.data() }) as Registration)
    .filter(r => r.seasonId === seasonId);
}

export async function createRegistration(
  data: Omit<Registration, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "registrations"), {
    ...toFirestore(data as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRegistration(
  id: string,
  data: Partial<Omit<Registration, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "registrations", id), {
    ...toFirestore(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRegistration(id: string): Promise<void> {
  await deleteDoc(doc(db, "registrations", id));
}

// Seed real data from Main_Black_Star_Tracker.xlsx — Registrations sheet.
// Only runs if the collection is empty.
export async function seedRegistrations(): Promise<void> {
  const existing = await getDocs(collection(db, "registrations"));
  if (!existing.empty) return;

  const SEED = [
    {
      seasonId: "2026", firstName: "Zayne", lastName: "Walsh",
      age: 2, gender: "boy", costumeType: "boys_backline", style: "White Tank",
      topSize: "4T", bottomSize: "4T", bandSize: "Small",
      waist: '22"', shoeSize: "8", shoeCategory: "Toddler",
      parentName: "Kim Walsh",
    },
    {
      seasonId: "2026", firstName: "Caleeb", lastName: "Smith",
      age: 7, gender: "boy", costumeType: "boys_backline", style: "White T-Shirt",
      topSize: "L (10-12)", bottomSize: "M (8-9)", bandSize: "Large",
      waist: '1"', shoeSize: "N/A",
      parentName: "Chelsea Alphonso",
    },
    {
      seasonId: "2026", firstName: "Ciara", lastName: "Walsh",
      age: 4, gender: "girl", costumeType: "girls_backline", style: "White Shorts",
      topSize: "S (6-7)", bottomSize: "S (6-7)", bandSize: "Small",
      girlsTopSize: "Small", waist: '21"', shoeSize: "12Y", shoeCategory: "Little Kid",
      parentName: "Kali Walsh",
    },
    {
      seasonId: "2026", firstName: "Emelia", lastName: "Fajardo",
      age: 7, gender: "girl", costumeType: "girls_backline", style: "White Shorts",
      topSize: "S (6-7)", bottomSize: "S (6-7)", bandSize: "Small",
      girlsTopSize: "Small", shoeSize: "N/A",
      parentName: "Leeann Samuel",
    },
    {
      seasonId: "2026", firstName: "Tristin", lastName: "Phillip",
      age: 7, gender: "boy", costumeType: "boys_backline", style: "White Tank",
      topSize: "M (8-9)", bottomSize: "M (8-9)", bandSize: "Small",
      waist: '25.5"', shoeSize: "N/A",
      parentName: "Crystal Samuel",
    },
    {
      seasonId: "2026", firstName: "Quintin", lastName: "Phillip",
      age: 6, gender: "boy", costumeType: "boys_backline", style: "White Tank",
      topSize: "S (6-7)", bottomSize: "S (6-7)", bandSize: "Small",
      waist: '23"', shoeSize: "N/A",
      parentName: "Crystal Samuel",
      notes: "Sibling of Tristin",
    },
    {
      seasonId: "2026", firstName: "Olivia Jade", lastName: "Laidlaw",
      age: 2, gender: "girl", costumeType: "girls_backline", style: "White Shorts",
      topSize: "2T", bottomSize: "2T", bandSize: "Small",
      girlsTopSize: "Small", shoeSize: "N/A",
      parentName: "Larissa Estrella",
    },
    {
      seasonId: "2026", firstName: "Kaylaha", lastName: "",
      age: 4, gender: "girl", costumeType: "toddler_frontline", style: "White Shorts",
      topSize: "4T", bottomSize: "4T", bandSize: "Small",
      girlsTopSize: "Small", shoeSize: "12", shoeCategory: "Little Kid",
      parentName: "Deon Dabideen",
    },
    {
      seasonId: "2026", firstName: "Ava", lastName: "",
      age: 0, gender: "girl", costumeType: "girls_ultra_frontline", style: "Green Shorts",
      topSize: "Adult Small", bottomSize: "Adult Small", bandSize: "Large",
      girlsTopSize: "Extra Large", shoeSize: "8", shoeCategory: "Adult",
      parentName: "Camille",
    },
    {
      seasonId: "2026", firstName: "Mateo", lastName: "",
      age: 0, gender: "boy", costumeType: "boys_ultra_frontline", style: "White Tank",
      topSize: "Adult Small", bottomSize: "Adult Small", bandSize: "Large",
      shoeSize: "9", shoeCategory: "Adult",
      parentName: "Camille",
      notes: "Sibling of Ava",
    },
    {
      seasonId: "2026", firstName: "Max", lastName: "",
      age: 0, gender: "boy", costumeType: "boys_ultra_frontline", style: "White Tank",
      topSize: "Adult Small", bottomSize: "Adult Small", bandSize: "Large",
      shoeSize: "5", shoeCategory: "Adult",
      parentName: "Tamara",
    },
    {
      seasonId: "2026", firstName: "Parker", lastName: "",
      age: 0, gender: "boy", costumeType: "boys_ultra_frontline", style: "White Tank",
      topSize: "Adult Small", bottomSize: "Adult Small", bandSize: "Large",
      parentName: "Cindy",
    },
  ];

  await Promise.all(
    SEED.map(r =>
      addDoc(collection(db, "registrations"), {
        ...toFirestore({
          ...r,
          addOns: null,
          parentEmail: null,
          parentPhone: null,
          participantPhoto: null,
          paymentStatus: "unpaid",
          amountPaid: 0,
          balanceOwing: 0,
          style: r.style ?? null,
          notes: (r as Record<string, unknown>).notes ?? null,
          girlsTopSize: (r as Record<string, unknown>).girlsTopSize ?? null,
          waist: (r as Record<string, unknown>).waist ?? null,
          shoeSize: (r as Record<string, unknown>).shoeSize ?? null,
          shoeCategory: (r as Record<string, unknown>).shoeCategory ?? null,
        }),
        registrationDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
}
