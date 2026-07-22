"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Loader2, Settings2, ChevronDown, ChevronUp, Pencil,
  TrendingUp, TrendingDown, Scissors, ShoppingBag,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  type CostumeType, CostumeTypeLabels, type PieceSourcing,
  type CostumePricing, type AppSettings, type Registration,
} from "@/types";
import { loadProductionData, type ProductionData } from "@/lib/production-needs";
import {
  computeCostumeEconomics, summarizeEconomics,
  type CostumeEconomics, type PieceCostBreakdown,
} from "@/lib/costing";
import {
  getPieceSourcings, upsertPieceSourcing,
  getCostumePricings, upsertCostumePricing,
  getAppSettings, saveAppSettings,
} from "@/lib/services/costing";
import { averageYardage, fabricPieceType } from "@/lib/yardage";

const SEASON = "2026";

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Which registration size field feeds a piece's fabric yardage
function pieceSizes(pieceName: string, regs: Registration[]): (string | undefined)[] {
  const t = fabricPieceType(pieceName);
  if (t === "bottom") return regs.map(r => r.bottomSize);
  if (t === "top") return regs.map(r => r.topSize || r.girlsTopSize);
  return [];
}

// ── Settings dialog ────────────────────────────────────────────────────────────
function SettingsDialog({
  open, onClose, settings, onSave,
}: {
  open: boolean; onClose: () => void; settings: AppSettings;
  onSave: (s: Partial<AppSettings>) => Promise<void>;
}) {
  const [policy, setPolicy] = useState(settings.modelPolicyType);
  const [discount, setDiscount] = useState(String(settings.modelDiscountAmount));
  const [includeEmb, setIncludeEmb] = useState(settings.includeEmbellishmentsInPieceCost);
  const [fabricPrice, setFabricPrice] = useState(String(settings.defaultFabricPricePerYard));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPolicy(settings.modelPolicyType);
      setDiscount(String(settings.modelDiscountAmount));
      setIncludeEmb(settings.includeEmbellishmentsInPieceCost);
      setFabricPrice(String(settings.defaultFabricPricePerYard));
    }
  }, [open, settings]);

  async function handleSave() {
    setSaving(true);
    await onSave({
      modelPolicyType: policy,
      modelDiscountAmount: Number(discount) || 0,
      includeEmbellishmentsInPieceCost: includeEmb,
      defaultFabricPricePerYard: Number(fabricPrice) || 0,
    });
    setSaving(false);
    onClose();
  }

  const label = { fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.04em" };
  const input = { width: "100%", border: "1px solid #E5E7EB", borderRadius: "0.375rem", padding: "0.5rem 0.7rem", fontSize: "0.9rem", color: "#111827" };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent showCloseButton style={{ maxWidth: "26rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: "0 0 1rem" }}>Costing Settings</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Model policy */}
          <div>
            <div style={label}>Model policy</div>
            <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: "0.15rem 0 0.5rem" }}>How costumes given to models are priced.</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {([["discount", "Discount off"], ["free_costume", "Fully free"]] as const).map(([val, txt]) => (
                <button key={val} onClick={() => setPolicy(val)}
                  style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", cursor: "pointer",
                    border: `1.5px solid ${policy === val ? "#1A73E8" : "#E5E7EB"}`,
                    background: policy === val ? "rgba(26,115,232,0.06)" : "#fff",
                    color: policy === val ? "#1A73E8" : "#374151", fontWeight: 600, fontSize: "0.82rem" }}>
                  {txt}
                </button>
              ))}
            </div>
            {policy === "discount" && (
              <div style={{ marginTop: "0.6rem" }}>
                <div style={label}>Discount amount ($)</div>
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} style={{ ...input, marginTop: "0.25rem" }} />
              </div>
            )}
          </div>

          {/* Calc method */}
          <div>
            <div style={label}>Make cost calculation</div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={includeEmb} onChange={e => setIncludeEmb(e.target.checked)} style={{ width: "1.1rem", height: "1.1rem" }} />
              <span style={{ fontSize: "0.85rem", color: "#374151" }}>Include gems &amp; appliques in a made piece&apos;s cost</span>
            </label>
            <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: "0.35rem 0 0" }}>
              Off = fabric + labor only. On = fabric + labor + the piece&apos;s embellishments.
            </p>
          </div>

          {/* Default fabric price */}
          <div>
            <div style={label}>Default fabric price ($/yard)</div>
            <input type="number" value={fabricPrice} onChange={e => setFabricPrice(e.target.value)} style={{ ...input, marginTop: "0.25rem" }} />
            <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: "0.35rem 0 0" }}>Used when a chosen fabric has no unit cost set.</p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ marginTop: "1.25rem", width: "100%", background: "#1A73E8", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.65rem", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Saving..." : "Save settings"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

// ── Sourcing dialog ──────────────────────────────────────────────────────────────
interface SourcingTarget { costumeType: CostumeType; masterPieceId: string; pieceName: string; }

function SourcingDialog({
  target, data, existing, onClose, onSaved,
}: {
  target: SourcingTarget | null;
  data: ProductionData;
  existing: PieceSourcing | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fabrics = useMemo(() => data.supplies.filter(s => s.category === "fabric"), [data.supplies]);
  const [mode, setMode] = useState<"buy_finished" | "make">("make");
  const [finishedPrice, setFinishedPrice] = useState("0");
  const [fabricId, setFabricId] = useState("");
  const [yardage, setYardage] = useState("0");
  const [labor, setLabor] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    if (existing) {
      setMode(existing.mode);
      setFinishedPrice(String(existing.finishedPrice));
      setFabricId(existing.fabricSupplyId ?? "");
      setYardage(String(existing.fabricYardage));
      setLabor(String(existing.laborCost));
    } else {
      // Seed yardage from the guide, averaged across this type's registrations
      const regs = data.registrations.filter(r => r.costumeType === target.costumeType);
      const seeded = averageYardage(target.pieceName, pieceSizes(target.pieceName, regs));
      setMode("make");
      setFinishedPrice("0");
      setFabricId(fabrics[0]?.id ?? "");
      setYardage(String(seeded));
      setLabor("0");
    }
  }, [target, existing, data.registrations, fabrics]);

  if (!target) return null;

  const fabric = fabrics.find(f => f.id === fabricId);
  const unitCost = fabric?.unitCost ?? 0;
  const fabricCost = mode === "make" ? Number(yardage) * unitCost : 0;

  async function handleSave() {
    if (!target) return;
    setSaving(true);
    await upsertPieceSourcing({
      seasonId: SEASON,
      costumeType: target.costumeType,
      masterPieceId: target.masterPieceId,
      pieceName: target.pieceName,
      mode,
      finishedPrice: Number(finishedPrice) || 0,
      fabricSupplyId: mode === "make" ? fabricId || undefined : undefined,
      fabricSupplyName: mode === "make" ? fabric?.name : undefined,
      fabricYardage: Number(yardage) || 0,
      fabricUnitCost: unitCost,
      laborCost: Number(labor) || 0,
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  const label = { fontSize: "0.72rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.04em" };
  const input = { width: "100%", border: "1px solid #E5E7EB", borderRadius: "0.375rem", padding: "0.5rem 0.7rem", fontSize: "0.9rem", color: "#111827" };
  const noFabricGuide = fabricPieceType(target.pieceName) === "other";

  return (
    <Dialog open={!!target} onOpenChange={v => !v && onClose()}>
      <DialogContent showCloseButton style={{ maxWidth: "26rem" }}>
        <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{CostumeTypeLabels[target.costumeType]}</p>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: "0.1rem 0 1rem" }}>{target.pieceName}</h2>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button onClick={() => setMode("make")}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.6rem", borderRadius: "0.5rem", cursor: "pointer",
              border: `1.5px solid ${mode === "make" ? "#059669" : "#E5E7EB"}`, background: mode === "make" ? "rgba(5,150,105,0.06)" : "#fff", color: mode === "make" ? "#059669" : "#374151", fontWeight: 600, fontSize: "0.82rem" }}>
            <Scissors style={{ width: "0.9rem", height: "0.9rem" }} /> Make
          </button>
          <button onClick={() => setMode("buy_finished")}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.6rem", borderRadius: "0.5rem", cursor: "pointer",
              border: `1.5px solid ${mode === "buy_finished" ? "#1A73E8" : "#E5E7EB"}`, background: mode === "buy_finished" ? "rgba(26,115,232,0.06)" : "#fff", color: mode === "buy_finished" ? "#1A73E8" : "#374151", fontWeight: 600, fontSize: "0.82rem" }}>
            <ShoppingBag style={{ width: "0.9rem", height: "0.9rem" }} /> Buy finished
          </button>
        </div>

        {mode === "buy_finished" ? (
          <div>
            <div style={label}>Purchase price per piece ($)</div>
            <input type="number" value={finishedPrice} onChange={e => setFinishedPrice(e.target.value)} style={{ ...input, marginTop: "0.25rem" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <div style={label}>Fabric</div>
              <select value={fabricId} onChange={e => setFabricId(e.target.value)} style={{ ...input, marginTop: "0.25rem", cursor: "pointer" }}>
                <option value="">No fabric selected</option>
                {fabrics.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({money(f.unitCost)}/{f.costUnit})</option>
                ))}
              </select>
              {fabrics.length === 0 && <p style={{ fontSize: "0.72rem", color: "#D97706", margin: "0.3rem 0 0" }}>No fabric supplies yet. Add one under Supplies (category: fabric).</p>}
            </div>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <div style={{ flex: 1 }}>
                <div style={label}>Yardage</div>
                <input type="number" step="0.125" value={yardage} onChange={e => setYardage(e.target.value)} style={{ ...input, marginTop: "0.25rem" }} />
                {!noFabricGuide && <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: "0.25rem 0 0" }}>Seeded from the yardage guide, edit freely.</p>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={label}>Labor ($)</div>
                <input type="number" value={labor} onChange={e => setLabor(e.target.value)} style={{ ...input, marginTop: "0.25rem" }} />
                <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: "0.25rem 0 0" }}>0 if sewn in-house.</p>
              </div>
            </div>
            <div style={{ background: "#F9FAFB", borderRadius: "0.5rem", padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "#6B7280" }}>Fabric cost</span>
              <span style={{ fontWeight: 700, color: "#111827" }}>{money(fabricCost)}</span>
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          style={{ marginTop: "1.25rem", width: "100%", background: "#1A73E8", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.65rem", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Saving..." : "Save sourcing"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

// ── Piece row ────────────────────────────────────────────────────────────────────
function PieceRow({ p, onEdit }: { p: PieceCostBreakdown; onEdit: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", borderBottom: "1px solid #F9FAFB" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>{p.pieceName}</div>
        <div style={{ fontSize: "0.68rem", color: p.configured ? "#9CA3AF" : "#D97706" }}>
          {!p.configured ? "Not set up" : p.mode === "buy_finished" ? "Bought finished"
            : `Made · fabric ${money(p.fabricCost)}${p.laborCost > 0 ? ` + labor ${money(p.laborCost)}` : ""}`}
        </div>
      </div>
      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", flexShrink: 0 }}>{money(p.total)}</span>
      <button onClick={onEdit} style={{ background: "#F3F4F6", border: "none", borderRadius: "0.375rem", padding: "0.35rem", cursor: "pointer", display: "flex", flexShrink: 0 }}>
        <Pencil style={{ width: "0.8rem", height: "0.8rem", color: "#6B7280" }} />
      </button>
    </div>
  );
}

// ── Costume card ──────────────────────────────────────────────────────────────────
function CostumeCard({
  eco, onPriceSave, onEditPiece,
}: {
  eco: CostumeEconomics;
  onPriceSave: (price: number) => void;
  onEditPiece: (p: PieceCostBreakdown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(eco.sellingPrice));
  useEffect(() => { setPrice(String(eco.sellingPrice)); }, [eco.sellingPrice]);

  const profitPositive = eco.unitProfit >= 0;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1E2029" }}>{CostumeTypeLabels[eco.costumeType]}</div>
            <div style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>
              {eco.registrationCount} registered{eco.modelCount > 0 ? ` · ${eco.modelCount} model${eco.modelCount > 1 ? "s" : ""}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: profitPositive ? "rgba(5,150,105,0.1)" : "rgba(239,68,68,0.1)", padding: "0.35rem 0.6rem", borderRadius: "999px" }}>
            {profitPositive ? <TrendingUp style={{ width: "0.85rem", height: "0.85rem", color: "#059669" }} /> : <TrendingDown style={{ width: "0.85rem", height: "0.85rem", color: "#EF4444" }} />}
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: profitPositive ? "#059669" : "#EF4444" }}>
              {eco.sellingPrice > 0 ? `${Math.round(eco.margin * 100)}% margin` : "No price"}
            </span>
          </div>
        </div>

        {/* Cost / price / profit */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.85rem" }}>
          <div style={{ background: "#F9FAFB", borderRadius: "0.5rem", padding: "0.5rem 0.6rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9CA3AF" }}>Cost</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>{money(eco.unitCost)}</div>
          </div>
          <div style={{ background: "#F9FAFB", borderRadius: "0.5rem", padding: "0.5rem 0.6rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9CA3AF" }}>Price</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827" }}>$</span>
              <input
                type="number" value={price}
                onChange={e => setPrice(e.target.value)}
                onBlur={() => { const n = Number(price) || 0; if (n !== eco.sellingPrice) onPriceSave(n); }}
                style={{ width: "100%", border: "none", background: "transparent", fontSize: "0.95rem", fontWeight: 800, color: "#111827", padding: 0, outline: "none" }}
              />
            </div>
          </div>
          <div style={{ background: profitPositive ? "rgba(5,150,105,0.06)" : "rgba(239,68,68,0.06)", borderRadius: "0.5rem", padding: "0.5rem 0.6rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9CA3AF" }}>Profit/ea</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: profitPositive ? "#059669" : "#EF4444" }}>{money(eco.unitProfit)}</div>
          </div>
        </div>

        {/* Season net profit line */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", fontSize: "0.78rem" }}>
          <span style={{ color: "#6B7280" }}>
            Net profit ({eco.registrationCount})
            {eco.modelAllowance > 0 ? ` · models −${money(eco.modelAllowance)}` : ""}
          </span>
          <span style={{ fontWeight: 800, color: eco.netProfit >= 0 ? "#059669" : "#EF4444" }}>{money(eco.netProfit)}</span>
        </div>

        <button onClick={() => setOpen(v => !v)} style={{ marginTop: "0.75rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", background: "none", border: "1px solid #F3F4F6", borderRadius: "0.5rem", padding: "0.45rem", cursor: "pointer", color: "#6B7280" }}>
          <span style={{ fontSize: "0.76rem", fontWeight: 600 }}>{eco.pieceCosts.length} pieces</span>
          {open ? <ChevronUp style={{ width: "0.85rem", height: "0.85rem" }} /> : <ChevronDown style={{ width: "0.85rem", height: "0.85rem" }} />}
        </button>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>
          {eco.pieceCosts.map(p => (
            <PieceRow key={p.masterPieceId} p={p} onEdit={() => onEditPiece(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────────
export default function CostingPage() {
  const [data, setData] = useState<ProductionData | null>(null);
  const [sourcings, setSourcings] = useState<PieceSourcing[]>([]);
  const [pricings, setPricings] = useState<CostumePricing[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SourcingTarget | null>(null);

  const reloadSourcings = useCallback(() => { getPieceSourcings(SEASON).then(setSourcings).catch(console.error); }, []);
  const reloadPricings = useCallback(() => { getCostumePricings(SEASON).then(setPricings).catch(console.error); }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadProductionData(SEASON),
      getPieceSourcings(SEASON),
      getCostumePricings(SEASON),
      getAppSettings(),
    ]).then(([prod, src, pr, st]) => {
      if (cancelled) return;
      setData(prod); setSourcings(src); setPricings(pr); setSettings(st);
    }).catch(console.error).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const economics = useMemo(() => {
    if (!data || !settings) return [];
    return computeCostumeEconomics(data, sourcings, pricings, settings);
  }, [data, sourcings, pricings, settings]);

  const summary = useMemo(() => summarizeEconomics(economics), [economics]);

  async function handlePriceSave(costumeType: CostumeType, price: number) {
    await upsertCostumePricing(SEASON, costumeType, price);
    reloadPricings();
  }
  async function handleSettingsSave(patch: Partial<AppSettings>) {
    await saveAppSettings(patch);
    const fresh = await getAppSettings();
    setSettings(fresh);
  }

  const editExisting = editTarget
    ? sourcings.find(s => s.costumeType === editTarget.costumeType && s.masterPieceId === editTarget.masterPieceId)
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,#10B981,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign style={{ width: "1rem", height: "1rem", color: "#fff" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Costume Costing</h1>
          </div>
          <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>Cost, price, and profit per costume for {SEASON}</p>
        </div>
        <button onClick={() => setSettingsOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#F3F4F6", border: "none", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", cursor: "pointer", color: "#374151", fontWeight: 600, fontSize: "0.82rem", flexShrink: 0 }}>
          <Settings2 style={{ width: "0.9rem", height: "0.9rem" }} /> <span className="mas-hide-sm">Settings</span>
        </button>
      </motion.div>
      <style>{`@media (max-width: 480px) { .mas-hide-sm { display: none; } }`}</style>

      {loading || !settings ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem" }} className="animate-spin" />
          <span style={{ fontSize: "0.875rem" }}>Loading...</span>
        </div>
      ) : (
        <>
          {/* Season summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }} className="mas-summary">
            <style>{`@media (min-width: 640px){ .mas-summary{ grid-template-columns: repeat(4, 1fr) !important; } }`}</style>
            <SummaryTile label="Net revenue" value={money(summary.netRevenue)} color="#1A73E8" />
            <SummaryTile label="Total cost" value={money(summary.totalCost)} color="#D97706" />
            <SummaryTile label="Net profit" value={money(summary.netProfit)} color={summary.netProfit >= 0 ? "#059669" : "#EF4444"} />
            <SummaryTile label="Model give-away" value={money(summary.modelAllowance)} color="#8B5CF6" />
          </div>

          {economics.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <DollarSign style={{ width: "2.5rem", height: "2.5rem", color: "#D1D5DB", margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
                No costume pieces configured yet. Set up pieces per costume type in Costumes first.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {economics.map((eco, i) => (
                <motion.div key={eco.costumeType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <CostumeCard
                    eco={eco}
                    onPriceSave={price => handlePriceSave(eco.costumeType, price)}
                    onEditPiece={p => setEditTarget({ costumeType: eco.costumeType, masterPieceId: p.masterPieceId, pieceName: p.pieceName })}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {settings && (
        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSave={handleSettingsSave} />
      )}
      {data && (
        <SourcingDialog target={editTarget} data={data} existing={editExisting} onClose={() => setEditTarget(null)} onSaved={reloadSourcings} />
      )}
    </div>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: "0.64rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>{label}</div>
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color, marginTop: "0.25rem", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
