"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Plus, Filter, Download, User,
  CreditCard, Loader2, Check, Pencil, Trash2, AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { COSTUME_PRICES, MODEL_DISCOUNT, ADD_ON_ITEMS } from "@/lib/pricing";
import { CostumeTypeLabels, type PaymentStatus, type Registration, type CostumeType } from "@/types";
import {
  getRegistrations, createRegistration, updateRegistration,
  deleteRegistration, seedRegistrations,
} from "@/lib/services/registrations";

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.875rem",
  border: "1.5px solid #E5E7EB", borderRadius: "0.625rem",
  background: "#FFFFFF", color: "#1E2029", outline: "none",
};

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
    paid:    { bg: "#DCFCE7", color: "#166534", label: "Paid" },
    partial: { bg: "#FEF9C3", color: "#854D0E", label: "Partial" },
    deposit: { bg: "#EFF6FF", color: "#1D4ED8", label: "Deposit" },
    unpaid:  { bg: "#FEE2E2", color: "#991B1B", label: "Unpaid" },
  };
  const s = cfg[status] ?? cfg.unpaid;
  return <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: s.bg, color: s.color }}>{s.label}</span>;
}

// ── Registration form ─────────────────────────────────────────────────────────

function RegistrationForm({ initial, onClose, onSaved }: {
  initial?: Registration; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initial;

  // Participant info
  const [firstName, setFirstName]     = useState(initial?.firstName ?? "");
  const [lastName, setLastName]       = useState(initial?.lastName ?? "");
  const [age, setAge]                 = useState(String(initial?.age ?? ""));
  const [gender, setGender]           = useState<"" | "boy" | "girl">(initial?.gender ?? "");
  const [costumeType, setCostumeType] = useState<"" | CostumeType>(initial?.costumeType ?? "");
  const [style, setStyle]             = useState(initial?.style ?? "");
  const [topSize, setTopSize]         = useState(initial?.topSize ?? "");
  const [bottomSize, setBottomSize]   = useState(initial?.bottomSize ?? "");
  const [bandSize, setBandSize]       = useState(initial?.bandSize ?? "");
  const [girlsTopSize, setGirlsTopSize] = useState(initial?.girlsTopSize ?? "");
  const [waist, setWaist]             = useState(initial?.waist ?? "");
  const [shoeSize, setShoeSize]       = useState(initial?.shoeSize ?? "");
  const [shoeCategory, setShoeCategory] = useState(initial?.shoeCategory ?? "");

  // Parent info
  const [parentName, setParentName]   = useState(initial?.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(initial?.parentEmail ?? "");
  const [parentPhone, setParentPhone] = useState(initial?.parentPhone ?? "");

  // Add-ons (structured)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(initial?.selectedAddOns ?? []);

  // Model status
  const [isModel, setIsModel]         = useState(initial?.isModel ?? false);

  // Notes & payment
  const [notes, setNotes]             = useState(initial?.notes ?? "");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initial?.paymentStatus ?? "unpaid");
  const [amountPaidOverride, setAmountPaidOverride] = useState<string>("");

  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  // ── Computed pricing ────────────────────────────────────────────────────────
  const costumeBasePrice = costumeType ? (COSTUME_PRICES[costumeType] ?? 0) : 0;
  const addOnTotal = selectedAddOns.reduce((s, key) => {
    const item = ADD_ON_ITEMS.find(a => a.key === key);
    return s + (item?.price ?? 0);
  }, 0);
  const modelDiscount = isModel ? MODEL_DISCOUNT : 0;
  const totalCost = Math.max(0, costumeBasePrice + addOnTotal - modelDiscount);

  // Amount paid — for deposit status auto-set to 50%, otherwise from override field
  const amountPaid = paymentStatus === "deposit"
    ? Math.round(totalCost * 0.5 * 100) / 100
    : paymentStatus === "paid"
      ? totalCost
      : parseFloat(amountPaidOverride) || (initial?.amountPaid ?? 0);
  const balanceOwing = Math.max(0, totalCost - amountPaid);

  function toggleAddOn(key: string) {
    setSelectedAddOns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !parentName.trim() || !costumeType || !gender) {
      setError("First name, parent name, costume type, and gender are required"); return;
    }
    setSaving(true); setError("");
    try {
      const addOnLabels = selectedAddOns.map(k => ADD_ON_ITEMS.find(a => a.key === k)?.label ?? k);
      const payload = {
        seasonId: "2026",
        firstName: firstName.trim(), lastName: lastName.trim(),
        age: parseFloat(age) || 0, gender: gender as "boy" | "girl",
        costumeType: costumeType as CostumeType, style: style || undefined,
        topSize: topSize || undefined, bottomSize: bottomSize || undefined,
        bandSize: bandSize || undefined, girlsTopSize: girlsTopSize || undefined,
        waist: waist || undefined, shoeSize: shoeSize || undefined,
        shoeCategory: shoeCategory || undefined,
        addOns: addOnLabels.length ? addOnLabels.join(", ") : undefined,
        selectedAddOns, isModel,
        costumeBasePrice, addOnTotal, modelDiscount, totalCost,
        parentName: parentName.trim(), parentEmail: parentEmail || undefined,
        parentPhone: parentPhone || undefined,
        registrationDate: initial?.registrationDate ?? new Date(),
        paymentStatus, amountPaid, balanceOwing,
        notes: notes || undefined,
      };
      if (isEdit && initial) await updateRegistration(initial.id, payload);
      else await createRegistration(payload);
      onSaved(); onClose();
    } catch { setError("Failed to save. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  const field = (label: string, el: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {el}
    </div>
  );

  const sec = (title: string) => (
    <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9CA3AF", margin: "0.25rem 0 0.6rem" }}>{title}</p>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Participant */}
      {sec("Participant")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {field("First Name *", <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />)}
        {field("Last Name",    <input style={inputStyle} value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Last name" />)}
        {field("Age",          <input type="number" min="0" step="0.5" style={inputStyle} value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 7" />)}
        {field("Gender *",
          <select style={inputStyle} value={gender} onChange={e => setGender(e.target.value as "boy" | "girl" | "")}>
            <option value="">— Select —</option>
            <option value="girl">Girl</option>
            <option value="boy">Boy</option>
          </select>
        )}
      </div>

      {/* Costume */}
      {sec("Costume")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {field("Costume Type *",
          <select style={inputStyle} value={costumeType} onChange={e => setCostumeType(e.target.value as CostumeType | "")}>
            <option value="">— Select type —</option>
            {Object.entries(CostumeTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v} — ${COSTUME_PRICES[k] ?? "?"}</option>
            ))}
          </select>
        )}
        {field("Style / Option", <input style={inputStyle} value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g. Grown Gyal" />)}
      </div>

      {/* Model */}
      <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", padding: "0.6rem 0.75rem", borderRadius: "0.75rem", background: isModel ? "rgba(255,0,110,0.06)" : "#F9FAFB", border: `1.5px solid ${isModel ? "rgba(255,0,110,0.3)" : "#E5E7EB"}` }}>
        <input type="checkbox" checked={isModel} onChange={e => setIsModel(e.target.checked)}
          style={{ width: "1rem", height: "1rem", accentColor: "#FF006E", cursor: "pointer" }} />
        <div>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: isModel ? "#FF006E" : "#374151" }}>🌟 Model — ${MODEL_DISCOUNT} discount applied</span>
          <p style={{ fontSize: "0.72rem", color: "#6B7280", margin: 0 }}>Models receive $150 off their costume price</p>
        </div>
      </label>

      {/* Add-ons */}
      {sec("Add-Ons & Upgrades")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
        {ADD_ON_ITEMS.map(item => {
          const on = selectedAddOns.includes(item.key);
          return (
            <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.65rem", borderRadius: "0.6rem", cursor: "pointer", border: `1.5px solid ${on ? "#1A73E8" : "#E5E7EB"}`, background: on ? "rgba(26,115,232,0.05)" : "#FAFAFA" }}>
              <input type="checkbox" checked={on} onChange={() => toggleAddOn(item.key)}
                style={{ width: "0.875rem", height: "0.875rem", accentColor: "#1A73E8", cursor: "pointer", flexShrink: 0 }} />
              <span style={{ fontSize: "0.78rem", color: "#374151", flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1A73E8", flexShrink: 0 }}>${item.price}</span>
            </label>
          );
        })}
      </div>

      {/* Sizing */}
      {sec("Sizing")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
        {field("Top Size",    <input style={inputStyle} value={topSize}      onChange={e => setTopSize(e.target.value)}      placeholder="e.g. 4T" />)}
        {field("Bottom Size", <input style={inputStyle} value={bottomSize}   onChange={e => setBottomSize(e.target.value)}   placeholder="e.g. 4T" />)}
        {field("Band Size",   <input style={inputStyle} value={bandSize}     onChange={e => setBandSize(e.target.value)}     placeholder="S / L" />)}
        {field("Girls Top",   <input style={inputStyle} value={girlsTopSize} onChange={e => setGirlsTopSize(e.target.value)} placeholder="S / XL" />)}
        {field("Waist",       <input style={inputStyle} value={waist}        onChange={e => setWaist(e.target.value)}        placeholder='e.g. 22"' />)}
        {field("Shoe Size",   <input style={inputStyle} value={shoeSize}     onChange={e => setShoeSize(e.target.value)}     placeholder="e.g. 8" />)}
      </div>
      {field("Shoe Category", <input style={inputStyle} value={shoeCategory} onChange={e => setShoeCategory(e.target.value)} placeholder="e.g. Toddler, Adult, Little Kid" />)}

      {/* Parent */}
      {sec("Parent / Guardian")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {field("Name *",  <input style={inputStyle} value={parentName}  onChange={e => setParentName(e.target.value)}  placeholder="Parent name" />)}
        {field("Phone",   <input style={inputStyle} value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="e.g. 868-555-0100" />)}
        <div style={{ gridColumn: "1 / -1" }}>
          {field("Email", <input type="email" style={inputStyle} value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="email@example.com" />)}
        </div>
      </div>

      {/* Payment */}
      {sec("Payment")}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "0.875rem", padding: "0.875rem" }}>
        {/* Pricing breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#374151" }}>
            <span>Costume — {costumeType ? CostumeTypeLabels[costumeType as CostumeType] : "—"}</span>
            <span style={{ fontWeight: 600 }}>{costumeBasePrice ? `$${costumeBasePrice}` : "—"}</span>
          </div>
          {addOnTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#374151" }}>
              <span>Add-ons ({selectedAddOns.length})</span>
              <span style={{ fontWeight: 600 }}>+${addOnTotal}</span>
            </div>
          )}
          {modelDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#FF006E" }}>
              <span>Model discount 🌟</span>
              <span style={{ fontWeight: 600 }}>−${modelDiscount}</span>
            </div>
          )}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "0.35rem", display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 800, color: "#1E2029" }}>
            <span>Total</span>
            <span>${totalCost}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {field("Payment Status",
            <select style={inputStyle} value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}>
              <option value="unpaid">Unpaid</option>
              <option value="deposit">Deposit Paid (50% = ${Math.round(totalCost * 0.5)})</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Paid in Full</option>
            </select>
          )}
          {paymentStatus === "partial" && field("Amount Paid ($)",
            <input type="number" min="0" step="0.01" style={inputStyle}
              value={amountPaidOverride}
              onChange={e => setAmountPaidOverride(e.target.value)}
              placeholder={`Max $${totalCost}`} />
          )}
        </div>

        {totalCost > 0 && (
          <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span style={{ color: "#6B7280" }}>Amount paid: <strong style={{ color: "#16A34A" }}>${amountPaid.toFixed(2)}</strong></span>
            <span style={{ color: "#6B7280" }}>Balance owing: <strong style={{ color: balanceOwing > 0 ? "#DC2626" : "#16A34A" }}>${balanceOwing.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      {/* Notes */}
      {field("Notes", <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Sibling of Ciara, needs extra arm bands" />)}

      {error && <p style={{ fontSize: "0.85rem", color: "#DC2626" }}>{error}</p>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid #F3F4F6" }}>
        <button type="button" onClick={onClose}
          style={{ padding: "0.55rem 1.25rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ padding: "0.55rem 1.5rem", borderRadius: "0.75rem", border: "none", background: "#1A73E8", color: "#FFF", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" /> : <Check style={{ width: "0.875rem", height: "0.875rem" }} />}
          {isEdit ? "Save Changes" : "Add Registration"}
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [costumeFilter, setCostumeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editReg, setEditReg] = useState<Registration | undefined>();
  const [deleteReg, setDeleteReg] = useState<Registration | undefined>();
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await seedRegistrations();
      setRegistrations(await getRegistrations("2026"));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = registrations.filter(reg => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      `${reg.firstName} ${reg.lastName}`.toLowerCase().includes(q) ||
      reg.parentName.toLowerCase().includes(q) ||
      (reg.parentPhone?.includes(q) ?? false);
    const matchCostume  = costumeFilter  === "all" || reg.costumeType    === costumeFilter;
    const matchPayment  = paymentFilter  === "all" || reg.paymentStatus  === paymentFilter;
    return matchSearch && matchCostume && matchPayment;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0 }} className="font-display">Registrations</h1>
          <p style={{ color: "#6B7280", marginTop: "0.2rem", fontSize: "0.9rem" }}>
            {loading ? "Loading…" : `${registrations.length} participants registered for 2026`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outline" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
            <Download style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} /> Export
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1A73E8", color: "#fff", border: "none", fontWeight: 600, borderRadius: "0.75rem" }}>
                <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} /> Add Registration
              </Button>
            </DialogTrigger>
            <DialogContent style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", zIndex: 51,
              width: "calc(100% - 2rem)", maxWidth: "42rem", maxHeight: "90vh",
              overflow: "hidden", background: "#FFF", border: "1px solid #E5E7EB",
              borderRadius: "1rem", padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              outline: "none", display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "1.25rem 3.5rem 1rem 1.5rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>New Registration</h2>
                <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: 0 }}>2026 Season — The Black Stars</p>
              </div>
              <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
                <RegistrationForm onClose={() => setAddOpen(false)} onSaved={load} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "14rem" }}>
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#9CA3AF" }} />
          <input
            placeholder="Search by name, parent, or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "2.25rem" }}
          />
        </div>
        <Select value={costumeFilter} onValueChange={setCostumeFilter}>
          <SelectTrigger style={{ width: "13rem", border: "1.5px solid #E5E7EB", borderRadius: "0.625rem", background: "#FFFFFF", color: "#1E2029", fontSize: "0.875rem" }}>
            <Filter style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#9CA3AF" }} />
            <SelectValue placeholder="Costume Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Costumes</SelectItem>
            {Object.entries(CostumeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger style={{ width: "11rem", border: "1.5px solid #E5E7EB", borderRadius: "0.625rem", background: "#FFFFFF", color: "#1E2029", fontSize: "0.875rem" }}>
            <CreditCard style={{ width: "1rem", height: "1rem", marginRight: "0.5rem", color: "#9CA3AF" }} />
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid in Full</SelectItem>
            <SelectItem value="deposit">Deposit Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.5rem", height: "1.5rem" }} className="animate-spin" />
          <span>Loading registrations…</span>
        </div>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", textAlign: "center" }}>
          <AlertCircle style={{ width: "2rem", height: "2rem", color: "#DC2626" }} />
          <p style={{ fontWeight: 600, color: "#DC2626" }}>Could not load registrations</p>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", maxWidth: "28rem" }}>{loadError}</p>
          <button onClick={load} style={{ marginTop: "0.5rem", padding: "0.5rem 1.25rem", borderRadius: "0.75rem", border: "none", background: "#1A73E8", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !loadError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["Participant", "Costume", "Parent", "Size", "Payment", "Balance", ""].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg, i) => (
                  <motion.tr key={reg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    className="group">
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "2rem", height: "2rem", borderRadius: "999px", background: "rgba(26,115,232,0.08)", border: "1px solid rgba(26,115,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <User style={{ width: "1rem", height: "1rem", color: "#1A73E8" }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: "#1E2029", margin: 0, fontSize: "0.875rem" }}>{reg.firstName} {reg.lastName}</p>
                          <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{reg.gender === "boy" ? "Boy" : "Girl"}{reg.age ? `, ${reg.age}y` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>{CostumeTypeLabels[reg.costumeType]}</p>
                      {reg.style && <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{reg.style}</p>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>{reg.parentName}</p>
                      {reg.parentPhone && <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{reg.parentPhone}</p>}
                      {reg.parentEmail && <p style={{ fontSize: "0.72rem", color: "#6B7280", margin: 0 }}>{reg.parentEmail}</p>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>{reg.topSize || "—"}</p>
                      {reg.bandSize && <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{reg.bandSize}</p>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <PaymentBadge status={reg.paymentStatus} />
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", margin: 0 }}>${(reg.totalCost ?? (reg.amountPaid + reg.balanceOwing)).toFixed(2)}</p>
                      <p style={{ fontSize: "0.72rem", color: reg.balanceOwing > 0 ? "#DC2626" : "#16A34A", margin: 0, fontWeight: 600 }}>
                        {reg.balanceOwing > 0 ? `Owes $${reg.balanceOwing.toFixed(2)}` : "✓ Settled"}
                      </p>
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", opacity: 0 }} className="group-hover:opacity-100" >
                        <button onClick={() => setEditReg(reg)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.25rem", borderRadius: "0.4rem" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#1A73E8")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}>
                          <Pencil style={{ width: "0.85rem", height: "0.85rem" }} />
                        </button>
                        <button onClick={() => setDeleteReg(reg)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.25rem", borderRadius: "0.4rem" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#DC2626")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}>
                          <Trash2 style={{ width: "0.85rem", height: "0.85rem" }} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#9CA3AF" }}>No registrations match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Mobile cards */}
      {!loading && !loadError && (
        <>
          <style>{`.reg-mobile{display:none}@media(max-width:767px){.reg-desktop{display:none}.reg-mobile{display:flex;flex-direction:column;gap:0.75rem}}`}</style>
          <div className="reg-mobile">
            {filtered.map((reg, i) => (
              <motion.div key={reg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "999px", background: "rgba(26,115,232,0.08)", border: "1px solid rgba(26,115,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User style={{ width: "1.25rem", height: "1.25rem", color: "#1A73E8" }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#1E2029", margin: 0 }}>{reg.firstName} {reg.lastName}</p>
                      <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{reg.gender === "boy" ? "Boy" : "Girl"}{reg.age ? `, ${reg.age}y` : ""}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PaymentBadge status={reg.paymentStatus} />
                    <button onClick={() => setEditReg(reg)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.2rem" }}>
                      <Pencil style={{ width: "0.85rem", height: "0.85rem" }} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #F3F4F6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div><p style={{ color: "#9CA3AF", fontSize: "0.68rem", margin: 0 }}>Costume</p><p style={{ color: "#374151", fontSize: "0.82rem", margin: 0 }}>{CostumeTypeLabels[reg.costumeType]}{reg.isModel && <span style={{ color: "#FF006E", marginLeft: "0.3rem" }}>🌟</span>}</p></div>
                  <div><p style={{ color: "#9CA3AF", fontSize: "0.68rem", margin: 0 }}>Total</p><p style={{ color: "#374151", fontSize: "0.82rem", fontWeight: 700, margin: 0 }}>${(reg.totalCost ?? 0).toFixed(2)}</p></div>
                  <div><p style={{ color: "#9CA3AF", fontSize: "0.68rem", margin: 0 }}>Parent</p><p style={{ color: "#374151", fontSize: "0.82rem", margin: 0 }}>{reg.parentName}</p>
                    {reg.parentEmail && <p style={{ color: "#6B7280", fontSize: "0.68rem", margin: 0 }}>{reg.parentEmail}</p>}
                  </div>
                  <div>
                    <p style={{ color: "#9CA3AF", fontSize: "0.68rem", margin: 0 }}>Balance</p>
                    <p style={{ fontWeight: 700, color: reg.balanceOwing > 0 ? "#DC2626" : "#16A34A", margin: 0, fontSize: "0.82rem" }}>{reg.balanceOwing > 0 ? `$${reg.balanceOwing.toFixed(2)}` : "✓ Settled"}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <p style={{ textAlign: "center", color: "#9CA3AF", padding: "3rem 0" }}>No registrations match your filters</p>
            )}
          </div>
        </>
      )}

      {/* Summary bar */}
      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.875rem", color: "#6B7280" }}>
          <span>Total: <strong style={{ color: "#1E2029" }}>{filtered.length}</strong></span>
          <span>Paid: <strong style={{ color: "#16A34A" }}>{filtered.filter(r => r.paymentStatus === "paid").length}</strong></span>
          <span>Deposit: <strong style={{ color: "#1D4ED8" }}>{filtered.filter(r => r.paymentStatus === "deposit").length}</strong></span>
          <span>Partial: <strong style={{ color: "#D97706" }}>{filtered.filter(r => r.paymentStatus === "partial").length}</strong></span>
          <span>Unpaid: <strong style={{ color: "#DC2626" }}>{filtered.filter(r => r.paymentStatus === "unpaid").length}</strong></span>
          <span>Models: <strong style={{ color: "#FF006E" }}>{filtered.filter(r => r.isModel).length}</strong></span>
          <span style={{ marginLeft: "auto" }}>
            Outstanding: <strong style={{ color: "#DC2626" }}>{formatCurrency(filtered.reduce((s, r) => s + r.balanceOwing, 0))}</strong>
          </span>
        </motion.div>
      )}

      {/* Edit dialog */}
      {editReg && (
        <Dialog open={!!editReg} onOpenChange={v => !v && setEditReg(undefined)}>
          <DialogContent style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", zIndex: 51,
            width: "calc(100% - 2rem)", maxWidth: "42rem", maxHeight: "90vh",
            overflow: "hidden", background: "#FFF", border: "1px solid #E5E7EB",
            borderRadius: "1rem", padding: 0, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            outline: "none", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "1.25rem 3.5rem 1rem 1.5rem", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>
                Edit — {editReg.firstName} {editReg.lastName}
              </h2>
              <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: 0 }}>Update registration details</p>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
              <RegistrationForm initial={editReg} onClose={() => setEditReg(undefined)} onSaved={load} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteReg} onOpenChange={v => !v && setDeleteReg(undefined)}>
        <DialogContent style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "24rem",
          background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem",
          padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", outline: "none",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#DC2626", margin: "0 0 0.75rem" }} className="font-display">Delete Registration</h2>
          <p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.25rem" }}>
            Permanently delete <strong>{deleteReg?.firstName} {deleteReg?.lastName}</strong>?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button onClick={() => setDeleteReg(undefined)}
              style={{ padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: "1.5px solid #E5E7EB", background: "#FFF", color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
              Cancel
            </button>
            <button disabled={deleting} onClick={async () => {
              if (!deleteReg) return;
              setDeleting(true);
              try {
                await deleteRegistration(deleteReg.id);
                setRegistrations(prev => prev.filter(r => r.id !== deleteReg.id));
                setDeleteReg(undefined);
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
