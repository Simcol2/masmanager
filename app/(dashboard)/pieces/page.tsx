"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  ImageIcon,
  Loader2,
  X,
  Check,
  Library,
  Hammer,
  Gem,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMasterPieces,
  createMasterPiece,
  updateMasterPiece,
  deleteMasterPiece,
  seedDefaultPieces,
} from "@/lib/services/pieces";
import { getGemSupplies } from "@/lib/services/gems";
import { getAppliques } from "@/lib/services/appliques";
import { getPieceIngredients, savePieceIngredients } from "@/lib/services/pieceIngredients";
import { uploadMasterPiecePhoto, deleteFileByURL } from "@/lib/services/storage";
import type { MasterPiece, PieceCategory, PieceSizeGroup, GemSupply, Applique, PieceIngredient } from "@/types";
import { BAND_SIZES, TOPS_SIZES, SML_SIZES, NECKLACE_SIZES } from "@/types";

// ── Display helpers ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<PieceCategory, string> = {
  bands:        "Bands",
  tops_bottoms: "Tops & Bottoms",
  skirts_tutus: "Skirts & Tutus",
  accessories:  "Accessories",
  collars:      "Collars",
  backpacks:    "Backpacks",
  headpieces:   "Head Pieces",
  jewelry:      "Jewelry",
  footwear:     "Footwear",
};

const SIZE_GROUP_LABELS: Record<PieceSizeGroup, string> = {
  bands:        "Small / Large",
  tops_bottoms: "Toddler, Youth & Adult",
  sml_only:     "Small / Medium / Large",
  necklace:     "Small / Large",
  none:         "No standard sizing",
};

// Light-theme category badge colours
const CATEGORY_BG: Record<PieceCategory, string> = {
  bands:        "#DBEAFE",
  tops_bottoms: "#EDE9FE",
  skirts_tutus: "#FDF2F8",
  accessories:  "#FEF3C7",
  collars:      "#CCFBF1",
  backpacks:    "#FFEDD5",
  headpieces:   "#FEE2E2",
  jewelry:      "#FEF9C3",
  footwear:     "#F3F4F6",
};
const CATEGORY_COLOR: Record<PieceCategory, string> = {
  bands:        "#1D4ED8",
  tops_bottoms: "#6D28D9",
  skirts_tutus: "#9D174D",
  accessories:  "#92400E",
  collars:      "#0F766E",
  backpacks:    "#9A3412",
  headpieces:   "#991B1B",
  jewelry:      "#854D0E",
  footwear:     "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.875rem",
  border: "1.5px solid #E5E7EB", borderRadius: "0.625rem",
  background: "#FFFFFF", color: "#1E2029", outline: "none",
};

function sizesForGroup(group: PieceSizeGroup): readonly string[] {
  switch (group) {
    case "bands":        return BAND_SIZES;
    case "tops_bottoms": return TOPS_SIZES;
    case "sml_only":     return SML_SIZES;
    case "necklace":     return NECKLACE_SIZES;
    default:             return [];
  }
}

// ── Photo upload sub-component ───────────────────────────────────────────────

function PhotoUploader({
  currentURL,
  uploading,
  uploadPct,
  onFileSelected,
  onRemove,
}: {
  currentURL?: string;
  uploading: boolean;
  uploadPct: number;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Photo</label>
      <div
        style={{
          position: "relative", width: "100%", height: "10rem",
          borderRadius: "0.5rem", border: `2px dashed ${currentURL ? "#1A73E8" : "#D1D5DB"}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: currentURL ? "default" : "pointer", background: "#F9FAFB", transition: "border-color 0.15s",
        }}
        onClick={() => !currentURL && inputRef.current?.click()}
      >
        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "#1A73E8" }} className="animate-spin" />
            <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>{uploadPct}%</span>
          </div>
        ) : currentURL ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentURL} alt="Piece photo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.375rem" }} />
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              background: "rgba(0,0,0,0.5)", borderRadius: "0.375rem", opacity: 0, transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}>
              <button type="button"
                style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", background: "#FFFFFF", color: "#374151", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                <Upload style={{ width: "0.75rem", height: "0.75rem" }} /> Replace
              </button>
              <button type="button"
                style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                onClick={e => { e.stopPropagation(); onRemove(); }}>
                <X style={{ width: "0.75rem", height: "0.75rem" }} /> Remove
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: "#9CA3AF" }}>
            <ImageIcon style={{ width: "2rem", height: "2rem" }} />
            <span style={{ fontSize: "0.72rem" }}>Click to upload photo</span>
            <span style={{ fontSize: "0.7rem", color: "#D1D5DB" }}>JPG, PNG, WEBP · max 5 MB</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

// ── Piece form dialog ────────────────────────────────────────────────────────

type PieceFormProps = {
  piece?: MasterPiece;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function PieceFormDialog({ piece, open, onClose, onSaved }: PieceFormProps) {
  const isEdit = !!piece;
  const [name, setName] = useState(piece?.name ?? "");
  const [category, setCategory] = useState<PieceCategory>(piece?.category ?? "accessories");
  const [sizeGroup, setSizeGroup] = useState<PieceSizeGroup>(piece?.sizeGroup ?? "sml_only");
  const [photoURL, setPhotoURL] = useState<string | undefined>(piece?.photoURL);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const tempId = useRef(`temp_${Date.now()}`);

  useEffect(() => {
    if (open) {
      setName(piece?.name ?? "");
      setCategory(piece?.category ?? "accessories");
      setSizeGroup(piece?.sizeGroup ?? "sml_only");
      setPhotoURL(piece?.photoURL);
      setError("");
    }
  }, [open, piece]);

  async function handlePhotoSelected(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB"); return; }
    setUploading(true); setUploadPct(0); setError("");
    try {
      const id = piece?.id ?? tempId.current;
      const url = await uploadMasterPiecePhoto(id, file, setUploadPct);
      setPhotoURL(url);
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    if (photoURL) {
      await deleteFileByURL(photoURL);
      setPhotoURL(undefined);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      if (isEdit && piece) {
        await updateMasterPiece(piece.id, { name: name.trim(), category, sizeGroup, photoURL });
      } else {
        await createMasterPiece({ name: name.trim(), category, sizeGroup, photoURL, isDefault: false });
      }
      onSaved(); onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "28rem",
        background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem",
        padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", outline: "none",
      }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: "0 0 1.25rem" }} className="font-display">
          {isEdit ? "Edit Piece" : "Add New Piece"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Piece Name</label>
            <input style={inputStyle} placeholder="e.g. Wrist Cuff" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Category</label>
            <Select value={category} onValueChange={v => setCategory(v as PieceCategory)}>
              <SelectTrigger style={{ border: "1.5px solid #E5E7EB", borderRadius: "0.625rem", background: "#FFFFFF", color: "#1E2029", fontSize: "0.875rem" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [PieceCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Group */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Size Group</label>
            <Select value={sizeGroup} onValueChange={v => setSizeGroup(v as PieceSizeGroup)}>
              <SelectTrigger style={{ border: "1.5px solid #E5E7EB", borderRadius: "0.625rem", background: "#FFFFFF", color: "#1E2029", fontSize: "0.875rem" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SIZE_GROUP_LABELS) as [PieceSizeGroup, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sizeGroup !== "none" && (
              <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.2rem" }}>
                Available sizes: {sizesForGroup(sizeGroup).join(" · ")}
              </p>
            )}
          </div>

          {/* Photo */}
          <PhotoUploader
            currentURL={photoURL}
            uploading={uploading}
            uploadPct={uploadPct}
            onFileSelected={handlePhotoSelected}
            onRemove={handleRemovePhoto}
          />

          {error && <p style={{ fontSize: "0.875rem", color: "#DC2626", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid #F3F4F6" }}>
            <button type="button" onClick={onClose}
              style={{ padding: "0.55rem 1.25rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading}
              style={{ padding: "0.55rem 1.5rem", borderRadius: "0.75rem", border: "none", background: "#1A73E8", color: "#FFF", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: (saving || uploading) ? 0.7 : 1 }}>
              {saving ? <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" /> : <Check style={{ width: "0.875rem", height: "0.875rem" }} />}
              {isEdit ? "Save Changes" : "Add Piece"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  piece,
  open,
  onClose,
  onDeleted,
}: {
  piece?: MasterPiece;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!piece) return;
    setDeleting(true);
    try {
      if (piece.photoURL) await deleteFileByURL(piece.photoURL);
      await deleteMasterPiece(piece.id);
      onDeleted();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "24rem",
        background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem",
        padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", outline: "none",
      }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#DC2626", margin: "0 0 0.75rem" }} className="font-display">Remove Piece</h2>
        <p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.25rem" }}>
          Remove <strong>{piece?.name}</strong> from the master library?
          This won&apos;t affect pieces already assigned to past seasons.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button onClick={onClose}
            style={{ padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            style={{ padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? <Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" /> : <Trash2 style={{ width: "1rem", height: "1rem" }} />}
            Remove
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Piece Builder Dialog ──────────────────────────────────────────────────────

type DraftIngredient = {
  type: "supply" | "applique";
  gemSupplyId?: string; gemSupplyName?: string; gemSupplyItemNumber?: string;
  appliqueId?: string; appliqueName?: string; appliqueItemNumber?: string;
  quantity: number; unitCost: number; lineCost: number;
  dimWidth?: number;   // inches
  dimLength?: number;  // inches
};

const LINEAR_UNITS = new Set(["yard", "metre", "feet"]);

function inchesToUnit(inches: number, unit: string): number {
  if (unit === "yard") return +(inches / 36).toFixed(4);
  if (unit === "metre") return +(inches / 39.3701).toFixed(4);
  if (unit === "feet") return +(inches / 12).toFixed(4);
  return inches;
}

function unitLabel(unit: string): string {
  if (unit === "yard") return "yd";
  if (unit === "metre") return "m";
  if (unit === "feet") return "ft";
  return unit;
}

const SUPPLY_CAT_LABELS: Record<string, string> = {
  rhinestone: "Rhinestone", gem: "Gem", trim: "Trim", fabric: "Fabric",
  feather: "Feather", wire: "Wire", elastic: "Elastic", chain: "Chain",
  htv: "HTV", hardware: "Hardware", glue: "Glue", cardstock: "Cardstock",
  tool: "Tool", paint: "Paint", applique_material: "Applique Mat.", other: "Other",
};

function PieceBuilderDialog({
  piece, open, onClose, gemSupplies, appliques,
}: {
  piece: MasterPiece; open: boolean; onClose: () => void;
  gemSupplies: GemSupply[]; appliques: Applique[];
}) {
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [tab, setTab] = useState<"supplies" | "appliques">("supplies");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingWidth, setPendingWidth] = useState<string>("");
  const [pendingLength, setPendingLength] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const existing = await getPieceIngredients(piece.id);
      setIngredients(existing.map(ing => ({
        type: ing.type,
        gemSupplyId: ing.gemSupplyId, gemSupplyName: ing.gemSupplyName, gemSupplyItemNumber: ing.gemSupplyItemNumber,
        appliqueId: ing.appliqueId, appliqueName: ing.appliqueName, appliqueItemNumber: ing.appliqueItemNumber,
        quantity: ing.quantity, unitCost: ing.unitCost, lineCost: ing.lineCost,
      })));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [piece.id]);

  useEffect(() => {
    if (!open) return;
    setTab("supplies"); setCatFilter("all"); setSearch("");
    setPendingId(null); setPendingQty(1); setPendingWidth(""); setPendingLength("");
    setRecipeOpen(true);
    load();
  }, [open, load]);

  function addSupply(supply: GemSupply, qty: number, dimWidth?: number, dimLength?: number) {
    const unitCost = supply.costQty > 0 ? +(supply.costAmount / supply.costQty).toFixed(6) : 0;
    setIngredients(prev => {
      const idx = prev.findIndex(i => i.type === "supply" && i.gemSupplyId === supply.id);
      const entry: DraftIngredient = {
        type: "supply",
        gemSupplyId: supply.id, gemSupplyName: supply.name, gemSupplyItemNumber: supply.itemNumber,
        quantity: qty, unitCost, lineCost: +(unitCost * qty).toFixed(4),
        ...(dimWidth !== undefined ? { dimWidth } : {}),
        ...(dimLength !== undefined ? { dimLength } : {}),
      };
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = entry;
        return updated;
      }
      return [...prev, entry];
    });
    setPendingId(null); setPendingQty(1); setPendingWidth(""); setPendingLength("");
  }

  function addApplique(applique: Applique, qty: number) {
    const unitCost = applique.totalCost;
    setIngredients(prev => {
      const idx = prev.findIndex(i => i.type === "applique" && i.appliqueId === applique.id);
      if (idx >= 0) {
        const updated = [...prev];
        const q = updated[idx].quantity + qty;
        updated[idx] = { ...updated[idx], quantity: q, lineCost: +(unitCost * q).toFixed(4) };
        return updated;
      }
      return [...prev, {
        type: "applique",
        appliqueId: applique.id, appliqueName: applique.name, appliqueItemNumber: applique.itemNumber,
        quantity: qty, unitCost, lineCost: +(unitCost * qty).toFixed(4),
      }];
    });
    setPendingId(null); setPendingQty(1); setPendingWidth(""); setPendingLength("");
  }

  function updateQty(idx: number, qty: number) {
    if (qty <= 0) return;
    setIngredients(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: qty, lineCost: +(updated[idx].unitCost * qty).toFixed(4) };
      return updated;
    });
  }

  function remove(idx: number) {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePieceIngredients(piece.id, piece.name, ingredients);
      onClose();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const totalCost = ingredients.reduce((s, i) => s + i.lineCost, 0);

  const filteredSupplies = gemSupplies.filter(g => {
    if (catFilter !== "all" && g.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.itemNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredAppliques = appliques.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.itemNumber.toLowerCase().includes(q);
  });

  const inRecipeIds = {
    supplies: new Set(ingredients.filter(i => i.type === "supply").map(i => i.gemSupplyId!)),
    appliques: new Set(ingredients.filter(i => i.type === "applique").map(i => i.appliqueId!)),
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 51, width: "calc(100% - 1rem)", maxWidth: "52rem", maxHeight: "92vh",
        overflow: "hidden", background: "#FFFFFF", border: "1px solid #E5E7EB",
        borderRadius: "1rem", padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        outline: "none", display: "flex", flexDirection: "column",
      }}>
        <style>{`
          .pb-layout { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
          @media (min-width: 700px) { .pb-layout { flex-direction: row; } }
          .pb-picker { display: flex; flex-direction: column; overflow: hidden; border-bottom: 1px solid #F3F4F6; }
          @media (min-width: 700px) { .pb-picker { width: 55%; border-bottom: none; border-right: 1px solid #F3F4F6; } }
          .pb-recipe { display: flex; flex-direction: column; overflow: hidden; }
          @media (min-width: 700px) { .pb-recipe { flex: 1; } }
          .pb-supply-list { overflow-y: auto; flex: 1; }
          @media (min-width: 700px) { .pb-supply-list { max-height: none; } }
        `}</style>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem 0.875rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem", background: "linear-gradient(135deg,#FF6B35,#FF006E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Hammer style={{ width: "1.1rem", height: "1.1rem", color: "#fff" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Build {piece.name}</h2>
            <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: 0 }}>Add supplies and appliques to define piece cost</p>
          </div>
          {totalCost > 0 && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span style={{ fontSize: "0.72rem", color: "#9CA3AF", display: "block" }}>Total cost</span>
              <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>${totalCost.toFixed(2)}</span>
            </div>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.25rem", flexShrink: 0 }}>
            <X style={{ width: "1.1rem", height: "1.1rem" }} />
          </button>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: "#9CA3AF" }}>
            <Loader2 style={{ width: "1.25rem", height: "1.25rem" }} className="animate-spin" />
            <span style={{ fontSize: "0.875rem" }}>Loading...</span>
          </div>
        ) : (
          <div className="pb-layout">

            {/* ── Picker panel ── */}
            <div className="pb-picker">
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
                {(["supplies", "appliques"] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setSearch(""); setPendingId(null); }}
                    style={{ flex: 1, padding: "0.625rem", fontSize: "0.82rem", fontWeight: 700, border: "none", cursor: "pointer",
                      background: tab === t ? "#FFFFFF" : "#F9FAFB",
                      color: tab === t ? "#1A73E8" : "#6B7280",
                      borderBottom: tab === t ? "2px solid #1A73E8" : "2px solid transparent",
                    }}>
                    {t === "supplies" ? (
                      <><Gem style={{ width: "0.8rem", height: "0.8rem", display: "inline", marginRight: "0.3rem" }} />Supplies</>
                    ) : (
                      <><Sparkles style={{ width: "0.8rem", height: "0.8rem", display: "inline", marginRight: "0.3rem" }} />Appliques</>
                    )}
                  </button>
                ))}
              </div>

              {/* Search + category filter */}
              <div style={{ padding: "0.625rem 0.75rem", borderBottom: "1px solid #F9FAFB", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "0.5rem", padding: "0.35rem 0.65rem" }}>
                  <Search style={{ width: "0.8rem", height: "0.8rem", color: "#9CA3AF", flexShrink: 0 }} />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={tab === "supplies" ? "Search supplies..." : "Search appliques..."}
                    style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: "0.82rem", color: "#1E2029" }}
                  />
                  {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0 }}><X style={{ width: "0.7rem", height: "0.7rem" }} /></button>}
                </div>
                {tab === "supplies" && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {["all", ...Object.keys(SUPPLY_CAT_LABELS).filter(k => gemSupplies.some(g => g.category === k))].map(k => (
                      <button key={k} onClick={() => setCatFilter(k)}
                        style={{ padding: "0.15rem 0.55rem", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 600, border: "none", cursor: "pointer",
                          background: catFilter === k ? "#1A73E8" : "#F3F4F6",
                          color: catFilter === k ? "#fff" : "#6B7280",
                        }}>
                        {k === "all" ? "All" : SUPPLY_CAT_LABELS[k] ?? k}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Supply list */}
              {tab === "supplies" && (
                <div className="pb-supply-list" style={{ padding: "0.375rem 0" }}>
                  {filteredSupplies.length === 0 && (
                    <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "0.8rem", padding: "2rem 1rem" }}>No supplies match</p>
                  )}
                  {filteredSupplies.map(supply => {
                    const inRecipe = inRecipeIds.supplies.has(supply.id);
                    const isPending = pendingId === supply.id;
                    const unitCost = supply.costQty > 0 ? +(supply.costAmount / supply.costQty).toFixed(6) : 0;
                    return (
                      <div key={supply.id} style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #F9FAFB", background: inRecipe ? "rgba(5,150,105,0.03)" : "transparent" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1E2029", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{supply.name}</p>
                          <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: 0 }}>{supply.itemNumber} · ${unitCost.toFixed(4)}/ea</p>
                        </div>
                        {inRecipe && !isPending ? (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.1)", padding: "0.15rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap" }}>In recipe</span>
                        ) : isPending ? (() => {
                          const isLinear = LINEAR_UNITS.has(supply.costUnit);
                          const isFabric = supply.category === "fabric";
                          const lenIn = parseFloat(pendingLength) || 0;
                          const computedQty = isLinear && lenIn > 0 ? inchesToUnit(lenIn, supply.costUnit) : pendingQty;
                          const canConfirm = isLinear ? lenIn > 0 : pendingQty > 0;
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
                              {isLinear ? (
                                <>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    {isFabric && (
                                      <>
                                        <input type="number" min="0" step="0.25" value={pendingWidth}
                                          onChange={e => setPendingWidth(e.target.value)}
                                          placeholder='W"'
                                          style={{ width: "3.5rem", padding: "0.25rem 0.4rem", border: "1.5px solid #E5E7EB", borderRadius: "0.4rem", fontSize: "0.78rem", color: "#1E2029", background: "#FFFFFF", outline: "none", textAlign: "center" }} />
                                        <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>×</span>
                                      </>
                                    )}
                                    <input type="number" min="0" step="0.25" value={pendingLength}
                                      onChange={e => setPendingLength(e.target.value)}
                                      placeholder='L"'
                                      autoFocus
                                      style={{ width: "3.5rem", padding: "0.25rem 0.4rem", border: "1.5px solid #1A73E8", borderRadius: "0.4rem", fontSize: "0.78rem", color: "#1E2029", background: "#FFFFFF", outline: "none", textAlign: "center" }} />
                                    <span style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>in</span>
                                  </div>
                                  {lenIn > 0 && (
                                    <span style={{ fontSize: "0.68rem", color: "#1A73E8", fontWeight: 600 }}>
                                      = {computedQty.toFixed(3)} {unitLabel(supply.costUnit)} · ${(unitCost * computedQty).toFixed(2)}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <input type="number" min="0.001" step="1" value={pendingQty}
                                  onChange={e => setPendingQty(Math.max(0.001, parseFloat(e.target.value) || 1))}
                                  autoFocus
                                  style={{ width: "3.5rem", padding: "0.25rem 0.4rem", border: "1.5px solid #1A73E8", borderRadius: "0.4rem", fontSize: "0.8rem", color: "#1E2029", background: "#FFFFFF", outline: "none" }} />
                              )}
                              <div style={{ display: "flex", gap: "0.3rem" }}>
                                <button
                                  disabled={!canConfirm}
                                  onClick={() => {
                                    const w = isFabric ? (parseFloat(pendingWidth) || undefined) : undefined;
                                    const l = parseFloat(pendingLength) || undefined;
                                    addSupply(supply, isLinear ? computedQty : pendingQty, w, l);
                                  }}
                                  style={{ padding: "0.25rem 0.5rem", borderRadius: "0.4rem", border: "none", background: canConfirm ? "#1A73E8" : "#E5E7EB", color: canConfirm ? "#fff" : "#9CA3AF", fontWeight: 700, fontSize: "0.78rem", cursor: canConfirm ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                  <Check style={{ width: "0.75rem", height: "0.75rem" }} />
                                </button>
                                <button onClick={() => { setPendingId(null); setPendingQty(1); setPendingWidth(""); setPendingLength(""); }}
                                  style={{ padding: "0.25rem", borderRadius: "0.4rem", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", color: "#9CA3AF" }}>
                                  <X style={{ width: "0.7rem", height: "0.7rem" }} />
                                </button>
                              </div>
                            </div>
                          );
                        })() : (
                          <button onClick={() => { setPendingId(supply.id); setPendingQty(1); setPendingWidth(""); setPendingLength(""); }}
                            style={{ padding: "0.25rem 0.6rem", borderRadius: "0.4rem", border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <Plus style={{ width: "0.7rem", height: "0.7rem" }} /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Applique list */}
              {tab === "appliques" && (
                <div className="pb-supply-list" style={{ padding: "0.375rem 0" }}>
                  {filteredAppliques.length === 0 && (
                    <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "0.8rem", padding: "2rem 1rem" }}>No appliques yet</p>
                  )}
                  {filteredAppliques.map(applique => {
                    const inRecipe = inRecipeIds.appliques.has(applique.id);
                    const isPending = pendingId === applique.id;
                    return (
                      <div key={applique.id} style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #F9FAFB", background: inRecipe ? "rgba(5,150,105,0.03)" : "transparent" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1E2029", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{applique.name}</p>
                          <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: 0 }}>{applique.itemNumber} · ${applique.totalCost.toFixed(2)} total</p>
                        </div>
                        {inRecipe && !isPending ? (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#059669", background: "rgba(5,150,105,0.1)", padding: "0.15rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap" }}>In recipe</span>
                        ) : isPending ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <input type="number" min="1" step="1" value={pendingQty}
                              onChange={e => setPendingQty(Math.max(1, parseInt(e.target.value) || 1))}
                              autoFocus
                              style={{ width: "3.5rem", padding: "0.25rem 0.4rem", border: "1.5px solid #1A73E8", borderRadius: "0.4rem", fontSize: "0.8rem", color: "#1E2029", background: "#FFFFFF", outline: "none" }} />
                            <button onClick={() => addApplique(applique, pendingQty)}
                              style={{ padding: "0.25rem 0.5rem", borderRadius: "0.4rem", border: "none", background: "#1A73E8", color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                              <Check style={{ width: "0.75rem", height: "0.75rem" }} />
                            </button>
                            <button onClick={() => { setPendingId(null); setPendingQty(1); }}
                              style={{ padding: "0.25rem", borderRadius: "0.4rem", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", color: "#9CA3AF" }}>
                              <X style={{ width: "0.7rem", height: "0.7rem" }} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setPendingId(applique.id); setPendingQty(1); }}
                            style={{ padding: "0.25rem 0.6rem", borderRadius: "0.4rem", border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <Plus style={{ width: "0.7rem", height: "0.7rem" }} /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Recipe panel ── */}
            <div className="pb-recipe">
              {/* Recipe header */}
              <div onClick={() => setRecipeOpen(v => !v)}
                style={{ padding: "0.625rem 0.875rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flexShrink: 0, background: "#FAFAFA" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6B7280", flex: 1 }}>
                  Recipe ({ingredients.length} item{ingredients.length !== 1 ? "s" : ""})
                </span>
                {totalCost > 0 && <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#059669" }}>${totalCost.toFixed(2)}</span>}
                {recipeOpen ? <ChevronUp style={{ width: "0.875rem", height: "0.875rem", color: "#9CA3AF" }} /> : <ChevronDown style={{ width: "0.875rem", height: "0.875rem", color: "#9CA3AF" }} />}
              </div>

              <AnimatePresence initial={false}>
                {recipeOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{ overflowY: "auto", maxHeight: "100%", padding: "0.375rem 0" }}>
                      {ingredients.length === 0 && (
                        <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "0.8rem", padding: "2rem 1rem" }}>
                          Add supplies or appliques from the left panel
                        </p>
                      )}
                      {ingredients.map((ing, idx) => (
                        <div key={idx} style={{ padding: "0.5rem 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid #F9FAFB" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "999px",
                                background: ing.type === "supply" ? "rgba(26,115,232,0.08)" : "rgba(255,0,110,0.08)",
                                color: ing.type === "supply" ? "#1A73E8" : "#FF006E" }}>
                                {ing.type === "supply" ? "Supply" : "Applique"}
                              </span>
                            </div>
                            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1E2029", margin: "0.15rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ing.gemSupplyName ?? ing.appliqueName}
                            </p>
                            {ing.dimLength ? (
                              <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: 0 }}>
                                {ing.dimWidth ? `${ing.dimWidth}″ × ` : ""}{ing.dimLength}&quot; = {ing.quantity.toFixed(3)} {ing.gemSupplyId && gemSupplies.find(g => g.id === ing.gemSupplyId)?.costUnit ? unitLabel(gemSupplies.find(g => g.id === ing.gemSupplyId)!.costUnit) : "units"}
                              </p>
                            ) : (
                              <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: 0 }}>
                                ${ing.unitCost.toFixed(4)}/ea
                              </p>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                            <input type="number" min="0.001" step="1" value={ing.quantity}
                              onChange={e => updateQty(idx, parseFloat(e.target.value) || 1)}
                              style={{ width: "3.5rem", padding: "0.25rem 0.4rem", border: "1.5px solid #E5E7EB", borderRadius: "0.4rem", fontSize: "0.8rem", color: "#1E2029", background: "#FFFFFF", outline: "none", textAlign: "center" }} />
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#D97706", whiteSpace: "nowrap" }}>
                              ${ing.lineCost.toFixed(2)}
                            </span>
                            <button onClick={() => remove(idx)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.15rem", flexShrink: 0 }}>
                              <X style={{ width: "0.75rem", height: "0.75rem" }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save / Cancel */}
              <div style={{ padding: "0.875rem", borderTop: "1px solid #F3F4F6", display: "flex", gap: "0.625rem", justifyContent: "flex-end", flexShrink: 0 }}>
                <button onClick={onClose}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.625rem", border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: "0.625rem", border: "none", background: "#1A73E8", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" /> : <Check style={{ width: "0.875rem", height: "0.875rem" }} />}
                  Save Piece
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Piece card ───────────────────────────────────────────────────────────────

function PieceCard({
  piece,
  onEdit,
  onDelete,
  onBuild,
  index,
}: {
  piece: MasterPiece;
  onEdit: () => void;
  onDelete: () => void;
  onBuild: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      className="group"
    >
      {/* Photo area */}
      <div style={{ position: "relative", height: "9rem", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {piece.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.photoURL} alt={piece.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: "#D1D5DB" }}>
            <ImageIcon style={{ width: "2rem", height: "2rem" }} />
            <span style={{ fontSize: "0.72rem" }}>No photo</span>
          </div>
        )}

        {/* Actions overlay */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          background: "rgba(0,0,0,0.45)", opacity: 0, transition: "opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}>
          <button style={{ height: "2rem", padding: "0 0.75rem", border: "1px solid rgba(255,107,53,0.7)", color: "#FF6B35", background: "rgba(255,107,53,0.12)", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={onBuild}>
            <Hammer style={{ width: "0.75rem", height: "0.75rem" }} /> Build
          </button>
          <button style={{ height: "2rem", padding: "0 0.75rem", border: "1px solid rgba(255,214,10,0.6)", color: "#FFD60A", background: "rgba(255,214,10,0.1)", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={onEdit}>
            <Pencil style={{ width: "0.75rem", height: "0.75rem" }} /> Edit
          </button>
          {!piece.isDefault && (
            <button style={{ height: "2rem", padding: "0 0.75rem", border: "1px solid rgba(220,38,38,0.6)", color: "#FCA5A5", background: "rgba(220,38,38,0.1)", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={onDelete}>
              <Trash2 style={{ width: "0.75rem", height: "0.75rem" }} /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
          <h3 style={{ fontWeight: 600, color: "#1E2029", fontSize: "0.875rem", lineHeight: 1.3, margin: 0 }}>{piece.name}</h3>
          {piece.isDefault && (
            <span style={{ fontSize: "0.7rem", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>Default</span>
          )}
        </div>

        <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "0.375rem", background: CATEGORY_BG[piece.category], color: CATEGORY_COLOR[piece.category], border: `1px solid ${CATEGORY_COLOR[piece.category]}30`, display: "inline-block", width: "fit-content" }}>
          {CATEGORY_LABELS[piece.category]}
        </span>

        <p style={{ fontSize: "0.72rem", color: "#6B7280", lineHeight: 1.4, margin: 0 }}>
          {SIZE_GROUP_LABELS[piece.sizeGroup]}
        </p>
        <button onClick={e => { e.stopPropagation(); onBuild(); }}
          style={{ marginTop: "0.25rem", width: "100%", padding: "0.35rem", borderRadius: "0.5rem", border: "1.5px solid rgba(255,107,53,0.4)", background: "rgba(255,107,53,0.06)", color: "#FF6B35", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
          <Hammer style={{ width: "0.7rem", height: "0.7rem" }} /> Build
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PiecesPage() {
  const [pieces, setPieces] = useState<MasterPiece[]>([]);
  const [gemSupplies, setGemSupplies] = useState<GemSupply[]>([]);
  const [appliques, setAppliques] = useState<Applique[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editPiece, setEditPiece] = useState<MasterPiece | undefined>();
  const [deletePiece, setDeletePiece] = useState<MasterPiece | undefined>();
  const [buildPiece, setBuildPiece] = useState<MasterPiece | undefined>();

  async function load(autoSeedIfEmpty = false) {
    setLoading(true);
    try {
      let data = await Promise.race([
        getMasterPieces(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Firestore timeout")), 10000)),
      ]) as Awaited<ReturnType<typeof getMasterPieces>>;

      if (data.length === 0 && autoSeedIfEmpty) {
        setSeeding(true);
        await seedDefaultPieces();
        data = await getMasterPieces();
        setSeeding(false);
      }
      setPieces(data);
    } catch (e) {
      console.error("Pieces load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDefaultPieces();
      await load();
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    load(true);
    getGemSupplies().then(setGemSupplies).catch(() => {});
    getAppliques().then(setAppliques).catch(() => {});
  }, []);

  const filtered = categoryFilter === "all"
    ? pieces
    : pieces.filter(p => p.category === categoryFilter);

  const grouped = filtered.reduce<Record<string, MasterPiece[]>>((acc, p) => {
    const key = p.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const categories = Object.keys(grouped) as PieceCategory[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#9CA3AF" }}>
        <a href="/settings" style={{ color: "#6B7280", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#374151")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>Settings</a>
        <span>/</span>
        <span style={{ color: "#374151" }}>Costume Pieces - Master List</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0 }} className="font-display">
            Costume Pieces - Master List
          </h1>
          <p style={{ color: "#6B7280", marginTop: "0.2rem", fontSize: "0.9rem" }}>
            Universal piece list - select from here when configuring each season
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {pieces.length === 0 && !loading && (
            <Button
              variant="outline"
              style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding
                ? <Loader2 style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} className="animate-spin" />
                : <Library style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} />}
              Load Default Pieces
            </Button>
          )}
          <Button
            onClick={() => setAddOpen(true)}
            style={{ background: "#1A73E8", color: "#fff", border: "none", fontWeight: 600, borderRadius: "0.75rem" }}>
            <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} />
            Add Piece
          </Button>
        </div>
      </motion.div>

      {/* Category filter pills */}
      {pieces.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
        >
          <button
            onClick={() => setCategoryFilter("all")}
            style={{
              padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: "all 0.1s",
              background: categoryFilter === "all" ? "#1A73E8" : "#FFFFFF",
              color: categoryFilter === "all" ? "#FFFFFF" : "#6B7280",
              border: `1px solid ${categoryFilter === "all" ? "#1A73E8" : "#E5E7EB"}`,
            }}
          >
            All ({pieces.length})
          </button>
          {(Object.entries(CATEGORY_LABELS) as [PieceCategory, string][]).map(([k, v]) => {
            const count = pieces.filter(p => p.category === k).length;
            if (count === 0) return null;
            const active = categoryFilter === k;
            return (
              <button
                key={k}
                onClick={() => setCategoryFilter(k)}
                style={{
                  padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: "all 0.1s",
                  background: active ? CATEGORY_BG[k] : "#FFFFFF",
                  color: active ? CATEGORY_COLOR[k] : "#6B7280",
                  border: `1px solid ${active ? CATEGORY_COLOR[k] + "60" : "#E5E7EB"}`,
                }}
              >
                {v} ({count})
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
          <Loader2 style={{ width: "2rem", height: "2rem", color: "#1A73E8" }} className="animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && pieces.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 1rem", gap: "1rem", textAlign: "center" }}
        >
          <div style={{ width: "4rem", height: "4rem", borderRadius: "999px", background: "rgba(26,115,232,0.05)", border: "1px solid rgba(26,115,232,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Library style={{ width: "2rem", height: "2rem", color: "#1A73E8", opacity: 0.4 }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "#374151", margin: 0 }}>No pieces yet</p>
            <p style={{ fontSize: "0.875rem", color: "#9CA3AF", marginTop: "0.25rem", marginBottom: 0 }}>
              Load the default pieces or add your own to get started
            </p>
          </div>
        </motion.div>
      )}

      {/* Piece grid grouped by category */}
      <AnimatePresence>
        {!loading && categories.map(cat => (
          <motion.section
            key={cat}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                {CATEGORY_LABELS[cat]}
              </h2>
              <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
              <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{grouped[cat].length}</span>
            </div>

            <>
              <style>{`.pieces-grid-${cat}{display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem}@media(min-width:640px){.pieces-grid-${cat}{grid-template-columns:repeat(3,1fr)}}@media(min-width:768px){.pieces-grid-${cat}{grid-template-columns:repeat(4,1fr)}}@media(min-width:1024px){.pieces-grid-${cat}{grid-template-columns:repeat(5,1fr)}}@media(min-width:1280px){.pieces-grid-${cat}{grid-template-columns:repeat(6,1fr)}}`}</style>
              <div className={`pieces-grid-${cat}`}>
                {grouped[cat].map((piece, i) => (
                  <PieceCard
                    key={piece.id}
                    piece={piece}
                    index={i}
                    onEdit={() => setEditPiece(piece)}
                    onDelete={() => setDeletePiece(piece)}
                    onBuild={() => setBuildPiece(piece)}
                  />
                ))}
              </div>
            </>
          </motion.section>
        ))}
      </AnimatePresence>

      {/* Dialogs */}
      <PieceFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <PieceFormDialog piece={editPiece} open={!!editPiece} onClose={() => setEditPiece(undefined)} onSaved={load} />
      <DeleteConfirmDialog piece={deletePiece} open={!!deletePiece} onClose={() => setDeletePiece(undefined)} onDeleted={load} />
      {buildPiece && (
        <PieceBuilderDialog
          piece={buildPiece}
          open={!!buildPiece}
          onClose={() => setBuildPiece(undefined)}
          gemSupplies={gemSupplies}
          appliques={appliques}
        />
      )}
    </div>
  );
}
