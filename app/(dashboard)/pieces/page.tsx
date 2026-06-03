"use client";

import { useState, useEffect, useRef } from "react";
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
import { uploadMasterPiecePhoto, deleteFileByURL } from "@/lib/services/storage";
import type { MasterPiece, PieceCategory, PieceSizeGroup } from "@/types";
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

// ── Piece card ───────────────────────────────────────────────────────────────

function PieceCard({
  piece,
  onEdit,
  onDelete,
  index,
}: {
  piece: MasterPiece;
  onEdit: () => void;
  onDelete: () => void;
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
      </div>
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PiecesPage() {
  const [pieces, setPieces] = useState<MasterPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editPiece, setEditPiece] = useState<MasterPiece | undefined>();
  const [deletePiece, setDeletePiece] = useState<MasterPiece | undefined>();

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

  useEffect(() => { load(true); }, []);

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
    </div>
  );
}
