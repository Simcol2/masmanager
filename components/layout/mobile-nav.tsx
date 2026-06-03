"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Shirt,
  BarChart3,
  CalendarDays,
  Gem,
  Sparkles,
} from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "Home", icon: LayoutDashboard, color: "#1A73E8", roles: ["admin", "registrar", "production"] },
  { href: "/seasons", label: "Costumes", icon: CalendarDays, color: "#FF006E", roles: ["admin", "registrar", "production"] },
  { href: "/registrations", label: "Register", icon: Users, color: "#FF6B35", roles: ["admin", "registrar"] },
  { href: "/gems", label: "Supplies", icon: Gem, color: "#FFD60A", roles: ["admin", "production"] },
  { href: "/appliques", label: "Appliques", icon: Sparkles, color: "#00BCD4", roles: ["admin", "production"] },
  { href: "/parent-shirts", label: "Shirts", icon: Shirt, color: "#4CAF50", roles: ["admin", "registrar"] },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "#1A73E8", roles: ["admin", "registrar", "production"] },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const filteredNav = mobileNavItems.filter(
    (item) => isAdmin || item.roles.includes(user?.role || "")
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: "#FFFFFF", borderTop: "1px solid #E5E7EB", boxShadow: "0 -2px 8px rgba(0,0,0,0.08)" }}>
      <div className="flex items-center justify-around h-16">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors min-w-0"
              style={{ color: isActive ? item.color : "#9CA3AF" }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: item.color }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
