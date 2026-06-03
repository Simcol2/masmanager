"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shirt, Plus, Download, Loader2, AlertCircle, X } from "lucide-react";
import { getParentShirts, seedParentShirts, createParentShirt } from "@/lib/services/parent-shirts";
import type { ParentShirt } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
type Size = typeof SIZES[number];

const SIZE_BG: Record<Size, string> = {
  XS: "#EDE9FE", S: "#DBEAFE", M: "#CCFBF1", L: "#FEF9C3",
  XL: "#FFEDD5", XXL: "#FEE2E2", XXXL: "#F3F4F6",
};
const SIZE_COLOR: Record<Size, string> = {
  XS: "#7C3AED", S: "#1D4ED8", M: "#0F766E", L: "#854D0E",
  XL: "#9A3412", XXL: "#991B1B", XXXL: "#374151",
};

const STYLE_BG: Record<string, string> = {
  "Ghana Jersey": "#CCFBF1",
  "Yellow T-Shirt": "#FEF9C3",
};
const STYLE_COLOR: Record<string, string> = {
  "Ghana Jersey": "#0F766E",
  "Yellow T-Shirt": "#854D0E",
};

const EMPTY_FORM = { parentName: "", participantName: "", style: "", size: "" as Size | "", quantity: 1 };

function SizePill({ size, count }: { size: Size; count: number }) {
  const active = count > 0;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
      padding: "0.5rem 0.25rem", borderRadius: "0.75rem",
      background: active ? SIZE_BG[size] : "#F9FAFB",
      border: `1px solid ${active ? SIZE_COLOR[size] + "40" : "#E5E7EB"}`,
      opacity: active ? 1 : 0.5,
      minWidth: "2.75rem",
    }}>
      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: active ? SIZE_COLOR[size] : "#9CA3AF", lineHeight: 1 }}>{count}</span>
      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: active ? SIZE_COLOR[size] : "#9CA3AF" }}>{size}</span>
    </div>
  );
}

export default function ParentShirtsPage() {
  const [orders, setOrders] = useState<ParentShirt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      await seedParentShirts();
      setOrders(await getParentShirts("2026"));
    } catch (e) { setError("Failed to load."); console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const totalShirts = orders.reduce((s, o) => s + o.quantity, 0);
  const styles = [...new Set(orders.map(o => o.style).filter(Boolean))] as string[];
  const bySize = SIZES.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.size === s).reduce((n, o) => n + o.quantity, 0);
    return acc;
  }, {} as Record<Size, number>);

  async function handleAdd() {
    if (!form.parentName || !form.size) return;
    setSaving(true);
    try {
      await createParentShirt({
        seasonId: "2026", parentName: form.parentName,
        participantName: form.participantName || undefined,
        style: form.style || undefined,
        size: form.size as Size, quantity: form.quantity,
      });
      await load(); setAddOpen(false); setForm(EMPTY_FORM);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Parent Shirts</h1>
          <p style={{ color: "#6B7280", marginTop: "0.2rem", fontSize: "0.9rem" }}>
            {loading ? "Loading…" : `${totalShirts} shirt${totalShirts !== 1 ? "s" : ""} · ${styles.length} style${styles.length !== 1 ? "s" : ""} · 2026`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outline" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
            <Download style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} /> Export
          </Button>
          <Button onClick={() => setAddOpen(true)} style={{ background: "#1A73E8", color: "#fff", border: "none", fontWeight: 600, borderRadius: "0.75rem" }}>
            <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.4rem" }} /> Add Order
          </Button>
        </div>
      </motion.div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "#9CA3AF" }}>
          <Loader2 style={{ width: "1.5rem", height: "1.5rem", animation: "spin 1s linear infinite" }} className="animate-spin" />
          <span>Loading orders…</span>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", borderRadius: "0.75rem", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
          <AlertCircle style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} />
          <span style={{ fontSize: "0.875rem" }}>{error}</span>
          <button onClick={load} style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary row */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", margin: 0 }}>Total Orders</p>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "#1E2029", margin: "0.2rem 0 0", lineHeight: 1 }}>{orders.length}</p>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", margin: 0 }}>Total Shirts</p>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "#1E2029", margin: "0.2rem 0 0", lineHeight: 1 }}>{totalShirts}</p>
            </div>
          </motion.div>

          {/* Style breakdown */}
          {styles.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.75rem" }}>By Style</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {styles.map(style => {
                  const count = orders.filter(o => o.style === style).reduce((n, o) => n + o.quantity, 0);
                  return (
                    <div key={style} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: "999px", background: STYLE_BG[style] ?? "#F3F4F6", border: `1px solid ${(STYLE_COLOR[style] ?? "#6B7280") + "40"}` }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: STYLE_COLOR[style] ?? "#374151", lineHeight: 1 }}>{count}</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: STYLE_COLOR[style] ?? "#374151" }}>{style}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Size breakdown */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.75rem" }}>By Size</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SIZES.map(s => <SizePill key={s} size={s} count={bySize[s]} />)}
            </div>
          </motion.div>

          {/* Orders table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #F3F4F6" }}>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E2029", margin: 0 }}>All Orders</h2>
            </div>
            {orders.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", gap: "0.75rem", color: "#9CA3AF" }}>
                <Shirt style={{ width: "2.5rem", height: "2.5rem" }} />
                <p style={{ fontSize: "0.875rem" }}>No shirt orders yet</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      {["#", "Parent Name", "Style", "Size", "Qty"].map(h => (
                        <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        style={{ borderBottom: i < orders.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "#9CA3AF", fontWeight: 500 }}>{i + 1}</td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#1E2029" }}>{order.parentName}</td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          {order.style ? (
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "999px", background: STYLE_BG[order.style] ?? "#F3F4F6", color: STYLE_COLOR[order.style] ?? "#374151" }}>
                              {order.style}
                            </span>
                          ) : <span style={{ color: "#D1D5DB", fontSize: "0.8rem" }}>—</span>}
                        </td>
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "0.375rem", background: SIZE_BG[order.size as Size] ?? "#F3F4F6", color: SIZE_COLOR[order.size as Size] ?? "#374151" }}>
                            {order.size}
                          </span>
                        </td>
                        <td style={{ padding: "0.875rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>{order.quantity}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Add Order Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 51, width: "calc(100% - 2rem)", maxWidth: "28rem",
          background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem",
          padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", outline: "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E2029", margin: 0 }}>Add Shirt Order</h2>
            <button onClick={() => setAddOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.25rem" }}>
              <X style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Parent Name *</label>
              <Input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="e.g. Cheryl" />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Participant Name</label>
              <Input value={form.participantName} onChange={e => setForm(f => ({ ...f, participantName: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Style</label>
              <Input value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} placeholder="e.g. Ghana Jersey" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Size *</label>
                <Select value={form.size} onValueChange={v => setForm(f => ({ ...f, size: v as Size }))}>
                  <SelectTrigger><SelectValue placeholder="Size" /></SelectTrigger>
                  <SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "0.35rem" }}>Quantity</label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.25rem" }}>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving || !form.parentName || !form.size}
                style={{ background: "#1A73E8", color: "#fff", border: "none", fontWeight: 600, borderRadius: "0.75rem" }}>
                {saving && <Loader2 style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} className="animate-spin" />}
                Save Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
