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
  other:      "badge-gold",
};

const UNITS = ["pcs", "metres", "cm", "grams", "kg", "ml", "L", "yards", "sheets"];

const COLOUR_OPTIONS = [
  "Clear / Crystal", "AB (Aurora Borealis)", "Gold", "Silver", "Rose Gold",
  "Black", "White", "Red", "Burgundy", "Pink", "Hot Pink", "Coral", "Orange",
  "Yellow", "Lime / Neon Green", "Green", "Teal", "Turquoise", "Blue",
  "Royal Blue", "Navy", "Purple", "Lavender", "Brown", "Bronze", "Iridescent",
  "Holographic", "Matte Black", "Matte White", "Multi / Mixed",
];

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.875rem",
  border: "1.5px solid #E5E7EB", borderRadius: "0.625rem",
  background: "#FFFFFF", color: "#1E2029", outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

// ── Small photo uploader ──────────────────────────────────────────────────────
function PhotoUploader({ currentURL, uploading, uploadPct, onFileSelected, onRemove }: {
  currentURL?: string; uploading: boolean; uploadPct: number;
  onFileSelected: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      style={{
        position: "relative", width: "7rem", height: "7rem", flexShrink: 0,
        border: `2px dashed ${currentURL ? "#1A73E8" : "#D1D5DB"}`,
        borderRadius: "0.75rem", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: currentURL ? "default" : "pointer",
        background: "#F9FAFB", transition: "border-color 0.15s",
      }}
      onClick={() => !currentURL && ref.current?.click()}
    >
      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
          <Loader2 style={{ width: "1.25rem", height: "1.25rem", color: "#1A73E8" }} className="animate-spin" />
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
          <span style={{ fontSize: "0.7rem", fontWeight: 500 }}>Add Photo</span>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(f); e.target.value = ""; }} />
    </div>
  );
}

// ── Colour multiselect (pill grid) ────────────────────────────────────────────
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Available Colours</span>
        {selected.length > 0 && (
          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(26,115,232,0.1)", color: "#1A73E8" }}>
            {selected.length} selected
          </span>
        )}
      </div>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "0.4rem",
        maxHeight: "9rem", overflowY: "auto", padding: "0.5rem",
        border: "1.5px solid #E5E7EB", borderRadius: "0.75rem", background: "#F9FAFB",
      }}>
        {COLOUR_OPTIONS.map(c => {
          const on = selected.includes(c);
          return (
            <button key={c} type="button" onClick={() => toggle(c)}
              style={{
                fontSize: "0.72rem", fontWeight: on ? 700 : 500,
                padding: "0.25rem 0.6rem", borderRadius: "999px", cursor: "pointer",
                border: `1.5px solid ${on ? "#1A73E8" : "#E5E7EB"}`,
                background: on ? "#1A73E8" : "#FFFFFF",
                color: on ? "#FFFFFF" : "#374151",
                transition: "all 0.1s",
              }}>
              {c}
            </button>
          );
        })}
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

  const field = (label: string, children: React.ReactNode, icon?: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: "0.35rem" }}>
        {icon}{label}
      </label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        {/* Title */}
        <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem", background: isEdit ? "rgba(26,115,232,0.1)" : "rgba(255,0,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gem style={{ width: "1.1rem", height: "1.1rem", color: isEdit ? "#1A73E8" : "#FF006E" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>
                {isEdit ? `Edit — ${gem?.itemNumber}` : "New Supply Item"}
              </h2>
              <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: 0 }}>
                {isEdit ? "Update supply details" : "Add a gem, trim, fabric or tool"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Photo + name/category */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <PhotoUploader currentURL={photoURL} uploading={uploading} uploadPct={uploadPct}
              onFileSelected={handlePhoto}
              onRemove={async () => { if (photoURL) { await deleteFileByURL(photoURL); setPhotoURL(undefined); } }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {field("Item Name",
                <input style={inputStyle} placeholder="e.g. AB Crystal SS16" value={name} onChange={e => setName(e.target.value)} />
              )}
              {field("Category",
                <select value={category} onChange={e => setCategory(e.target.value as SupplyCategory)} style={inputStyle}>
                  {(Object.entries(CATEGORY_LABELS) as [SupplyCategory, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Colours */}
          <ColourMultiSelect selected={availableColours} onChange={setAvailableColours} />

          {/* Cost / Qty / Unit */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            {field("Unit Cost ($)",
              <input type="number" step="0.001" min="0" style={inputStyle} value={unitCost}
                onChange={e => setUnitCost(parseFloat(e.target.value) || 0)} />
            )}
            {field("Qty on Hand",
              <input type="number" min="0" style={inputStyle} value={qtyOnHand}
                onChange={e => setQtyOnHand(parseFloat(e.target.value) || 0)} />
            )}
            {field("Unit",
              <select value={unit} onChange={e => setUnit(e.target.value)} style={inputStyle}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            )}
          </div>

          {/* Min order / Supplier */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {field("Min. Order",
              <input style={inputStyle} placeholder="e.g. 200/bag, 10 yards" value={minOrder} onChange={e => setMinOrder(e.target.value)} />,
              <ShoppingCart style={{ width: "0.85rem", height: "0.85rem", color: "#FF6B35" }} />
            )}
            {field("Supplier",
              <input style={inputStyle} placeholder="e.g. Alibaba" value={supplier} onChange={e => setSupplier(e.target.value)} />
            )}
          </div>

          {/* Product link */}
          {field("Product Link",
            <input style={inputStyle} placeholder="https://www.alibaba.com/..." value={supplierLink} onChange={e => setSupplierLink(e.target.value)} />,
            <Link2 style={{ width: "0.85rem", height: "0.85rem", color: "#00BCD4" }} />
          )}

          {/* Notes */}
          {field("Notes",
            <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Sizing, quality notes, where to find it…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          )}

          {error && <p style={{ fontSize: "0.875rem", color: "#DC2626", margin: 0 }}>{error}</p>}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid #F3F4F6", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose}
              style={{ padding: "0.55rem 1.25rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFFFFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading}
              style={{ padding: "0.55rem 1.5rem", borderRadius: "0.75rem", border: "none", background: isEdit ? "#1A73E8" : "#FF006E", color: "#FFFFFF", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: (saving || uploading) ? 0.7 : 1 }}>
              {saving ? <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" /> : <Check style={{ width: "0.875rem", height: "0.875rem" }} />}
              {isEdit ? "Save Changes" : "Add Item"}
            </button>
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
      className="glass-card rounded-lg overflow-hidden group"
      style={{ border: "1px solid rgba(220,200,210,0.5)" }}
    >
      {/* Photo */}
      <div className="relative h-28 flex items-center justify-center" style={{ background: "rgba(245,238,232,0.8)" }}>
        {gem.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gem.photoURL} alt={gem.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1" style={{ color: "#C084A0" }}>
            <Gem className="w-7 h-7" />
            <span className="text-xs">No photo</span>
          </div>
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

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-[10px] font-mono" style={{ color: "#C084A0" }}>{gem.itemNumber}</p>
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
              <span className="text-[10px]" style={{ color: "#C084A0" }}>+{gem.availableColours.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-carnival-yellow font-semibold">${gem.unitCost.toFixed(3)}<span className="font-normal" style={{ color: "#C084A0" }}>/{gem.unit}</span></span>
          <span className={cn("font-medium", gem.quantityOnHand <= 0 ? "text-crimson" : "text-carnival-teal")}>
            {gem.quantityOnHand} {gem.unit}
          </span>
        </div>
        {gem.minOrder && (
          <p className="text-[10px] flex items-center gap-1" style={{ color: "#C084A0" }}>
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
          <p className="mt-1" style={{ color: "#6B7280" }}>
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
            <Card key={s.label} className="glass-card border-border">
              <CardContent className="p-4">
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#C084A0" }}>{s.label}</p>
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
                  : "border-border text-muted-foreground hover:text-foreground"
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
          <p className="text-sm max-w-md" style={{ color: "#C084A0" }}>{loadError}</p>
          <p className="text-xs max-w-md" style={{ color: "#C084A0" }}>
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
            <p className="text-foreground font-medium">No supply items yet</p>
            <p className="text-sm mt-1" style={{ color: "#C084A0" }}>Add your rhinestones, trims, fabric and more</p>
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
        <DialogContent className="glass-card border-border max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-xl text-crimson">Delete Supply</DialogTitle></DialogHeader>
          <p className="text-foreground text-sm mt-2">
            Delete <strong className="text-foreground">{deleteGem_?.itemNumber} - {deleteGem_?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteGem(undefined)} className="border-border text-muted-foreground">Cancel</Button>
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
