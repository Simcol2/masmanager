"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Upload, ImageIcon, Loader2, X, Check,
  Sparkles, Package, ChevronDown, ChevronUp, Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAppliques, createApplique, updateApplique, deleteApplique, getAppliqueUsagesByApplique, upsertAppliqueUsage, deleteAppliqueUsage } from "@/lib/services/appliques";
import { getMasterPieces } from "@/lib/services/pieces";
import { getGemSupplies } from "@/lib/services/gems";
import { uploadFile, deleteFileByURL } from "@/lib/services/storage";
import type { Applique, AppliqueUsage, AppliqueIngredient, MasterPiece, CostumeType, GemSupply } from "@/types";
import { CostumeTypeLabels } from "@/types";

// ── Photo uploader ────────────────────────────────────────────────────────────
function PhotoUploader({ currentURL, uploading, uploadPct, onFileSelected, onRemove }: {
  currentURL?: string; uploading: boolean; uploadPct: number;
  onFileSelected: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative w-28 h-28 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors shrink-0"
      style={{ borderColor: currentURL ? "rgba(255,107,157,0.4)" : "rgba(220,200,210,0.7)" }}
      onClick={() => !currentURL && ref.current?.click()}>
      {uploading ? (
        <div className="flex flex-col items-center gap-1"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#FF6B9D" }} /><span className="text-xs" style={{ color: "#C084A0" }}>{uploadPct}%</span></div>
      ) : currentURL ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentURL} alt="" className="w-full h-full object-cover rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity rounded-lg" style={{ background: "rgba(253,246,241,0.85)" }}>
            <Button type="button" size="icon" variant="ghost" className="w-7 h-7" style={{ color: "#7A6080" }}
              onClick={e => { e.stopPropagation(); ref.current?.click(); }}><Upload className="w-3 h-3" /></Button>
            <Button type="button" size="icon" variant="ghost" className="w-7 h-7" style={{ color: "#DC143C" }}
              onClick={e => { e.stopPropagation(); onRemove(); }}><X className="w-3 h-3" /></Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1" style={{ color: "#C084A0" }}><ImageIcon className="w-6 h-6" /><span className="text-[10px]">Photo</span></div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
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
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(255,107,157,0.05)", border: "1px solid rgba(255,107,157,0.15)" }}>
      {gem?.photoURL && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={gem.photoURL} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{ingredient.gemSupplyName}</p>
        <p className="text-xs" style={{ color: "#C084A0" }}>${ingredient.unitCost.toFixed(3)} / {gem?.unit ?? "pcs"}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <label className="text-xs" style={{ color: "#C084A0" }}>Qty:</label>
        <Input type="number" min="0.001" step="0.001" value={ingredient.quantity}
          onChange={e => handleQtyChange(parseFloat(e.target.value) || 0)}
          className="luxury-input w-16 h-7 text-xs px-2" />
      </div>
      <span className="text-xs font-semibold text-carnival-yellow shrink-0">${ingredient.lineCost.toFixed(2)}</span>
      <Button type="button" size="icon" variant="ghost" className="w-6 h-6 shrink-0" style={{ color: "#C084A0" }} onClick={onRemove}>
        <X className="w-3 h-3" />
      </Button>
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
    onAdd({
      gemSupplyId: selected.id,
      gemSupplyName: `${selected.name}${selected.availableColours?.length ? ` (${selected.availableColours[0]})` : ""}`,
      quantity: qty,
      unitCost: selected.unitCost,
      lineCost: +(selected.unitCost * qty).toFixed(4),
    });
    setSelectedId(""); setQty(1);
  }

  if (available.length === 0) return null;

  return (
    <div className="flex items-center gap-2 pt-2 border-t border-border">
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="luxury-input h-8 text-sm flex-1">
          <SelectValue placeholder="Add a gem or supply…" />
        </SelectTrigger>
        <SelectContent style={{ background: "#0F2540", border: "1px solid rgba(255,255,255,0.15)" }}>
          {available.map(g => (
            <SelectItem key={g.id} value={g.id} style={{ color: "#F0F4FF" }}>
              {g.itemNumber} - {g.name}{g.availableColours?.length ? ` (${g.availableColours[0]})` : ""} - ${g.unitCost}/{g.unit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="number" min="0.001" step="1" value={qty}
        onChange={e => setQty(parseFloat(e.target.value) || 1)}
        className="luxury-input h-8 w-16 text-sm" placeholder="Qty" />
      {selected && <span className="text-xs whitespace-nowrap" style={{ color: "#C084A0" }}>${(selected.unitCost * qty).toFixed(2)}</span>}
      <Button type="button" size="sm" className="gold-btn h-8 px-3 shrink-0" disabled={!selectedId} onClick={handleAdd}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add
      </Button>
    </div>
  );
}

// ── Usage assignment section (which piece + costume type) ─────────────────────
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
    <div className="space-y-2 p-3 rounded-lg" style={{ background: "rgba(0,212,184,0.04)", border: "1px solid rgba(0,212,184,0.12)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Package className="w-3.5 h-3.5 text-carnival-teal" />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#C084A0" }}>Used On Pieces</span>
        <span className="text-xs ml-1" style={{ color: "#C084A0" }}>
          ({existingUsages.filter(u => !removedIds.includes(u.id)).length + pendingUsages.length})
        </span>
      </div>

      {existingUsages.filter(u => !removedIds.includes(u.id)).map(u => (
        <div key={u.id} className="flex items-center gap-3 py-1.5 px-2 rounded-md" style={{ background: "rgba(0,212,184,0.06)", border: "1px solid rgba(0,212,184,0.1)" }}>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-foreground">{u.pieceName}</span>
            <span className="mx-1.5" style={{ color: "#C084A0" }}>·</span>
            <span className="text-xs" style={{ color: "#C084A0" }}>{CostumeTypeLabels[u.costumeType]}</span>
          </div>
          <span className="text-sm font-semibold text-carnival-yellow shrink-0">{u.quantityPerCostume}×</span>
          <Button type="button" size="icon" variant="ghost" className="w-6 h-6" style={{ color: "#C084A0" }} onClick={() => onRemoveExisting(u.id)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}

      {pendingUsages.map((u, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-md" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-foreground">{u.pieceName}</span>
            <span className="mx-1.5" style={{ color: "#C084A0" }}>·</span>
            <span className="text-xs" style={{ color: "#C084A0" }}>{CostumeTypeLabels[u.costumeType]}</span>
            <span className="text-xs ml-1.5" style={{ color: "#C084A0" }}>unsaved</span>
          </div>
          <span className="text-sm font-semibold text-carnival-yellow">{u.quantityPerCostume}×</span>
          <Button type="button" size="icon" variant="ghost" className="w-6 h-6" style={{ color: "#C084A0" }} onClick={() => onRemovePending(i)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}

      {/* Add usage row */}
      {masterPieces.length > 0 && (
        <div className="pt-2 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Select value={costumeType} onValueChange={setCostumeType}>
              <SelectTrigger className="luxury-input h-8 text-sm"><SelectValue placeholder="Costume type" /></SelectTrigger>
              <SelectContent style={{ background: "#0F2540", border: "1px solid rgba(255,255,255,0.15)" }}>
                {(Object.entries(CostumeTypeLabels) as [CostumeType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k} style={{ color: "#F0F4FF" }}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={masterPieceId} onValueChange={setMasterPieceId}>
              <SelectTrigger className="luxury-input h-8 text-sm"><SelectValue placeholder="Piece" /></SelectTrigger>
              <SelectContent style={{ background: "#0F2540", border: "1px solid rgba(255,255,255,0.15)" }}>
                {masterPieces.map(p => <SelectItem key={p.id} value={p.id} style={{ color: "#F0F4FF" }}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs whitespace-nowrap" style={{ color: "#C084A0" }}>Qty per costume:</label>
            <Input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="luxury-input h-7 w-16 text-sm" />
            <Button type="button" size="sm" className="gold-btn h-7 px-3 ml-auto"
              disabled={!costumeType || !masterPieceId}
              onClick={() => {
                if (!costumeType || !selectedPiece) return;
                onAddPending({ seasonId: SEASON_ID, appliqueId, appliqueName, appliqueItemNumber, masterPieceId, pieceName: selectedPiece.name, costumeType: costumeType as CostumeType, quantityPerCostume: qty, costPerCostume: 0 });
                setCostumeType(""); setMasterPieceId(""); setQty(1);
              }}>
              <Plus className="w-3 h-3 mr-1" /> Assign
            </Button>
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
      <DialogContent className="glass-card max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text">
            {isEdit ? `Edit - ${applique?.itemNumber}` : "New Applique"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Photo + Name */}
          <div className="flex gap-4 items-start">
            <PhotoUploader currentURL={photoURL} uploading={uploading} uploadPct={uploadPct}
              onFileSelected={handlePhoto}
              onRemove={async () => { if (photoURL) { await deleteFileByURL(photoURL); setPhotoURL(undefined); } }} />
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Applique Name</label>
                <Input className="luxury-input" placeholder="e.g. Gold Star Cluster" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Input className="luxury-input" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2 p-3 rounded-lg" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.12)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gem className="w-3.5 h-3.5 text-carnival-yellow" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#C084A0" }}>Gems & Supplies</span>
              </div>
              <span className="text-sm font-bold text-carnival-yellow">Total: ${totalCost.toFixed(2)}</span>
            </div>
            {ingredients.map((ing, i) => (
              <IngredientRow key={ing.gemSupplyId} ingredient={ing} gemSupplies={gemSupplies}
                onChange={updated => setIngredients(prev => prev.map((x, idx) => idx === i ? updated : x))}
                onRemove={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))} />
            ))}
            {gemSupplies.length === 0 ? (
              <p className="text-xs italic py-1" style={{ color: "#C084A0" }}>No supply items yet - add them in Gems & Supplies first</p>
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

          {error && <p className="text-sm text-crimson">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-muted-foreground">Cancel</Button>
            <Button type="submit" className="gold-btn" disabled={saving || uploading}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {isEdit ? "Save Changes" : "Create Applique"}
            </Button>
          </div>
        </form>
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
      className="glass-card rounded-lg overflow-hidden"
      style={{ border: "1px solid rgba(220,200,210,0.5)" }}>
      <div className="relative h-32 flex items-center justify-center group" style={{ background: "rgba(245,238,232,0.8)" }}>
        {applique.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={applique.photoURL} alt={applique.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1" style={{ color: "#C084A0" }}><Sparkles className="w-7 h-7" /><span className="text-xs">No photo</span></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(253,246,241,0.85)" }}>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" style={{ borderColor: "rgba(212,175,55,0.4)", color: "#D4AF37" }} onClick={onEdit}>
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" style={{ borderColor: "rgba(220,20,60,0.4)", color: "#DC143C" }} onClick={onDelete}>
            <Trash2 className="w-3 h-3 mr-1" /> Del
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-[10px] font-mono" style={{ color: "#C084A0" }}>{applique.itemNumber}</p>
            <h3 className="font-medium text-foreground text-sm leading-tight">{applique.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-carnival-yellow">${applique.totalCost.toFixed(2)}</p>
            <p className="text-[10px]" style={{ color: "#C084A0" }}>to make</p>
          </div>
        </div>

        {applique.ingredients.length > 0 && (
          <p className="text-xs" style={{ color: "#C084A0" }}>{applique.ingredients.length} supply item{applique.ingredients.length !== 1 ? "s" : ""}</p>
        )}

        {usages.length > 0 && (
          <div>
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs w-full transition-colors" style={{ color: "#C084A0" }}>
              <Package className="w-3 h-3" />
              <span>{usages.length} piece assignment{usages.length !== 1 ? "s" : ""}</span>
              {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-2 space-y-1 pt-2 border-t border-border">
                    {usages.map(u => (
                      <div key={u.id} className="flex items-center justify-between text-xs">
                        <span className="truncate" style={{ color: "#7A6080" }}>{u.pieceName} · {CostumeTypeLabels[u.costumeType]}</span>
                        <span className="text-carnival-yellow font-medium shrink-0 ml-2">{u.quantityPerCostume}×</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {usages.length === 0 && <p className="text-xs italic" style={{ color: "#C084A0" }}>Not assigned yet</p>}
      </div>
    </motion.div>
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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Applique Library</h1>
          <p className="mt-1" style={{ color: "rgba(180,200,240,0.6)" }}>
            Build appliques from your gem & supply ingredients - cost rolls up automatically
          </p>
        </div>
        <Button className="gold-btn" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Applique
        </Button>
      </motion.div>

      {/* Stats */}
      {!loading && appliques.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Appliques", value: appliques.length, color: "text-carnival-pink" },
            { label: "Assigned to Pieces", value: `${appliques.filter(a => (usageMap[a.id]?.length ?? 0) > 0).length}/${appliques.length}`, color: "text-carnival-teal" },
            { label: "Avg Cost to Make", value: appliques.length ? `$${(appliques.reduce((s, a) => s + a.totalCost, 0) / appliques.length).toFixed(2)}` : "$0.00", color: "text-carnival-yellow" },
          ].map(s => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4">
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#C084A0" }}>{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {loading && <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-carnival-pink" /></div>}

      {!loading && appliques.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,107,157,0.07)", border: "1px solid rgba(255,107,157,0.15)" }}>
            <Sparkles className="w-8 h-8 text-carnival-pink opacity-50" />
          </div>
          <div>
            <p className="text-foreground font-medium">No appliques yet</p>
            <p className="text-sm mt-1" style={{ color: "#C084A0" }}>Add gems & supplies first, then build appliques from them</p>
          </div>
          <Button className="gold-btn" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Applique</Button>
        </motion.div>
      )}

      {!loading && appliques.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {appliques.map((a, i) => (
            <AppliqueCard key={a.id} applique={a} usages={usageMap[a.id] ?? []} index={i}
              onEdit={() => setEditApplique(a)} onDelete={() => setDeleteApplique(a)} />
          ))}
        </div>
      )}

      <AppliqueFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} masterPieces={masterPieces} gemSupplies={gemSupplies} />
      <AppliqueFormDialog applique={editApplique} open={!!editApplique} onClose={() => setEditApplique(undefined)} onSaved={load} masterPieces={masterPieces} gemSupplies={gemSupplies} />

      <Dialog open={!!deleteApplique_} onOpenChange={v => !v && setDeleteApplique(undefined)}>
        <DialogContent className="glass-card max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-xl text-crimson">Delete Applique</DialogTitle></DialogHeader>
          <p className="text-foreground text-sm mt-2">Delete <strong className="text-foreground">{deleteApplique_?.itemNumber} - {deleteApplique_?.name}</strong>? All usages will be removed.</p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteApplique(undefined)} className="border-border text-muted-foreground">Cancel</Button>
            <Button disabled={deleting} onClick={async () => {
              if (!deleteApplique_) return; setDeleting(true);
              try {
                if (deleteApplique_.photoURL) await deleteFileByURL(deleteApplique_.photoURL);
                await deleteApplique(deleteApplique_.id); load(); setDeleteApplique(undefined);
              } finally { setDeleting(false); }
            }} className="bg-crimson/10 border border-crimson/40 text-crimson hover:bg-crimson/20">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
