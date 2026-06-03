"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Users, Package, Shirt, ArrowRight, Plus, Library, Sparkles, Gem, CalendarDays, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getRegistrations } from "@/lib/services/registrations";
import { type CostumeType, CostumeTypeLabels } from "@/types";

const COSTUME_ORDER: CostumeType[] = [
  "girls_backline", "boys_backline", "toddler_frontline",
  "girls_frontline", "boys_frontline", "girls_ultra_frontline", "boys_ultra_frontline",
];
const TYPE_COLORS: Record<CostumeType, string> = {
  girls_backline: "#FF006E", boys_backline: "#1A73E8", toddler_frontline: "#FFD60A",
  girls_frontline: "#FF6B35", boys_frontline: "#00BCD4",
  girls_ultra_frontline: "#673AB7", boys_ultra_frontline: "#4CAF50",
};

const QUICK_LINKS = [
  { label: "2026 Season",   href: "/seasons",   icon: CalendarDays, color: "#FF006E" },
  { label: "Piece Library", href: "/pieces",    icon: Library,      color: "#1A73E8" },
  { label: "Supplies",      href: "/gems",      icon: Gem,          color: "#FFD60A" },
  { label: "Appliques",     href: "/appliques", icon: Sparkles,     color: "#673AB7" },
  { label: "Inventory",     href: "/inventory", icon: Package,      color: "#00BCD4" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Awaited<ReturnType<typeof getRegistrations>>>([]);

  useEffect(() => {
    getRegistrations("2026").then(setRegistrations).catch(console.error);
  }, []);

  const total = registrations.length;
  const regsByType = COSTUME_ORDER.map(type => ({
    label: CostumeTypeLabels[type],
    count: registrations.filter(r => r.costumeType === type).length,
    color: TYPE_COLORS[type],
  }));

  const STAT_CARDS = [
    { title: "Registrations", value: total, href: "/registrations", icon: Users,    bg: "#FF006E", light: "rgba(255,0,110,0.1)" },
    { title: "Shirt Orders",  value: "—",   href: "/parent-shirts", icon: Shirt,    bg: "#00BCD4", light: "rgba(0,188,212,0.1)" },
    { title: "Costume Pieces",value: "—",   href: "/pieces",        icon: Library,  bg: "#FFD60A", light: "rgba(255,214,10,0.12)" },
    { title: "Appliques",     value: "—",   href: "/appliques",     icon: Sparkles, bg: "#673AB7", light: "rgba(103,58,183,0.1)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0, lineHeight: 1.2 }}>
            The Black Stars{" "}
            <span style={{ color: "#FF006E" }}>2026</span>
          </h1>
          <p style={{ color: "#6B7280", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            Welcome back, {user?.displayName || "Admin"}
          </p>
        </div>
        <Link href="/registrations">
          <Button style={{ background: "#1A73E8", color: "#fff", fontWeight: 600, borderRadius: "0.75rem", boxShadow: "0 2px 8px rgba(26,115,232,0.35)", border: "none" }}>
            <Plus style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} /> Add Registration
          </Button>
        </Link>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}
        className="sm:grid-cols-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Link href={card.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "1rem",
                padding: "1.25rem",
                cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", margin: 0 }}>{card.title}</p>
                    <p style={{ fontSize: "2rem", fontWeight: 800, color: "#1E2029", marginTop: "0.25rem", lineHeight: 1 }}>{card.value}</p>
                  </div>
                  <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: card.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <card.icon style={{ width: "1.2rem", height: "1.2rem", color: card.bg }} />
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem", height: "3px", borderRadius: "2px", background: card.bg, opacity: 0.8 }} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main content: breakdown + shirts */}
      <div style={{ display: "grid", gap: "1.5rem" }} className="lg:grid-cols-3">
        {/* Registration breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
          className="lg:col-span-2">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", margin: 0 }}>Registrations by Type</h2>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E2029", margin: "0.2rem 0 0" }}>{total} <span style={{ fontSize: "1rem", color: "#9CA3AF", fontWeight: 500 }}>masqueraders</span></p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(26,115,232,0.08)", padding: "0.4rem 0.75rem", borderRadius: "999px" }}>
              <TrendingUp style={{ width: "0.9rem", height: "0.9rem", color: "#1A73E8" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1A73E8" }}>2026 Season</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {regsByType.map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.85rem", color: "#374151", width: "11rem", flexShrink: 0 }}>{item.label}</span>
                <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "#F3F4F6", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: total > 0 ? `${(item.count / total) * 100}%` : "0%" }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    style={{ height: "100%", borderRadius: "4px", background: item.color }}
                  />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E2029", width: "1.5rem", textAlign: "right", flexShrink: 0 }}>{item.count}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #F3F4F6" }}>
            <Link href="/registrations">
              <Button variant="ghost" style={{ width: "100%", color: "#1A73E8", fontWeight: 600, fontSize: "0.875rem" }}>
                View All Registrations <ArrowRight style={{ width: "1rem", height: "1rem", marginLeft: "0.5rem" }} />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Parent shirts — link through to dedicated page */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", margin: 0 }}>Parent Shirt Orders</h2>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shirt style={{ width: "1rem", height: "1rem", color: "#00BCD4" }} />
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem 0" }}>
            <p style={{ fontSize: "0.875rem", color: "#9CA3AF", textAlign: "center" }}>View and manage shirt orders on the Parent Shirts page.</p>
          </div>
          <div style={{ paddingTop: "1rem", borderTop: "1px solid #F3F4F6" }}>
            <Link href="/parent-shirts">
              <Button variant="ghost" style={{ width: "100%", color: "#00BCD4", fontWeight: 600, fontSize: "0.875rem" }}>
                Manage Orders <ArrowRight style={{ width: "1rem", height: "1rem", marginLeft: "0.5rem" }} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick access */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", marginBottom: "0.75rem" }}>Quick Access</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }} className="sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_LINKS.map(item => (
            <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "1rem",
                padding: "1.25rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.6rem",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                textAlign: "center",
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = item.color; el.style.boxShadow = `0 4px 16px ${item.color}22`; el.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#E5E7EB"; el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; el.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon style={{ width: "1.2rem", height: "1.2rem", color: item.color }} />
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
