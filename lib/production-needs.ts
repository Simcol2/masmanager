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
  PieceSourcing,
} from "@/types";

import { getRegistrations } from "@/lib/services/registrations";
import { getSeasonPieceConfigs, getMasterPieces } from "@/lib/services/pieces";
import { getPieceIngredients } from "@/lib/services/pieceIngredients";
import { getAppliques, getAppliqueUsages } from "@/lib/services/appliques";
import { getBodywearRecipes } from "@/lib/services/bodywearRecipes";
import { getGemSupplies } from "@/lib/services/gems";
import { yardageFor, fabricPieceType } from "@/lib/yardage";

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

export interface FinishedPurchaseRow {
  pieceName: string;
  costumeType: CostumeType;
  count: number;
  unitPrice: number;
  total: number;
}

export interface OrderPlan {
  supplies: SupplyDemand[];
  finishedPurchases: FinishedPurchaseRow[];
}

// Which registration size field feeds a piece's fabric yardage.
function regSizeForPiece(pieceName: string, reg: Registration): string | undefined {
  const t = fabricPieceType(pieceName);
  if (t === "bottom") return reg.bottomSize;
  if (t === "top") return reg.topSize || reg.girlsTopSize;
  return undefined;
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

// ── Order plan: supplies to make + finished pieces to buy ─────────────────────────
// Honors per-piece sourcing:
//   • buy_finished → a finished-purchase row; its fabric, supplies, and appliques
//     are NOT ordered (you buy it complete).
//   • make → fabric demand from the chosen fabric × per-registration yardage
//     (size-accurate); plus its supplies and appliques as normal.
// Supplies with no sourcing fall back to the piece recipe (fabric included), so
// nothing is lost before sourcing is set up.

export function computeOrderPlan(
  data: ProductionData,
  sourcings: PieceSourcing[] = [],
): OrderPlan {
  const {
    registrations, configs, pieceIngredients, appliques, usages, bodywearRecipes, supplies,
  } = data;

  const counts = regCountsByType(registrations);
  const supplyById = new Map(supplies.map((s) => [s.id, s]));
  const sourcingByKey = new Map(sourcings.map((s) => [`${s.costumeType}::${s.masterPieceId}`, s]));
  const outsourced = new Set<string>(); // `${costumeType}::${masterPieceId}` bought finished
  const finishedPurchases: FinishedPurchaseRow[] = [];

  // Fabric-category piece ingredients, kept for the fallback when no sourcing is set.
  const fabricIngredientsByMaster = new Map<string, PieceIngredient[]>();
  for (const ing of pieceIngredients) {
    if (ing.type !== "supply" || !ing.gemSupplyId) continue;
    if (supplyById.get(ing.gemSupplyId)?.category !== "fabric") continue;
    if (!fabricIngredientsByMaster.has(ing.masterPieceId)) fabricIngredientsByMaster.set(ing.masterPieceId, []);
    fabricIngredientsByMaster.get(ing.masterPieceId)!.push(ing);
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

  // Fabric + finished purchases, per configured piece per costume type
  for (const cfg of configs) {
    const key = `${cfg.costumeType}::${cfg.masterPieceId}`;
    const src = sourcingByKey.get(key);
    const count = counts[cfg.costumeType] ?? 0;

    if (src?.mode === "buy_finished") {
      outsourced.add(key);
      if (count > 0) {
        finishedPurchases.push({
          pieceName: cfg.pieceName,
          costumeType: cfg.costumeType,
          count,
          unitPrice: src.finishedPrice,
          total: round(count * src.finishedPrice),
        });
      }
      continue;
    }
    if (count === 0) continue;

    if (src?.mode === "make" && src.fabricSupplyId) {
      // Size-accurate: sum the yardage for each registered dancer's actual size
      const regs = registrations.filter((r) => r.costumeType === cfg.costumeType);
      let yards = 0;
      for (const r of regs) yards += yardageFor(cfg.pieceName, regSizeForPiece(cfg.pieceName, r));
      addDemand(src.fabricSupplyId, yards, `Fabric: ${cfg.pieceName}`);
    } else {
      // No sourcing fabric: fall back to the piece recipe's fabric ingredients
      for (const ing of fabricIngredientsByMaster.get(cfg.masterPieceId) ?? []) {
        addDemand(ing.gemSupplyId, ing.quantity * count, cfg.pieceName);
      }
    }
  }

  // How many of each master piece are actually made (skip outsourced types).
  const piecesMadeByMaster = new Map<string, number>();
  for (const cfg of configs) {
    if (outsourced.has(`${cfg.costumeType}::${cfg.masterPieceId}`)) continue;
    const n = counts[cfg.costumeType] ?? 0;
    piecesMadeByMaster.set(cfg.masterPieceId, (piecesMadeByMaster.get(cfg.masterPieceId) ?? 0) + n);
  }

  // Non-fabric piece supplies × pieces made
  for (const ing of pieceIngredients) {
    if (ing.type !== "supply" || !ing.gemSupplyId) continue;
    if (supplyById.get(ing.gemSupplyId)?.category === "fabric") continue; // handled above
    const made = piecesMadeByMaster.get(ing.masterPieceId) ?? 0;
    addDemand(ing.gemSupplyId, ing.quantity * made, ing.pieceName);
  }

  // Gems consumed by appliques we need to make (excluding outsourced pieces)
  const appliqueById = new Map(appliques.map((a) => [a.id, a]));
  const usagesToMake = usages.filter((u) => !outsourced.has(`${u.costumeType}::${u.masterPieceId}`));
  const { unitsByApplique } = computeAppliqueNeeds(usagesToMake, bodywearRecipes, appliques, registrations);
  for (const [appliqueId, units] of unitsByApplique) {
    const applique = appliqueById.get(appliqueId);
    if (!applique) continue;
    for (const ing of applique.ingredients) {
      addDemand(ing.gemSupplyId, ing.quantity * units, `Applique: ${applique.name}`);
    }
  }

  // Bodywear item itself + its direct supply ingredients
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

  finishedPurchases.sort((a, b) => b.total - a.total);
  return { supplies: rows, finishedPurchases };
}

// Backwards-compatible helper: just the supply rows, no sourcing applied.
export function computeSupplyDemand(data: ProductionData): SupplyDemand[] {
  return computeOrderPlan(data).supplies;
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
