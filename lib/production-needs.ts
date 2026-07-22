// ─── Production Needs Engine ───────────────────────────────────────────────────
// The single source of truth for "how many to make" and "what to order".
//
// Everything traces back to the two formulas in CLAUDE.md:
//   pieces to make      = registrations of a costume type (one piece per costume)
//   appliques to make   = quantityPerCostume × registrations of that costume type
//   supply demand       = Σ (recipe quantity × units that consume it)
//   order quantity      = max(0, demand - onHand) rounded up to the min order qty
//
// The functions here are pure: give them already-fetched Firestore arrays and
// they return the rolled-up numbers. `loadProductionData` does the fetching so
// pages can stay thin. Reused by the Production page, the Order List page, and
// future reports.

import type {
  Registration,
  SeasonPieceConfig,
  PieceIngredient,
  Applique,
  AppliqueUsage,
  BodywearRecipe,
  GemSupply,
  MasterPiece,
  CostumeType,
} from "@/types";

import { getRegistrations } from "@/lib/services/registrations";
import { getSeasonPieceConfigs, getMasterPieces } from "@/lib/services/pieces";
import { getPieceIngredients } from "@/lib/services/pieceIngredients";
import { getAppliques, getAppliqueUsages } from "@/lib/services/appliques";
import { getBodywearRecipes } from "@/lib/services/bodywearRecipes";
import { getGemSupplies } from "@/lib/services/gems";

// ── Rounding helper ────────────────────────────────────────────────────────────
function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProductionData {
  registrations: Registration[];
  configs: SeasonPieceConfig[];
  masterPieces: MasterPiece[];
  pieceIngredients: PieceIngredient[];
  appliques: Applique[];
  usages: AppliqueUsage[];
  bodywearRecipes: BodywearRecipe[];
  supplies: GemSupply[];
}

export interface PieceNeed {
  pieceName: string;
  byCostumeType: { costumeType: CostumeType; count: number }[];
  total: number;
}

export interface AppliqueNeed {
  appliqueId: string;
  appliqueName: string;
  itemNumber: string;
  totalUnits: number;
  totalCost: number;
  byUsage: { costumeType: CostumeType; pieceName: string; units: number }[];
}

export interface DemandSource {
  label: string; // e.g. "Top" or "Applique: Feather Fan"
  qty: number;
}

export interface SupplyDemand {
  supplyId: string;
  itemNumber: string;
  name: string;
  category: string;
  costUnit: string;
  unitCost: number;
  demandQty: number; // total units the season consumes
  quantityOnHand: number;
  shortfall: number; // max(0, demand - onHand)
  minOrderQty: number;
  minOrderUnit: string;
  orderQty: number; // shortfall rounded up to a multiple of minOrderQty
  estCost: number; // orderQty × unitCost
  supplier?: string;
  supplierLink?: string;
  sources: DemandSource[];
}

// ── Registration counts by costume type ─────────────────────────────────────────

export function regCountsByType(registrations: Registration[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of registrations) {
    counts[r.costumeType] = (counts[r.costumeType] ?? 0) + 1;
  }
  return counts;
}

// ── Pieces to make ───────────────────────────────────────────────────────────────
// One piece per registered costume. Driven by SeasonPieceConfig (which pieces
// apply to which costume type this season), NOT a hardcoded map.

export function computePieceNeeds(
  configs: SeasonPieceConfig[],
  registrations: Registration[],
): PieceNeed[] {
  const counts = regCountsByType(registrations);
  const byPiece = new Map<string, Map<CostumeType, number>>();

  for (const cfg of configs) {
    const n = counts[cfg.costumeType] ?? 0;
    if (n === 0) continue;
    if (!byPiece.has(cfg.pieceName)) byPiece.set(cfg.pieceName, new Map());
    const inner = byPiece.get(cfg.pieceName)!;
    inner.set(cfg.costumeType, (inner.get(cfg.costumeType) ?? 0) + n);
  }

  const needs: PieceNeed[] = [];
  for (const [pieceName, inner] of byPiece) {
    const byCostumeType = Array.from(inner.entries()).map(([costumeType, count]) => ({
      costumeType,
      count,
    }));
    const total = byCostumeType.reduce((s, x) => s + x.count, 0);
    needs.push({ pieceName, byCostumeType, total });
  }
  return needs;
}

// ── Appliques to make ────────────────────────────────────────────────────────────
// quantityPerCostume × registrations, summed over every usage of the applique.
// Also folds in appliques embedded inside bodywear recipes so nothing is missed.

interface AppliqueUnitsResult {
  unitsByApplique: Map<string, number>;
  needs: AppliqueNeed[];
}

export function computeAppliqueNeeds(
  usages: AppliqueUsage[],
  bodywearRecipes: BodywearRecipe[],
  appliques: Applique[],
  registrations: Registration[],
): AppliqueUnitsResult {
  const counts = regCountsByType(registrations);
  const appliqueById = new Map(appliques.map((a) => [a.id, a]));

  const unitsByApplique = new Map<string, number>();
  const usageRows = new Map<string, { costumeType: CostumeType; pieceName: string; units: number }[]>();

  function add(appliqueId: string, units: number, costumeType: CostumeType, pieceName: string) {
    if (units <= 0) return;
    unitsByApplique.set(appliqueId, (unitsByApplique.get(appliqueId) ?? 0) + units);
    if (!usageRows.has(appliqueId)) usageRows.set(appliqueId, []);
    usageRows.get(appliqueId)!.push({ costumeType, pieceName, units });
  }

  // Direct applique-to-piece assignments (season + costume type specific)
  for (const u of usages) {
    const n = counts[u.costumeType] ?? 0;
    add(u.appliqueId, u.quantityPerCostume * n, u.costumeType, u.pieceName);
  }

  // Appliques used as ingredients inside a bodywear recipe
  for (const recipe of bodywearRecipes) {
    const n = counts[recipe.costumeType] ?? 0;
    if (n === 0) continue;
    for (const ing of recipe.ingredients) {
      if (ing.type === "applique" && ing.appliqueId) {
        add(ing.appliqueId, ing.quantity * n, recipe.costumeType, recipe.bodywearName);
      }
    }
  }

  const needs: AppliqueNeed[] = [];
  for (const [appliqueId, units] of unitsByApplique) {
    const applique = appliqueById.get(appliqueId);
    needs.push({
      appliqueId,
      appliqueName: applique?.name ?? "Unknown applique",
      itemNumber: applique?.itemNumber ?? "",
      totalUnits: round(units, 2),
      totalCost: round(units * (applique?.totalCost ?? 0), 2),
      byUsage: usageRows.get(appliqueId) ?? [],
    });
  }
  needs.sort((a, b) => a.itemNumber.localeCompare(b.itemNumber));
  return { unitsByApplique, needs };
}

// ── Supply / fabric demand → order list ──────────────────────────────────────────
// Three demand sources, summed per gem supply:
//   1. supplies used directly on a piece (PieceIngredient) × pieces of that type
//   2. gems inside an applique × appliques to make (from computeAppliqueNeeds)
//   3. the bodywear item itself and its direct supply ingredients × registrations

export function computeSupplyDemand(data: ProductionData): SupplyDemand[] {
  const {
    registrations, configs, pieceIngredients, appliques, usages, bodywearRecipes, supplies,
  } = data;

  const counts = regCountsByType(registrations);
  const supplyById = new Map(supplies.map((s) => [s.id, s]));

  // How many of each master piece are made this season (regs across every
  // costume type whose config includes that piece).
  const piecesMadeByMaster = new Map<string, number>();
  for (const cfg of configs) {
    const n = counts[cfg.costumeType] ?? 0;
    piecesMadeByMaster.set(cfg.masterPieceId, (piecesMadeByMaster.get(cfg.masterPieceId) ?? 0) + n);
  }

  // Accumulator: supplyId → { demand, sources }
  const demand = new Map<string, { qty: number; sources: Map<string, number> }>();
  function addDemand(supplyId: string | undefined, qty: number, sourceLabel: string) {
    if (!supplyId || qty <= 0) return;
    if (!demand.has(supplyId)) demand.set(supplyId, { qty: 0, sources: new Map() });
    const entry = demand.get(supplyId)!;
    entry.qty += qty;
    entry.sources.set(sourceLabel, (entry.sources.get(sourceLabel) ?? 0) + qty);
  }

  // 1. Direct piece supplies
  for (const ing of pieceIngredients) {
    if (ing.type !== "supply" || !ing.gemSupplyId) continue;
    const made = piecesMadeByMaster.get(ing.masterPieceId) ?? 0;
    addDemand(ing.gemSupplyId, ing.quantity * made, ing.pieceName);
  }

  // 2. Gems consumed by appliques we need to make
  const { unitsByApplique } = computeAppliqueNeeds(usages, bodywearRecipes, appliques, registrations);
  const appliqueById = new Map(appliques.map((a) => [a.id, a]));
  for (const [appliqueId, units] of unitsByApplique) {
    const applique = appliqueById.get(appliqueId);
    if (!applique) continue;
    for (const ing of applique.ingredients) {
      addDemand(ing.gemSupplyId, ing.quantity * units, `Applique: ${applique.name}`);
    }
  }

  // 3. Bodywear item itself + its direct supply ingredients
  for (const recipe of bodywearRecipes) {
    const n = counts[recipe.costumeType] ?? 0;
    if (n === 0) continue;
    addDemand(recipe.bodywearSupplyId, n, `Bodywear: ${recipe.bodywearName}`);
    for (const ing of recipe.ingredients) {
      if (ing.type === "supply" && ing.gemSupplyId) {
        addDemand(ing.gemSupplyId, ing.quantity * n, `Bodywear: ${recipe.bodywearName}`);
      }
    }
  }

  // Roll up into order rows
  const rows: SupplyDemand[] = [];
  for (const [supplyId, entry] of demand) {
    const s = supplyById.get(supplyId);
    if (!s) continue;
    const demandQty = round(entry.qty, 2);
    const onHand = s.quantityOnHand ?? 0;
    const shortfall = round(Math.max(0, demandQty - onHand), 2);
    const minOrder = s.minOrderQty ?? 0;
    const orderQty = shortfall <= 0
      ? 0
      : minOrder > 0
        ? round(Math.ceil(shortfall / minOrder) * minOrder, 2)
        : round(Math.ceil(shortfall), 2);
    const sources = Array.from(entry.sources.entries())
      .map(([label, qty]) => ({ label, qty: round(qty, 2) }))
      .sort((a, b) => b.qty - a.qty);

    rows.push({
      supplyId,
      itemNumber: s.itemNumber ?? "",
      name: s.name,
      category: s.category,
      costUnit: s.costUnit ?? "pcs",
      unitCost: s.unitCost ?? 0,
      demandQty,
      quantityOnHand: onHand,
      shortfall,
      minOrderQty: minOrder,
      minOrderUnit: s.minOrderUnit ?? s.costUnit ?? "pcs",
      orderQty,
      estCost: round(orderQty * (s.unitCost ?? 0), 2),
      supplier: s.supplier,
      supplierLink: s.supplierLink,
      sources,
    });
  }
  rows.sort((a, b) => b.shortfall - a.shortfall || a.name.localeCompare(b.name));
  return rows;
}

// ── Data loader ──────────────────────────────────────────────────────────────────
// Fetches every input the engine needs for a season in one call.

export async function loadProductionData(seasonId: string): Promise<ProductionData> {
  const [registrations, configs, masterPieces, appliques, usages, supplies] = await Promise.all([
    getRegistrations(seasonId),
    getSeasonPieceConfigs(seasonId),
    getMasterPieces(),
    getAppliques(),
    getAppliqueUsages(seasonId),
    getGemSupplies(),
  ]);

  // Piece ingredients are stored per master piece
  const pieceIngredientLists = await Promise.all(
    masterPieces.map((mp) => getPieceIngredients(mp.id)),
  );
  const pieceIngredients = pieceIngredientLists.flat();

  // Bodywear recipes are stored per bodywear supply
  const bodywearSupplies = supplies.filter((s) => s.category === "bodywear");
  const bodywearLists = await Promise.all(
    bodywearSupplies.map((s) => getBodywearRecipes(s.id)),
  );
  const bodywearRecipes = bodywearLists.flat();

  return {
    registrations,
    configs,
    masterPieces,
    pieceIngredients,
    appliques,
    usages,
    bodywearRecipes,
    supplies,
  };
}
