"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button"; // removed — using inline buttons
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  CalendarDays, Users, Sparkles, ChevronDown, ChevronUp,
  Plus, X, Check, Loader2, ChevronRight, Upload, Download, FileText, ImageIcon,
  Pencil,
} from "lucide-react";
import {
  type CostumeType, CostumeTypeLabels,
  type MasterPiece, type SeasonPieceConfig, type Registration,
  type SeasonAsset, SeasonAssetCategory,
} from "@/types";
import {
  getMasterPieces, seedDefaultPieces,
  upsertSeasonPieceConfig, getSeasonPieceConfigs, deleteSeasonPieceConfig,
} from "@/lib/services/pieces";
import { getSeasonAssets, createSeasonAsset, deleteSeasonAsset, renameSeasonAsset } from "@/lib/services/seasonAssets";
import { uploadSeasonAsset } from "@/lib/services/storage";
import { getRegistrations, seedRegistrations } from "@/lib/services/registrations";

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

const CARD_ACCENT = ["#FF006E","#1A73E8","#FFD60A","#FF6B35","#00BCD4","#673AB7","#4CAF50"];


// ── Registration row ──────────────────────────────────────────────────────────
function RegistrationRow({ reg }: { reg: Registration }) {
  const sizes: string[] = [];
  if (reg.topSize)     sizes.push(`Top: ${reg.topSize}`);
  if (reg.bottomSize)  sizes.push(`Bottom: ${reg.bottomSize}`);
  if (reg.bandSize)    sizes.push(`Bands: ${reg.bandSize}`);
  if (reg.girlsTopSize) sizes.push(`Girls Top: ${reg.girlsTopSize}`);
  if (reg.waist)       sizes.push(`Waist: ${reg.waist}`);
  if (reg.shoeSize)    sizes.push(`Shoe: ${reg.shoeSize}${reg.shoeCategory ? ` (${reg.shoeCategory})` : ""}`);

  const payMap: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: "rgba(76,175,80,0.1)",   color: "#2E7D32",  label: "Paid" },
    partial: { bg: "rgba(255,152,0,0.1)",   color: "#E65100",  label: "Partial" },
    deposit: { bg: "rgba(29,78,216,0.1)",   color: "#1D4ED8",  label: "Deposit" },
    unpaid:  { bg: "rgba(229,57,53,0.1)",   color: "#B71C1C",  label: "Unpaid" },
  };
  const pay = payMap[reg.paymentStatus] ?? payMap.unpaid;

  return (
    <div style={{ background: "#FAFAFA", border: "1px solid #F3F4F6", borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E2029" }}>
          {reg.firstName} {reg.lastName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>{reg.age}y · {reg.gender}</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "999px", background: pay.bg, color: pay.color }}>
            {pay.label}
          </span>
        </div>
      </div>
      {sizes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {sizes.map(s => (
            <span key={s} style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem", borderRadius: "0.35rem", background: "rgba(26,115,232,0.07)", color: "#1A73E8" }}>
              {s}
            </span>
          ))}
        </div>
      )}
      {reg.addOns && (
        <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>Add-ons:</span> {reg.addOns}
        </p>
      )}
      <p style={{ fontSize: "0.7rem", color: "#9CA3AF", margin: 0 }}>
        {reg.parentName}{reg.parentPhone ? ` · ${reg.parentPhone}` : ""}
      </p>
    </div>
  );
}

// ── Costume detail dialog ────────────────────────────────────────────────────
function CostumeDetailDialog({
  costumeType, season, registrations, open, onClose,
}: {
  costumeType: CostumeType | null;
  season: string;
  registrations: Registration[];
  open: boolean;
  onClose: () => void;
}) {
  const [masterPieces, setMasterPieces] = useState<MasterPiece[]>([]);
  const [pieceConfigs, setPieceConfigs] = useState<SeasonPieceConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingPiece, setAddingPiece] = useState(false);
  const [selectedPieceId, setSelectedPieceId] = useState("");
  const [pieceNotes, setPieceNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !costumeType) return;
    let cancelled = false;
    setLoading(true);
    setAddingPiece(false);
    setSelectedPieceId("");
    setPieceNotes("");

    Promise.all([
      seedDefaultPieces().catch(() => {}),
      getMasterPieces(),
      getSeasonPieceConfigs(season),
    ]).then(([, pieces, allConfigs]) => {
      if (cancelled) return;
      setMasterPieces(pieces);
      setPieceConfigs(allConfigs.filter(c => c.costumeType === costumeType));
    }).catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, costumeType, season]);

  async function handleAddPiece() {
    if (!selectedPieceId || !costumeType) return;
    const piece = masterPieces.find(p => p.id === selectedPieceId);
    if (!piece) return;
    setSaving(true);
    try {
      await upsertSeasonPieceConfig({
        seasonId: season,
        costumeType,
        masterPieceId: piece.id,
        pieceName: piece.name,
        availableSizes: [],
        notes: pieceNotes || undefined,
      });
      const updated = await getSeasonPieceConfigs(season);
      setPieceConfigs(updated.filter(c => c.costumeType === costumeType));
      setAddingPiece(false);
      setSelectedPieceId("");
      setPieceNotes("");
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleRemovePiece(configId: string) {
    setRemovingId(configId);
    try {
      await deleteSeasonPieceConfig(configId);
      setPieceConfigs(prev => prev.filter(c => c.id !== configId));
    } catch (e) { console.error(e); }
    finally { setRemovingId(null); }
  }

  if (!costumeType) return null;

  const defaultPieces = COSTUME_BREAKDOWN[costumeType];
  const costumeRegistrations = registrations.filter(r => r.costumeType === costumeType);
  const accent = CARD_ACCENT[COSTUME_ORDER.indexOf(costumeType) % CARD_ACCENT.length];

  const configuredPieceIds = new Set(pieceConfigs.map(c => c.masterPieceId));
  const availableMasterPieces = masterPieces.filter(p => !configuredPieceIds.has(p.id));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", zIndex: 51,
        width: "calc(100% - 2rem)", maxWidth: "42rem", maxHeight: "88vh",
        overflow: "hidden", background: "#FFFFFF", border: "1px solid #E5E7EB",
        borderRadius: "1rem", padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        outline: "none", display: "flex", flexDirection: "column",
      }}>

        {/* Header — right padding accounts for the absolute-positioned close button */}
        <div style={{ padding: "1.25rem 3.5rem 1rem 1.5rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "0.3rem", height: "2rem", borderRadius: "2px", background: accent, flexShrink: 0 }} />
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>
                {CostumeTypeLabels[costumeType]}
              </h2>
              <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: 0 }}>
                {season} Season · {costumeRegistrations.length} registration{costumeRegistrations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* ── Pieces ── */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9CA3AF", margin: 0 }}>
                Pieces — {defaultPieces.length + pieceConfigs.length} total
              </h3>
              {!addingPiece && (
                <button
                  onClick={() => setAddingPiece(true)}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 600, padding: "0.3rem 0.75rem", borderRadius: "0.5rem", border: "none", background: accent, color: "#fff", cursor: "pointer" }}>
                  <Plus style={{ width: "0.8rem", height: "0.8rem" }} />
                  Add Piece
                </button>
              )}
            </div>

            {/* Add piece inline form */}
            {addingPiece && (
              <div style={{ marginBottom: "0.75rem", padding: "0.875rem", background: "#F9FAFB", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", margin: 0 }}>Add piece from master list</p>
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#9CA3AF", fontSize: "0.8rem" }}>
                    <Loader2 style={{ width: "0.9rem", height: "0.9rem" }} className="animate-spin" />
                    Loading pieces…
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedPieceId}
                      onChange={e => setSelectedPieceId(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.875rem", border: "1.5px solid #E5E7EB", borderRadius: "0.5rem", background: "#fff", color: "#1E2029", outline: "none" }}>
                      <option value="">— Select a piece —</option>
                      {availableMasterPieces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      placeholder="Notes (optional, e.g. Large Crown)"
                      value={pieceNotes}
                      onChange={e => setPieceNotes(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.875rem", border: "1.5px solid #E5E7EB", borderRadius: "0.5rem", background: "#fff", color: "#1E2029", outline: "none" }} />
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => { setAddingPiece(false); setSelectedPieceId(""); setPieceNotes(""); }}
                        style={{ padding: "0.4rem 0.875rem", fontSize: "0.8rem", border: "1.5px solid #E5E7EB", borderRadius: "0.5rem", background: "#fff", cursor: "pointer", color: "#374151", fontWeight: 500 }}>
                        Cancel
                      </button>
                      <button
                        onClick={handleAddPiece}
                        disabled={!selectedPieceId || saving}
                        style={{ padding: "0.4rem 0.875rem", fontSize: "0.8rem", border: "none", borderRadius: "0.5rem", background: accent, color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", opacity: (!selectedPieceId || saving) ? 0.6 : 1 }}>
                        {saving
                          ? <Loader2 style={{ width: "0.75rem", height: "0.75rem" }} className="animate-spin" />
                          : <Check style={{ width: "0.75rem", height: "0.75rem" }} />}
                        Save
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Default pieces */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {defaultPieces.map(p => {
                const pc = PIECE_COLORS[p.piece] ?? { bg: "rgba(107,114,128,0.08)", color: "#374151" };
                return (
                  <div key={p.piece + (p.notes ?? "")}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "0.4rem", background: pc.bg, color: pc.color, display: "inline-block" }}>
                      {p.piece}
                    </span>
                    {p.notes && <span style={{ display: "block", fontSize: "0.65rem", color: "#9CA3AF", paddingLeft: "0.25rem", marginTop: "0.1rem" }}>{p.notes}</span>}
                  </div>
                );
              })}

              {/* Extra pieces added via master piece list */}
              {pieceConfigs.map(cfg => {
                const pc = PIECE_COLORS[cfg.pieceName] ?? { bg: "rgba(76,175,80,0.08)", color: "#2E7D32" };
                return (
                  <div key={cfg.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.2rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "0.4rem", background: pc.bg, color: pc.color, border: `1px dashed ${pc.color}60`, display: "inline-block" }}>
                        {cfg.pieceName}
                      </span>
                      {cfg.notes && <span style={{ display: "block", fontSize: "0.65rem", color: "#9CA3AF", paddingLeft: "0.25rem", marginTop: "0.1rem" }}>{cfg.notes}</span>}
                    </div>
                    <button
                      onClick={() => handleRemovePiece(cfg.id)}
                      disabled={removingId === cfg.id}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#D1D5DB", padding: "0.15rem", display: "flex", alignItems: "center", marginTop: "0.1rem" }}>
                      {removingId === cfg.id
                        ? <Loader2 style={{ width: "0.65rem", height: "0.65rem" }} className="animate-spin" />
                        : <X style={{ width: "0.65rem", height: "0.65rem" }} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Registrations ── */}
          <section>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9CA3AF", marginBottom: "0.75rem" }}>
              Registrations ({registrations.length})
            </h3>
            {costumeRegistrations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF", fontSize: "0.875rem", background: "#F9FAFB", borderRadius: "0.75rem", border: "1px solid #F3F4F6" }}>
                No registrations yet for this costume type
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {costumeRegistrations.map(reg => <RegistrationRow key={reg.id} reg={reg} />)}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Costume card ─────────────────────────────────────────────────────────────
function CostumeCard({ costumeType, count, index, onViewDetails, stylePhotoURL, onUploadStylePhoto }: {
  costumeType: CostumeType;
  count: number;
  index: number;
  stylePhotoURL?: string;
  onUploadStylePhoto: () => void;
  onViewDetails: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const pieces = COSTUME_BREAKDOWN[costumeType];
  const accent = CARD_ACCENT[index % CARD_ACCENT.length];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
      {/* Accent bar */}
      <div style={{ height: "4px", background: accent }} />
      <div style={{ padding: "1rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E2029", margin: 0 }}>{CostumeTypeLabels[costumeType]}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
              <Users style={{ width: "0.8rem", height: "0.8rem", color: "#9CA3AF" }} />
              <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>{count} registered</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px",
              background: count > 0 ? "rgba(76,175,80,0.1)" : "rgba(107,114,128,0.08)",
              color: count > 0 ? "#2E7D32" : "#6B7280",
              border: `1px solid ${count > 0 ? "rgba(76,175,80,0.25)" : "rgba(107,114,128,0.2)"}`,
            }}>
              {count > 0 ? "Active" : "Empty"}
            </span>
            <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.1rem", display: "flex" }}>
              {expanded ? <ChevronUp style={{ width: "1rem", height: "1rem" }} /> : <ChevronDown style={{ width: "1rem", height: "1rem" }} />}
            </button>
          </div>
        </div>

        {expanded && (
          <>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.5rem" }}>
              {pieces.length} Pieces
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.875rem" }}>
              {pieces.map(p => {
                const pc = PIECE_COLORS[p.piece] ?? { bg: "rgba(107,114,128,0.08)", color: "#374151" };
                return (
                  <div key={p.piece + (p.notes ?? "")}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "0.4rem", background: pc.bg, color: pc.color, display: "inline-block" }}>
                      {p.piece}
                    </span>
                    {p.notes && <span style={{ display: "block", fontSize: "0.65rem", color: "#9CA3AF", paddingLeft: "0.3rem", marginTop: "0.1rem" }}>{p.notes}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ marginBottom: "0.875rem" }}>
          <div style={{ aspectRatio: "1 / 1", width: "100%", overflow: "hidden", borderRadius: "0.85rem", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {stylePhotoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stylePhotoURL} alt={`${CostumeTypeLabels[costumeType]} style`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.35rem", color: "#9CA3AF" }}>
                <ImageIcon style={{ width: "1.4rem", height: "1.4rem" }} />
                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>No style photo</span>
                <span style={{ fontSize: "0.72rem" }}>Add a costume image</span>
              </div>
            )}
          </div>
          <button type="button" onClick={onUploadStylePhoto}
            style={{ marginTop: "0.85rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.7rem 0.85rem", borderRadius: "0.75rem", border: "1px solid #E5E7EB", background: "#FFFFFF", color: "#1D4ED8", fontWeight: 700, cursor: "pointer" }}>
            <Upload style={{ width: "0.85rem", height: "0.85rem" }} />
            {stylePhotoURL ? "Replace photo" : "Upload photo"}
          </button>
        </div>

        {/* View details button */}
        <button
          onClick={onViewDetails}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 600, padding: "0.5rem", borderRadius: "0.625rem", border: `1px solid ${accent}30`, background: `${accent}08`, color: accent, cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = `${accent}14`)}
          onMouseLeave={e => (e.currentTarget.style.background = `${accent}08`)}>
          View registrations & manage pieces
          <ChevronRight style={{ width: "0.85rem", height: "0.85rem" }} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Asset Hub Folder definitions ─────────────────────────────────────────────
const ASSET_FOLDERS: { key: string; label: string; color: string; emoji: string }[] = [
  { key: "instagram",         label: "Instagram",          color: "#E1306C", emoji: "📸" },
  { key: "website",           label: "Website",            color: "#1A73E8", emoji: "🌐" },
  { key: "binder",            label: "Binder",             color: "#FF6B35", emoji: "📁" },
  { key: "models_photoshoot", label: "Models Photoshoot",  color: "#673AB7", emoji: "💃" },
  { key: "email_templates",   label: "Email Templates",    color: "#00BCD4", emoji: "✉️" },
  { key: "costume_templates", label: "Costume Templates",  color: "#FF006E", emoji: "👗" },
  { key: "miscellaneous",     label: "Miscellaneous",      color: "#6B7280", emoji: "📎" },
];

function isImage(url: string, name: string) {
  return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(name) || url.includes("token=");
}

function AssetHub({ seasonId, assets, uploading, uploadPct, error, uploadingCategory, onStartUpload, onDelete, onRename, deletingId }: {
  seasonId: string;
  assets: SeasonAsset[];
  uploading: boolean;
  uploadPct: number;
  error: string | null;
  uploadingCategory: string | null;
  onStartUpload: (cat: string) => void;
  onDelete: (id: string, url?: string) => void;
  onRename: (id: string, title: string) => void;
  deletingId: string | null;
}) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function toggleFolder(key: string) {
    setOpenFolders(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function startRename(asset: SeasonAsset) {
    setRenamingId(asset.id);
    setRenameValue(asset.title);
  }

  function commitRename(id: string) {
    if (renameValue.trim()) onRename(id, renameValue.trim());
    setRenamingId(null);
  }

  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Season Asset Hub</h2>
          <p style={{ fontSize: "0.82rem", color: "#6B7280", margin: "0.2rem 0 0" }}>
            All your {seasonId} season files — photos, templates, marketing materials
          </p>
        </div>
        {uploading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1A73E8", fontSize: "0.82rem", fontWeight: 600 }}>
            <Loader2 style={{ width: "0.9rem", height: "0.9rem" }} className="animate-spin" />
            Uploading {uploadPct}%
          </div>
        )}
        {error && <p style={{ fontSize: "0.82rem", color: "#DC2626", margin: 0 }}>{error}</p>}
      </div>

      {/* Folder list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {ASSET_FOLDERS.map(folder => {
          const folderAssets = assets.filter(a => a.category === folder.key);
          const isOpen = !!openFolders[folder.key];
          const isUploading = uploadingCategory === folder.key && uploading;
          return (
            <div key={folder.key} style={{ border: "1px solid #E5E7EB", borderRadius: "0.875rem", overflow: "hidden" }}>
              {/* Folder header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: isOpen ? "#F9FAFB" : "#FFFFFF", cursor: "pointer" }}
                onClick={() => toggleFolder(folder.key)}>
                <span style={{ fontSize: "1.2rem" }}>{folder.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1E2029", margin: 0 }}>{folder.label}</p>
                  <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{folderAssets.length} file{folderAssets.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onStartUpload(folder.key); }}
                  disabled={isUploading}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, padding: "0.35rem 0.75rem", borderRadius: "0.5rem", border: `1.5px solid ${folder.color}30`, background: `${folder.color}08`, color: folder.color, cursor: "pointer", flexShrink: 0 }}>
                  {isUploading ? <Loader2 style={{ width: "0.75rem", height: "0.75rem" }} className="animate-spin" /> : <Upload style={{ width: "0.75rem", height: "0.75rem" }} />}
                  Upload
                </button>
                {isOpen
                  ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "#9CA3AF", flexShrink: 0 }} />
                  : <ChevronDown style={{ width: "1rem", height: "1rem", color: "#9CA3AF", flexShrink: 0 }} />
                }
              </div>

              {/* Folder contents — 1:1 grid */}
              {isOpen && (
                <div style={{ padding: "0.75rem", borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                  {folderAssets.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => onStartUpload(folder.key)}
                      style={{ width: "100%", padding: "2rem", border: "2px dashed #E5E7EB", borderRadius: "0.75rem", background: "#FFFFFF", color: "#9CA3AF", fontSize: "0.875rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <Upload style={{ width: "1.5rem", height: "1.5rem" }} />
                      No files yet — click to upload
                    </button>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.6rem" }}>
                      {folderAssets.map(asset => {
                        const img = isImage(asset.fileURL, asset.fileName);
                        return (
                          <div key={asset.id} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "0.75rem", overflow: "hidden" }}>
                            {/* 1:1 preview */}
                            <a href={asset.fileURL} target="_blank" rel="noopener noreferrer"
                              style={{ display: "block", aspectRatio: "1 / 1", position: "relative", background: "#F3F4F6", overflow: "hidden" }}>
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={asset.fileURL} alt={asset.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                                  <FileText style={{ width: "2rem", height: "2rem", color: folder.color }} />
                                  <span style={{ fontSize: "0.6rem", color: "#9CA3AF", padding: "0 0.5rem", textAlign: "center" }}>
                                    {asset.fileName.split(".").pop()?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </a>
                            {/* Name + actions */}
                            <div style={{ padding: "0.4rem 0.5rem" }}>
                              {renamingId === asset.id ? (
                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                  <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") commitRename(asset.id); if (e.key === "Escape") setRenamingId(null); }}
                                    style={{ flex: 1, fontSize: "0.7rem", padding: "0.2rem 0.35rem", border: "1.5px solid #1A73E8", borderRadius: "0.35rem", outline: "none", minWidth: 0 }}
                                  />
                                  <button type="button" onClick={() => commitRename(asset.id)}
                                    style={{ background: "#1A73E8", border: "none", borderRadius: "0.35rem", cursor: "pointer", padding: "0.2rem 0.35rem", color: "#fff", display: "flex" }}>
                                    <Check style={{ width: "0.65rem", height: "0.65rem" }} />
                                  </button>
                                </div>
                              ) : (
                                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {asset.title}
                                </p>
                              )}
                              <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", marginTop: "0.25rem" }}>
                                <button type="button" title="Rename" onClick={() => startRename(asset)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.1rem", display: "flex" }}>
                                  <Pencil style={{ width: "0.65rem", height: "0.65rem" }} />
                                </button>
                                <a href={asset.fileURL} target="_blank" rel="noopener noreferrer" title="Open/Download"
                                  style={{ color: "#9CA3AF", display: "flex", padding: "0.1rem" }}>
                                  <Download style={{ width: "0.65rem", height: "0.65rem" }} />
                                </a>
                                <button type="button" title="Delete" onClick={() => onDelete(asset.id, asset.fileURL)}
                                  disabled={deletingId === asset.id}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.1rem", display: "flex", marginLeft: "auto" }}>
                                  {deletingId === asset.id
                                    ? <Loader2 style={{ width: "0.65rem", height: "0.65rem" }} className="animate-spin" />
                                    : <X style={{ width: "0.65rem", height: "0.65rem" }} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SeasonsPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("2026");
  const [detailType, setDetailType] = useState<CostumeType | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [assets, setAssets] = useState<SeasonAsset[]>([]);
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<SeasonAssetCategory | null>(null);
  const [stylePhotoCostumeType, setStylePhotoCostumeType] = useState<CostumeType | null>(null);
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetUploadPct, setAssetUploadPct] = useState(0);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    seedRegistrations()
      .catch(() => {})
      .then(() => getRegistrations(selectedSeason))
      .then(data => { if (!cancelled) setRegistrations(data); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [selectedSeason]);

  useEffect(() => {
    let cancelled = false;
    setAssets([]);

    getSeasonAssets(selectedSeason)
      .then(data => { if (!cancelled) setAssets(data); })
      .catch(console.error);

    return () => { cancelled = true; };
  }, [selectedSeason]);

  const stylePhotoMap = assets.reduce<Record<CostumeType, SeasonAsset>>((acc, asset) => {
    if (asset.category === "costume_style_photo" && asset.costumeType) {
      acc[asset.costumeType] = asset;
    }
    return acc;
  }, {} as Record<CostumeType, SeasonAsset>);

  const totalRegistrations = registrations.length;
  const activeTypes = COSTUME_ORDER.filter(c => registrations.some(r => r.costumeType === c)).length;

  function startAssetUpload(category: string, costumeType?: CostumeType) {
    setAssetError(null);
    setSelectedAssetCategory(category as SeasonAssetCategory);
    setStylePhotoCostumeType(costumeType ?? null);
    fileInputRef.current?.click();
  }

  async function handleSeasonAssetSelected(file?: File) {
    if (!selectedAssetCategory || !file || !selectedSeason) return;

    setAssetUploading(true);
    setAssetUploadPct(0);
    setAssetError(null);

    try {
      const fileURL = await uploadSeasonAsset(selectedSeason, selectedAssetCategory, file, setAssetUploadPct);
      const assetPayload: Omit<SeasonAsset, "id" | "createdAt" | "updatedAt"> = {
        seasonId: selectedSeason,
        category: selectedAssetCategory,
        title: file.name,
        fileName: file.name,
        fileURL,
      };
      if (selectedAssetCategory === "costume_style_photo" && stylePhotoCostumeType) {
        assetPayload.costumeType = stylePhotoCostumeType;
      }
      const asset = await createSeasonAsset(assetPayload);
      setAssets(prev => [asset, ...prev]);
    } catch (error) {
      console.error(error);
      setAssetError("Upload failed. Please try again.");
    } finally {
      setAssetUploading(false);
      setSelectedAssetCategory(null);
      setStylePhotoCostumeType(null);
      setAssetUploadPct(0);
    }
  }

  async function handleDeleteAsset(id: string, fileURL?: string) {
    setDeletingAssetId(id);
    try {
      await deleteSeasonAsset(id, fileURL);
      setAssets(prev => prev.filter(asset => asset.id !== id));
    } catch (error) {
      console.error(error);
      setAssetError("Unable to delete asset. Please try again.");
    } finally {
      setDeletingAssetId(null);
    }
  }

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
            style={{ appearance: "none", background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "0.75rem", padding: "0.5rem 2.5rem 0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#1E2029", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
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
                <CostumeCard
                  key={costumeType}
                  costumeType={costumeType}
                  count={registrations.filter(r => r.costumeType === costumeType).length}
                  index={i}
                  stylePhotoURL={stylePhotoMap[costumeType]?.fileURL}
                  onUploadStylePhoto={() => startAssetUpload("costume_style_photo", costumeType)}
                  onViewDetails={() => setDetailType(costumeType)}
                />
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
                    {"color" in a && a.color && <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: "0.15rem 0 0" }}>{a.color}</p>}
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

      {/* ── Asset Hub ───────────────────────────────────────────────────── */}
      <AssetHub
        seasonId={selectedSeason}
        assets={assets.filter(a => a.category !== "costume_style_photo")}
        uploading={assetUploading}
        uploadPct={assetUploadPct}
        error={assetError}
        uploadingCategory={selectedAssetCategory}
        onStartUpload={startAssetUpload}
        onDelete={handleDeleteAsset}
        onRename={(id, title) => {
          renameSeasonAsset(id, title).then(() =>
            setAssets(prev => prev.map(a => a.id === id ? { ...a, title } : a))
          ).catch(console.error);
        }}
        deletingId={deletingAssetId}
      />

      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleSeasonAssetSelected(file);
          e.target.value = "";
        }}
      />

      {/* Costume detail dialog */}
      <CostumeDetailDialog
        costumeType={detailType}
        season={selectedSeason}
        registrations={registrations}
        open={!!detailType}
        onClose={() => setDetailType(null)}
      />
    </div>
  );
}
