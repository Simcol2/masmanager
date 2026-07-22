"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, CalendarDays, Users, Package, Hammer,
  Shirt, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Sparkles, Gem, Scissors, ShoppingCart, DollarSign, Megaphone,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/",              label: "Dashboard",     icon: LayoutDashboard, color: "#1A73E8", roles: ["admin","registrar","production"] },
  { href: "/seasons",       label: "2026 Costumes", icon: CalendarDays,    color: "#FF006E", roles: ["admin","registrar","production"] },
  { href: "/registrations", label: "Registrations", icon: Users,           color: "#FF6B35", roles: ["admin","registrar"] },
  { href: "/gems",          label: "Supplies",      icon: Gem,             color: "#F59E0B", roles: ["admin","production"] },
  { href: "/appliques",     label: "Costume Pieces", icon: Sparkles,        color: "#8B5CF6", roles: ["admin","production"] },
  { href: "/patterns",      label: "Patterns",      icon: Scissors,        color: "#00BCD4", roles: ["admin","production"] },
  { href: "/inventory",     label: "Inventory",     icon: Package,         color: "#0891B2", roles: ["admin","production"] },
  { href: "/production",    label: "Production",    icon: Hammer,          color: "#F97316", roles: ["admin","production"] },
  { href: "/orders",        label: "Order List",    icon: ShoppingCart,    color: "#D97706", roles: ["admin","production"] },
  { href: "/costing",       label: "Costing",       icon: DollarSign,      color: "#10B981", roles: ["admin"] },
  { href: "/social",        label: "Social Media",  icon: Megaphone,       color: "#7C3AED", roles: ["admin","registrar"] },
  { href: "/parent-shirts", label: "Parent Shirts", icon: Shirt,           color: "#10B981", roles: ["admin","registrar"] },
  { href: "/reports",       label: "Reports",       icon: BarChart3,       color: "#1A73E8", roles: ["admin","registrar","production"] },
  { href: "/settings",      label: "Settings",      icon: Settings,        color: "#6B7280", roles: ["admin"] },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Collapsing only makes sense on desktop
  const isCollapsed = !mobile && collapsed;

  const filteredNav = navItems.filter(
    item => isAdmin || item.roles.includes(user?.role || "")
  );

  return (
    <aside style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: isCollapsed ? "5rem" : "16rem",
      background: "#FFFFFF",
      borderRight: "1px solid #E5E7EB",
      boxShadow: mobile ? "none" : "2px 0 8px rgba(0,0,0,0.05)",
      ...(mobile ? {} : { position: "fixed", left: 0, top: 0, zIndex: 40 }),
      transition: "width 0.2s ease",
      overflow: "hidden",
    }}>

      {/* Logo */}
      <div style={{
        height: "4rem", display: "flex", alignItems: "center", flexShrink: 0,
        justifyContent: isCollapsed ? "center" : "space-between",
        padding: isCollapsed ? "0 1rem" : "0 0.75rem 0 1rem",
        borderBottom: "1px solid #F3F4F6",
      }}>
        {!isCollapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FF006E,#1A73E8)", boxShadow: "0 2px 8px rgba(255,0,110,0.25)" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>M</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#111827", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
              MasManager
            </span>
          </div>
        )}
        {/* Collapse toggle only on desktop */}
        {!mobile && (
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.35rem", borderRadius: "0.375rem", color: "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#6B7280"; (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#D1D5DB"; (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            {isCollapsed ? <ChevronRight style={{ width: "0.875rem", height: "0.875rem" }} /> : <ChevronLeft style={{ width: "0.875rem", height: "0.875rem" }} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0.375rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
        {filteredNav.map(item => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              style={{
                display: "flex", alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: "0.625rem",
                padding: "0.5rem 0.625rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? item.color : "#6B7280",
                background: isActive ? `${item.color}12` : "transparent",
                borderLeft: isActive && !isCollapsed ? `3px solid ${item.color}` : "3px solid transparent",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
              {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: "0.625rem 0.5rem", borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
        {!isCollapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.375rem", marginBottom: "0.25rem" }}>
            <div style={{ width: "1.875rem", height: "1.875rem", borderRadius: "50%", background: "linear-gradient(135deg,#FF006E,#1A73E8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 }}>
              {user?.displayName?.charAt(0) || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.displayName}
              </p>
              <p style={{ fontSize: "0.68rem", color: "#9CA3AF", margin: 0, textTransform: "capitalize" }}>{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "0.5rem", padding: "0.5rem 0.625rem",
            borderRadius: "0.5rem", border: "none", background: "none",
            cursor: "pointer", color: "#9CA3AF", fontSize: "0.8rem", fontWeight: 500,
            transition: "background 0.1s, color 0.1s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
        >
          <LogOut style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
