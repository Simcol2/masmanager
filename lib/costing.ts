// ─── Costume Costing Engine ─────────────────────────────────────────────────────
// Turns per-piece sourcing (buy finished vs make), selling prices, and the band's
// configurable policies into cost, profit, and margin per costume type.
//
//   piece cost (buy_finished) = finishedPrice
//   piece cost (make)         = fabricYardage × fabricUnitCost + laborCost
//                               + (if enabled) gems/appliques on the piece
//   costume unit cost         = Σ piece costs for that costume type
//   unit profit               = sellingPrice − unit cost
//   season net profit         = net revenue (after model policy) − total cost
//
// Fabric traces back to a GemSupply unit cost; embellishments to the applique /
// supply recipes, so nothing here is freestanding.

import type {
  PieceSourcing, CostumePricing, AppSettings, CostumeType, PieceSourcingMode,
} from "@/types";
import type { ProductionData } from "@/lib/production-needs";
import { regCountsByType } from "@/lib/production-needs";

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export interface PieceCostBreakdown {
  pieceName: string;
  masterPieceId: string;
  mode: PieceSourcingMode;
  fabricCost: number;
  laborCost: number;
  embellishmentCost: number; // only added to total when settings enable it
  finishedPrice: number;
  total: number;
  configured: boolean; // has the user set sourcing for this piece yet
}

export interface CostumeEconomics {
  costumeType: CostumeType;
  pieceCosts: PieceCostBreakdown[];
  unitCost: number;
  sellingPrice: number;
  unitProfit: number;
  margin: number; // unitProfit / sellingPrice
  registrationCount: number;
  modelCount: number;
  // season scale, after model policy
  grossRevenue: number;   // everyone at full price
  modelAllowance: number; // revenue given up to models
  netRevenue: number;
  totalCost: number;      // every costume (incl. models) costs unitCost to make
  netProfit: number;
}

// Embellishment (gems + appliques) cost for one costume of a given piece+type.
// Appliques come from AppliqueUsage (season/type specific); supplies come from the
// piece recipe, excluding fabric so it isn't double counted with the make fabric.
function embellishmentCostMap(data: ProductionData): Map<string, number> {
  const { usages, appliques, pieceIngredients, supplies } = data;
  const appliqueById = new Map(appliques.map(a => [a.id, a]));
  const supplyById = new Map(supplies.map(s => [s.id, s]));
  const map = new Map<string, number>();
  const key = (ct: string, mp: string) => `${ct}::${mp}`;

  for (const u of usages) {
    const applique = appliqueById.get(u.appliqueId);
    const cost = (applique?.totalCost ?? 0) * u.quantityPerCostume;
    const k = key(u.costumeType, u.masterPieceId);
    map.set(k, (map.get(k) ?? 0) + cost);
  }

  // Non-fabric supplies attached directly to a master piece apply to every costume
  // type that uses that piece.
  const pieceSupplyCost = new Map<string, number>();
  for (const ing of pieceIngredients) {
    if (ing.type !== "supply" || !ing.gemSupplyId) continue;
    if (supplyById.get(ing.gemSupplyId)?.category === "fabric") continue;
    pieceSupplyCost.set(ing.masterPieceId, (pieceSupplyCost.get(ing.masterPieceId) ?? 0) + ing.lineCost);
  }
  for (const cfg of data.configs) {
    const extra = pieceSupplyCost.get(cfg.masterPieceId) ?? 0;
    if (extra === 0) continue;
    const k = key(cfg.costumeType, cfg.masterPieceId);
    map.set(k, (map.get(k) ?? 0) + extra);
  }
  return map;
}

function pieceCost(
  sourcing: PieceSourcing | undefined,
  embellishment: number,
  settings: AppSettings,
): Omit<PieceCostBreakdown, "pieceName" | "masterPieceId"> {
  const includeEmb = settings.includeEmbellishmentsInPieceCost;
  if (!sourcing) {
    // No sourcing set yet: cost is whatever embellishments the piece already carries.
    const total = includeEmb ? embellishment : 0;
    return { mode: "make", fabricCost: 0, laborCost: 0, embellishmentCost: embellishment, finishedPrice: 0, total: round(total), configured: false };
  }
  if (sourcing.mode === "buy_finished") {
    return {
      mode: "buy_finished", fabricCost: 0, laborCost: 0,
      embellishmentCost: embellishment, finishedPrice: sourcing.finishedPrice,
      total: round(sourcing.finishedPrice), configured: true,
    };
  }
  const unit = sourcing.fabricUnitCost > 0 ? sourcing.fabricUnitCost : settings.defaultFabricPricePerYard;
  const fabricCost = sourcing.fabricYardage * unit;
  const total = fabricCost + sourcing.laborCost + (includeEmb ? embellishment : 0);
  return {
    mode: "make", fabricCost: round(fabricCost), laborCost: round(sourcing.laborCost),
    embellishmentCost: round(embellishment), finishedPrice: 0,
    total: round(total), configured: true,
  };
}

export function computeCostumeEconomics(
  data: ProductionData,
  sourcings: PieceSourcing[],
  pricings: CostumePricing[],
  settings: AppSettings,
): CostumeEconomics[] {
  const counts = regCountsByType(data.registrations);
  const modelCounts: Record<string, number> = {};
  for (const r of data.registrations) {
    if (r.isModel) modelCounts[r.costumeType] = (modelCounts[r.costumeType] ?? 0) + 1;
  }

  const embMap = embellishmentCostMap(data);
  const sourcingByKey = new Map(sourcings.map(s => [`${s.costumeType}::${s.masterPieceId}`, s]));
  const priceByType = new Map(pricings.map(p => [p.costumeType, p.sellingPrice]));

  // Pieces per costume type from the season config
  const piecesByType = new Map<CostumeType, { masterPieceId: string; pieceName: string }[]>();
  for (const cfg of data.configs) {
    if (!piecesByType.has(cfg.costumeType)) piecesByType.set(cfg.costumeType, []);
    const list = piecesByType.get(cfg.costumeType)!;
    if (!list.some(p => p.masterPieceId === cfg.masterPieceId)) {
      list.push({ masterPieceId: cfg.masterPieceId, pieceName: cfg.pieceName });
    }
  }

  const result: CostumeEconomics[] = [];
  for (const [costumeType, pieces] of piecesByType) {
    const pieceCosts: PieceCostBreakdown[] = pieces.map(p => {
      const key = `${costumeType}::${p.masterPieceId}`;
      const breakdown = pieceCost(sourcingByKey.get(key), embMap.get(key) ?? 0, settings);
      return { pieceName: p.pieceName, masterPieceId: p.masterPieceId, ...breakdown };
    });

    const unitCost = round(pieceCosts.reduce((s, p) => s + p.total, 0));
    const sellingPrice = priceByType.get(costumeType) ?? 0;
    const unitProfit = round(sellingPrice - unitCost);
    const margin = sellingPrice > 0 ? round(unitProfit / sellingPrice, 4) : 0;

    const registrationCount = counts[costumeType] ?? 0;
    const modelCount = modelCounts[costumeType] ?? 0;
    const grossRevenue = round(registrationCount * sellingPrice);

    let modelAllowance: number;
    if (settings.modelPolicyType === "free_costume") {
      modelAllowance = round(modelCount * sellingPrice);
    } else {
      modelAllowance = round(modelCount * Math.min(settings.modelDiscountAmount, sellingPrice));
    }
    const netRevenue = round(grossRevenue - modelAllowance);
    const totalCost = round(registrationCount * unitCost);
    const netProfit = round(netRevenue - totalCost);

    result.push({
      costumeType, pieceCosts, unitCost, sellingPrice, unitProfit, margin,
      registrationCount, modelCount, grossRevenue, modelAllowance,
      netRevenue, totalCost, netProfit,
    });
  }
  return result;
}

// Season-wide totals across every costume type.
export function summarizeEconomics(rows: CostumeEconomics[]) {
  return rows.reduce(
    (acc, r) => ({
      registrations: acc.registrations + r.registrationCount,
      models: acc.models + r.modelCount,
      netRevenue: round(acc.netRevenue + r.netRevenue),
      totalCost: round(acc.totalCost + r.totalCost),
      netProfit: round(acc.netProfit + r.netProfit),
      modelAllowance: round(acc.modelAllowance + r.modelAllowance),
    }),
    { registrations: 0, models: 0, netRevenue: 0, totalCost: 0, netProfit: 0, modelAllowance: 0 },
  );
}
