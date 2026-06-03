"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shirt, Plus, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
type Size = typeof SIZES[number];

interface ShirtOrder {
  id: string;
  name: string;
  style: string;   // e.g. "Yellow T-Shirt", "Ghana Jersey"
  size: Size;
  qty: number;
}

// Real data from Main Black Star Tracker.xlsx - Parent T Shirts sheet
// Cheryl ordered L, Aunty Angie ordered M (shirt styles from conversation context)
const shirtOrders: ShirtOrder[] = [
  { id: "1", name: "Cheryl",      style: "Ghana Jersey",  size: "L", qty: 1 },
  { id: "2", name: "Aunty Angie", style: "Yellow T-Shirt", size: "M", qty: 1 },
];

const SIZE_COLORS: Record<Size, string> = {
  XS:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  S:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  M:    "bg-carnival-teal/10 border-carnival-teal/30",
  L:    "badge-gold",
  XL:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
  XXL:  "badge-crimson",
  XXXL: "bg-void-600/30 text-void-300 border-void-600/30",
};

const STYLE_COLORS: Record<string, string> = {
  "Ghana Jersey":   "badge-teal",
  "Yellow T-Shirt": "badge-yellow",
};

export default function ParentShirtsPage() {
  const [orders] = useState<ShirtOrder[]>(shirtOrders);

  const totalsBySize = SIZES.reduce((acc, size) => {
    acc[size] = orders.filter(o => o.size === size).reduce((s, o) => s + o.qty, 0);
    return acc;
  }, {} as Record<Size, number>);

  const totalShirts = orders.reduce((s, o) => s + o.qty, 0);

  const styleGroups = [...new Set(orders.map(o => o.style))];
  const totalsByStyle = styleGroups.reduce((acc, style) => {
    acc[style] = orders.filter(o => o.style === style).reduce((s, o) => s + o.qty, 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Parent Shirts</h1>
          <p className="mt-1" style={{ color: "rgba(180,200,240,0.6)" }}>
            {totalShirts} shirt{totalShirts !== 1 ? "s" : ""} ordered · {styleGroups.length} style{styleGroups.length !== 1 ? "s" : ""} · 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-void-700 text-void-300 hover:bg-void-800">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="gold-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Order
          </Button>
        </div>
      </motion.div>

      {/* Style breakdown */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {styleGroups.map(style => (
          <Card key={style} className="glass-card border-void-800/50">
            <CardContent className="p-4">
              <p className="text-xl font-bold text-foreground">{totalsByStyle[style]}</p>
              <Badge variant="outline" className={cn("text-xs px-2 py-0.5 rounded-md mt-1 block w-fit", STYLE_COLORS[style] ?? "badge-gold")}>
                {style}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </motion.div>

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
                      <th>Name</th>
                      <th>Style</th>
                      <th>Size</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <motion.tr key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <td className="text-void-600 text-sm">{i + 1}</td>
                        <td className="font-medium text-foreground">{order.name}</td>
                        <td>
                          <Badge variant="outline" className={cn("text-xs px-2 py-0.5 rounded-md", STYLE_COLORS[order.style] ?? "badge-gold")}>
                            {order.style}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant="outline" className={cn("text-xs border px-1.5 py-0.5 rounded-md", SIZE_COLORS[order.size])}>
                            {order.size}
                          </Badge>
                        </td>
                        <td className="text-void-300">{order.qty}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
