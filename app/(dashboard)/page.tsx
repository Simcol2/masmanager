"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Package, Shirt, ArrowRight, Plus, Library, Sparkles, Gem, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Real 2026 data only ───────────────────────────────────────────────────────

const REGISTRATIONS_BY_TYPE: Record<string, { label: string; count: number; color: string }> = {
  girls_backline:       { label: "Girls Backline",        count: 3, color: "#FF6B9D" },
  boys_backline:        { label: "Boys Backline",         count: 4, color: "#6690F5" },
  toddler_frontline:    { label: "Toddler Frontline",     count: 1, color: "#FFD700" },
  girls_frontline:      { label: "Girls Frontline",       count: 0, color: "#FF8C69" },
  boys_frontline:       { label: "Boys Frontline",        count: 0, color: "#00D4B8" },
  girls_ultra_frontline:{ label: "Girls Ultra Frontline", count: 1, color: "#9B5DE5" },
  boys_ultra_frontline: { label: "Boys Ultra Frontline",  count: 3, color: "#80FF44" },
};

const TOTAL_REGISTRATIONS = Object.values(REGISTRATIONS_BY_TYPE).reduce((s, x) => s + x.count, 0);

const PARENT_SHIRTS = [
  { name: "Cheryl",      style: "Ghana Jersey",   size: "L" },
  { name: "Aunty Angie", style: "Yellow T-Shirt", size: "M" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            The Black Stars <span className="gold-text">2026</span>
          </h1>
          <p className="mt-1" style={{ color: "rgba(180,200,240,0.6)" }}>
            Welcome back, {user?.displayName || "Admin"}
          </p>
        </div>
        <Link href="/registrations">
          <Button className="gold-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Registration
          </Button>
        </Link>
      </motion.div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { title: "Registrations", value: TOTAL_REGISTRATIONS, href: "/registrations", icon: Users, color: "#FF6B9D" },
          { title: "Shirt Orders", value: PARENT_SHIRTS.length, href: "/parent-shirts", icon: Shirt, color: "#00D4B8" },
          { title: "Costume Pieces", value: 14, href: "/pieces", icon: Library, color: "#FFD700" },
          { title: "Appliques", value: "-", href: "/appliques", icon: Sparkles, color: "#9B5DE5" },
        ].map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Link href={card.href}>
              <Card className="glass-card border-void-800/50 hover:border-void-700/60 transition-colors cursor-pointer">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(180,200,240,0.5)" }}>{card.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Registration breakdown + Quick links */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Registration breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(180,200,240,0.6)" }}>
                  Registrations by Costume Type
                </CardTitle>
                <Badge className="badge-gold text-xs">{TOTAL_REGISTRATIONS} Total</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.values(REGISTRATIONS_BY_TYPE).map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-void-300 w-40 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: TOTAL_REGISTRATIONS > 0 ? `${(item.count / TOTAL_REGISTRATIONS) * 100}%` : "0%" }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground w-6 text-right shrink-0">{item.count}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-void-800/40">
                <Link href="/registrations">
                  <Button variant="ghost" className="w-full text-sm" style={{ color: "#D4AF37" }}>
                    View All Registrations <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parent shirts summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(180,200,240,0.6)" }}>
                  Parent Shirt Orders
                </CardTitle>
                <Shirt className="w-4 h-4" style={{ color: "#00D4B8" }} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {PARENT_SHIRTS.map(s => (
                <div key={s.name} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-sm text-foreground font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,212,184,0.12)", color: "#00D4B8", border: "1px solid rgba(0,212,184,0.25)" }}>
                      {s.style}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.25)" }}>
                      {s.size}
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-void-800/40 mt-2">
                <Link href="/parent-shirts">
                  <Button variant="ghost" className="w-full text-sm" style={{ color: "#00D4B8" }}>
                    Manage Orders <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick access tiles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(180,200,240,0.5)" }}>
          Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "2026 Season",    href: "/seasons",      icon: CalendarDays, color: "#D4AF37" },
            { label: "Piece Library",  href: "/pieces",       icon: Library,      color: "#FF6B9D" },
            { label: "Supplies",        href: "/gems",         icon: Gem,          color: "#FFD700" },
            { label: "Appliques",      href: "/appliques",    icon: Sparkles,     color: "#9B5DE5" },
            { label: "Inventory",      href: "/inventory",    icon: Package,      color: "#00D4B8" },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <div className="glass-card border-void-800/50 hover:border-void-700/60 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] text-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="text-xs font-medium text-void-300">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
