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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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

const CATEGORY_COLORS: Record<PieceCategory, string> = {
  bands:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tops_bottoms: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  skirts_tutus: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  accessories:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  collars:      "bg-teal-500/10 text-teal-400 border-teal-500/20",
  backpacks:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  headpieces:   "bg-red-500/10 text-red-400 border-red-500/20",
  jewelry:      "bg-gold-500/10 text-gold-400 border-gold-500/20",
  footwear:     "bg-void-600/30 text-void-300 border-void-600/20",
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
    <div className="space-y-2">
      <label className="text-sm font-medium text-void-300">Photo</label>
      <div
        className={cn(
          "relative w-full h-40 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors",
          currentURL
            ? "border-gold-500/40 bg-void-900"
            : "border-void-700 bg-void-900/50 hover:border-gold-500/40 hover:bg-void-900"
        )}
        onClick={() => !currentURL && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
            <span className="text-xs text-void-400">{uploadPct}%</span>
          </div>
        ) : currentURL ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentURL}
              alt="Piece photo"
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 bg-void-950/70 rounded-md transition-opacity">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-void-600 text-void-300"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                <Upload className="w-3 h-3 mr-1" /> Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-crimson/40 text-crimson hover:bg-crimson/10"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
              >
                <X className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-void-500">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">Click to upload photo</span>
            <span className="text-xs text-void-600">JPG, PNG, WEBP · max 5 MB</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
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
  // Temporary piece ID used for photo path before the doc exists
  const tempId = useRef(`temp_${Date.now()}`);

  // Reset form when dialog opens/closes
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
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB");
      return;
    }
    setUploading(true);
    setUploadPct(0);
    setError("");
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
    setSaving(true);
    setError("");
    try {
      if (isEdit && piece) {
        await updateMasterPiece(piece.id, { name: name.trim(), category, sizeGroup, photoURL });
      } else {
        await createMasterPiece({
          name: name.trim(),
          category,
          sizeGroup,
          photoURL,
          isDefault: false,
        });
      }
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-card border-void-800/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text">
            {isEdit ? "Edit Piece" : "Add New Piece"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-void-300">Piece Name</label>
            <Input
              className="luxury-input"
              placeholder="e.g. Wrist Cuff"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-void-300">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as PieceCategory)}>
              <SelectTrigger className="luxury-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-void-900 border-void-700">
                {(Object.entries(CATEGORY_LABELS) as [PieceCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Group */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-void-300">Size Group</label>
            <Select value={sizeGroup} onValueChange={(v) => setSizeGroup(v as PieceSizeGroup)}>
              <SelectTrigger className="luxury-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-void-900 border-void-700">
                {(Object.entries(SIZE_GROUP_LABELS) as [PieceSizeGroup, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    <span className="font-medium">{v}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sizeGroup !== "none" && (
              <p className="text-xs text-void-500 pt-0.5">
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

          {error && <p className="text-sm text-crimson">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="border-void-700 text-void-300">
              Cancel
            </Button>
            <Button type="submit" className="gold-btn" disabled={saving || uploading}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {isEdit ? "Save Changes" : "Add Piece"}
            </Button>
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-card border-void-800/50 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-crimson">Remove Piece</DialogTitle>
        </DialogHeader>
        <p className="text-void-300 text-sm mt-2">
          Remove <strong className="text-foreground">{piece?.name}</strong> from the master library?
          This won&apos;t affect pieces already assigned to past seasons.
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="border-void-700 text-void-300">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-crimson/10 border border-crimson/40 text-crimson hover:bg-crimson/20"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Remove
          </Button>
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
      className="glass-card rounded-lg border border-void-800/50 overflow-hidden group"
    >
      {/* Photo area */}
      <div className="relative h-36 bg-void-900/60 flex items-center justify-center">
        {piece.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={piece.photoURL}
            alt={piece.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-void-700">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">No photo</span>
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-void-950/60 transition-opacity">
          <Button
            size="sm"
            variant="outline"
            className="border-gold-500/40 text-gold-400 hover:bg-gold-500/10 h-8 px-3"
            onClick={onEdit}
          >
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          {!piece.isDefault && (
            <Button
              size="sm"
              variant="outline"
              className="border-crimson/40 text-crimson hover:bg-crimson/10 h-8 px-3"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground text-sm leading-tight">{piece.name}</h3>
          {piece.isDefault && (
            <span className="text-xs text-void-500 whitespace-nowrap">Default</span>
          )}
        </div>

        <Badge
          variant="outline"
          className={cn("text-xs border", CATEGORY_COLORS[piece.category])}
        >
          {CATEGORY_LABELS[piece.category]}
        </Badge>

        <p className="text-xs text-void-500 leading-tight">
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
    : pieces.filter((p) => p.category === categoryFilter);

  // Group by category for display
  const grouped = filtered.reduce<Record<string, MasterPiece[]>>((acc, p) => {
    const key = p.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const categories = Object.keys(grouped) as PieceCategory[];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-void-500">
        <a href="/settings" className="hover:text-void-300 transition-colors">Settings</a>
        <span>/</span>
        <span className="text-void-300">Costume Pieces - Master List</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Costume Pieces - Master List
          </h1>
          <p className="text-void-400 mt-1">
            Universal piece list - select from here when configuring each season
          </p>
        </div>
        <div className="flex gap-2">
          {pieces.length === 0 && !loading && (
            <Button
              variant="outline"
              className="border-void-700 text-void-300 hover:bg-void-800"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding
                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                : <Library className="w-4 h-4 mr-2" />}
              Load Default Pieces
            </Button>
          )}
          <Button className="gold-btn" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
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
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              categoryFilter === "all"
                ? "bg-gold-500/10 text-gold-400 border-gold-500/30"
                : "bg-void-900 text-void-400 border-void-700 hover:text-void-200"
            )}
          >
            All ({pieces.length})
          </button>
          {(Object.entries(CATEGORY_LABELS) as [PieceCategory, string][]).map(([k, v]) => {
            const count = pieces.filter((p) => p.category === k).length;
            if (count === 0) return null;
            return (
              <button
                key={k}
                onClick={() => setCategoryFilter(k)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  categoryFilter === k
                    ? cn("border", CATEGORY_COLORS[k])
                    : "bg-void-900 text-void-400 border-void-700 hover:text-void-200"
                )}
              >
                {v} ({count})
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && pieces.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gold-500/5 border border-gold-500/10 flex items-center justify-center">
            <Library className="w-8 h-8 text-gold-500/40" />
          </div>
          <div>
            <p className="text-void-300 font-medium">No pieces yet</p>
            <p className="text-void-500 text-sm mt-1">
              Load the default pieces or add your own to get started
            </p>
          </div>
        </motion.div>
      )}

      {/* Piece grid grouped by category */}
      <AnimatePresence>
        {!loading && categories.map((cat) => (
          <motion.section
            key={cat}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-void-300 uppercase tracking-wider">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="flex-1 h-px bg-void-800/60" />
              <span className="text-xs text-void-500">{grouped[cat].length}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
          </motion.section>
        ))}
      </AnimatePresence>

      {/* Dialogs */}
      <PieceFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={load}
      />

      <PieceFormDialog
        piece={editPiece}
        open={!!editPiece}
        onClose={() => setEditPiece(undefined)}
        onSaved={load}
      />

      <DeleteConfirmDialog
        piece={deletePiece}
        open={!!deletePiece}
        onClose={() => setDeletePiece(undefined)}
        onDeleted={load}
      />
    </div>
  );
}
