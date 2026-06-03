"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  Hammer,
  Shirt,
  BarChart3,
  CalendarDays,
  Gem,
  Sparkles,
} from "lucide-react";

const mobileNavItems = [
  { href: "/", label: "Home", icon: LayoutDashboard, roles: ["admin", "registrar", "production"] },
  { href: "/seasons", label: "Costumes", icon: CalendarDays, roles: ["admin", "registrar", "production"] },
  { href: "/registrations", label: "Registrations", icon: Users, roles: ["admin", "registrar"] },
  { href: "/gems", label: "Supplies", icon: Gem, roles: ["admin", "production"] },
  { href: "/appliques", label: "Appliques", icon: Sparkles, roles: ["admin", "production"] },
  { href: "/parent-shirts", label: "Shirts", icon: Shirt, roles: ["admin", "registrar"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "registrar", "production"] },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const filteredNav = mobileNavItems.filter(
    (item) => isAdmin || item.roles.includes(user?.role || "")
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl z-50" style={{ background: "rgba(253,246,241,0.97)", borderTop: "1.5px solid rgba(220,200,210,0.5)", boxShadow: "0 -2px 8px rgba(180,100,140,0.06)" }}>
      <div className="flex items-center justify-around h-16">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors"
              style={{ color: isActive ? "#FF6B9D" : "#C084A0" }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
