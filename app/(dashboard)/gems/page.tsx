"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, ImageIcon, Loader2, X, Check, Gem, Link2, ShoppingCart, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGemSupplies, createGemSupply, updateGemSupply, deleteGemSupply, seedGemSupplies, deduplicateGemSupplies } from "@/lib/services/gems";
import { uploadFile, deleteFileByURL } from "@/lib/services/storage";
import type { GemSupply, SupplyCategory } from "@/types";

const CATEGORY_LABELS: Record<SupplyCategory, string> = {
  rhinestone:        "Rhinestone",
  gem:               "Gem / Stone",
  trim:              "Trim",
  fabric:            "Fabric",
  feather:           "Feather",
  frame:             "Frame / Base",
  wire:              "Wire / Structure",
  elastic:           "Elastic / Cord",
  chain:             "Chain",
  applique_material: "Applique",
  htv:               "HTV",
  cardstock:         "Cardstock",
  glue:              "Glue / Adhesive",
  tool:              "Tool",
  hardware:          "Hardware",
  paint:             "Paint / Finish",
  other:             "Other",
};

// Light-theme category badge colours
const CATEGORY_BG: Record<SupplyCategory, string> = {
  rhinestone:        "#FDF2F8",
  gem:               "#FEF9C3",
  trim:              "#CCFBF1",
  fabric:            "#EDE9FE",
  feather:           "#ECFDF5",
  frame:             "#FFF7ED",
  wire:              "#FEF3C7",
  elastic:           "#F0FDFA",
  chain:             "#F8FAFC",
  applique_material: "#FFF1F2",
  htv:               "#F0FDF4",
  cardstock:         "#FFF7ED",
  glue:              "#FFF7ED",
  tool:              "#F3F4F6",
  hardware:          "#F3F4F6",
  paint:             "#FFF7ED",
  other:             "#F3F4F6",
};
const CATEGORY_COLOR: Record<SupplyCategory, string> = {
  rhinestone:        "#9D174D",
  gem:               "#854D0E",
  trim:              "#0F766E",
  fabric:            "#6D28D9",
  feather:           "#065F46",
  frame:             "#9A3412",
  wire:              "#92400E",
  elastic:           "#0F766E",
  chain:             "#374151",
  applique_material: "#BE123C",
  htv:               "#15803D",
  cardstock:         "#C2410C",
  glue:              "#9A3412",
  tool:              "#374151",
  hardware:          "#374151",
  paint:             "#9A3412",
  other:             "#374151",
};

// Units for cost and min-order dropdowns
const COST_UNITS = ["pcs", "bag", "yard", "metre", "roll", "spool", "sheet", "feet", "gram", "kg", "box", "pack", "L"];

const DEFAULT_SUPPLIERS = [
  "Alibaba",
  "AliExpress",
  "Amazon",
  "Dollarama",
  "Dollar Tree",
  "John Bead",
  "McDonald & Wang",
  "Shein",
  "Temu",
];

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
  const [shape, setShape] = useState(gem?.shape ?? "");
  const [availableColours, setAvailableColours] = useState<string[]>(gem?.availableColours ?? []);
  // Cost: "$X for Y <unit>" — stored as strings so backspace/clearing works naturally
  const [costAmount, setCostAmount] = useState(gem?.costAmount ? String(gem.costAmount) : "");
  const [costQty, setCostQty]       = useState(gem?.costQty ? String(gem.costQty) : "");
  const [costUnit, setCostUnit]     = useState(gem?.costUnit ?? "pcs");
  const [qtyOnHand, setQtyOnHand]   = useState(gem?.quantityOnHand ? String(gem.quantityOnHand) : "");
  // Min order: "N <unit>"
  const [minOrderQty, setMinOrderQty]   = useState(gem?.minOrderQty ? String(gem.minOrderQty) : "");
  const [minOrderUnit, setMinOrderUnit] = useState(gem?.minOrderUnit ?? "pcs");
  const [supplierLink, setSupplierLink] = useState(gem?.supplierLink ?? "");
  const [supplier, setSupplier] = useState(gem?.supplier ?? "");
  const [customSupplierMode, setCustomSupplierMode] = useState(
    !!(gem?.supplier && !DEFAULT_SUPPLIERS.includes(gem.supplier))
  );
  const [extraSuppliers, setExtraSuppliers] = useState<string[]>([]);
  const [notes, setNotes] = useState(gem?.notes ?? "");
  const [photoURL, setPhotoURL] = useState<string | undefined>(gem?.photoURL);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const tempId = useRef(`temp_${Date.now()}`);
  // URL import
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedFields, setImportedFields] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(gem?.name ?? "");
    setCategory(gem?.category ?? "rhinestone");
    setAvailableColours(gem?.availableColours ?? []);
    setCostAmount(gem?.costAmount ? String(gem.costAmount) : "");
    setCostQty(gem?.costQty ? String(gem.costQty) : "");
    setCostUnit(gem?.costUnit ?? "pcs");
    setQtyOnHand(gem?.quantityOnHand ? String(gem.quantityOnHand) : "");
    setMinOrderQty(gem?.minOrderQty ? String(gem.minOrderQty) : "");
    setMinOrderUnit(gem?.minOrderUnit ?? "pcs");
    setSupplierLink(gem?.supplierLink ?? "");
    setSupplier(gem?.supplier ?? "");
    setCustomSupplierMode(!!(gem?.supplier && !DEFAULT_SUPPLIERS.includes(gem.supplier ?? "")));
    setNotes(gem?.notes ?? "");
    setPhotoURL(gem?.photoURL);
    setError("");
    setImportUrl("");
    setImportError("");
    setImportedFields([]);
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

  async function handleImport(urlToImport?: string) {
    const url = (urlToImport ?? importUrl).trim();
    if (!url) return;
    setImporting(true); setImportError(""); setImportedFields([]);
    try {
      const res = await fetch("/api/fetch-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setImportError(data.error ?? "Could not import product info.");
        return;
      }
      const filled: string[] = [];
      if (data.name)       { setName(data.name);                                          filled.push("name"); }
      if (data.category)   { setCategory(data.category as SupplyCategory);               filled.push("category"); }
      if (data.shape)      { setShape(data.shape);                                        filled.push("shape"); }
      if (data.costAmount) { setCostAmount(String(data.costAmount));                      filled.push("price"); }
      if (data.costQty)    { setCostQty(String(data.costQty));                            filled.push("qty"); }
      if (data.costUnit)   { setCostUnit(data.costUnit);                                  filled.push("unit"); }
      if (data.minOrderQty){ setMinOrderQty(String(data.minOrderQty));                   filled.push("min order"); }
      if (data.minOrderUnit){ setMinOrderUnit(data.minOrderUnit); }
      if (data.supplier && DEFAULT_SUPPLIERS.includes(data.supplier)) {
        setSupplier(data.supplier); setCustomSupplierMode(false);                         filled.push("supplier");
      }
      if (data.supplierLink){ setSupplierLink(data.supplierLink);                        filled.push("link"); }
      if (data.imageUrl)   { setPhotoURL(data.imageUrl);                                  filled.push("photo"); }
      setImportedFields(filled);
      if (filled.length === 0) setImportError("Could not extract product info from that page. Fill in the fields manually.");
    } catch {
      setImportError("Failed to fetch product info. Check your connection and try again.");
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const cAmt = parseFloat(costAmount) || 0;
      const cQty = parseFloat(costQty) || 1;
      const perPieceCost = cQty > 0 ? +(cAmt / cQty).toFixed(6) : 0;
      const payload = {
        name: name.trim(), category, shape: shape || undefined, availableColours,
        costAmount: cAmt, costQty: cQty, costUnit,
        unitCost: perPieceCost,
        quantityOnHand: parseFloat(qtyOnHand) || 0,
        minOrderQty: parseFloat(minOrderQty) || 0,
        minOrderUnit,
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
      <DialogContent style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "32rem", maxHeight: "90vh",
        overflow: "hidden", background: "#FFFFFF", border: "1px solid #E5E7EB",
        borderRadius: "1rem", padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        outline: "none", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem 1rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
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

        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* URL import — new items only */}
            {!isEdit && (
              <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "0.875rem", padding: "0.75rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.1rem" }}>
                  <Sparkles style={{ width: "0.875rem", height: "0.875rem", color: "#0EA5E9", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0369A1" }}>Import from product link</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="url"
                    placeholder="Paste Alibaba, AliExpress, or any product URL"
                    value={importUrl}
                    onChange={e => { setImportUrl(e.target.value); setImportError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleImport(); } }}
                    style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1.5px solid #BAE6FD", background: "#FFFFFF", fontSize: "0.82rem", color: "#1E2029", outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleImport()}
                    disabled={importing || !importUrl.trim()}
                    style={{ padding: "0.5rem 0.875rem", borderRadius: "0.5rem", border: "none", background: importing ? "#BAE6FD" : "#0EA5E9", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: importing || !importUrl.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}
                  >
                    {importing
                      ? <><Loader2 style={{ width: "0.8rem", height: "0.8rem" }} className="animate-spin" />Fetching</>
                      : "Import"}
                  </button>
                </div>
                {importError && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", padding: "0.4rem 0.6rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "0.5rem" }}>
                    <AlertCircle style={{ width: "0.8rem", height: "0.8rem", color: "#DC2626", flexShrink: 0, marginTop: "0.1rem" }} />
                    <span style={{ fontSize: "0.75rem", color: "#DC2626" }}>{importError}</span>
                  </div>
                )}
                {importedFields.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <Check style={{ width: "0.75rem", height: "0.75rem", color: "#059669", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 600 }}>Filled:</span>
                    {importedFields.map(f => (
                      <span key={f} style={{ fontSize: "0.68rem", background: "#DCFCE7", color: "#16A34A", padding: "0.1rem 0.45rem", borderRadius: "999px", fontWeight: 600 }}>{f}</span>
                    ))}
                    <span style={{ fontSize: "0.68rem", color: "#6B7280" }}>Review and adjust below.</span>
                  </div>
                )}
              </div>
            )}

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
                {field("Shape",
                  <select value={shape} onChange={e => setShape(e.target.value)} style={inputStyle}>
                    <option value="">— Any shape —</option>
                    {["Round","Oval","Square","Rectangle","Diamond","Teardrop","Heart","Star","Hexagon","Triangle","Navette","Pear","Marquise","Flatback","Cabochon","Baguette","Horse Eye","Irregular","Other"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Colours */}
            <ColourMultiSelect selected={availableColours} onChange={setAvailableColours} />

            {/* Cost structure */}
            <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "0.875rem", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", margin: 0 }}>Cost</p>
              {/* "$X for Y <unit>" */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", alignItems: "end" }}>
                {field("Price ($)",
                  <input type="number" step="0.01" min="0" style={inputStyle} value={costAmount}
                    placeholder="e.g. 13"
                    onChange={e => setCostAmount(e.target.value)} />
                )}
                {field("Quantity covered",
                  <input type="number" step="1" min="1" style={inputStyle} value={costQty}
                    placeholder="e.g. 200"
                    onChange={e => setCostQty(e.target.value)} />
                )}
                {field("Unit",
                  <select value={costUnit} onChange={e => setCostUnit(e.target.value)} style={inputStyle}>
                    {COST_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                )}
              </div>
              {/* Auto-calculated per-piece cost */}
              {parseFloat(costAmount) > 0 && parseFloat(costQty) > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <span style={{ fontSize: "0.8rem", color: "#1D4ED8" }}>
                    Individual piece cost:
                    <strong style={{ marginLeft: "0.35rem", fontSize: "0.9rem" }}>
                      ${(parseFloat(costAmount) / parseFloat(costQty)).toFixed(4)}
                    </strong>
                    <span style={{ color: "#93C5FD", marginLeft: "0.25rem" }}>per piece</span>
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#60A5FA" }}>
                    ${parseFloat(costAmount).toFixed(2)} ÷ {costQty} {costUnit}
                  </span>
                </div>
              )}
              <div style={{ fontSize: "0.72rem", color: "#6B7280" }}>
                Enter the number of pieces covered by this purchase. Example: a $13 bag with 200 pieces should be entered as 13 dollars, 200 quantity, and unit pcs.
              </div>
              {/* Qty on hand */}
              {field("Quantity on Hand",
                <input type="number" min="0" style={inputStyle} value={qtyOnHand}
                  placeholder="How many do you have?"
                  onChange={e => setQtyOnHand(e.target.value)} />
              )}
            </div>

            {/* Min order / Supplier */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {field("Min. Order",
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <input type="number" min="0" step="1" style={{ ...inputStyle, flex: 1 }} value={minOrderQty}
                    placeholder="e.g. 3"
                    onChange={e => setMinOrderQty(e.target.value)} />
                  <select value={minOrderUnit} onChange={e => setMinOrderUnit(e.target.value)}
                    style={{ ...inputStyle, width: "auto", flexShrink: 0 }}>
                    {COST_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>,
                <ShoppingCart style={{ width: "0.85rem", height: "0.85rem", color: "#FF6B35" }} />
              )}
              {field("Supplier",
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <select
                    style={inputStyle}
                    value={customSupplierMode ? "__custom__" : (supplier || "")}
                    onChange={e => {
                      if (e.target.value === "__custom__") {
                        setCustomSupplierMode(true);
                        setSupplier("");
                      } else {
                        setCustomSupplierMode(false);
                        setSupplier(e.target.value);
                      }
                    }}
                  >
                    <option value="">— Select supplier —</option>
                    {[...DEFAULT_SUPPLIERS, ...extraSuppliers].sort().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__custom__">+ Add new supplier…</option>
                  </select>
                  {customSupplierMode && (
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Type supplier name…"
                        value={supplier}
                        onChange={e => setSupplier(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (supplier.trim() && !DEFAULT_SUPPLIERS.includes(supplier.trim())) {
                            setExtraSuppliers(prev => [...prev, supplier.trim()]);
                          }
                          setCustomSupplierMode(false);
                        }}
                        style={{ padding: "0.4rem 0.75rem", borderRadius: "0.6rem", border: "none", background: "#1A73E8", color: "#fff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCustomSupplierMode(false); setSupplier(""); }}
                        style={{ padding: "0.4rem 0.5rem", borderRadius: "0.6rem", border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Supply detail popup ───────────────────────────────────────────────────────
function GemDetailDialog({ gem, open, onClose, onEdit }: {
  gem: GemSupply; open: boolean; onClose: () => void; onEdit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent style={{ maxWidth: "28rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Photo */}
          {gem.photoURL && (
            <div style={{ aspectRatio: "1 / 1", width: "100%", borderRadius: "0.875rem", overflow: "hidden", background: "#F9FAFB", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gem.photoURL} alt={gem.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          {/* Header */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#9CA3AF" }}>{gem.itemNumber}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "0.35rem", background: CATEGORY_BG[gem.category], color: CATEGORY_COLOR[gem.category] }}>
                {CATEGORY_LABELS[gem.category]}
              </span>
              {gem.shape && <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "0.35rem", background: "#EFF6FF", color: "#1D4ED8" }}>{gem.shape}</span>}
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>{gem.name}</h2>
          </div>
          {/* Pricing */}
          <div style={{ background: "#F9FAFB", borderRadius: "0.75rem", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {gem.costAmount > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "#6B7280" }}>Cost</span>
                  <span style={{ fontWeight: 700, color: "#1E2029" }}>${gem.costAmount.toFixed(2)} / {gem.costQty} {gem.costUnit}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "#6B7280" }}>Per piece</span>
                  <span style={{ fontWeight: 700, color: "#D97706" }}>${gem.unitCost.toFixed(4)}</span>
                </div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ color: "#6B7280" }}>Qty on Hand</span>
              <span style={{ fontWeight: 700, color: gem.quantityOnHand <= 0 ? "#DC2626" : "#16A34A" }}>{gem.quantityOnHand} {gem.costUnit}</span>
            </div>
            {(gem.minOrderQty ?? 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <span style={{ color: "#6B7280" }}>Min Order</span>
                <span style={{ fontWeight: 700, color: "#1E2029" }}>{gem.minOrderQty} {gem.minOrderUnit}</span>
              </div>
            )}
          </div>
          {/* Colours */}
          {gem.availableColours && gem.availableColours.length > 0 && (
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.5rem" }}>Available Colours</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {gem.availableColours.map(c => (
                  <span key={c} style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(0,188,212,0.08)", color: "#00838F", border: "1px solid rgba(0,188,212,0.2)" }}>{c}</span>
                ))}
              </div>
            </div>
          )}
          {/* Supplier */}
          {(gem.supplier || gem.supplierLink) && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ color: "#6B7280" }}>Supplier</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {gem.supplier && <span style={{ fontWeight: 600, color: "#374151" }}>{gem.supplier}</span>}
                {gem.supplierLink && <a href={gem.supplierLink} target="_blank" rel="noopener noreferrer" style={{ color: "#1A73E8", fontSize: "0.78rem", fontWeight: 600 }}>View listing ↗</a>}
              </div>
            </div>
          )}
          {gem.notes && <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>{gem.notes}</p>}
          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem", borderTop: "1px solid #F3F4F6" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "0.6rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFFFFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>Close</button>
            <button onClick={() => { onClose(); onEdit(); }} style={{ flex: 2, padding: "0.6rem", borderRadius: "0.75rem", border: "none", background: "#1A73E8", color: "#FFFFFF", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <Pencil style={{ width: "0.875rem", height: "0.875rem" }} /> Edit Item
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Supply card ───────────────────────────────────────────────────────────────
function SupplyCard({ gem, onEdit, onDelete, index }: {
  gem: GemSupply; onEdit: () => void; onDelete: () => void; index: number;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  return (
    <>
    <GemDetailDialog gem={gem} open={detailOpen} onClose={() => setDetailOpen(false)} onEdit={onEdit} />
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}
    >
      {/* Photo — 1:1 square, clickable to open detail */}
      <div onClick={() => setDetailOpen(true)} style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {gem.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gem.photoURL} alt={gem.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", color: "#9CA3AF" }}>
            <Gem style={{ width: "1.5rem", height: "1.5rem" }} />
            <span style={{ fontSize: "0.65rem" }}>No photo</span>
          </div>
        )}
        {/* Click hint overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")} />
      </div>

      {/* Info */}
      <div style={{ padding: "0.65rem 0.7rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>

        {/* SKU */}
        <p style={{ fontSize: "0.6rem", fontFamily: "monospace", letterSpacing: "0.05em", color: "#9CA3AF", lineHeight: 1, margin: 0 }}>
          {gem.itemNumber}
        </p>

        {/* Title — clickable if supplier link exists */}
        {gem.supplierLink ? (
          <a href={gem.supplierLink} target="_blank" rel="noopener noreferrer"
            className="font-display"
            style={{ fontSize: "0.95rem", fontWeight: 800, lineHeight: 1.2, color: "#1A73E8", textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "0.25rem" }}
            onClick={e => e.stopPropagation()}>
            <span style={{ flex: 1 }}>{gem.name}</span>
            <Link2 style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0, marginTop: "0.15rem", opacity: 0.7 }} />
          </a>
        ) : (
          <p className="font-display" style={{ fontSize: "0.95rem", fontWeight: 800, lineHeight: 1.2, color: "#1E2029", margin: 0 }}>
            {gem.name}
          </p>
        )}

        {/* Category + Colours */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "0.375rem", background: CATEGORY_BG[gem.category], color: CATEGORY_COLOR[gem.category], border: `1px solid ${CATEGORY_COLOR[gem.category]}30`, display: "inline-block", width: "fit-content" }}>
            {CATEGORY_LABELS[gem.category]}
          </span>
          {gem.availableColours && gem.availableColours.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem" }}>
              {gem.availableColours.slice(0, 3).map(c => (
                <span key={c} style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: "999px", background: "rgba(0,188,212,0.08)", color: "#00838F", border: "1px solid rgba(0,188,212,0.2)" }}>
                  {c}
                </span>
              ))}
              {gem.availableColours.length > 3 && (
                <span style={{ fontSize: "0.6rem", color: "#9CA3AF" }}>+{gem.availableColours.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Price / Stock */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.4rem", marginTop: "auto", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ lineHeight: 1.3 }}>
            {gem.costAmount > 0 ? (
              <>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#D97706" }}>${gem.costAmount.toFixed(2)}</span>
                <span style={{ fontSize: "0.6rem", color: "#9CA3AF" }}> / {gem.costQty} {gem.costUnit}</span>
                <br />
                <span style={{ fontSize: "0.62rem", color: "#6B7280" }}>${gem.unitCost.toFixed(4)}/ea</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#D97706" }}>${gem.unitCost.toFixed(4)}</span>
                <span style={{ fontSize: "0.6rem", color: "#9CA3AF" }}>/ea</span>
              </>
            )}
          </div>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: gem.quantityOnHand <= 0 ? "#DC2626" : "#16A34A" }}>
            {gem.quantityOnHand} {gem.costUnit ?? "pcs"}
          </span>
        </div>

        {(gem.minOrderQty ?? 0) > 0 && (
          <p style={{ fontSize: "0.6rem", display: "flex", alignItems: "center", gap: "0.2rem", color: "#9CA3AF", margin: 0 }}>
            <ShoppingCart style={{ width: "0.6rem", height: "0.6rem" }} /> Min: {gem.minOrderQty} {gem.minOrderUnit}
          </p>
        )}
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", borderTop: "1px solid #F3F4F6", padding: "0.35rem 0.5rem", gap: "0.35rem" }}>
        <button onClick={() => setDetailOpen(true)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", fontSize: "0.7rem", fontWeight: 600, color: "#374151", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "0.5rem", padding: "0.3rem", cursor: "pointer" }}>
          <Gem style={{ width: "0.65rem", height: "0.65rem" }} /> Details
        </button>
        <button onClick={onEdit}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.3rem 0.5rem", color: "#1A73E8", background: "rgba(26,115,232,0.07)", border: "1px solid rgba(26,115,232,0.2)", borderRadius: "0.5rem", cursor: "pointer" }}>
          <Pencil style={{ width: "0.65rem", height: "0.65rem" }} />
        </button>
        <button onClick={onDelete}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.3rem 0.5rem", color: "#DC2626", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.5rem", cursor: "pointer" }}>
          <Trash2 style={{ width: "0.65rem", height: "0.65rem" }} />
        </button>
      </div>
    </motion.div>
    </>
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
        await deduplicateGemSupplies().catch(() => {});
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0 }} className="font-display">Supplies</h1>
          <p style={{ color: "#6B7280", marginTop: "0.2rem", fontSize: "0.9rem" }}>
            Gems, feathers, trims, fabric, frames, tools, hardware - everything you work with
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} style={{ background: "#FF006E", color: "#fff", border: "none", fontWeight: 600, borderRadius: "0.75rem" }}>
          <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} /> Add Supply
        </Button>
      </motion.div>

      {/* Stats row */}
      {!loading && gems.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          {[
            { label: "Total Items", value: gems.length, color: "#00BCD4" },
            { label: "In Stock", value: gems.filter(g => g.quantityOnHand > 0).length, color: "#FFD60A" },
          ].map(s => (
            <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.25rem", marginBottom: 0 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Category filter pills */}
      {gems.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {[{ k: "all", v: `All (${gems.length})` },
            ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
              k, v: `${v} (${gems.filter(g => g.category === k).length})`
            })).filter(x => gems.some(g => g.category === x.k))
          ].map(({ k, v }) => (
            <button key={k} onClick={() => setCategoryFilter(k)}
              style={{
                padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: "all 0.1s",
                background: categoryFilter === k ? "#00BCD4" : "#FFFFFF",
                color: categoryFilter === k ? "#FFFFFF" : "#6B7280",
                border: `1px solid ${categoryFilter === k ? "#00BCD4" : "#E5E7EB"}`,
              }}>
              {v}
            </button>
          ))}
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
          <Loader2 style={{ width: "2rem", height: "2rem", color: "#00BCD4" }} className="animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && loadError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", textAlign: "center" }}>
          <AlertCircle style={{ width: "2rem", height: "2rem", color: "#DC2626" }} />
          <p style={{ fontWeight: 600, color: "#DC2626", margin: 0 }}>Could not load gems</p>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", maxWidth: "28rem", margin: 0 }}>{loadError}</p>
          <p style={{ fontSize: "0.75rem", color: "#9CA3AF", maxWidth: "28rem", margin: 0 }}>
            Check Firebase Console → Firestore → Rules and make sure reads/writes are allowed for authenticated users.
          </p>
          <button onClick={() => load(true)} style={{ marginTop: "0.5rem", padding: "0.5rem 1.25rem", borderRadius: "0.75rem", border: "none", background: "#1A73E8", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Retry
          </button>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && gems.length === 0 && !loadError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 1rem", gap: "1rem", textAlign: "center" }}>
          <div style={{ width: "4rem", height: "4rem", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,188,212,0.07)", border: "1px solid rgba(0,188,212,0.15)" }}>
            <Gem style={{ width: "2rem", height: "2rem", color: "#00BCD4", opacity: 0.5 }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "#1E2029", margin: 0 }}>No supply items yet</p>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem", marginBottom: 0 }}>Add your rhinestones, trims, fabric and more</p>
          </div>
          <button onClick={() => setAddOpen(true)} style={{ padding: "0.55rem 1.25rem", borderRadius: "0.75rem", border: "none", background: "#FF006E", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Plus style={{ width: "1rem", height: "1rem" }} /> Add First Item
          </button>
        </motion.div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <>
          <style>{`.gems-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem}@media(min-width:1024px){.gems-grid{grid-template-columns:repeat(4,1fr)}}`}</style>
          <div className="gems-grid">
            {filtered.map((g, i) => (
              <SupplyCard key={g.id} gem={g} index={i}
                onEdit={() => setEditGem(g)}
                onDelete={() => setDeleteGem(g)} />
            ))}
          </div>
        </>
      )}

      {/* Add / Edit dialogs */}
      <GemFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={load} />
      <GemFormDialog gem={editGem} open={!!editGem} onClose={() => setEditGem(undefined)} onSaved={load} />

      {/* Delete confirm */}
      <Dialog open={!!deleteGem_} onOpenChange={v => !v && setDeleteGem(undefined)}>
        <DialogContent style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "24rem",
          background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem",
          padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", outline: "none",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#DC2626", margin: "0 0 0.75rem" }} className="font-display">Delete Supply</h2>
          <p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.25rem" }}>
            Delete <strong>{deleteGem_?.itemNumber} - {deleteGem_?.name}</strong>?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button onClick={() => setDeleteGem(undefined)}
              style={{ padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
              Cancel
            </button>
            <button disabled={deleting} onClick={async () => {
              if (!deleteGem_) return;
              setDeleting(true);
              try {
                if (deleteGem_.photoURL) await deleteFileByURL(deleteGem_.photoURL);
                await deleteGemSupply(deleteGem_.id);
                load();
                setDeleteGem(undefined);
              } finally { setDeleting(false); }
            }} style={{ padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: deleting ? 0.7 : 1 }}>
              {deleting ? <Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" /> : <Trash2 style={{ width: "1rem", height: "1rem" }} />}
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
