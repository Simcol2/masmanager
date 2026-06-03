"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shirt, Plus, Download, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getParentShirts, seedParentShirts, createParentShirt } from "@/lib/services/parent-shirts";
import type { ParentShirt } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
type Size = typeof SIZES[number];

const SIZE_COLORS: Record<Size, string> = {
  XS:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  S:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  M:    "bg-carnival-teal/10 border-carnival-teal/30",
  L:    "badge-gold",
  XL:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
  XXL:  "badge-crimson",
  XXXL: "bg-void-600/30 text-void-300 border-void-600/30",
};

const EMPTY_FORM = {
  parentName: "",
  participantName: "",
  style: "",
  size: "" as Size | "",
  quantity: 1,
};

export default function ParentShirtsPage() {
  const [orders, setOrders] = useState<ParentShirt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      await seedParentShirts();
      const data = await getParentShirts("2026");
      setOrders(data);
    } catch (e) {
      setError("Failed to load shirt orders.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalsBySize = SIZES.reduce((acc, size) => {
    acc[size] = orders.filter(o => o.size === size).reduce((s, o) => s + o.quantity, 0);
    return acc;
  }, {} as Record<Size, number>);

  const totalShirts = orders.reduce((s, o) => s + o.quantity, 0);

  const styleGroups = [...new Set(orders.map(o => o.style).filter(Boolean))] as string[];
  const totalsByStyle = styleGroups.reduce((acc, style) => {
    acc[style] = orders.filter(o => o.style === style).reduce((s, o) => s + o.quantity, 0);
    return acc;
  }, {} as Record<string, number>);

  const styleColor = (style: string) => {
    const STYLE_COLORS: Record<string, string> = {
      "Ghana Jersey":   "badge-teal",
      "Yellow T-Shirt": "badge-yellow",
    };
    return STYLE_COLORS[style] ?? "badge-gold";
  };

  async function handleAdd() {
    if (!form.parentName || !form.size) return;
    setSaving(true);
    try {
      await createParentShirt({
        seasonId: "2026",
        parentName: form.parentName,
        participantName: form.participantName || undefined,
        style: form.style || undefined,
        size: form.size as Size,
        quantity: form.quantity,
      });
      await load();
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Parent Shirts</h1>
          <p className="mt-1" style={{ color: "rgba(180,200,240,0.6)" }}>
            {loading ? "Loading…" : `${totalShirts} shirt${totalShirts !== 1 ? "s" : ""} ordered · ${styleGroups.length} style${styleGroups.length !== 1 ? "s" : ""} · 2026`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-void-700 text-void-300 hover:bg-void-800">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="gold-btn" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Order
          </Button>
        </div>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-void-500" />
          <span className="text-void-400">Loading orders…</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={load} className="ml-auto text-red-400">Retry</Button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Style breakdown */}
          {styleGroups.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {styleGroups.map(style => (
                <Card key={style} className="glass-card border-void-800/50">
                  <CardContent className="p-4">
                    <p className="text-xl font-bold text-foreground">{totalsByStyle[style]}</p>
                    <Badge variant="outline" className={cn("text-xs px-2 py-0.5 rounded-md mt-1 block w-fit", styleColor(style))}>
                      {style}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Size summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {SIZES.map(size => (
              <Card key={size} className={cn("glass-card border-void-800/50", totalsBySize[size] === 0 && "opacity-40")}>
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{totalsBySize[size]}</p>
                  <Badge variant="outline" className={cn("text-xs border mt-1 px-1.5 py-0.5 rounded-md", SIZE_COLORS[size])}>
                    {size}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Orders table */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-void-800/50">
              <CardHeader>
                <CardTitle className="text-base font-display text-foreground">All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <Shirt className="w-10 h-10 text-void-700" />
                    <p className="text-void-400">No shirt orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="luxury-table w-full">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Parent Name</th>
                          <th>Style</th>
                          <th>Size</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, i) => (
                          <motion.tr key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                            <td className="text-void-600 text-sm">{i + 1}</td>
                            <td className="font-medium text-foreground">{order.parentName}</td>
                            <td>
                              {order.style ? (
                                <Badge variant="outline" className={cn("text-xs px-2 py-0.5 rounded-md", styleColor(order.style))}>
                                  {order.style}
                                </Badge>
                              ) : <span className="text-void-600 text-sm">—</span>}
                            </td>
                            <td>
                              <Badge variant="outline" className={cn("text-xs border px-1.5 py-0.5 rounded-md", SIZE_COLORS[order.size as Size])}>
                                {order.size}
                              </Badge>
                            </td>
                            <td className="text-void-300">{order.quantity}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Add Order Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shirt Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-void-400 uppercase tracking-wide block mb-1">Parent Name *</label>
              <Input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="e.g. Cheryl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-void-400 uppercase tracking-wide block mb-1">Participant Name</label>
              <Input value={form.participantName} onChange={e => setForm(f => ({ ...f, participantName: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs font-semibold text-void-400 uppercase tracking-wide block mb-1">Style</label>
              <Input value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} placeholder="e.g. Ghana Jersey" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-void-400 uppercase tracking-wide block mb-1">Size *</label>
                <Select value={form.size} onValueChange={v => setForm(f => ({ ...f, size: v as Size }))}>
                  <SelectTrigger><SelectValue placeholder="Size" /></SelectTrigger>
                  <SelectContent>
                    {SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-void-400 uppercase tracking-wide block mb-1">Quantity</label>
                <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="gold-btn" onClick={handleAdd} disabled={saving || !form.parentName || !form.size}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
