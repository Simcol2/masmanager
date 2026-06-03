"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Upload, ImageIcon, Loader2, X, Check,
  Sparkles, Package, ChevronDown, ChevronUp, Gem, Search, Hammer,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAppliques, createApplique, updateApplique, deleteApplique, getAppliqueUsagesByApplique, upsertAppliqueUsage, deleteAppliqueUsage } from "@/lib/services/appliques";
import { getMasterPieces } from "@/lib/services/pieces";
import { getGemSupplies } from "@/lib/services/gems";
import { uploadFile, deleteFileByURL } from "@/lib/services/storage";
import type { Applique, AppliqueUsage, AppliqueIngredient, MasterPiece, CostumeType, GemSupply } from "@/types";
import { CostumeTypeLabels } from "@/types";

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.875rem",
  border: "1.5px solid #E5E7EB", borderRadius: "0.625rem",
  background: "#FFFFFF", color: "#1E2029", outline: "none",
};

// ── Photo uploader ────────────────────────────────────────────────────────────
function PhotoUploader({ currentURL, uploading, uploadPct, onFileSelected, onRemove }: {
  currentURL?: string; uploading: boolean; uploadPct: number;
  onFileSelected: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      style={{
        position: "relative", width: "7rem", height: "7rem", flexShrink: 0,
        border: `2px dashed ${currentURL ? "#FF006E" : "#D1D5DB"}`,
        borderRadius: "0.75rem", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: currentURL ? "default" : "pointer",
        background: "#F9FAFB",
      }}
      onClick={() => !currentURL && ref.current?.click()}>
      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem", color: "#FF006E" }} className="animate-spin" />
          <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>{uploadPct}%</span>
        </div>
      ) : currentURL ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.6rem" }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "0.6rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
            background: "rgba(255,255,255,0.9)", opacity: 0, transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}>
            <button type="button" onClick={e => { e.stopPropagation(); ref.current?.click(); }}
              style={{ background: "#F3F4F6", border: "none", borderRadius: "0.5rem", padding: "0.35rem", cursor: "pointer" }}>
              <Upload style={{ width: "0.875rem", height: "0.875rem", color: "#374151" }} />
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
              style={{ background: "#FEE2E2", border: "none", borderRadius: "0.5rem", padding: "0.35rem", cursor: "pointer" }}>
              <X style={{ width: "0.875rem", height: "0.875rem", color: "#DC2626" }} />
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", color: "#9CA3AF" }}>
          <ImageIcon style={{ width: "1.5rem", height: "1.5rem" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 500 }}>Photo</span>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Ingredient row inside the form ────────────────────────────────────────────
function IngredientRow({ ingredient, gemSupplies, onChange, onRemove }: {
  ingredient: AppliqueIngredient;
  gemSupplies: GemSupply[];
  onChange: (updated: AppliqueIngredient) => void;
  onRemove: () => void;
}) {
  const gem = gemSupplies.find(g => g.id === ingredient.gemSupplyId);

  function handleQtyChange(qty: number) {
    const q = Math.max(0.001, qty);
    onChange({ ...ingredient, quantity: q, lineCost: +(ingredient.unitCost * q).toFixed(4) });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(255,0,110,0.04)", border: "1px solid rgba(255,0,110,0.12)" }}>
      {gem?.photoURL && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={gem.photoURL} alt="" style={{ width: "2rem", height: "2rem", borderRadius: "0.375rem", objectFit: "cover", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1E2029", margin: 0 }} className="truncate">{ingredient.gemSupplyName}</p>
        <p style={{ fontSize: "0.72rem", color: "#6B7280", margin: 0 }}>${ingredient.unitCost.toFixed(4)} / ea</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
        <label style={{ fontSize: "0.72rem", color: "#6B7280" }}>Qty:</label>
        <input type="number" min="0.001" step="0.001" value={ingredient.quantity}
          onChange={e => handleQtyChange(parseFloat(e.target.value) || 0)}
          style={{ width: "4rem", padding: "0.25rem 0.4rem", border: "1.5px solid #E5E7EB", borderRadius: "0.4rem", fontSize: "0.8rem", color: "#1E2029", background: "#FFFFFF", outline: "none" }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#D97706", flexShrink: 0 }}>${ingredient.lineCost.toFixed(2)}</span>
      <button type="button" onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.2rem", flexShrink: 0 }}>
        <X style={{ width: "0.75rem", height: "0.75rem" }} />
      </button>
    </div>
  );
}

// ── Add ingredient picker ─────────────────────────────────────────────────────
function AddIngredientRow({ gemSupplies, existingIds, onAdd }: {
  gemSupplies: GemSupply[];
  existingIds: string[];
  onAdd: (ingredient: AppliqueIngredient) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(1);
  const available = gemSupplies.filter(g => !existingIds.includes(g.id));
  const selected = gemSupplies.find(g => g.id === selectedId);

  function handleAdd() {
    if (!selected) return;
    const unitCost = getGemSupplyUnitCost(selected);
    onAdd({
      gemSupplyId: selected.id,
      gemSupplyName: `${selected.name}${selected.availableColours?.length ? ` (${selected.availableColours[0]})` : ""}`,
      quantity: qty,
      unitCost,
      lineCost: +(unitCost * qty).toFixed(4),
    });
    setSelectedId(""); setQty(1);
  }

  if (available.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #F3F4F6" }}>
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger style={{ flex: 1, height: "2rem", fontSize: "0.875rem", border: "1.5px solid #E5E7EB", borderRadius: "0.5rem", background: "#FFFFFF", color: "#1E2029" }}>
          <SelectValue placeholder="Add a gem or supply…" />
        </SelectTrigger>
        <SelectContent>
          {available.map(g => (
            <SelectItem key={g.id} value={g.id}>
              {g.itemNumber} - {g.name}{g.availableColours?.length ? ` (${g.availableColours[0]})` : ""} - ${getGemSupplyUnitCost(g).toFixed(4)}/ea
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="number" min="0.001" step="1" value={qty}
        onChange={e => setQty(parseFloat(e.target.value) || 1)}
        placeholder="Qty"
        style={{ width: "4rem", height: "2rem", padding: "0 0.4rem", border: "1.5px solid #E5E7EB", borderRadius: "0.5rem", fontSize: "0.875rem", color: "#1E2029", background: "#FFFFFF", outline: "none" }} />
      {selected && <span style={{ fontSize: "0.72rem", whiteSpace: "nowrap", color: "#6B7280" }}>${(selected.unitCost * qty).toFixed(2)}</span>}
      <button type="button" disabled={!selectedId} onClick={handleAdd}
        style={{ height: "2rem", padding: "0 0.75rem", borderRadius: "0.5rem", border: "none", background: "#1A73E8", color: "#fff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, opacity: !selectedId ? 0.5 : 1 }}>
        <Plus style={{ width: "0.875rem", height: "0.875rem" }} /> Add
      </button>
    </div>
  );
}

// ── Usage assignment section ──────────────────────────────────────────────────
function UsageSection({ appliqueId, appliqueName, appliqueItemNumber, masterPieces, existingUsages, pendingUsages, removedIds, onAddPending, onRemovePending, onRemoveExisting }: {
  appliqueId: string; appliqueName: string; appliqueItemNumber: string;
  masterPieces: MasterPiece[];
  existingUsages: AppliqueUsage[];
  pendingUsages: Omit<AppliqueUsage, "id" | "createdAt" | "updatedAt">[];
  removedIds: string[];
  onAddPending: (u: Omit<AppliqueUsage, "id" | "createdAt" | "updatedAt">) => void;
  onRemovePending: (idx: number) => void;
  onRemoveExisting: (id: string) => void;
}) {
  const SEASON_ID = "2026";
  const [costumeType, setCostumeType] = useState<string>("");
  const [masterPieceId, setMasterPieceId] = useState("");
  const [qty, setQty] = useState(1);
  const selectedPiece = masterPieces.find(p => p.id === masterPieceId);

  return (
    <div style={{ padding: "0.75rem", borderRadius: "0.75rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Package style={{ width: "0.875rem", height: "0.875rem", color: "#00BCD4" }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>Used On Pieces</span>
        <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>
          ({existingUsages.filter(u => !removedIds.includes(u.id)).length + pendingUsages.length})
        </span>
      </div>

      {existingUsages.filter(u => !removedIds.includes(u.id)).map(u => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.1)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "0.875rem", color: "#1E2029" }}>{u.pieceName}</span>
            <span style={{ margin: "0 0.375rem", color: "#9CA3AF" }}>·</span>
            <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{CostumeTypeLabels[u.costumeType]}</span>
          </div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#D97706", flexShrink: 0 }}>{u.quantityPerCostume}×</span>
          <button type="button" onClick={() => onRemoveExisting(u.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.15rem" }}>
            <X style={{ width: "0.75rem", height: "0.75rem" }} />
          </button>
        </div>
      ))}

      {pendingUsages.map((u, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "0.875rem", color: "#1E2029" }}>{u.pieceName}</span>
            <span style={{ margin: "0 0.375rem", color: "#9CA3AF" }}>·</span>
            <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{CostumeTypeLabels[u.costumeType]}</span>
            <span style={{ fontSize: "0.72rem", color: "#9CA3AF", marginLeft: "0.375rem" }}>unsaved</span>
          </div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#D97706" }}>{u.quantityPerCostume}×</span>
          <button type="button" onClick={() => onRemovePending(i)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.15rem" }}>
            <X style={{ width: "0.75rem", height: "0.75rem" }} />
          </button>
        </div>
      ))}

      {/* Add usage row */}
      {masterPieces.length > 0 && (
        <div style={{ paddingTop: "0.5rem", borderTop: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="usage-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <Select value={costumeType} onValueChange={setCostumeType}>
              <SelectTrigger style={{ height: "2rem", fontSize: "0.875rem", border: "1.5px solid #E5E7EB", borderRadius: "0.5rem", background: "#FFFFFF", color: "#1E2029" }}>
                <SelectValue placeholder="Costume type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CostumeTypeLabels) as [CostumeType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={masterPieceId} onValueChange={setMasterPieceId}>
              <SelectTrigger style={{ height: "2rem", fontSize: "0.875rem", border: "1.5px solid #E5E7EB", borderRadius: "0.5rem", background: "#FFFFFF", color: "#1E2029" }}>
                <SelectValue placeholder="Piece" />
              </SelectTrigger>
              <SelectContent>
                {masterPieces.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.72rem", whiteSpace: "nowrap", color: "#6B7280" }}>Qty per costume:</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: "4rem", height: "1.75rem", padding: "0 0.4rem", border: "1.5px solid #E5E7EB", borderRadius: "0.4rem", fontSize: "0.875rem", color: "#1E2029", background: "#FFFFFF", outline: "none" }} />
            <button type="button"
              disabled={!costumeType || !masterPieceId}
              style={{ height: "1.75rem", padding: "0 0.75rem", marginLeft: "auto", borderRadius: "0.5rem", border: "none", background: "#1A73E8", color: "#fff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", opacity: (!costumeType || !masterPieceId) ? 0.5 : 1 }}
              onClick={() => {
                if (!costumeType || !selectedPiece) return;
                onAddPending({ seasonId: SEASON_ID, appliqueId, appliqueName, appliqueItemNumber, masterPieceId, pieceName: selectedPiece.name, costumeType: costumeType as CostumeType, quantityPerCostume: qty, costPerCostume: 0 });
                setCostumeType(""); setMasterPieceId(""); setQty(1);
              }}>
              <Plus style={{ width: "0.75rem", height: "0.75rem" }} /> Assign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main form dialog ──────────────────────────────────────────────────────────
function AppliqueFormDialog({ applique, open, onClose, onSaved, masterPieces, gemSupplies }: {
  applique?: Applique; open: boolean; onClose: () => void; onSaved: () => void;
  masterPieces: MasterPiece[]; gemSupplies: GemSupply[];
}) {
  const isEdit = !!applique;
  const [name, setName] = useState(applique?.name ?? "");
  const [notes, setNotes] = useState(applique?.notes ?? "");
  const [photoURL, setPhotoURL] = useState<string | undefined>(applique?.photoURL);
  const [ingredients, setIngredients] = useState<AppliqueIngredient[]>(applique?.ingredients ?? []);
  const [pendingUsages, setPendingUsages] = useState<Omit<AppliqueUsage, "id" | "createdAt" | "updatedAt">[]>([]);
  const [existingUsages, setExistingUsages] = useState<AppliqueUsage[]>([]);
  const [removedUsageIds, setRemovedUsageIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const tempId = useRef(`temp_${Date.now()}`);

  const totalCost = ingredients.reduce((s, i) => s + i.lineCost, 0);

  useEffect(() => {
    if (!open) return;
    setName(applique?.name ?? ""); setNotes(applique?.notes ?? "");
    setPhotoURL(applique?.photoURL);
    setIngredients(applique?.ingredients ?? []);
    setPendingUsages([]); setRemovedUsageIds([]); setError("");
    if (isEdit && applique) {
      getAppliqueUsagesByApplique(applique.id).then(setExistingUsages).catch(() => {});
    } else { setExistingUsages([]); }
  }, [open, applique, isEdit]);

  async function handlePhoto(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB"); return; }
    setUploading(true); setUploadPct(0);
    try {
      const id = applique?.id ?? tempId.current;
      const ext = file.name.split(".").pop() ?? "jpg";
      setPhotoURL(await uploadFile(`appliques/${id}/photo.${ext}`, file, setUploadPct));
    } catch { setError("Upload failed."); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = { name: name.trim(), photoURL, ingredients, totalCost, notes: notes || undefined };
      let savedId: string;
      if (isEdit && applique) { await updateApplique(applique.id, payload); savedId = applique.id; }
      else { const c = await createApplique(payload); savedId = c.id; }
      await Promise.all([
        ...removedUsageIds.map(id => deleteAppliqueUsage(id)),
        ...pendingUsages.map(u => upsertAppliqueUsage({ ...u, appliqueId: savedId })),
      ]);
      onSaved(); onClose();
    } catch { setError("Failed to save."); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "32rem", maxHeight: "90vh",
        overflow: "hidden", background: "#FFFFFF", border: "1px solid #E5E7EB",
        borderRadius: "1rem", padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        outline: "none", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem 1rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: 0 }} className="font-display">
            {isEdit ? `Edit - ${applique?.itemNumber}` : "New Applique"}
          </h2>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Photo + Name */}
            <div className="photo-name-row">
              <PhotoUploader currentURL={photoURL} uploading={uploading} uploadPct={uploadPct}
                onFileSelected={handlePhoto}
                onRemove={async () => { if (photoURL) { await deleteFileByURL(photoURL); setPhotoURL(undefined); } }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Applique Name</label>
                  <input style={inputStyle} placeholder="e.g. Gold Star Cluster" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Notes</label>
                  <input style={inputStyle} placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div style={{ padding: "0.75rem", borderRadius: "0.75rem", background: "rgba(255,214,10,0.04)", border: "1px solid rgba(255,214,10,0.12)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Gem style={{ width: "0.875rem", height: "0.875rem", color: "#D97706" }} />
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280" }}>Gems & Supplies</span>
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#D97706" }}>Total: ${totalCost.toFixed(2)}</span>
              </div>
              {ingredients.map((ing, i) => (
                <IngredientRow key={ing.gemSupplyId} ingredient={ing} gemSupplies={gemSupplies}
                  onChange={updated => setIngredients(prev => prev.map((x, idx) => idx === i ? updated : x))}
                  onRemove={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))} />
              ))}
              {gemSupplies.length === 0 ? (
                <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#9CA3AF", padding: "0.25rem 0", margin: 0 }}>No supply items yet - add them in Gems & Supplies first</p>
              ) : (
                <AddIngredientRow gemSupplies={gemSupplies} existingIds={ingredients.map(i => i.gemSupplyId)}
                  onAdd={ing => setIngredients(prev => [...prev, ing])} />
              )}
            </div>

            {/* Piece usage */}
            <UsageSection
              appliqueId={applique?.id ?? tempId.current}
              appliqueName={name}
              appliqueItemNumber={applique?.itemNumber ?? ""}
              masterPieces={masterPieces}
              existingUsages={existingUsages}
              pendingUsages={pendingUsages}
              removedIds={removedUsageIds}
              onAddPending={u => setPendingUsages(prev => [...prev, u])}
              onRemovePending={i => setPendingUsages(prev => prev.filter((_, idx) => idx !== i))}
              onRemoveExisting={id => setRemovedUsageIds(prev => [...prev, id])}
            />

            {error && <p style={{ fontSize: "0.875rem", color: "#DC2626", margin: 0 }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid #F3F4F6" }}>
              <button type="button" onClick={onClose}
                style={{ padding: "0.55rem 1.25rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFFFFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={saving || uploading}
                style={{ padding: "0.55rem 1.5rem", borderRadius: "0.75rem", border: "none", background: isEdit ? "#1A73E8" : "#FF006E", color: "#FFFFFF", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: (saving || uploading) ? 0.7 : 1 }}>
                {saving ? <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" /> : <Check style={{ width: "0.875rem", height: "0.875rem" }} />}
                {isEdit ? "Save Changes" : "Create Applique"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Applique card ─────────────────────────────────────────────────────────────
function AppliqueCard({ applique, usages, onEdit, onDelete, index }: {
  applique: Applique; usages: AppliqueUsage[];
  onEdit: () => void; onDelete: () => void; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ position: "relative", height: "8rem", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB" }}>
        {applique.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={applique.photoURL} alt={applique.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", color: "#9CA3AF" }}>
            <Sparkles style={{ width: "1.75rem", height: "1.75rem" }} />
            <span style={{ fontSize: "0.72rem" }}>No photo</span>
          </div>
        )}
      </div>

      <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.25rem" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#9CA3AF", margin: 0 }}>{applique.itemNumber}</p>
            <h3 style={{ fontWeight: 600, color: "#1E2029", fontSize: "0.875rem", lineHeight: 1.3, margin: 0 }}>{applique.name}</h3>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#D97706", margin: 0 }}>${applique.totalCost.toFixed(2)}</p>
            <p style={{ fontSize: "0.6rem", color: "#9CA3AF", margin: 0 }}>to make</p>
          </div>
        </div>

        {/* Edit / Delete actions */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={onEdit}
            style={{ flex: 1, height: "1.75rem", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(26,115,232,0.35)", color: "#1A73E8", background: "rgba(26,115,232,0.06)", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
            <Pencil style={{ width: "0.65rem", height: "0.65rem" }} /> Edit
          </button>
          <button onClick={onDelete}
            style={{ height: "1.75rem", padding: "0 0.55rem", fontSize: "0.72rem", fontWeight: 600, border: "1px solid rgba(220,38,38,0.35)", color: "#DC2626", background: "rgba(220,38,38,0.06)", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 style={{ width: "0.65rem", height: "0.65rem" }} />
          </button>
        </div>

        {applique.ingredients.length > 0 && (
          <p style={{ fontSize: "0.72rem", color: "#6B7280", margin: 0 }}>{applique.ingredients.length} supply item{applique.ingredients.length !== 1 ? "s" : ""}</p>
        )}

        {usages.length > 0 && (
          <div>
            <button onClick={() => setExpanded(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", width: "100%", background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 0 }}>
              <Package style={{ width: "0.75rem", height: "0.75rem" }} />
              <span>{usages.length} piece assignment{usages.length !== 1 ? "s" : ""}</span>
              {expanded ? <ChevronUp style={{ width: "0.75rem", height: "0.75rem", marginLeft: "auto" }} /> : <ChevronDown style={{ width: "0.75rem", height: "0.75rem", marginLeft: "auto" }} />}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                  <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", paddingTop: "0.5rem", borderTop: "1px solid #F3F4F6" }}>
                    {usages.map(u => (
                      <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem" }}>
                        <span style={{ color: "#6B7280" }} className="truncate">{u.pieceName} · {CostumeTypeLabels[u.costumeType]}</span>
                        <span style={{ color: "#D97706", fontWeight: 600, flexShrink: 0, marginLeft: "0.5rem" }}>{u.quantityPerCostume}×</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {usages.length === 0 && <p style={{ fontSize: "0.72rem", fontStyle: "italic", color: "#9CA3AF", margin: 0 }}>Not assigned yet</p>}
      </div>
    </motion.div>
  );
}

// ── Category label map ────────────────────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  all: "All", rhinestone: "Rhinestone", gem: "Gem / Stone", trim: "Trim",
  fabric: "Fabric", feather: "Feather", frame: "Frame", wire: "Wire",
  glue: "Glue", tool: "Tool", hardware: "Hardware", paint: "Paint", other: "Other",
};

// ── Visual Applique Builder ───────────────────────────────────────────────────
function getGemSupplyUnitCost(gem: GemSupply): number {
  if (typeof gem.unitCost === "number" && Number.isFinite(gem.unitCost)) return gem.unitCost;
  if (typeof gem.costQty === "number" && gem.costQty > 0) return gem.costAmount / gem.costQty;
  return 0;
}

function ApliqueBuilderDialog({ open, onClose, onSaved, gemSupplies, applique }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  gemSupplies: GemSupply[]; applique?: Applique;
}) {
  const isEdit = !!applique;
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  const [ingredients, setIngredients] = useState<AppliqueIngredient[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [shapeFilter, setShapeFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const tempId = useRef(`temp_${Date.now()}`);

  const totalCost = ingredients.reduce((s, i) => s + i.lineCost, 0);
  const categories = ["all", ...Array.from(new Set(gemSupplies.map(g => g.category)))];
  const shapes = ["all", ...Array.from(new Set(gemSupplies.map(g => g.shape).filter(Boolean))) as string[]];

  useEffect(() => {
    if (!open) return;
    setName(applique?.name ?? ""); setNotes(applique?.notes ?? "");
    setPhotoURL(applique?.photoURL); setIngredients(applique?.ingredients ?? []);
    setSearch(""); setCatFilter("all"); setShapeFilter("all"); setError("");
  }, [open, applique]);

  const filteredGems = gemSupplies.filter(g => {
    const matchCat = catFilter === "all" || g.category === catFilter;
    const matchShape = shapeFilter === "all" || g.shape === shapeFilter;
    const q = search.toLowerCase();
    return matchCat && matchShape && (!q || g.name.toLowerCase().includes(q) || g.itemNumber.toLowerCase().includes(q) ||
      g.availableColours?.some(c => c.toLowerCase().includes(q)));
  });

  function toggleGem(gemId: string) {
    const gem = gemSupplies.find(g => g.id === gemId);
    if (!gem) return;
    if (ingredients.some(i => i.gemSupplyId === gemId)) {
      setIngredients(prev => prev.filter(i => i.gemSupplyId !== gemId));
    } else {
      const unitCost = getGemSupplyUnitCost(gem);
      setIngredients(prev => [...prev, {
        gemSupplyId: gem.id,
        gemSupplyName: gem.name + (gem.availableColours?.length ? ` (${gem.availableColours[0]})` : ""),
        quantity: 1,
        unitCost,
        lineCost: +unitCost.toFixed(4),
      }]);
    }
  }

  function updateQty(gemId: string, qty: number) {
    const q = Math.max(1, qty);
    setIngredients(prev => prev.map(i =>
      i.gemSupplyId === gemId ? { ...i, quantity: q, lineCost: +(i.unitCost * q).toFixed(4) } : i
    ));
  }

  async function handlePhoto(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB"); return; }
    setUploading(true); setUploadPct(0);
    try {
      const id = applique?.id ?? tempId.current;
      const ext = file.name.split(".").pop() ?? "jpg";
      setPhotoURL(await uploadFile(`appliques/${id}/photo.${ext}`, file, setUploadPct));
    } catch { setError("Upload failed."); } finally { setUploading(false); }
  }

  async function handleSave() {
    if (!name.trim()) { setError("Applique name is required"); return; }
    if (!ingredients.every(i => Number.isFinite(i.unitCost) && Number.isFinite(i.lineCost))) {
      setError("One or more ingredients have invalid unit cost.");
      return;
    }
    setSaving(true); setError("");
    try {
      const payload = { name: name.trim(), notes: notes || undefined, photoURL, ingredients, totalCost };
      if (isEdit && applique) await updateApplique(applique.id, payload);
      else await createApplique(payload);
      onSaved(); onClose();
    } catch (error) {
      console.error("Failed to save applique", error);
      setError("Failed to save.");
    } finally { setSaving(false); }
  }

  const iSt: React.CSSProperties = { width: "100%", padding: "0.45rem 0.7rem", fontSize: "0.8rem", border: "1.5px solid #E5E7EB", borderRadius: "0.6rem", background: "#FFFFFF", color: "#1E2029", outline: "none" };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        onOpenAutoFocus={e => e.preventDefault()}
        style={{ maxWidth: "62rem", width: "calc(100vw - 2rem)", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100dvh - 1rem)" }}
      >
        <style>{`
          .applique-builder-body { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }
          .applique-builder-left { height:42vh; min-height:200px; flex-shrink:0; display:flex; flex-direction:column; border-right:none; min-width:0; border-bottom:1px solid #F3F4F6; }
          .applique-builder-right { flex:1; min-height:0; display:flex; flex-direction:column; background:#FAFAFA; }
          .applique-builder-right .builder-actions { display:flex; flex-direction:column; gap:0.5rem; }
          .applique-builder-bottom-actions { display:flex; flex-direction:column; gap:0.5rem; }
          .usage-grid { display:grid; grid-template-columns:1fr; gap:0.5rem; }
          .photo-name-row { display:flex; flex-direction:column; gap:1rem; align-items:flex-start; }
          @media (min-width: 640px) {
            .photo-name-row { flex-direction:row; align-items:flex-start; }
            .applique-form-photo { width: min(7rem, 100%); height: 7rem; }
          }
          @media (min-width: 900px) {
            .applique-builder-body { flex-direction:row; }
            .applique-builder-left { flex:1 1 0; height:auto; min-height:0; border-right:1px solid #F3F4F6; border-bottom:none; }
            .applique-builder-right { width:19rem; flex:0 0 19rem; }
            .applique-builder-bottom-actions { flex-direction:row; justify-content:flex-end; }
            .applique-builder-right .builder-actions { flex-direction:column; }
          }
        `}</style>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: isEdit ? "rgba(26,115,232,0.1)" : "rgba(255,0,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hammer style={{ width: "1rem", height: "1rem", color: isEdit ? "#1A73E8" : "#FF006E" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>
              {isEdit ? `Edit — ${applique?.itemNumber}` : "Build an Applique"}
            </h2>
            <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>Select gems from your supplies, set quantities — cost calculates automatically</p>
          </div>
          {error && <p style={{ fontSize: "0.78rem", color: "#DC2626", margin: 0 }}>{error}</p>}
        </div>

        {/* Two-panel body */}
        <div className="applique-builder-body">

          {/* LEFT — Gem picker */}
          <div className="applique-builder-left" style={{ flex: "1 1 0", minWidth: 0 }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", width: "0.85rem", height: "0.85rem", color: "#9CA3AF" }} />
                <input placeholder="Search by name, code, colour…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...iSt, paddingLeft: "2rem" }} />
              </div>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {categories.map(cat => (
                  <button key={cat} type="button" onClick={() => setCatFilter(cat)}
                    style={{ fontSize: "0.68rem", fontWeight: catFilter === cat ? 700 : 500, padding: "0.2rem 0.55rem", borderRadius: "999px", cursor: "pointer", border: `1.5px solid ${catFilter === cat ? "#1A73E8" : "#E5E7EB"}`, background: catFilter === cat ? "#1A73E8" : "#FFFFFF", color: catFilter === cat ? "#FFFFFF" : "#6B7280" }}>
                    {CAT_LABELS[cat] ?? cat}
                  </button>
                ))}
              </div>
              {shapes.length > 1 && (
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Shape:</span>
                  {shapes.map(s => (
                    <button key={s} type="button" onClick={() => setShapeFilter(s)}
                      style={{ fontSize: "0.68rem", fontWeight: shapeFilter === s ? 700 : 500, padding: "0.15rem 0.5rem", borderRadius: "999px", cursor: "pointer", border: `1.5px solid ${shapeFilter === s ? "#FF006E" : "#E5E7EB"}`, background: shapeFilter === s ? "#FF006E" : "#FFFFFF", color: shapeFilter === s ? "#FFFFFF" : "#6B7280" }}>
                      {s === "all" ? "Any" : s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.5rem", alignContent: "start" }}>
              {filteredGems.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", paddingTop: "2.5rem", color: "#9CA3AF" }}>
                  <Gem style={{ width: "1.75rem", height: "1.75rem", margin: "0 auto 0.4rem" }} />
                  <p style={{ fontSize: "0.8rem", margin: 0 }}>No gems match</p>
                </div>
              )}
              {filteredGems.map(gem => {
                const added = ingredients.some(i => i.gemSupplyId === gem.id);
                return (
                  <button key={gem.id} type="button" onClick={() => toggleGem(gem.id)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", padding: "0.6rem 0.4rem", borderRadius: "0.75rem", cursor: "pointer", textAlign: "center", border: `2px solid ${added ? "#1A73E8" : "#E5E7EB"}`, background: added ? "rgba(26,115,232,0.06)" : "#FFFFFF", position: "relative" }}>
                    {added && (
                      <div style={{ position: "absolute", top: "0.25rem", right: "0.25rem", width: "1rem", height: "1rem", borderRadius: "50%", background: "#1A73E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check style={{ width: "0.6rem", height: "0.6rem", color: "#fff" }} />
                      </div>
                    )}
                    <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "0.5rem", background: "#F3F4F6", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {gem.photoURL
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={gem.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <Gem style={{ width: "1.1rem", height: "1.1rem", color: "#D1D5DB" }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.65rem", fontWeight: 600, color: "#1E2029", lineHeight: 1.2, margin: 0 }}>{gem.name}</p>
                      <p style={{ fontSize: "0.6rem", color: "#9CA3AF", margin: "0.1rem 0 0" }}>{gem.itemNumber}</p>
                      <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1A73E8", margin: "0.1rem 0 0" }}>${gem.unitCost.toFixed(4)}/ea</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "0.4rem 1rem", borderTop: "1px solid #F3F4F6", fontSize: "0.68rem", color: "#9CA3AF" }}>
              {filteredGems.length} shown · {ingredients.length} in applique
            </div>
          </div>

          {/* RIGHT — Builder panel */}
          <div className="applique-builder-right">
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "0.6rem", flexShrink: 0 }}>
              <div>
                <label style={{ fontSize: "0.73rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.25rem" }}>Applique Name *</label>
                <input style={iSt} placeholder="e.g. Gold Star Cluster" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "0.5rem", flexShrink: 0, border: "2px dashed #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}
                  onClick={() => photoRef.current?.click()}>
                  {uploading ? <Loader2 style={{ width: "1rem", height: "1rem", color: "#1A73E8" }} className="animate-spin" />
                    : photoURL
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <ImageIcon style={{ width: "1rem", height: "1rem", color: "#9CA3AF" }} />}
                </div>
                <div>
                  <button type="button" onClick={() => photoRef.current?.click()} style={{ fontSize: "0.73rem", fontWeight: 600, color: "#1A73E8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {photoURL ? "Change photo" : "Upload photo"}
                  </button>
                  <p style={{ fontSize: "0.65rem", color: "#9CA3AF", margin: "0.1rem 0 0" }}>JPG/PNG up to 5 MB</p>
                </div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ""; }} />
              </div>
              <div>
                <label style={{ fontSize: "0.73rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.25rem" }}>Notes</label>
                <input style={iSt} placeholder="Optional" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0.6rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {ingredients.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "2rem", color: "#9CA3AF" }}>
                  <Sparkles style={{ width: "1.5rem", height: "1.5rem", margin: "0 auto 0.35rem" }} />
                  <p style={{ fontSize: "0.78rem", margin: 0 }}>Click gems on the left to add them</p>
                </div>
              ) : ingredients.map(ing => (
                <div key={ing.gemSupplyId} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.5rem", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "0.6rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1E2029", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ing.gemSupplyName}</p>
                    <p style={{ fontSize: "0.65rem", color: "#9CA3AF", margin: 0 }}>${ing.unitCost}/ea</p>
                  </div>
                  <button type="button" onClick={() => updateQty(ing.gemSupplyId, ing.quantity - 1)} style={{ width: "1.25rem", height: "1.25rem", borderRadius: "0.3rem", border: "1.5px solid #E5E7EB", background: "#F3F4F6", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", flexShrink: 0 }}>−</button>
                  <input type="number" min="1" step="1" value={ing.quantity} onChange={e => updateQty(ing.gemSupplyId, parseInt(e.target.value) || 1)}
                    style={{ width: "2.25rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 700, border: "1.5px solid #E5E7EB", borderRadius: "0.3rem", padding: "0.1rem 0.2rem", color: "#1E2029", outline: "none" }} />
                  <button type="button" onClick={() => updateQty(ing.gemSupplyId, ing.quantity + 1)} style={{ width: "1.25rem", height: "1.25rem", borderRadius: "0.3rem", border: "1.5px solid #E5E7EB", background: "#F3F4F6", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", flexShrink: 0 }}>+</button>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#FF006E", width: "2.25rem", textAlign: "right", flexShrink: 0, margin: 0 }}>${ing.lineCost.toFixed(2)}</p>
                  <button type="button" onClick={() => toggleGem(ing.gemSupplyId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, display: "flex", flexShrink: 0 }}>
                    <X style={{ width: "0.85rem", height: "0.85rem" }} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid #E5E7EB", background: "#FFFFFF", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", margin: 0 }}>Cost per Applique</p>
                  <p style={{ fontSize: "1.75rem", fontWeight: 800, color: ingredients.length > 0 ? "#FF006E" : "#D1D5DB", margin: 0, lineHeight: 1 }}>${totalCost.toFixed(2)}</p>
                  {ingredients.length > 0 && <p style={{ fontSize: "0.65rem", color: "#9CA3AF", margin: "0.1rem 0 0" }}>{ingredients.length} gem{ingredients.length !== 1 ? "s" : ""} · {ingredients.reduce((s, i) => s + i.quantity, 0)} pcs total</p>}
                </div>
              </div>
              <div className="applique-builder-bottom-actions">
                <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.55rem", borderRadius: "0.7rem", border: "1.5px solid #E5E7EB", background: "#FFFFFF", color: "#374151", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving || uploading || !name.trim()}
                  style={{ flex: 1, padding: "0.55rem", borderRadius: "0.7rem", border: "none", background: name.trim() ? (isEdit ? "#1A73E8" : "#FF006E") : "#E5E7EB", color: name.trim() ? "#FFFFFF" : "#9CA3AF", fontWeight: 700, fontSize: "0.8rem", cursor: name.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                  {saving ? <Loader2 style={{ width: "0.8rem", height: "0.8rem" }} className="animate-spin" /> : <Check style={{ width: "0.8rem", height: "0.8rem" }} />}
                  {isEdit ? "Save Changes" : "Save Applique"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AppliquesPage() {
  const [appliques, setAppliques] = useState<Applique[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, AppliqueUsage[]>>({});
  const [masterPieces, setMasterPieces] = useState<MasterPiece[]>([]);
  const [gemSupplies, setGemSupplies] = useState<GemSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderApplique, setBuilderApplique] = useState<Applique | undefined>();
  const [editApplique, setEditApplique] = useState<Applique | undefined>();
  const [deleteApplique_, setDeleteApplique] = useState<Applique | undefined>();
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apls, pieces, gems] = await Promise.all([getAppliques(), getMasterPieces(), getGemSupplies()]);
      setAppliques(apls); setMasterPieces(pieces); setGemSupplies(gems);
      const usageEntries = await Promise.all(apls.map(async a => [a.id, await getAppliqueUsagesByApplique(a.id)] as [string, AppliqueUsage[]]));
      setUsageMap(Object.fromEntries(usageEntries));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0 }} className="font-display">Applique Library</h1>
          <p style={{ color: "#6B7280", marginTop: "0.2rem", fontSize: "0.9rem" }}>
            Build appliques from your gem & supply ingredients - cost rolls up automatically
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={() => setAddOpen(true)}
            style={{ padding: "0.55rem 1rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFFFFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Plus style={{ width: "0.9rem", height: "0.9rem" }} /> Add Purchased
          </button>
          <button onClick={() => { setBuilderApplique(undefined); setBuilderOpen(true); }}
            style={{ padding: "0.55rem 1.25rem", borderRadius: "0.75rem", border: "none", background: "#FF006E", color: "#FFFFFF", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", boxShadow: "0 2px 8px rgba(255,0,110,0.3)" }}>
            <Hammer style={{ width: "0.9rem", height: "0.9rem" }} /> Build Applique
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      {!loading && appliques.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            { label: "Total Appliques", value: appliques.length, color: "#FF006E" },
            { label: "Assigned to Pieces", value: `${appliques.filter(a => (usageMap[a.id]?.length ?? 0) > 0).length}/${appliques.length}`, color: "#00BCD4" },
            { label: "Avg Cost to Make", value: appliques.length ? `$${(appliques.reduce((s, a) => s + a.totalCost, 0) / appliques.length).toFixed(2)}` : "$0.00", color: "#FFD60A" },
          ].map(s => (
            <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.25rem", marginBottom: 0 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
          <Loader2 style={{ width: "2rem", height: "2rem", color: "#FF006E" }} className="animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && appliques.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 1rem", gap: "1rem", textAlign: "center" }}>
          <div style={{ width: "4rem", height: "4rem", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,0,110,0.07)", border: "1px solid rgba(255,0,110,0.15)" }}>
            <Sparkles style={{ width: "2rem", height: "2rem", color: "#FF006E", opacity: 0.5 }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "#1E2029", margin: 0 }}>No appliques yet</p>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem", marginBottom: 0 }}>Add gems & supplies first, then build appliques from them</p>
          </div>
          <button onClick={() => { setBuilderApplique(undefined); setBuilderOpen(true); }} style={{ padding: "0.55rem 1.25rem", borderRadius: "0.75rem", border: "none", background: "#FF006E", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Hammer style={{ width: "0.9rem", height: "0.9rem" }} /> Build Applique
          </button>
        </motion.div>
      )}

      {/* Grid */}
      {!loading && appliques.length > 0 && (
        <>
          <style>{`.appliques-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}@media(min-width:640px){.appliques-grid{grid-template-columns:repeat(3,1fr)}}@media(min-width:768px){.appliques-grid{grid-template-columns:repeat(4,1fr)}}@media(min-width:1024px){.appliques-grid{grid-template-columns:repeat(5,1fr)}}@media(min-width:1280px){.appliques-grid{grid-template-columns:repeat(6,1fr)}}`}</style>
          <div className="appliques-grid">
            {appliques.map((a, i) => (
              <AppliqueCard key={a.id} applique={a} usages={usageMap[a.id] ?? []} index={i}
                onEdit={() => { setBuilderApplique(a); setBuilderOpen(true); }} onDelete={() => setDeleteApplique(a)} />
            ))}
          </div>
        </>
      )}

      {/* Visual builder for building appliques from gems */}
      <ApliqueBuilderDialog open={builderOpen} applique={builderApplique}
        onClose={() => { setBuilderOpen(false); setBuilderApplique(undefined); }} onSaved={load} gemSupplies={gemSupplies} />
      {/* Simple form for logging pre-purchased appliques */}
      <AppliqueFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} masterPieces={masterPieces} gemSupplies={gemSupplies} />
      <AppliqueFormDialog applique={editApplique} open={!!editApplique} onClose={() => setEditApplique(undefined)} onSaved={load} masterPieces={masterPieces} gemSupplies={gemSupplies} />

      {/* Delete confirm */}
      <Dialog open={!!deleteApplique_} onOpenChange={v => !v && setDeleteApplique(undefined)}>
        <DialogContent style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "24rem",
          background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem",
          padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", outline: "none",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#DC2626", margin: "0 0 0.75rem" }} className="font-display">Delete Applique</h2>
          <p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.25rem" }}>
            Delete <strong>{deleteApplique_?.itemNumber} - {deleteApplique_?.name}</strong>? All usages will be removed.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button onClick={() => setDeleteApplique(undefined)}
              style={{ padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
              Cancel
            </button>
            <button disabled={deleting} onClick={async () => {
              if (!deleteApplique_) return; setDeleting(true);
              try {
                if (deleteApplique_.photoURL) await deleteFileByURL(deleteApplique_.photoURL);
                await deleteApplique(deleteApplique_.id); load(); setDeleteApplique(undefined);
              } finally { setDeleting(false); }
            }} style={{ padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: deleting ? 0.7 : 1 }}>
              {deleting ? <Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" /> : <Trash2 style={{ width: "1rem", height: "1rem" }} />} Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
