"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer, ChevronDown, ChevronUp, Loader2,
  AlertTriangle, CheckCircle2, Circle, ListChecks,
} from "lucide-react";
import Link from "next/link";
import {
  type CostumeType, type Registration, type SeasonPieceStep,
  CostumeTypeLabels,
} from "@/types";
import { getRegistrations } from "@/lib/services/registrations";
import { getSeasonPieceSteps, updateStepStatus } from "@/lib/services/productionSteps";

const SEASON = "2026";

// ── Piece-to-costume-type mapping ─────────────────────────────────────────────
const COSTUME_PIECES: Record<CostumeType, string[]> = {
  girls_backline:        ["Arm Bands", "Thigh Bands", "Half Skirt", "Shorts", "Top", "Necklace", "Head Piece"],
  boys_backline:         ["Arm Bands", "Shorts", "Top", "Belt", "Chest Piece", "Head Piece"],
  toddler_frontline:     ["Arm Bands", "Thigh Bands", "Half Skirt", "Shorts", "Top", "Necklace", "Head Piece", "Collar"],
  girls_frontline:       ["Arm Bands", "Thigh Bands", "Half Skirt", "Shorts", "Top", "Necklace", "Head Piece", "Backpack"],
  boys_frontline:        ["Arm Bands", "Shorts", "Top", "Belt", "Chest Piece", "Head Piece", "Backpack"],
  girls_ultra_frontline: ["Arm Bands", "Leg Bands", "Shorts", "Top", "Necklace", "Head Piece", "Collar", "Backpack", "Half Skirt"],
  boys_ultra_frontline:  ["Arm Bands", "Leg Bands", "Shorts", "Top", "Belt", "Chest Piece", "Head Piece", "Backpack"],
};

// Canonical piece display order
const PIECE_ORDER = [
  "Arm Bands", "Thigh Bands", "Leg Bands",
  "Top", "Shorts", "Half Skirt", "Tutu",
  "Belt", "Chest Piece",
  "Head Piece", "Necklace", "Collar",
  "Backpack", "Shoes",
];

// Style tiers — groups costume types into production batches
const TIERS: { key: string; label: string; types: CostumeType[] }[] = [
  { key: "backline",  label: "Backline",       types: ["girls_backline", "boys_backline"] },
  { key: "frontline", label: "Frontline",      types: ["toddler_frontline", "girls_frontline", "boys_frontline"] },
  { key: "ultra",     label: "Ultra Frontline", types: ["girls_ultra_frontline", "boys_ultra_frontline"] },
];

// Which registration field holds the size for a given piece
function getPieceSize(pieceName: string, reg: Registration): string | null {
  switch (pieceName) {
    case "Arm Bands":
    case "Thigh Bands":
    case "Leg Bands":
    case "Belt":
      return reg.bandSize || null;
    case "Top":
      return reg.topSize || reg.girlsTopSize || null;
    case "Shorts":
      return reg.bottomSize || null;
    case "Chest Piece":
      return reg.bandSize || null;
    case "Shoes":
      return reg.shoeSize || null;
    default:
      return null;
  }
}

// ── Build step status config ──────────────────────────────────────────────────
type StepStatus = SeasonPieceStep["status"];
const STATUS_CYCLE: StepStatus[] = ["not_started", "material_needed", "completed"];
const STATUS_CFG: Record<StepStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  not_started:     { label: "Not started",     color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", Icon: Circle },
  material_needed: { label: "Material needed", color: "#D97706", bg: "rgba(217,119,6,0.1)",   Icon: AlertTriangle },
  completed:       { label: "Completed",       color: "#059669", bg: "rgba(5,150,105,0.1)",   Icon: CheckCircle2 },
};

// ── Components ────────────────────────────────────────────────────────────────

function SizeBreakdown({ sizes }: { sizes: Record<string, number> }) {
  const sorted = Object.entries(sizes).sort(([a], [b]) => {
    const order = ["2T","3T","4T","5T","Youth XS","Youth S","Youth M","Youth L","Youth XL","Adult XS","Adult S","Adult M","Adult L","Adult XL","Small","Medium","Large","XS","S","M","L","XL","XXL","XXXL"];
    const ai = order.indexOf(a), bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
      {sorted.map(([size, count]) => (
        <div key={size} style={{
          display: "flex", alignItems: "center", gap: "0.3rem",
          background: "#F3F4F6", borderRadius: "0.5rem",
          padding: "0.2rem 0.6rem",
        }}>
          <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{size}</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1E2029" }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function StepRow({
  step, onStatusChange, updating,
}: {
  step: SeasonPieceStep;
  onStatusChange: (id: string, s: StepStatus) => void;
  updating: boolean;
}) {
  const cfg = STATUS_CFG[step.status];
  const Icon = cfg.Icon;
  function cycle() {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(step.status) + 1) % STATUS_CYCLE.length];
    onStatusChange(step.id, next);
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.625rem",
      padding: "0.5rem 0.625rem", borderRadius: "0.5rem",
      background: step.status === "completed" ? "rgba(5,150,105,0.04)" : step.status === "material_needed" ? "rgba(217,119,6,0.04)" : "#FAFAFA",
      border: `1px solid ${step.status === "completed" ? "rgba(5,150,105,0.15)" : step.status === "material_needed" ? "rgba(217,119,6,0.15)" : "#F3F4F6"}`,
    }}>
      <button onClick={cycle} disabled={updating} style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}40`, borderRadius: "50%", width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: updating ? "wait" : "pointer", flexShrink: 0 }}>
        {updating ? <Loader2 style={{ width: "0.7rem", height: "0.7rem", color: cfg.color }} className="animate-spin" /> : <Icon style={{ width: "0.75rem", height: "0.75rem", color: cfg.color }} />}
      </button>
      <span style={{ fontSize: "0.82rem", flex: 1, color: step.status === "completed" ? "#059669" : step.status === "material_needed" ? "#D97706" : "#374151", fontWeight: step.status === "completed" ? 600 : 400, textDecoration: step.status === "completed" ? "line-through" : "none", textDecorationColor: "#05966960" }}>
        {step.stepName}
      </span>
      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "0.1rem 0.4rem", borderRadius: "999px", flexShrink: 0 }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Piece card ────────────────────────────────────────────────────────────────
function PieceCard({
  pieceName,
  grandTotal,
  tierData,
  pieceSteps,
  onStatusChange,
  updatingStepId,
}: {
  pieceName: string;
  grandTotal: number;
  tierData: { key: string; label: string; total: number; sizes: Record<string, number> | null }[];
  pieceSteps: SeasonPieceStep[];
  onStatusChange: (id: string, s: StepStatus) => void;
  updatingStepId: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const [stepsOpen, setStepsOpen] = useState(false);

  const stepsDone = pieceSteps.filter(s => s.status === "completed").length;
  const stepsTotal = pieceSteps.length;
  const stepsPct = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div onClick={() => setExpanded(v => !v)} style={{ padding: "0.875rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#1E2029" }}>{pieceName}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1E2029" }}>{grandTotal}</span>
              <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>to make</span>
            </div>
          </div>
          {stepsTotal > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
              <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "#F3F4F6", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${stepsPct}%`, borderRadius: "2px", background: stepsPct === 100 ? "#059669" : "#1A73E8", transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: "0.7rem", color: "#9CA3AF", whiteSpace: "nowrap" }}>{stepsDone}/{stepsTotal} steps</span>
            </div>
          )}
        </div>
        {expanded
          ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "#9CA3AF", flexShrink: 0 }} />
          : <ChevronDown style={{ width: "1rem", height: "1rem", color: "#9CA3AF", flexShrink: 0 }} />}
      </div>

      {/* Tier breakdown */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}>
            <div style={{ borderTop: "1px solid #F3F4F6" }}>
              {tierData.map(({ key, label, total, sizes }) => (
                <div key={key} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #F9FAFB" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>{label}</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E2029" }}>{total}</span>
                  </div>
                  {sizes && <SizeBreakdown sizes={sizes} />}
                </div>
              ))}

              {/* Build steps section */}
              {stepsTotal > 0 && (
                <div style={{ borderTop: "1px solid #F3F4F6" }}>
                  <button
                    onClick={e => { e.stopPropagation(); setStepsOpen(v => !v); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", background: "none", border: "none", cursor: "pointer" }}>
                    <ListChecks style={{ width: "0.875rem", height: "0.875rem", color: "#1A73E8", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1A73E8", flex: 1, textAlign: "left" }}>
                      Build Steps ({stepsDone}/{stepsTotal})
                    </span>
                    {stepsOpen ? <ChevronUp style={{ width: "0.875rem", height: "0.875rem", color: "#9CA3AF" }} /> : <ChevronDown style={{ width: "0.875rem", height: "0.875rem", color: "#9CA3AF" }} />}
                  </button>
                  {stepsOpen && (
                    <div style={{ padding: "0 0.875rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {pieceSteps.map(step => (
                        <StepRow key={step.id} step={step} onStatusChange={onStatusChange} updating={updatingStepId === step.id} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {stepsTotal === 0 && (
                <div style={{ padding: "0.625rem 1rem", borderTop: "1px solid #F9FAFB" }}>
                  <Link href="/seasons" style={{ textDecoration: "none" }}>
                    <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                      No build steps set up.{" "}
                      <span style={{ color: "#1A73E8", fontWeight: 600 }}>Configure in Seasons</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductionPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [allSteps, setAllSteps] = useState<SeasonPieceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getRegistrations(SEASON),
      getSeasonPieceSteps(SEASON),
    ]).then(([regs, steps]) => {
      if (cancelled) return;
      setRegistrations(regs);
      setAllSteps(steps);
    }).catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = useCallback(async (stepId: string, status: StepStatus) => {
    setUpdatingStepId(stepId);
    try {
      await updateStepStatus(stepId, status);
      setAllSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, updatedAt: new Date() } : s));
    } catch (e) { console.error(e); }
    finally { setUpdatingStepId(null); }
  }, []);

  // Build piece data from registrations
  const allPieceNames = new Set<string>();
  for (const pieces of Object.values(COSTUME_PIECES)) {
    for (const p of pieces) allPieceNames.add(p);
  }
  const sortedPieceNames = PIECE_ORDER.filter(p => allPieceNames.has(p));
  for (const p of allPieceNames) {
    if (!PIECE_ORDER.includes(p)) sortedPieceNames.push(p);
  }

  const pieces = sortedPieceNames.map(pieceName => {
    const tierData = TIERS.map(tier => {
      const relevantTypes = tier.types.filter(ct => COSTUME_PIECES[ct].includes(pieceName));
      if (relevantTypes.length === 0) return null;
      const tierRegs = registrations.filter(r => relevantTypes.includes(r.costumeType));
      if (tierRegs.length === 0) return null;

      const sizes: Record<string, number> = {};
      let hasSizes = false;
      for (const reg of tierRegs) {
        const size = getPieceSize(pieceName, reg);
        if (size) { hasSizes = true; sizes[size] = (sizes[size] ?? 0) + 1; }
      }

      return { key: tier.key, label: tier.label, total: tierRegs.length, sizes: hasSizes ? sizes : null };
    }).filter((t): t is NonNullable<typeof t> => t !== null);

    if (tierData.length === 0) return null;
    const grandTotal = tierData.reduce((s, t) => s + t.total, 0);

    // Aggregate steps for this piece across all configured costumeTypes
    const pieceSteps = allSteps
      .filter(s => s.pieceName === pieceName)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Deduplicate: if same stepName appears for multiple costumeTypes, show each
    // (steps are per costumeType in Firestore, but we surface them flattened here)
    const seenStepKeys = new Set<string>();
    const dedupedSteps = pieceSteps.filter(s => {
      const key = `${s.costumeType}:${s.stepName}`;
      if (seenStepKeys.has(key)) return false;
      seenStepKeys.add(key);
      return true;
    });

    return { pieceName, grandTotal, tierData, pieceSteps: dedupedSteps };
  }).filter((p): p is NonNullable<typeof p> => p !== null && p.grandTotal > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
          <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,#F97316,#FF006E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hammer style={{ width: "1rem", height: "1rem", color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Production</h1>
        </div>
        <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>
          {SEASON} cut list from {registrations.length} registrations
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem" }} className="animate-spin" />
          <span style={{ fontSize: "0.875rem" }}>Loading...</span>
        </div>
      ) : registrations.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Hammer style={{ width: "2.5rem", height: "2.5rem", color: "#D1D5DB", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: 0 }}>No registrations for {SEASON} yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {pieces.map((piece, i) => (
            <motion.div key={piece.pieceName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <PieceCard
                pieceName={piece.pieceName}
                grandTotal={piece.grandTotal}
                tierData={piece.tierData}
                pieceSteps={piece.pieceSteps}
                onStatusChange={handleStatusChange}
                updatingStepId={updatingStepId}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
