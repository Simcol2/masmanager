"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Plus, Filter, Download, MoreHorizontal, User,
  CreditCard, Loader2, Check, Pencil, Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
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
  if (status === "paid")    return <Badge className="badge-emerald">Paid</Badge>;
  if (status === "partial") return <Badge className="badge-gold">Partial</Badge>;
  return <Badge className="badge-crimson">Unpaid</Badge>;
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Registrations</h1>
          <p className="text-void-400 mt-1">
            {loading ? "Loading…" : `${registrations.length} participants registered for 2026`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-void-700 text-void-300 hover:bg-void-800">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gold-btn"><Plus className="w-4 h-4 mr-2" /> Add Registration</Button>
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
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-void-500" />
          <Input placeholder="Search by name, parent, or phone…" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} className="luxury-input pl-10" />
        </div>
        <Select value={costumeFilter} onValueChange={setCostumeFilter}>
          <SelectTrigger className="luxury-input w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-void-500" />
            <SelectValue placeholder="Costume Type" />
          </SelectTrigger>
          <SelectContent className="bg-void-900 border-void-700">
            <SelectItem value="all">All Costumes</SelectItem>
            {Object.entries(CostumeTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="luxury-input w-full sm:w-[180px]">
            <CreditCard className="w-4 h-4 mr-2 text-void-500" />
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent className="bg-void-900 border-void-700">
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Loading / error states */}
      {loading && (
        <div className="flex items-center justify-center h-48 gap-3 text-void-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading registrations…</span>
        </div>
      )}
      {!loading && loadError && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <p className="text-crimson font-medium">Could not load registrations</p>
          <p className="text-sm text-void-400 max-w-md">{loadError}</p>
          <Button className="gold-btn mt-2" onClick={load}>Retry</Button>
        </div>
      )}

      {/* Desktop table */}
      {!loading && !loadError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="hidden md:block">
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="luxury-table w-full">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Costume</th>
                    <th>Parent</th>
                    <th>Size</th>
                    <th>Payment</th>
                    <th>Balance</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((reg, i) => (
                    <motion.tr key={reg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }} className="group cursor-pointer">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                            <User className="w-4 h-4 text-gold-400" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{reg.firstName} {reg.lastName}</p>
                            <p className="text-xs text-void-500">{reg.gender === "boy" ? "Boy" : "Girl"}{reg.age ? `, ${reg.age}y` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-void-300">{CostumeTypeLabels[reg.costumeType]}</span>
                        <p className="text-xs text-void-500">{reg.style}</p>
                      </td>
                      <td>
                        <span className="text-sm text-void-300">{reg.parentName}</span>
                        {reg.parentPhone && <p className="text-xs text-void-500">{reg.parentPhone}</p>}
                      </td>
                      <td>
                        <span className="text-sm text-void-300">{reg.topSize}</span>
                        <p className="text-xs text-void-500">{reg.bandSize}</p>
                      </td>
                      <td><PaymentBadge status={reg.paymentStatus} /></td>
                      <td>
                        <span className={cn("text-sm font-medium", reg.balanceOwing > 0 ? "text-crimson" : "text-emerald")}>
                          {formatCurrency(reg.balanceOwing)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </Card>
        </motion.div>
      )}

      {/* Mobile cards */}
      {!loading && !loadError && (
        <div className="md:hidden space-y-3">
          {filtered.map((reg, i) => (
            <motion.div key={reg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 rounded-lg border border-void-800/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                    <User className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{reg.firstName} {reg.lastName}</p>
                    <p className="text-xs text-void-500">{reg.gender === "boy" ? "Boy" : "Girl"}{reg.age ? `, ${reg.age}y` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PaymentBadge status={reg.paymentStatus} />
                  <button onClick={() => setEditReg(reg)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.2rem" }}>
                    <Pencil style={{ width: "0.85rem", height: "0.85rem" }} />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-void-800/50 grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-void-500 text-xs">Costume</p><p className="text-void-300">{CostumeTypeLabels[reg.costumeType]}</p></div>
                <div><p className="text-void-500 text-xs">Style</p><p className="text-void-300">{reg.style || "—"}</p></div>
                <div><p className="text-void-500 text-xs">Parent</p><p className="text-void-300">{reg.parentName}</p></div>
                <div>
                  <p className="text-void-500 text-xs">Balance</p>
                  <p className={cn("font-medium", reg.balanceOwing > 0 ? "text-crimson" : "text-emerald")}>
                    {formatCurrency(reg.balanceOwing)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-void-500 py-12">No registrations match your filters</p>
          )}
        </div>
      )}

      {/* Summary bar */}
      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-4 text-sm text-void-500">
          <span>Total: <strong className="text-foreground">{filtered.length}</strong></span>
          <span>Paid: <strong className="text-emerald">{filtered.filter(r => r.paymentStatus === "paid").length}</strong></span>
          <span>Partial: <strong className="text-gold-400">{filtered.filter(r => r.paymentStatus === "partial").length}</strong></span>
          <span>Unpaid: <strong className="text-crimson">{filtered.filter(r => r.paymentStatus === "unpaid").length}</strong></span>
          <span className="ml-auto">
            Outstanding: <strong className="text-crimson">{formatCurrency(filtered.reduce((s, r) => s + r.balanceOwing, 0))}</strong>
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
        <DialogContent className="glass-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-crimson">Delete Registration</DialogTitle>
          </DialogHeader>
          <p className="text-foreground text-sm mt-2">
            Permanently delete <strong>{deleteReg?.firstName} {deleteReg?.lastName}</strong>?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteReg(undefined)} className="border-border text-muted-foreground">Cancel</Button>
            <Button disabled={deleting} onClick={async () => {
              if (!deleteReg) return;
              setDeleting(true);
              try {
                await deleteRegistration(deleteReg.id);
                setRegistrations(prev => prev.filter(r => r.id !== deleteReg.id));
                setDeleteReg(undefined);
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
