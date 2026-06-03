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
  if (status === "paid") return (
    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D040" }}>Paid</span>
  );
  if (status === "partial") return (
    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#FEF9C3", color: "#854D0E", border: "1px solid #FDE04740" }}>Partial</span>
  );
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA40" }}>Unpaid</span>
  );
}

// ── Registration form ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  firstName: "", lastName: "", age: "", gender: "" as "" | "boy" | "girl",
  costumeType: "" as "" | CostumeType,
  style: "", topSize: "", bottomSize: "", bandSize: "",
  girlsTopSize: "", waist: "", shoeSize: "", shoeCategory: "", addOns: "",
  parentName: "", parentEmail: "", parentPhone: "",
  amountPaid: "0", totalCost: "0",
  paymentStatus: "unpaid" as PaymentStatus,
  notes: "",
};

function RegistrationForm({
  initial, onClose, onSaved,
}: {
  initial?: Registration;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState(() =>
    initial
      ? {
          firstName: initial.firstName,
          lastName: initial.lastName,
          age: String(initial.age ?? ""),
          gender: initial.gender,
          costumeType: initial.costumeType,
          style: initial.style ?? "",
          topSize: initial.topSize ?? "",
          bottomSize: initial.bottomSize ?? "",
          bandSize: initial.bandSize ?? "",
          girlsTopSize: initial.girlsTopSize ?? "",
          waist: initial.waist ?? "",
          shoeSize: initial.shoeSize ?? "",
          shoeCategory: initial.shoeCategory ?? "",
          addOns: initial.addOns ?? "",
          parentName: initial.parentName,
          parentEmail: initial.parentEmail ?? "",
          parentPhone: initial.parentPhone ?? "",
          amountPaid: String(initial.amountPaid ?? 0),
          totalCost: String((initial.amountPaid ?? 0) + (initial.balanceOwing ?? 0)),
          paymentStatus: initial.paymentStatus,
          notes: initial.notes ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.parentName.trim() || !form.costumeType || !form.gender) {
      setError("First name, parent name, costume type, and gender are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const paid = parseFloat(form.amountPaid) || 0;
      const total = parseFloat(form.totalCost) || 0;
      const payload = {
        seasonId: "2026",
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: parseFloat(form.age) || 0,
        gender: form.gender as "boy" | "girl",
        costumeType: form.costumeType as CostumeType,
        style: form.style || undefined,
        topSize: form.topSize || undefined,
        bottomSize: form.bottomSize || undefined,
        bandSize: form.bandSize || undefined,
        girlsTopSize: form.girlsTopSize || undefined,
        waist: form.waist || undefined,
        shoeSize: form.shoeSize || undefined,
        shoeCategory: form.shoeCategory || undefined,
        addOns: form.addOns || undefined,
        parentName: form.parentName.trim(),
        parentEmail: form.parentEmail || undefined,
        parentPhone: form.parentPhone || undefined,
        registrationDate: initial?.registrationDate ?? new Date(),
        paymentStatus: form.paymentStatus,
        amountPaid: paid,
        balanceOwing: Math.max(0, total - paid),
        notes: form.notes || undefined,
      };
      if (isEdit && initial) {
        await updateRegistration(initial.id, payload);
      } else {
        await createRegistration(payload);
      }
      onSaved();
      onClose();
    } catch { setError("Failed to save. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  const field = (label: string, el: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {el}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Participant */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {field("First Name *", <input style={inputStyle} value={form.firstName} onChange={e => set("firstName")(e.target.value)} placeholder="First name" />)}
        {field("Last Name", <input style={inputStyle} value={form.lastName} onChange={e => set("lastName")(e.target.value)} placeholder="Last name" />)}
        {field("Age", <input type="number" min="0" step="0.5" style={inputStyle} value={form.age} onChange={e => set("age")(e.target.value)} placeholder="e.g. 7" />)}
        {field("Gender *",
          <select style={inputStyle} value={form.gender} onChange={e => set("gender")(e.target.value as "boy" | "girl" | "")}>
            <option value="">— Select —</option>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
        )}
      </div>

      {/* Costume */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {field("Costume Type *",
          <select style={inputStyle} value={form.costumeType} onChange={e => set("costumeType")(e.target.value as CostumeType | "")}>
            <option value="">— Select —</option>
            {Object.entries(CostumeTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        {field("Style", <input style={inputStyle} value={form.style} onChange={e => set("style")(e.target.value)} placeholder="e.g. White Tank" />)}
      </div>

      {/* Sizing */}
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.5rem" }}>Sizing</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
          {field("Top Size",      <input style={inputStyle} value={form.topSize}      onChange={e => set("topSize")(e.target.value)}      placeholder="e.g. 4T" />)}
          {field("Bottom Size",   <input style={inputStyle} value={form.bottomSize}   onChange={e => set("bottomSize")(e.target.value)}   placeholder="e.g. 4T" />)}
          {field("Band Size",     <input style={inputStyle} value={form.bandSize}     onChange={e => set("bandSize")(e.target.value)}     placeholder="Small / Large" />)}
          {field("Girls Top",     <input style={inputStyle} value={form.girlsTopSize} onChange={e => set("girlsTopSize")(e.target.value)} placeholder="Small / XL" />)}
          {field("Waist",         <input style={inputStyle} value={form.waist}        onChange={e => set("waist")(e.target.value)}        placeholder='e.g. 22"' />)}
          {field("Shoe Size",     <input style={inputStyle} value={form.shoeSize}     onChange={e => set("shoeSize")(e.target.value)}     placeholder="e.g. 8" />)}
        </div>
        <div style={{ marginTop: "0.6rem" }}>
          {field("Shoe Category", <input style={inputStyle} value={form.shoeCategory} onChange={e => set("shoeCategory")(e.target.value)} placeholder="e.g. Toddler, Adult, Little Kid" />)}
        </div>
      </div>

      {/* Add-ons */}
      {field("Add-ons", <input style={inputStyle} value={form.addOns} onChange={e => set("addOns")(e.target.value)} placeholder="e.g. Extra necklace, Crown upgrade" />)}

      {/* Parent */}
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.5rem" }}>Parent / Guardian</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {field("Name *",  <input style={inputStyle} value={form.parentName}  onChange={e => set("parentName")(e.target.value)}  placeholder="Parent name" />)}
          {field("Phone",   <input style={inputStyle} value={form.parentPhone} onChange={e => set("parentPhone")(e.target.value)} placeholder="e.g. 868-555-0100" />)}
          <div style={{ gridColumn: "1 / -1" }}>
            {field("Email", <input type="email" style={inputStyle} value={form.parentEmail} onChange={e => set("parentEmail")(e.target.value)} placeholder="email@example.com" />)}
          </div>
        </div>
      </div>

      {/* Payment */}
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.5rem" }}>Payment</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
          {field("Amount Paid ($)", <input type="number" min="0" step="0.01" style={inputStyle} value={form.amountPaid} onChange={e => set("amountPaid")(e.target.value)} />)}
          {field("Total Cost ($)",  <input type="number" min="0" step="0.01" style={inputStyle} value={form.totalCost}  onChange={e => set("totalCost")(e.target.value)} />)}
          {field("Status",
            <select style={inputStyle} value={form.paymentStatus} onChange={e => set("paymentStatus")(e.target.value as PaymentStatus)}>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          )}
        </div>
      </div>

      {/* Notes */}
      {field("Notes", <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="e.g. Sibling of ..." />)}

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
            <SelectItem value="paid">Paid</SelectItem>
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
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>{reg.topSize || "—"}</p>
                      {reg.bandSize && <p style={{ fontSize: "0.72rem", color: "#9CA3AF", margin: 0 }}>{reg.bandSize}</p>}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <PaymentBadge status={reg.paymentStatus} />
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: reg.balanceOwing > 0 ? "#DC2626" : "#16A34A" }}>
                        {formatCurrency(reg.balanceOwing)}
                      </span>
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
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #F3F4F6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <div><p style={{ color: "#9CA3AF", fontSize: "0.72rem", margin: 0 }}>Costume</p><p style={{ color: "#374151", margin: 0 }}>{CostumeTypeLabels[reg.costumeType]}</p></div>
                  <div><p style={{ color: "#9CA3AF", fontSize: "0.72rem", margin: 0 }}>Style</p><p style={{ color: "#374151", margin: 0 }}>{reg.style || "—"}</p></div>
                  <div><p style={{ color: "#9CA3AF", fontSize: "0.72rem", margin: 0 }}>Parent</p><p style={{ color: "#374151", margin: 0 }}>{reg.parentName}</p></div>
                  <div>
                    <p style={{ color: "#9CA3AF", fontSize: "0.72rem", margin: 0 }}>Balance</p>
                    <p style={{ fontWeight: 600, color: reg.balanceOwing > 0 ? "#DC2626" : "#16A34A", margin: 0 }}>{formatCurrency(reg.balanceOwing)}</p>
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
          <span>Partial: <strong style={{ color: "#D97706" }}>{filtered.filter(r => r.paymentStatus === "partial").length}</strong></span>
          <span>Unpaid: <strong style={{ color: "#DC2626" }}>{filtered.filter(r => r.paymentStatus === "unpaid").length}</strong></span>
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
