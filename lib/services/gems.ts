import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc,
  deleteDoc, query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GemSupply } from "@/types";

function toFirestore(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

function fromFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["createdAt", "updatedAt"]) {
    if ((out as Record<string, unknown>)[key] instanceof Timestamp)
      (out as Record<string, unknown>)[key] = ((out as Record<string, unknown>)[key] as Timestamp).toDate();
  }
  return out;
}

// Category prefixes for item numbers
const CATEGORY_PREFIX: Record<string, string> = {
  rhinestone: "RHN",
  gem:        "GEM",
  trim:       "TRIM",
  fabric:     "FAB",
  glue:       "GLUE",
  wire:       "WIRE",
  feather:    "FEATH",
  paint:      "PAINT",
  hardware:   "HW",
  other:      "MISC",
};

async function generateItemNumber(category: string): Promise<string> {
  const prefix = CATEGORY_PREFIX[category] ?? "MISC";
  const snap = await getDocs(collection(db, "gemSupplies"));
  let max = 0;
  snap.docs.forEach((d) => {
    const num = d.data().itemNumber as string ?? "";
    // Match items with this exact prefix followed by a dash and digits
    const match = num.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  });
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export async function getGemSupplies(): Promise<GemSupply[]> {
  const q = query(collection(db, "gemSupplies"), orderBy("itemNumber"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore({ id: d.id, ...d.data() }) as GemSupply);
}

export async function createGemSupply(
  data: Omit<GemSupply, "id" | "itemNumber" | "createdAt" | "updatedAt">
): Promise<GemSupply> {
  // Generate outside transaction since it needs a full collection read
  const itemNumber = await generateItemNumber(data.category);
  const ref = await addDoc(collection(db, "gemSupplies"), {
    ...toFirestore(data as Record<string, unknown>),
    itemNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...data, id: ref.id, itemNumber, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateGemSupply(
  id: string,
  data: Partial<Omit<GemSupply, "id" | "itemNumber" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "gemSupplies", id), {
    ...toFirestore(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGemSupply(id: string): Promise<void> {
  await deleteDoc(doc(db, "gemSupplies", id));
}

// Pre-populated from Main Black Star Tracker.xlsx — Supply Costs sheet
const SEED_SUPPLIES = [
  { itemNumber: "001A",  name: "Tear Drop Gem 17x28",            category: "gem",        availableColours: ["Clear / Crystal"], unitCost: 0.045, unit: "pcs",    quantityOnHand: 0, minOrder: "200/bag",      supplier: "Alibaba" },
  { itemNumber: "002A",  name: "Horse Eye Gem 30x62",             category: "gem",        availableColours: ["Clear / Crystal"], unitCost: 0.26,  unit: "pcs",    quantityOnHand: 0, minOrder: "50/bag",       supplier: "Alibaba" },
  { itemNumber: "100AB", name: "Rectangle Hot Fix Trim",          category: "trim",       availableColours: ["AB (Aurora Borealis)"], unitCost: 3.60, unit: "yards", quantityOnHand: 0, minOrder: "per yard",  supplier: "Alibaba" },
  { itemNumber: "101AB", name: "Diamond Tape",                    category: "trim",       availableColours: ["AB (Aurora Borealis)"], unitCost: 1.60, unit: "yards", quantityOnHand: 0, minOrder: "per yard",  supplier: "Alibaba" },
  { itemNumber: "102A",  name: "Gold Half Pearl Trim",            category: "trim",       availableColours: ["Gold"],            unitCost: 0.80,  unit: "yards",  quantityOnHand: 0, minOrder: "10 yds/pack",  supplier: "Alibaba" },
  { itemNumber: "103A",  name: "Gold Pointy Half Pearl",          category: "trim",       availableColours: ["Gold"],            unitCost: 1.20,  unit: "yards",  quantityOnHand: 0, minOrder: "10 yds/pack",  supplier: "Alibaba" },
  { itemNumber: "104AB", name: "Diamond Yellow AB Gem",           category: "rhinestone", availableColours: ["Yellow", "AB (Aurora Borealis)"], unitCost: 0.15, unit: "pcs", quantityOnHand: 0, minOrder: "200/bag", supplier: "McDonald & Wang" },
  { itemNumber: "200T",  name: "Rooster Feather",                 category: "feather",    availableColours: ["Multi / Mixed"],   unitCost: 4.00,  unit: "metres", quantityOnHand: 0, minOrder: "per metre",    supplier: "Alibaba" },
  { itemNumber: "201S",  name: "Ostrich Plumes",                  category: "feather",    availableColours: ["Multi / Mixed"],   unitCost: 3.50,  unit: "pcs",    quantityOnHand: 0, minOrder: "per plume",    supplier: "McDonald & Wang" },
  { itemNumber: "500",   name: "Glue Sticks",                     category: "glue",       availableColours: [],                  unitCost: 30.00, unit: "lbs",    quantityOnHand: 0, minOrder: "per pound",    supplier: "McDonald & Wang" },
  { itemNumber: "003AB", name: "30x40 Rectangle Gems",           category: "rhinestone", availableColours: ["AB (Aurora Borealis)"], unitCost: 0.14, unit: "pcs",  quantityOnHand: 0, minOrder: "50/bag",    supplier: "Alibaba" },
  { itemNumber: "004AB", name: "16x30mm Gold Tear Drop Gems",     category: "gem",        availableColours: ["Gold"],            unitCost: 0.05,  unit: "pcs",    quantityOnHand: 0, minOrder: "200/bag",      supplier: "Alibaba" },
  { itemNumber: "005AB", name: "Flat Back Resin Gems (Bulk)",     category: "rhinestone", availableColours: ["Multi / Mixed"],   unitCost: 0.42,  unit: "pcs",    quantityOnHand: 0, minOrder: "1000/bag",     supplier: "Alibaba" },
  { itemNumber: "006AB", name: "17x28 Iridescent Tear Drop Gems", category: "rhinestone", availableColours: ["Iridescent"],     unitCost: 0.05,  unit: "pcs",    quantityOnHand: 0, minOrder: "200/bag",      supplier: "Alibaba" },
  // Rows 17-20 from spreadsheet - unnamed, to be named by user
  { itemNumber: "007",   name: "Unnamed Gem (Shein)",              category: "gem",        availableColours: [],                  unitCost: 0,     unit: "pcs",    quantityOnHand: 0, minOrder: "50/bag",       supplier: "Shein",           supplierLink: "https://share.temu.com/BZFIpiuggjA" },
  { itemNumber: "008",   name: "Unnamed Gem (John Bead)",          category: "gem",        availableColours: [],                  unitCost: 0,     unit: "pcs",    quantityOnHand: 0, minOrder: "20/bag",       supplier: "John Bead",       supplierLink: null },
  { itemNumber: "009",   name: "Unnamed Gem (Temu)",               category: "gem",        availableColours: [],                  unitCost: 0,     unit: "pcs",    quantityOnHand: 0, minOrder: "50/bag",       supplier: "Temu",            supplierLink: "https://share.temu.com/A2bR0q7nXdA" },
  { itemNumber: "010",   name: "Unnamed Gem (Temu 2)",             category: "gem",        availableColours: [],                  unitCost: 0,     unit: "pcs",    quantityOnHand: 0, minOrder: "20/bag",       supplier: "Temu",            supplierLink: "https://share.temu.com/HV3ITX0pLLA" },
];

export async function seedGemSupplies(): Promise<void> {
  // Use a dedicated flag document to prevent race-condition double-seeding
  const flagRef = doc(db, "seeds", "gemSupplies");
  const flag = await getDoc(flagRef);
  if (flag.exists()) return;
  // Write the flag first so a concurrent call bails out
  await setDoc(flagRef, { seededAt: serverTimestamp() });
  await Promise.all(
    SEED_SUPPLIES.map(s =>
      addDoc(collection(db, "gemSupplies"), {
        ...s,
        supplierLink: (s as Record<string, unknown>).supplierLink ?? null,
        notes: null,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
}

// Remove duplicates that appeared from the race-condition double-seed.
// Keeps the document with the earlier createdAt for each itemNumber.
export async function deduplicateGemSupplies(): Promise<void> {
  const snap = await getDocs(collection(db, "gemSupplies"));
  const byItemNumber = new Map<string, { id: string; createdAt: Date }[]>();
  snap.docs.forEach(d => {
    const num: string = d.data().itemNumber ?? "";
    const raw = d.data().createdAt;
    const createdAt = raw instanceof Timestamp ? raw.toDate() : new Date(0);
    const arr = byItemNumber.get(num) ?? [];
    arr.push({ id: d.id, createdAt });
    byItemNumber.set(num, arr);
  });
  const toDelete: string[] = [];
  byItemNumber.forEach(entries => {
    if (entries.length <= 1) return;
    // Sort oldest first, delete the rest
    entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    entries.slice(1).forEach(e => toDelete.push(e.id));
  });
  await Promise.all(toDelete.map(id => deleteDoc(doc(db, "gemSupplies", id))));
}
