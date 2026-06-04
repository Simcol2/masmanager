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

type StepStatus = "not_started" | "material_needed" | "completed";

const STATUS_CYCLE: StepStatus[] = ["not_started", "material_needed", "completed"];

const STATUS_CONFIG: Record<StepStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  not_started:     { label: "Not started",     color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", Icon: Circle },
  material_needed: { label: "Material needed", color: "#D97706", bg: "rgba(217,119,6,0.1)",   Icon: AlertTriangle },
  completed:       { label: "Completed",        color: "#059669", bg: "rgba(5,150,105,0.1)",   Icon: CheckCircle2 },
};

function getPieceStatus(steps: SeasonPieceStep[]): StepStatus {
  if (steps.length === 0) return "not_started";
  if (steps.every((s) => s.status === "completed")) return "completed";
  if (steps.some((s) => s.status === "material_needed")) return "material_needed";
  if (steps.some((s) => s.status === "completed")) return "not_started"; // in_progress shown as not_started
  return "not_started";
}

function completedCount(steps: SeasonPieceStep[]) {
  return steps.filter((s) => s.status === "completed").length;
}

// ── Step row ──────────────────────────────────────────────────────────────────
function StepRow({
  step,
  onStatusChange,
  updating,
}: {
  step: SeasonPieceStep;
  onStatusChange: (stepId: string, status: StepStatus) => void;
  updating: boolean;
}) {
  const cfg = STATUS_CONFIG[step.status];
  const Icon = cfg.Icon;

  function cycleStatus() {
    const current = STATUS_CYCLE.indexOf(step.status);
    const next = STATUS_CYCLE[(current + 1) % STATUS_CYCLE.length];
    onStatusChange(step.id, next);
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "0.6rem 0.75rem",
      borderRadius: "0.5rem",
      background: step.status === "completed" ? "rgba(5,150,105,0.04)" : step.status === "material_needed" ? "rgba(217,119,6,0.04)" : "#FAFAFA",
      border: `1px solid ${step.status === "completed" ? "rgba(5,150,105,0.15)" : step.status === "material_needed" ? "rgba(217,119,6,0.15)" : "#F3F4F6"}`,
    }}>
      <button
        onClick={cycleStatus}
        disabled={updating}
        aria-label={`Status: ${cfg.label}. Tap to advance.`}
        style={{
          background: cfg.bg,
          border: `1.5px solid ${cfg.color}40`,
          borderRadius: "50%",
          width: "2rem",
          height: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: updating ? "wait" : "pointer",
          flexShrink: 0,
          transition: "transform 0.1s",
        }}
      >
        {updating
          ? <Loader2 style={{ width: "0.8rem", height: "0.8rem", color: cfg.color }} className="animate-spin" />
          : <Icon style={{ width: "0.85rem", height: "0.85rem", color: cfg.color }} />
        }
      </button>
      <span style={{
        fontSize: "0.875rem",
        color: step.status === "completed" ? "#059669" : step.status === "material_needed" ? "#D97706" : "#374151",
        fontWeight: step.status === "completed" ? 600 : 500,
        flex: 1,
        textDecoration: step.status === "completed" ? "line-through" : "none",
        textDecorationColor: "#05966960",
      }}>
        {step.stepName}
      </span>
      <span style={{
        fontSize: "0.7rem",
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        padding: "0.15rem 0.5rem",
        borderRadius: "999px",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Piece card ────────────────────────────────────────────────────────────────
function PieceCard({
  pieceName,
  steps,
  regCount,
  onStatusChange,
  updatingStepId,
}: {
  pieceName: string;
  steps: SeasonPieceStep[];
  regCount: number;
  onStatusChange: (stepId: string, status: StepStatus) => void;
  updatingStepId: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const done = completedCount(steps);
  const total = steps.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const pieceStatus = getPieceStatus(steps);
  const statusCfg = STATUS_CONFIG[pieceStatus];

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "0.875rem",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Piece header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ padding: "0.875rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.925rem", fontWeight: 700, color: "#1E2029" }}>{pieceName}</span>
            <span style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: statusCfg.color,
              background: statusCfg.bg,
              padding: "0.15rem 0.5rem",
              borderRadius: "999px",
            }}>
              {pieceStatus === "completed" ? "Done" : pieceStatus === "material_needed" ? "Needs material" : done > 0 ? "In progress" : "Not started"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
              {done}/{total} steps
            </span>
            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
              {regCount} to make
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: "0.5rem", height: "5px", borderRadius: "3px", background: "#F3F4F6", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
              style={{
                height: "100%",
                borderRadius: "3px",
                background: pieceStatus === "completed" ? "#059669" : pieceStatus === "material_needed" ? "#D97706" : "#1A73E8",
              }}
            />
          </div>
        </div>
        <div style={{ color: "#9CA3AF", flexShrink: 0 }}>
          {expanded ? <ChevronUp style={{ width: "1rem", height: "1rem" }} /> : <ChevronDown style={{ width: "1rem", height: "1rem" }} />}
        </div>
      </div>

      {/* Steps list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="steps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 0.75rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.4rem", borderTop: "1px solid #F3F4F6", paddingTop: "0.75rem" }}>
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  onStatusChange={onStatusChange}
                  updating={updatingStepId === step.id}
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
  const [regCounts, setRegCounts] = useState<Record<CostumeType, number>>({} as Record<CostumeType, number>);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<CostumeType | "all">("all");
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
      const counts = {} as Record<CostumeType, number>;
      for (const ct of COSTUME_ORDER) {
        counts[ct] = regs.filter((r) => r.costumeType === ct).length;
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
      setSteps((prev) =>
        prev.map((s) => s.id === stepId ? { ...s, status, updatedAt: new Date() } : s)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStepId(null);
    }
  }, []);

  // Group steps by costumeType then pieceName
  type GroupedData = Map<CostumeType, Map<string, SeasonPieceStep[]>>;
  const grouped: GroupedData = new Map();
  for (const step of steps) {
    if (!grouped.has(step.costumeType)) grouped.set(step.costumeType, new Map());
    const byPiece = grouped.get(step.costumeType)!;
    if (!byPiece.has(step.pieceName)) byPiece.set(step.pieceName, []);
    byPiece.get(step.pieceName)!.push(step);
  }

  const costumeTypesWithSteps = COSTUME_ORDER.filter((ct) => grouped.has(ct));
  const visibleTypes = activeType === "all" ? costumeTypesWithSteps : costumeTypesWithSteps.filter((ct) => ct === activeType);

  // Overall progress
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const overallPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <style>{`
        .prod-tabs { display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
        .prod-tabs::-webkit-scrollbar { display: none; }
        .prod-tab { padding: 0.45rem 0.875rem; border-radius: 999px; border: 1.5px solid #E5E7EB; background: #FFFFFF; font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; color: #6B7280; transition: all 0.15s; flex-shrink: 0; }
        .prod-tab.active { color: #FFFFFF; border-color: transparent; }
      `}</style>

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
              <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "linear-gradient(135deg,#F97316,#FF006E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Hammer style={{ width: "1rem", height: "1rem", color: "#fff" }} />
              </div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>
                Build Tracker
              </h1>
            </div>
            <p style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}>
              {SEASON} season production progress
            </p>
          </div>
        </div>
      </motion.div>

      {/* Overall progress */}
      {totalSteps > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", margin: 0 }}>
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
          <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: "0.5rem 0 0" }}>
            {completedSteps} of {totalSteps} steps completed across all pieces
          </p>
        </motion.div>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem" }} className="animate-spin" />
          <span style={{ fontSize: "0.875rem" }}>Loading build tracker...</span>
        </div>
      ) : costumeTypesWithSteps.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Hammer style={{ width: "2.5rem", height: "2.5rem", color: "#D1D5DB", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#374151", margin: "0 0 0.5rem" }}>No build steps configured</p>
          <p style={{ fontSize: "0.875rem", color: "#9CA3AF", margin: "0 0 1.5rem" }}>
            Go to the Seasons page and open a costume type to set up build steps for each piece.
          </p>
          <Link href="/seasons">
            <button style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              background: "#1A73E8", color: "#fff", border: "none",
              borderRadius: "0.5rem", padding: "0.6rem 1.25rem",
              fontWeight: 600, cursor: "pointer", fontSize: "0.875rem",
            }}>
              <LinkIcon style={{ width: "0.875rem", height: "0.875rem" }} />
              Set up build steps
            </button>
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Costume type tabs */}
          <div className="prod-tabs">
            <button
              className={`prod-tab${activeType === "all" ? " active" : ""}`}
              style={activeType === "all" ? { background: "#1E2029", borderColor: "#1E2029" } : {}}
              onClick={() => setActiveType("all")}
            >
              All types
            </button>
            {costumeTypesWithSteps.map((ct) => (
              <button
                key={ct}
                className={`prod-tab${activeType === ct ? " active" : ""}`}
                style={activeType === ct ? { background: TYPE_COLORS[ct], borderColor: TYPE_COLORS[ct] } : {}}
                onClick={() => setActiveType(ct)}
              >
                {CostumeTypeLabels[ct]}
              </button>
            ))}
          </div>

          {/* Costume type sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {visibleTypes.map((ct) => {
              const byPiece = grouped.get(ct)!;
              const pieces = Array.from(byPiece.entries());
              const ctSteps = pieces.flatMap(([, s]) => s);
              const ctDone = ctSteps.filter((s) => s.status === "completed").length;
              const ctTotal = ctSteps.length;
              const regCount = regCounts[ct] ?? 0;
              const color = TYPE_COLORS[ct];

              return (
                <motion.div key={ct} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Section header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <div style={{ width: "0.25rem", height: "1.75rem", borderRadius: "2px", background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>
                        {CostumeTypeLabels[ct]}
                      </h2>
                      <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: 0 }}>
                        {regCount} registration{regCount !== 1 ? "s" : ""} · {ctDone}/{ctTotal} steps done
                      </p>
                    </div>
                    <span style={{
                      fontSize: "0.8rem", fontWeight: 800, color,
                      background: `${color}14`, padding: "0.2rem 0.6rem",
                      borderRadius: "999px",
                    }}>
                      {ctTotal > 0 ? Math.round((ctDone / ctTotal) * 100) : 0}%
                    </span>
                  </div>

                  {/* Piece cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {pieces.map(([pieceName, pieceSteps]) => (
                      <PieceCard
                        key={pieceName}
                        pieceName={pieceName}
                        steps={pieceSteps}
                        regCount={regCount}
                        onStatusChange={handleStatusChange}
                        updatingStepId={updatingStepId}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
