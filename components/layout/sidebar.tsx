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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "registrar", "production"] },
  { href: "/seasons", label: "Seasons", icon: CalendarDays, roles: ["admin"] },
  { href: "/registrations", label: "Registrations", icon: Users, roles: ["admin", "registrar"] },
  { href: "/inventory", label: "Inventory", icon: Package, roles: ["admin", "production"] },
  { href: "/production", label: "Production", icon: Hammer, roles: ["admin", "production"] },
  { href: "/parent-shirts", label: "Parent Shirts", icon: Shirt, roles: ["admin", "registrar"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "registrar", "production"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
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
        "hidden lg:flex flex-col h-screen bg-void-950 border-r border-void-800/50 transition-all duration-300 fixed left-0 top-0 z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-void-800/50">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-sm bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                <span className="text-gold-400 font-display font-bold text-lg">M</span>
              </div>
              <span className="font-display text-lg font-bold gold-text whitespace-nowrap">
                MasManager
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-void-500 hover:text-gold-400 hover:bg-gold-500/5"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 group",
                isActive
                  ? "bg-gold-500/5 text-gold-400 border-l-2 border-gold-500"
                  : "text-void-400 hover:text-void-200 hover:bg-void-800/30 border-l-2 border-transparent"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-gold-400")} />
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
      <div className="p-3 border-t border-void-800/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20 flex-shrink-0">
            <span className="text-gold-400 text-xs font-bold">
              {user?.displayName?.charAt(0) || "U"}
            </span>
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0"
              >
                <p className="text-sm font-medium text-void-200 truncate">
                  {user?.displayName}
                </p>
                <p className="text-xs text-void-500 capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full mt-2 text-void-500 hover:text-crimson hover:bg-crimson/5",
            collapsed && "px-3"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2 text-sm">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
