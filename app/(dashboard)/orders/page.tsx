"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Loader2, ChevronDown, ChevronUp, ExternalLink,
  PackageCheck, AlertTriangle,
} from "lucide-react";
import {
  loadProductionData, computeSupplyDemand, type SupplyDemand,
} from "@/lib/production-needs";

const SEASON = "2026";

const CATEGORY_LABELS: Record<string, string> = {
  rhinestone: "Rhinestone", gem: "Gem", trim: "Trim", fabric: "Fabric",
  feather: "Feather", frame: "Frame", wire: "Wire", elastic: "Elastic",
  chain: "Chain", applique_material: "Applique Material", htv: "HTV",
  cardstock: "Cardstock", glue: "Glue", tool: "Tool", hardware: "Hardware",
  paint: "Paint", bodywear: "Bodywear", other: "Other",
};

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function qty(n: number, unit: string): string {
  const rounded = Math.round(n * 100) / 100;
  return `${rounded.toLocaleString()} ${unit}`;
}

// ── Row card ─────────────────────────────────────────────────────────────────
function OrderRow({ row }: { row: SupplyDemand }) {
  const [open, setOpen] = useState(false);
  const needsOrder = row.orderQty > 0;

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${needsOrder ? "rgba(217,119,6,0.3)" : "#E5E7EB"}`,
      borderRadius: "0.875rem",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ padding: "0.875rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E2029" }}>{row.name}</span>
              {row.itemNumber && (
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "0.1rem 0.4rem", borderRadius: "0.375rem" }}>{row.itemNumber}</span>
              )}
            </div>
            <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>
              {CATEGORY_LABELS[row.category] ?? row.category}
              {row.supplier ? ` · ${row.supplier}` : ""}
            </span>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {needsOrder ? (
              <>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
                  {qty(row.orderQty, row.minOrderUnit || row.costUnit)}
                </div>
                <div style={{ fontSize: "0.68rem", color: "#9CA3AF", marginTop: "0.15rem" }}>to order</div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#059669" }}>
                <PackageCheck style={{ width: "0.9rem", height: "0.9rem" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>In stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Demand math */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>
          <Stat label="Needed" value={qty(row.demandQty, row.costUnit)} />
          <Stat label="On hand" value={qty(row.quantityOnHand, row.costUnit)} />
          <Stat label="Short" value={qty(row.shortfall, row.costUnit)} accent={row.shortfall > 0 ? "#D97706" : undefined} />
          {needsOrder && <Stat label="Est. cost" value={money(row.estCost)} accent="#1A73E8" />}
        </div>

        {/* Sources toggle */}
        {row.sources.length > 0 && (
          <button
            onClick={() => setOpen(v => !v)}
            style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", padding: 0, cursor: "pointer", color: "#6B7280" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>
              Driven by {row.sources.length} {row.sources.length === 1 ? "item" : "items"}
            </span>
            {open ? <ChevronUp style={{ width: "0.8rem", height: "0.8rem" }} /> : <ChevronDown style={{ width: "0.8rem", height: "0.8rem" }} />}
          </button>
        )}
        {open && (
          <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {row.sources.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.75rem", color: "#374151", background: "#FAFAFA", borderRadius: "0.375rem", padding: "0.35rem 0.5rem" }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                <span style={{ fontWeight: 600, flexShrink: 0 }}>{qty(s.qty, row.costUnit)}</span>
              </div>
            ))}
          </div>
        )}

        {needsOrder && row.supplierLink && (
          <a href={row.supplierLink} target="_blank" rel="noopener noreferrer"
            style={{ marginTop: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", fontWeight: 600, color: "#1A73E8", textDecoration: "none" }}>
            Open supplier <ExternalLink style={{ width: "0.8rem", height: "0.8rem" }} />
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "#F9FAFB", borderRadius: "0.5rem", padding: "0.3rem 0.55rem" }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9CA3AF" }}>{label}</div>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: accent ?? "#1E2029" }}>{value}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [rows, setRows] = useState<SupplyDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyToOrder, setOnlyToOrder] = useState(true);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;
    loadProductionData(SEASON)
      .then(data => { if (!cancelled) setRows(computeSupplyDemand(data)); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const categories = Array.from(new Set(rows.map(r => r.category))).sort();
  const visible = rows.filter(r =>
    (!onlyToOrder || r.orderQty > 0) &&
    (category === "all" || r.category === category)
  );

  const toOrderRows = rows.filter(r => r.orderQty > 0);
  const totalEstCost = toOrderRows.reduce((s, r) => s + r.estCost, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
          <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,#F59E0B,#D97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingCart style={{ width: "1rem", height: "1rem", color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Order List</h1>
        </div>
        <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>
          What to buy for {SEASON}, from registrations, piece recipes, and appliques
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem" }} className="animate-spin" />
          <span style={{ fontSize: "0.875rem" }}>Calculating demand...</span>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <AlertTriangle style={{ width: "0.9rem", height: "0.9rem", color: "#D97706" }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>Items to order</span>
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1E2029", marginTop: "0.25rem", lineHeight: 1 }}>{toOrderRows.length}</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <ShoppingCart style={{ width: "0.9rem", height: "0.9rem", color: "#1A73E8" }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>Est. order cost</span>
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1E2029", marginTop: "0.25rem", lineHeight: 1 }}>{money(totalEstCost)}</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setOnlyToOrder(v => !v)}
              style={{
                background: onlyToOrder ? "#D97706" : "#F3F4F6",
                color: onlyToOrder ? "#fff" : "#374151",
                border: "none", borderRadius: "0.375rem", padding: "0.4rem 0.8rem",
                fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
              }}>
              {onlyToOrder ? "Showing items to order" : "Showing all supplies"}
            </button>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ border: "1px solid #E5E7EB", borderRadius: "0.375rem", padding: "0.4rem 0.7rem", fontSize: "0.78rem", color: "#374151", background: "#fff", cursor: "pointer" }}>
              <option value="all">All categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
              ))}
            </select>
          </div>

          {/* Rows */}
          {visible.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <PackageCheck style={{ width: "2.5rem", height: "2.5rem", color: "#D1D5DB", margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>
                {rows.length === 0
                  ? "No demand yet. Add registrations, piece recipes, and applique assignments to see what to order."
                  : onlyToOrder
                    ? "Nothing to order, everything needed is in stock."
                    : "No supplies match this filter."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {visible.map((row, i) => (
                <motion.div key={row.supplyId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                  <OrderRow row={row} />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
