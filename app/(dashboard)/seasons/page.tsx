"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { type CostumeType, CostumeTypeLabels } from "@/types";

const SEASONS = ["2026"] as const;

const COSTUME_BREAKDOWN: Record<CostumeType, { piece: string; notes?: string }[]> = {
  girls_backline:       [{ piece: "Arm Bands" }, { piece: "Thigh Bands" }, { piece: "Half Skirt" }, { piece: "Shorts" }, { piece: "Top" }, { piece: "Necklace" }, { piece: "Head Piece", notes: "Headband" }],
  boys_backline:        [{ piece: "Arm Bands" }, { piece: "Shorts" }, { piece: "Top" }, { piece: "Belt" }, { piece: "Chest Piece" }, { piece: "Head Piece", notes: "Headband" }],
  toddler_frontline:    [{ piece: "Arm Bands" }, { piece: "Thigh Bands" }, { piece: "Half Skirt" }, { piece: "Shorts" }, { piece: "Top" }, { piece: "Necklace" }, { piece: "Head Piece", notes: "Small Crown" }, { piece: "Collar", notes: "Yellow Feather Collar" }],
  girls_frontline:      [{ piece: "Arm Bands" }, { piece: "Thigh Bands" }, { piece: "Half Skirt" }, { piece: "Shorts" }, { piece: "Top" }, { piece: "Necklace" }, { piece: "Head Piece", notes: "Small Crown" }, { piece: "Backpack", notes: "Small Backpack" }],
  boys_frontline:       [{ piece: "Arm Bands" }, { piece: "Shorts" }, { piece: "Top" }, { piece: "Belt" }, { piece: "Chest Piece" }, { piece: "Head Piece", notes: "Feather Headband" }, { piece: "Backpack", notes: "Small Backpack" }],
  girls_ultra_frontline:[{ piece: "Arm Bands" }, { piece: "Leg Bands" }, { piece: "Shorts", notes: "Green Shorts" }, { piece: "Top" }, { piece: "Necklace" }, { piece: "Head Piece", notes: "Large Crown" }, { piece: "Collar", notes: "Large Red Feather Collar" }, { piece: "Backpack", notes: "Large Backpack" }, { piece: "Half Skirt", notes: "Cage Skirt" }],
  boys_ultra_frontline: [{ piece: "Arm Bands" }, { piece: "Leg Bands" }, { piece: "Shorts" }, { piece: "Top" }, { piece: "Belt" }, { piece: "Chest Piece" }, { piece: "Head Piece", notes: "Feather Headband" }, { piece: "Backpack", notes: "Soccer Ball Backpack" }],
};

const REGISTRATION_COUNTS: Record<CostumeType, number> = {
  girls_backline: 3, boys_backline: 4, toddler_frontline: 1,
  girls_frontline: 0, boys_frontline: 0,
  girls_ultra_frontline: 1, boys_ultra_frontline: 3,
};

const APPLIQUES_2026 = [
  { name: "Applique 1", usedOn: ["Thigh Bands", "Belt", "Necklace", "Head Piece", "Arm Bands"] },
  { name: "Applique 2", usedOn: ["Arm Bands", "Head Piece"] },
  { name: "Rectangle Hot Fix Trim", color: "Gold", usedOn: ["Chest Piece", "Belt"] },
  { name: "Gold Half Pearl Trim", color: "Gold", usedOn: ["Belt", "Necklace"] },
  { name: "Gold Pointy Half Pearl", color: "Gold", usedOn: ["Necklace"] },
];

const COSTUME_ORDER: CostumeType[] = [
  "girls_backline", "boys_backline", "toddler_frontline",
  "girls_frontline", "boys_frontline", "girls_ultra_frontline", "boys_ultra_frontline",
];

const PIECE_COLORS: Record<string, { bg: string; color: string }> = {
  "Arm Bands":   { bg: "rgba(26,115,232,0.1)",  color: "#1A73E8" },
  "Leg Bands":   { bg: "rgba(26,115,232,0.1)",  color: "#1A73E8" },
  "Thigh Bands": { bg: "rgba(26,115,232,0.1)",  color: "#1A73E8" },
  "Shorts":      { bg: "rgba(103,58,183,0.1)",  color: "#673AB7" },
  "Top":         { bg: "rgba(103,58,183,0.1)",  color: "#673AB7" },
  "Half Skirt":  { bg: "rgba(255,0,110,0.1)",   color: "#FF006E" },
  "Tutu":        { bg: "rgba(255,0,110,0.1)",   color: "#FF006E" },
  "Belt":        { bg: "rgba(255,152,0,0.12)",  color: "#E65100" },
  "Chest Piece": { bg: "rgba(255,152,0,0.12)",  color: "#E65100" },
  "Collar":      { bg: "rgba(0,188,212,0.1)",   color: "#00838F" },
  "Backpack":    { bg: "rgba(255,107,53,0.1)",  color: "#D84315" },
  "Head Piece":  { bg: "rgba(229,57,53,0.1)",   color: "#B71C1C" },
  "Necklace":    { bg: "rgba(255,214,10,0.15)", color: "#8A6500" },
  "Shoes":       { bg: "rgba(107,114,128,0.1)", color: "#374151" },
};

const TYPE_COLORS: CostumeType[] = COSTUME_ORDER;
const CARD_ACCENT = ["#FF006E","#1A73E8","#FFD60A","#FF6B35","#00BCD4","#673AB7","#4CAF50"];

function CostumeCard({ costumeType, index }: { costumeType: CostumeType; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const pieces = COSTUME_BREAKDOWN[costumeType];
  const count = REGISTRATION_COUNTS[costumeType];
  const accent = CARD_ACCENT[index % CARD_ACCENT.length];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
      {/* Accent bar */}
      <div style={{ height: "4px", background: accent }} />
      <div style={{ padding: "1rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E2029", margin: 0 }}>{CostumeTypeLabels[costumeType]}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
              <Users style={{ width: "0.8rem", height: "0.8rem", color: "#9CA3AF" }} />
              <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>{count} registered</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px",
              background: count > 0 ? "rgba(76,175,80,0.1)" : "rgba(107,114,128,0.08)",
              color: count > 0 ? "#2E7D32" : "#6B7280",
              border: `1px solid ${count > 0 ? "rgba(76,175,80,0.25)" : "rgba(107,114,128,0.2)"}`,
            }}>
              {count > 0 ? "Active" : "Empty"}
            </span>
            <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.1rem" }}>
              {expanded ? <ChevronUp style={{ width: "1rem", height: "1rem" }} /> : <ChevronDown style={{ width: "1rem", height: "1rem" }} />}
            </button>
          </div>
        </div>

        {expanded && (
          <>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.5rem" }}>
              {pieces.length} Pieces
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {pieces.map(p => {
                const pc = PIECE_COLORS[p.piece] ?? { bg: "rgba(107,114,128,0.08)", color: "#374151" };
                return (
                  <div key={p.piece + (p.notes ?? "")}>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.55rem",
                      borderRadius: "0.4rem", background: pc.bg, color: pc.color,
                      display: "inline-block",
                    }}>
                      {p.piece}
                    </span>
                    {p.notes && <span style={{ display: "block", fontSize: "0.65rem", color: "#9CA3AF", paddingLeft: "0.3rem", marginTop: "0.1rem" }}>{p.notes}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function SeasonsPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("2026");
  const totalRegistrations = Object.values(REGISTRATION_COUNTS).reduce((s, n) => s + n, 0);
  const activeTypes = COSTUME_ORDER.filter(c => REGISTRATION_COUNTS[c] > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Seasons</h1>
          <p style={{ color: "#6B7280", marginTop: "0.25rem", fontSize: "0.9rem" }}>Costume configurations by season year</p>
        </div>
        <div style={{ position: "relative" }}>
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            style={{
              appearance: "none", background: "#FFFFFF", border: "1.5px solid #E5E7EB",
              borderRadius: "0.75rem", padding: "0.5rem 2.5rem 0.5rem 1rem",
              fontSize: "0.875rem", fontWeight: 600, color: "#1E2029", cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}>
            {SEASONS.map(s => <option key={s} value={s}>{s} Season</option>)}
          </select>
          <CalendarDays style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#6B7280", pointerEvents: "none" }} />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={selectedSeason} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Season summary card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "linear-gradient(135deg,#FF006E,#1A73E8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarDays style={{ width: "1.3rem", height: "1.3rem", color: "#fff" }} />
              </div>
              <div>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FF006E", margin: 0, lineHeight: 1 }}>{selectedSeason}</p>
                <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: 0 }}>The Black Stars</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {[
                { value: totalRegistrations, label: "Registrations", color: "#FF006E" },
                { value: activeTypes, label: "Active Types", color: "#1A73E8" },
                { value: APPLIQUES_2026.length, label: "Appliques", color: "#FFD60A" },
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color, margin: 0, lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0.2rem 0 0" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: "999px", background: "rgba(76,175,80,0.1)", color: "#2E7D32", border: "1px solid rgba(76,175,80,0.25)" }}>
                Active Season
              </span>
            </div>
          </motion.div>

          {/* Costume grid */}
          <div>
            <h2 style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9CA3AF", marginBottom: "1rem" }}>
              Costume Styles — {selectedSeason}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {COSTUME_ORDER.map((costumeType, i) => (
                <CostumeCard key={costumeType} costumeType={costumeType} index={i} />
              ))}
            </div>
          </div>

          {/* Appliques overview */}
          <div>
            <h2 style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9CA3AF", marginBottom: "1rem" }}>
              Appliques & Trims — {selectedSeason}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
              {APPLIQUES_2026.map((a, i) => (
                <motion.div key={a.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "0.875rem", padding: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem", background: "rgba(255,214,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Sparkles style={{ width: "1.1rem", height: "1.1rem", color: "#8A6500" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1E2029", margin: 0 }}>{a.name}</p>
                    {a.color && <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0.15rem 0 0" }}>{a.color}</p>}
                    <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: "0.35rem 0 0" }}>
                      Used on: <span style={{ color: "#374151", fontWeight: 500 }}>{a.usedOn.join(", ")}</span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
