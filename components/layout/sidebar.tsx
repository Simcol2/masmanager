"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Package,
  Hammer,
  Shirt,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "#1A73E8", roles: ["admin", "registrar", "production"] },
  { href: "/seasons", label: "2026 Costumes", icon: CalendarDays, color: "#FF006E", roles: ["admin", "registrar", "production"] },
  { href: "/registrations", label: "Registrations", icon: Users, color: "#FF6B35", roles: ["admin", "registrar"] },
  { href: "/gems", label: "Supplies", icon: Gem, color: "#FFD60A", roles: ["admin", "production"] },
  { href: "/appliques", label: "Appliques", icon: Sparkles, color: "#00BCD4", roles: ["admin", "production"] },
  { href: "/inventory", label: "Inventory", icon: Package, color: "#673AB7", roles: ["admin", "production"] },
  { href: "/production", label: "Production", icon: Hammer, color: "#FF5722", roles: ["admin", "production"] },
  { href: "/parent-shirts", label: "Parent Shirts", icon: Shirt, color: "#4CAF50", roles: ["admin", "registrar"] },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "#1A73E8", roles: ["admin", "registrar", "production"] },
  { href: "/settings", label: "Settings", icon: Settings, color: "#6B7280", roles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter(
    (item) => isAdmin || item.roles.includes(user?.role || "")
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen transition-all duration-300 fixed left-0 top-0 z-40",
        collapsed ? "w-20" : "w-64"
      )}
      style={{ background: "#FFFFFF", borderRight: "1px solid #E5E7EB", boxShadow: "2px 0 8px rgba(0,0,0,0.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF006E,#1A73E8)", boxShadow: "0 2px 8px rgba(255,0,110,0.35)" }}>
                <span style={{ color: "#fff", fontWeight: "bold", fontSize: "1.1rem" }}>M</span>
              </div>
              <span className="font-display text-lg font-bold whitespace-nowrap" style={{ color: "#1E2029" }}>
                MasManager
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          style={{ color: "#6B7280" }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
              style={isActive
                ? { background: `${item.color}14`, color: item.color, borderLeft: `3px solid ${item.color}`, paddingLeft: "calc(0.75rem - 3px)" }
                : { color: "#6B7280" }
              }
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3" style={{ borderTop: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm" style={{ background: "linear-gradient(135deg,#FF006E,#1A73E8)" }}>
            {user?.displayName?.charAt(0) || "U"}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0"
              >
                <p className="text-sm font-medium truncate" style={{ color: "#1E2029" }}>
                  {user?.displayName}
                </p>
                <p className="text-xs capitalize" style={{ color: "#6B7280" }}>{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          onClick={logout}
          className={cn("w-full mt-2", collapsed && "px-3")}
          style={{ color: "#6B7280" }}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2 text-sm">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
