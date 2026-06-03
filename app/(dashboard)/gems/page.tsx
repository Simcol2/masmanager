"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, ImageIcon, Loader2, X, Check, Gem, Link2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getGemSupplies, createGemSupply, updateGemSupply, deleteGemSupply, seedGemSupplies } from "@/lib/services/gems";
import { uploadFile, deleteFileByURL } from "@/lib/services/storage";
import type { GemSupply, SupplyCategory } from "@/types";

const CATEGORY_LABELS: Record<SupplyCategory, string> = {
  rhinestone: "Rhinestone",
  gem:        "Gem / Stone",
  trim:       "Trim",
  fabric:     "Fabric",
  feather:    "Feather",
  frame:      "Frame / Base",
  wire:       "Wire / Structure",
  glue:       "Glue / Adhesive",
  tool:       "Tool",
  hardware:   "Hardware",
  paint:      "Paint / Finish",
  other:      "Other",
};

// Carnival-flavoured category colours
const CATEGORY_COLORS: Record<SupplyCategory, string> = {
  rhinestone: "badge-pink",
  gem:        "badge-yellow",
  trim:       "badge-teal",
  fabric:     "badge-purple",
  feather:    "badge-lime",
  frame:      "badge-coral",
  wire:       "badge-gold",
  glue:       "badge-coral",
  tool:       "badge-gold",
  hardware:   "badge-gold",
  paint:      "badge-coral",
  other:      "bg-void-700/30 text-void-300 border border-void-600/30",
};

const UNITS = ["pcs", "metres", "cm", "grams", "kg", "ml", "L", "yards", "sheets"];

const COLOUR_OPTIONS = [
  "Clear / Crystal", "AB (Aurora Borealis)", "Gold", "Silver", "Rose Gold",
  "Black", "White", "Red", "Burgundy", "Pink", "Hot Pink", "Coral", "Orange",
  "Yellow", "Lime / Neon Green", "Green", "Teal", "Turquoise", "Blue",
  "Royal Blue", "Navy", "Purple", "Lavender", "Brown", "Bronze", "Iridescent",
  "Holographic", "Matte Black", "Matte White", "Multi / Mixed",
];

// ── Small photo uploader ──────────────────────────────────────────────────────
function PhotoUploader({ currentURL, uploading, uploadPct, onFileSelected, onRemove }: {
  currentURL?: string; uploading: boolean; uploadPct: number;
  onFileSelected: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className={cn("relative w-28 h-28 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors shrink-0",
        currentURL ? "border-carnival-teal/40" : "border-void-700 hover:border-carnival-teal/40")}
      onClick={() => !currentURL && ref.current?.click()}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-1"><Loader2 className="w-5 h-5 text-carnival-teal animate-spin" /><span className="text-xs text-void-400">{uploadPct}%</span></div>
      ) : currentURL ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentURL} alt="" className="w-full h-full object-cover rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 bg-void-950/70 rounded-lg transition-opacity">
            <Button type="button" size="icon" variant="ghost" className="w-7 h-7 text-void-300 hover:text-white"
              onClick={e => { e.stopPropagation(); ref.current?.click(); }}><Upload className="w-3 h-3" /></Button>
            <Button type="button" size="icon" variant="ghost" className="w-7 h-7 text-crimson hover:text-crimson"
              onClick={e => { e.stopPropagation(); onRemove(); }}><X className="w-3 h-3" /></Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 text-void-600"><ImageIcon className="w-6 h-6" /><span className="text-[10px]">Photo</span></div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Colour multiselect ────────────────────────────────────────────────────────
function ColourMultiSelect({ selected, onChange }: {
  selected: string[];
  onChange: (colours: string[]) => void;
}) {
  function toggle(colour: string) {
    onChange(selected.includes(colour)
      ? selected.filter(c => c !== colour)
      : [...selected, colour]);
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-void-300">
        Available Colours
        {selected.length > 0 && (
          <span className="ml-2 text-xs font-normal text-carnival-teal">
            {selected.length} selected
          </span>
        )}
      </label>
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(c => (
            <button key={c} type="button" onClick={() => toggle(c)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors"
              style={{ background: "rgba(0,212,184,0.15)", color: "#00D4B8", border: "1px solid rgba(0,212,184,0.3)" }}>
              {c} <X className="w-2.5 h-2.5" />
            </button>
          ))}
        </div>
      )}
      {/* Scrollable option list */}
      <div className="max-h-36 overflow-y-auto rounded-lg p-2 space-y-1"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {COLOUR_OPTIONS.map(c => (
          <label key={c} className="flex items-center gap-2.5 px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-white/5">
            <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)}
              className="w-3.5 h-3.5 rounded accent-carnival-teal" />
            <span className="text-sm text-void-200">{c}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Form dialog ───────────────────────────────────────────────────────────────
function GemFormDialog({ gem, open, onClose, onSaved }: {
  gem?: GemSupply; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!gem;
  const [name, setName] = useState(gem?.name ?? "");
  const [category, setCategory] = useState<SupplyCategory>(gem?.category ?? "rhinestone");
  const [availableColours, setAvailableColours] = useState<string[]>(gem?.availableColours ?? []);
  const [unitCost, setUnitCost] = useState(gem?.unitCost ?? 0);
  const [qtyOnHand, setQtyOnHand] = useState(gem?.quantityOnHand ?? 0);
  const [unit, setUnit] = useState(gem?.unit ?? "pcs");
  const [minOrder, setMinOrder] = useState(gem?.minOrder ?? "");
  const [supplierLink, setSupplierLink] = useState(gem?.supplierLink ?? "");
  const [supplier, setSupplier] = useState(gem?.supplier ?? "");
  const [notes, setNotes] = useState(gem?.notes ?? "");
  const [photoURL, setPhotoURL] = useState<string | undefined>(gem?.photoURL);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const tempId = useRef(`temp_${Date.now()}`);

  useEffect(() => {
    if (!open) return;
    setName(gem?.name ?? "");
    setCategory(gem?.category ?? "rhinestone");
    setAvailableColours(gem?.availableColours ?? []);
    setUnitCost(gem?.unitCost ?? 0);
    setQtyOnHand(gem?.quantityOnHand ?? 0);
    setUnit(gem?.unit ?? "pcs");
    setMinOrder(gem?.minOrder ?? "");
    setSupplierLink(gem?.supplierLink ?? "");
    setSupplier(gem?.supplier ?? "");
    setNotes(gem?.notes ?? "");
    setPhotoURL(gem?.photoURL);
    setError("");
  }, [open, gem]);

  async function handlePhoto(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB"); return; }
    setUploading(true); setUploadPct(0);
    try {
      const id = gem?.id ?? tempId.current;
      const ext = file.name.split(".").pop() ?? "jpg";
      setPhotoURL(await uploadFile(`gemSupplies/${id}/photo.${ext}`, file, setUploadPct));
    } catch { setError("Upload failed."); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name: name.trim(), category, availableColours, unitCost,
        quantityOnHand: qtyOnHand, unit,
        minOrder: minOrder || undefined,
        supplierLink: supplierLink || undefined,
        supplier: supplier || undefined,
        notes: notes || undefined,
        photoURL,
      };
      if (isEdit && gem) await updateGemSupply(gem.id, payload);
      else await createGemSupply(payload);
      onSaved(); onClose();
    } catch { setError("Failed to save."); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="glass-card border-void-800/50 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text">
            {isEdit ? `Edit - ${gem?.itemNumber}` : "New Supply Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Photo + name */}
          <div className="flex gap-4 items-start">
            <PhotoUploader currentURL={photoURL} uploading={uploading} uploadPct={uploadPct}
              onFileSelected={handlePhoto}
              onRemove={async () => { if (photoURL) { await deleteFileByURL(photoURL); setPhotoURL(undefined); } }} />
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-void-300">Item Name</label>
                <Input className="luxury-input" placeholder="e.g. AB Crystal SS16" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-void-300">Category</label>
                <Select value={category} onValueChange={v => setCategory(v as SupplyCategory)}>
                  <SelectTrigger className="luxury-input"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "#0F2540", border: "1px solid rgba(255,255,255,0.15)" }}>
                    {(Object.entries(CATEGORY_LABELS) as [SupplyCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k} style={{ color: "#F0F4FF" }}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Available colours - multiselect */}
          <ColourMultiSelect selected={availableColours} onChange={setAvailableColours} />

          {/* Cost, qty, unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-void-300">Unit Cost ($)</label>
              <Input type="number" step="0.001" min="0" className="luxury-input" value={unitCost}
                onChange={e => setUnitCost(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-void-300">Qty on Hand</label>
              <Input type="number" min="0" className="luxury-input" value={qtyOnHand}
                onChange={e => setQtyOnHand(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-void-300">Unit</label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="luxury-input"><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "#0F2540", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {UNITS.map(u => <SelectItem key={u} value={u} style={{ color: "#F0F4FF" }}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Min order + supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-void-300 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-carnival-coral" />
                Min. Order
              </label>
              <Input className="luxury-input" placeholder="e.g. 200/bag, 10 yards" value={minOrder}
                onChange={e => setMinOrder(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-void-300">Supplier</label>
              <Input className="luxury-input" placeholder="e.g. Alibaba, McDonald & Wang" value={supplier}
                onChange={e => setSupplier(e.target.value)} />
            </div>
          </div>

          {/* Product link */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-void-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-carnival-teal" />
              Product Link
            </label>
            <Input className="luxury-input" placeholder="https://www.alibaba.com/..." value={supplierLink}
              onChange={e => setSupplierLink(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-void-300">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-md px-3 py-2 text-sm resize-none luxury-input"
              placeholder="Any extra details - sizing, quality notes, where to find it…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-crimson">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-void-700 text-void-300">Cancel</Button>
            <Button type="submit" className="gold-btn" disabled={saving || uploading}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {isEdit ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Supply card ───────────────────────────────────────────────────────────────
function SupplyCard({ gem, onEdit, onDelete, index }: {
  gem: GemSupply; onEdit: () => void; onDelete: () => void; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
      className="glass-card rounded-lg border border-void-800/50 overflow-hidden group"
    >
      {/* Photo */}
      <div className="relative h-28 flex items-center justify-center" style={{ background: "rgba(13,27,46,0.6)" }}>
        {gem.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gem.photoURL} alt={gem.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-void-700">
            <Gem className="w-7 h-7" />
            <span className="text-xs">No photo</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(13,27,46,0.7)" }}>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" style={{ borderColor: "rgba(212,175,55,0.4)", color: "#D4AF37" }} onClick={onEdit}>
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" style={{ borderColor: "rgba(220,20,60,0.4)", color: "#DC143C" }} onClick={onDelete}>
            <Trash2 className="w-3 h-3 mr-1" /> Del
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-[10px] font-mono text-void-500">{gem.itemNumber}</p>
          <p className="text-sm font-medium text-foreground leading-tight">{gem.name}</p>
        </div>
        <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5 rounded-md", CATEGORY_COLORS[gem.category])}>
          {CATEGORY_LABELS[gem.category]}
        </Badge>
        {/* Colour pills */}
        {gem.availableColours && gem.availableColours.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {gem.availableColours.slice(0, 3).map(c => (
              <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(0,212,184,0.1)", color: "#00D4B8", border: "1px solid rgba(0,212,184,0.2)" }}>
                {c}
              </span>
            ))}
            {gem.availableColours.length > 3 && (
              <span className="text-[10px] text-void-500">+{gem.availableColours.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-carnival-yellow font-semibold">${gem.unitCost.toFixed(3)}<span className="text-void-500 font-normal">/{gem.unit}</span></span>
          <span className={cn("font-medium", gem.quantityOnHand <= 0 ? "text-crimson" : "text-carnival-teal")}>
            {gem.quantityOnHand} {gem.unit}
          </span>
        </div>
        {gem.minOrder && (
          <p className="text-[10px] text-void-500 flex items-center gap-1">
            <ShoppingCart className="w-2.5 h-2.5" /> Min: {gem.minOrder}
          </p>
        )}
        {gem.supplierLink && (
          <a href={gem.supplierLink} target="_blank" rel="noopener noreferrer"
            className="text-[10px] flex items-center gap-1 hover:underline"
            style={{ color: "#00D4B8" }} onClick={e => e.stopPropagation()}>
            <Link2 className="w-2.5 h-2.5" /> View listing
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GemsPage() {
  const [gems, setGems] = useState<GemSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editGem, setEditGem] = useState<GemSupply | undefined>();
  const [deleteGem_, setDeleteGem] = useState<GemSupply | undefined>();
  const [deleting, setDeleting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (autoSeed = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      if (autoSeed) {
        await Promise.race([
          seedGemSupplies(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("seed timeout")), 8000)),
        ]).catch((e) => console.warn("Seed skipped:", e.message));
      }
      const data = await Promise.race([
        getGemSupplies(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Firestore timeout - check your security rules")), 10000)),
      ]) as Awaited<ReturnType<typeof getGemSupplies>>;
      setGems(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setLoadError(msg);
      console.error("Gems load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  const filtered = categoryFilter === "all" ? gems : gems.filter(g => g.category === categoryFilter);
  const totalValue = gems.reduce((s, g) => s + g.unitCost * g.quantityOnHand, 0);
  const lowStock = gems.filter(g => g.quantityOnHand <= 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Supplies</h1>
          <p className="mt-1" style={{ color: "rgba(180,200,240,0.6)" }}>
            Gems, feathers, trims, fabric, frames, tools, hardware - everything you work with
          </p>
        </div>
        <Button className="gold-btn" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Supply
        </Button>
      </motion.div>

      {/* Stats row */}
      {!loading && gems.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Items", value: gems.length, color: "text-carnival-teal" },
            { label: "In Stock", value: gems.filter(g => g.quantityOnHand > 0).length, color: "text-carnival-yellow" },
          ].map(s => (
            <Card key={s.label} className="glass-card border-void-800/50">
              <CardContent className="p-4">
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-void-500 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Category filter pills */}
      {gems.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2">
          {[{ k: "all", v: `All (${gems.length})` },
            ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
              k, v: `${v} (${gems.filter(g => g.category === k).length})`
            })).filter(x => gems.some(g => g.category === x.k))
          ].map(({ k, v }) => (
            <button key={k} onClick={() => setCategoryFilter(k)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                categoryFilter === k
                  ? "border-carnival-teal/50 text-carnival-teal bg-carnival-teal/10"
                  : "border-void-700 text-void-400 hover:text-void-200"
              )}>
              {v}
            </button>
          ))}
        </motion.div>
      )}

      {loading && <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-carnival-teal" /></div>}

      {!loading && loadError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <p className="text-crimson font-medium">Could not load gems</p>
          <p className="text-void-400 text-sm max-w-md">{loadError}</p>
          <p className="text-void-500 text-xs max-w-md">
            Check Firebase Console → Firestore → Rules and make sure reads/writes are allowed for authenticated users.
          </p>
          <Button className="gold-btn mt-2" onClick={() => load(true)}>Retry</Button>
        </motion.div>
      )}

      {!loading && gems.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,212,184,0.07)", border: "1px solid rgba(0,212,184,0.15)" }}>
            <Gem className="w-8 h-8 text-carnival-teal opacity-50" />
          </div>
          <div>
            <p className="text-void-300 font-medium">No supply items yet</p>
            <p className="text-void-500 text-sm mt-1">Add your rhinestones, trims, fabric and more</p>
          </div>
          <Button className="gold-btn" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add First Item</Button>
        </motion.div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((g, i) => (
            <SupplyCard key={g.id} gem={g} index={i}
              onEdit={() => setEditGem(g)}
              onDelete={() => setDeleteGem(g)} />
          ))}
        </div>
      )}

      {/* Add / Edit dialogs */}
      <GemFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <GemFormDialog gem={editGem} open={!!editGem} onClose={() => setEditGem(undefined)} onSaved={load} />

      {/* Delete confirm */}
      <Dialog open={!!deleteGem_} onOpenChange={v => !v && setDeleteGem(undefined)}>
        <DialogContent className="glass-card border-void-800/50 max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-xl text-crimson">Delete Supply</DialogTitle></DialogHeader>
          <p className="text-void-300 text-sm mt-2">
            Delete <strong className="text-foreground">{deleteGem_?.itemNumber} - {deleteGem_?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteGem(undefined)} className="border-void-700 text-void-300">Cancel</Button>
            <Button disabled={deleting} onClick={async () => {
              if (!deleteGem_) return;
              setDeleting(true);
              try {
                if (deleteGem_.photoURL) await deleteFileByURL(deleteGem_.photoURL);
                await deleteGemSupply(deleteGem_.id);
                load();
                setDeleteGem(undefined);
              } finally { setDeleting(false); }
            }} className="bg-crimson/10 border border-crimson/40 text-crimson hover:bg-crimson/20">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
