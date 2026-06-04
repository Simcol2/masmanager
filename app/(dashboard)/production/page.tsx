"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Circle, Link as LinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  type CostumeType, type SeasonPieceStep,
  CostumeTypeLabels,
} from "@/types";
import { getSeasonPieceSteps, updateStepStatus } from "@/lib/services/productionSteps";
import { getRegistrations } from "@/lib/services/registrations";

const SEASON = "2026";

const COSTUME_ORDER: CostumeType[] = [
  "girls_backline", "boys_backline", "toddler_frontline",
  "girls_frontline", "boys_frontline", "girls_ultra_frontline", "boys_ultra_frontline",
];

const TYPE_COLORS: Record<CostumeType, string> = {
  girls_backline:        "#FF006E",
  boys_backline:         "#1A73E8",
  toddler_frontline:     "#FFD60A",
  girls_frontline:       "#FF6B35",
  boys_frontline:        "#00BCD4",
  girls_ultra_frontline: "#673AB7",
  boys_ultra_frontline:  "#4CAF50",
};

// Which pieces each costume type includes
const COSTUME_PIECES: Record<CostumeType, string[]> = {
  girls_backline:        ["Arm Bands", "Thigh Bands", "Half Skirt", "Shorts", "Top", "Necklace", "Head Piece"],
  boys_backline:         ["Arm Bands", "Shorts", "Top", "Belt", "Chest Piece", "Head Piece"],
  toddler_frontline:     ["Arm Bands", "Thigh Bands", "Half Skirt", "Shorts", "Top", "Necklace", "Head Piece", "Collar"],
  girls_frontline:       ["Arm Bands", "Thigh Bands", "Half Skirt", "Shorts", "Top", "Necklace", "Head Piece", "Backpack"],
  boys_frontline:        ["Arm Bands", "Shorts", "Top", "Belt", "Chest Piece", "Head Piece", "Backpack"],
  girls_ultra_frontline: ["Arm Bands", "Leg Bands", "Shorts", "Top", "Necklace", "Head Piece", "Collar", "Backpack", "Half Skirt"],
  boys_ultra_frontline:  ["Arm Bands", "Leg Bands", "Shorts", "Top", "Belt", "Chest Piece", "Head Piece", "Backpack"],
};

type StepStatus = "not_started" | "material_needed" | "completed";

const STATUS_CYCLE: StepStatus[] = ["not_started", "material_needed", "completed"];

const STATUS_CFG: Record<StepStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  not_started:     { label: "Not started",     color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", Icon: Circle },
  material_needed: { label: "Material needed", color: "#D97706", bg: "rgba(217,119,6,0.1)",   Icon: AlertTriangle },
  completed:       { label: "Completed",       color: "#059669", bg: "rgba(5,150,105,0.1)",   Icon: CheckCircle2 },
};

// ── Step row ──────────────────────────────────────────────────────────────────
function StepRow({
  step, onStatusChange, updating,
}: {
  step: SeasonPieceStep;
  onStatusChange: (stepId: string, status: StepStatus) => void;
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
      padding: "0.55rem 0.75rem", borderRadius: "0.5rem",
      background: step.status === "completed" ? "rgba(5,150,105,0.04)" : step.status === "material_needed" ? "rgba(217,119,6,0.04)" : "#FAFAFA",
      border: `1px solid ${step.status === "completed" ? "rgba(5,150,105,0.15)" : step.status === "material_needed" ? "rgba(217,119,6,0.15)" : "#F3F4F6"}`,
    }}>
      <button
        onClick={cycle}
        disabled={updating}
        style={{
          background: cfg.bg, border: `1.5px solid ${cfg.color}40`,
          borderRadius: "50%", width: "1.875rem", height: "1.875rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: updating ? "wait" : "pointer", flexShrink: 0,
        }}
      >
        {updating
          ? <Loader2 style={{ width: "0.75rem", height: "0.75rem", color: cfg.color }} className="animate-spin" />
          : <Icon style={{ width: "0.8rem", height: "0.8rem", color: cfg.color }} />}
      </button>
      <span style={{
        fontSize: "0.875rem", flex: 1,
        color: step.status === "completed" ? "#059669" : step.status === "material_needed" ? "#D97706" : "#374151",
        fontWeight: step.status === "completed" ? 600 : 400,
        textDecoration: step.status === "completed" ? "line-through" : "none",
        textDecorationColor: "#05966960",
      }}>
        {step.stepName}
      </span>
      <span style={{
        fontSize: "0.65rem", fontWeight: 700, color: cfg.color,
        background: cfg.bg, padding: "0.1rem 0.45rem",
        borderRadius: "999px", whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Per-costume-type step group within a piece ────────────────────────────────
function TypeStepGroup({
  costumeType, regCount, steps, onStatusChange, updatingStepId, showHeader,
}: {
  costumeType: CostumeType;
  regCount: number;
  steps: SeasonPieceStep[];
  onStatusChange: (stepId: string, status: StepStatus) => void;
  updatingStepId: string | null;
  showHeader: boolean;
}) {
  const done = steps.filter(s => s.status === "completed").length;
  const color = TYPE_COLORS[costumeType];

  return (
    <div>
      {showHeader && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280" }}>
            {CostumeTypeLabels[costumeType]}
          </span>
          <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
            {regCount} to make · {done}/{steps.length} steps
          </span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {steps.map(step => (
          <StepRow
            key={step.id}
            step={step}
            onStatusChange={onStatusChange}
            updating={updatingStepId === step.id}
          />
        ))}
      </div>
    </div>
  );
}

// ── Piece card (groups all costume types for one piece) ───────────────────────
function PieceCard({
  pieceName,
  totalToMake,
  typeGroups,
  onStatusChange,
  updatingStepId,
}: {
  pieceName: string;
  totalToMake: number;
  typeGroups: { costumeType: CostumeType; regCount: number; steps: SeasonPieceStep[] }[];
  onStatusChange: (stepId: string, status: StepStatus) => void;
  updatingStepId: string | null;
}) {
  const [expanded, setExpanded] = useState(true);

  const allSteps = typeGroups.flatMap(g => g.steps);
  const done = allSteps.filter(s => s.status === "completed").length;
  const total = allSteps.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const hasMaterial = allSteps.some(s => s.status === "material_needed");
  const allDone = done === total && total > 0;

  // Determine whether to show per-type headers
  const showTypeHeaders = typeGroups.length > 1;

  const statusColor = allDone ? "#059669" : hasMaterial ? "#D97706" : done > 0 ? "#1A73E8" : "#9CA3AF";
  const statusLabel = allDone ? "Done" : hasMaterial ? "Needs material" : done > 0 ? "In progress" : "Not started";

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E5E7EB",
      borderRadius: "0.875rem", overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: "0.875rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#1E2029" }}>{pieceName}</span>
            <span style={{
              fontSize: "0.68rem", fontWeight: 700,
              color: statusColor, background: `${statusColor}14`,
              padding: "0.15rem 0.5rem", borderRadius: "999px",
            }}>
              {statusLabel}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>
              {totalToMake} to make
            </span>
            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
              {done}/{total} steps done
            </span>
          </div>
          <div style={{ marginTop: "0.45rem", height: "5px", borderRadius: "3px", background: "#F3F4F6", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: "100%", borderRadius: "3px", background: statusColor }}
            />
          </div>
        </div>
        <div style={{ color: "#9CA3AF", flexShrink: 0 }}>
          {expanded
            ? <ChevronUp style={{ width: "1rem", height: "1rem" }} />
            : <ChevronDown style={{ width: "1rem", height: "1rem" }} />}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 0.875rem 0.875rem",
              borderTop: "1px solid #F3F4F6",
              paddingTop: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: showTypeHeaders ? "1rem" : "0.375rem",
            }}>
              {typeGroups.map(group => (
                <TypeStepGroup
                  key={group.costumeType}
                  costumeType={group.costumeType}
                  regCount={group.regCount}
                  steps={group.steps}
                  onStatusChange={onStatusChange}
                  updatingStepId={updatingStepId}
                  showHeader={showTypeHeaders}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductionPage() {
  const [steps, setSteps] = useState<SeasonPieceStep[]>([]);
  const [regCounts, setRegCounts] = useState<Partial<Record<CostumeType, number>>>({});
  const [loading, setLoading] = useState(true);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getSeasonPieceSteps(SEASON),
      getRegistrations(SEASON),
    ]).then(([loadedSteps, regs]) => {
      if (cancelled) return;
      setSteps(loadedSteps);
      const counts: Partial<Record<CostumeType, number>> = {};
      for (const ct of COSTUME_ORDER) {
        counts[ct] = regs.filter(r => r.costumeType === ct).length;
      }
      setRegCounts(counts);
    }).catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = useCallback(async (stepId: string, status: StepStatus) => {
    setUpdatingStepId(stepId);
    try {
      await updateStepStatus(stepId, status);
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status, updatedAt: new Date() } : s));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStepId(null);
    }
  }, []);

  // Build piece groups: group by pieceName, then by costumeType within
  // "totalToMake" = sum of registrations for ALL costume types that include this piece
  const pieceMap = new Map<string, { costumeType: CostumeType; regCount: number; steps: SeasonPieceStep[] }[]>();

  for (const step of steps) {
    if (!pieceMap.has(step.pieceName)) pieceMap.set(step.pieceName, []);
    const groups = pieceMap.get(step.pieceName)!;
    let group = groups.find(g => g.costumeType === step.costumeType);
    if (!group) {
      group = { costumeType: step.costumeType, regCount: regCounts[step.costumeType] ?? 0, steps: [] };
      groups.push(group);
    }
    group.steps.push(step);
  }

  // Sort steps within each group by sortOrder
  for (const groups of pieceMap.values()) {
    for (const g of groups) {
      g.steps.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    // Sort groups by COSTUME_ORDER
    groups.sort((a, b) => COSTUME_ORDER.indexOf(a.costumeType) - COSTUME_ORDER.indexOf(b.costumeType));
  }

  // Sort pieces alphabetically
  const pieceEntries = Array.from(pieceMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Compute totalToMake per piece: sum of registrations for ALL types that include this piece
  function getTotalToMake(pieceName: string): number {
    let total = 0;
    for (const ct of COSTUME_ORDER) {
      if (COSTUME_PIECES[ct].includes(pieceName)) {
        total += regCounts[ct] ?? 0;
      }
    }
    return total;
  }

  // Overall stats
  const allSteps = steps;
  const totalDone = allSteps.filter(s => s.status === "completed").length;
  const overallPct = allSteps.length > 0 ? Math.round((totalDone / allSteps.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
          <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,#F97316,#FF006E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hammer style={{ width: "1rem", height: "1rem", color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Build Tracker</h1>
        </div>
        <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>{SEASON} season production progress</p>
      </motion.div>

      {/* Overall progress */}
      {allSteps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", margin: 0 }}>
              Overall Progress
            </p>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: overallPct === 100 ? "#059669" : "#1E2029" }}>
              {overallPct}%
            </span>
          </div>
          <div style={{ height: "8px", borderRadius: "4px", background: "#F3F4F6", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ height: "100%", borderRadius: "4px", background: overallPct === 100 ? "#059669" : "linear-gradient(90deg,#1A73E8,#FF006E)" }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: "0.4rem 0 0" }}>
            {totalDone} of {allSteps.length} steps completed
          </p>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem" }} className="animate-spin" />
          <span style={{ fontSize: "0.875rem" }}>Loading...</span>
        </div>
      ) : pieceEntries.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Hammer style={{ width: "2.5rem", height: "2.5rem", color: "#D1D5DB", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#374151", margin: "0 0 0.5rem" }}>No build steps configured</p>
          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: "0 0 1.5rem" }}>
            Open each costume type in the Seasons page and set up build steps for each piece.
          </p>
          <Link href="/seasons">
            <button style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              background: "#1A73E8", color: "#fff", border: "none",
              borderRadius: "0.5rem", padding: "0.6rem 1.25rem",
              fontWeight: 600, cursor: "pointer", fontSize: "0.875rem",
            }}>
              <LinkIcon style={{ width: "0.875rem", height: "0.875rem" }} />
              Go to Seasons
            </button>
          </Link>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {pieceEntries.map(([pieceName, typeGroups], i) => (
            <motion.div key={pieceName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <PieceCard
                pieceName={pieceName}
                totalToMake={getTotalToMake(pieceName)}
                typeGroups={typeGroups}
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
