"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, Shirt, BarChart3, CalendarDays, Gem, Sparkles,
} from "lucide-react";

const mobileNavItems = [
  { href: "/",              label: "Home",      icon: LayoutDashboard, color: "#1A73E8", roles: ["admin","registrar","production"] },
  { href: "/seasons",       label: "Costumes",  icon: CalendarDays,    color: "#FF006E", roles: ["admin","registrar","production"] },
  { href: "/registrations", label: "Register",  icon: Users,           color: "#FF6B35", roles: ["admin","registrar"] },
  { href: "/gems",          label: "Supplies",  icon: Gem,             color: "#D97706", roles: ["admin","production"] },
  { href: "/appliques",     label: "Appliques", icon: Sparkles,        color: "#7C3AED", roles: ["admin","production"] },
  { href: "/parent-shirts", label: "Shirts",    icon: Shirt,           color: "#059669", roles: ["admin","registrar"] },
  { href: "/reports",       label: "Reports",   icon: BarChart3,       color: "#1A73E8", roles: ["admin","registrar","production"] },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const filteredNav = mobileNavItems.filter(
    item => isAdmin || item.roles.includes(user?.role || "")
  );

  return (
    <>
      {/* Only show on mobile — inline media query */}
      <style>{`@media (min-width: 1024px) { .mas-mobile-nav { display: none !important; } }`}</style>
      <nav
        className="mas-mobile-nav"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          background: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "stretch",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {filteredNav.map(item => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.2rem",
                padding: "0.6rem 0.25rem 0.5rem",
                textDecoration: "none",
                color: isActive ? item.color : "#9CA3AF",
                position: "relative",
                minWidth: 0,
              }}
            >
              {/* Active indicator — top bar */}
              {isActive && (
                <span style={{
                  position: "absolute",
                  top: 0, left: "20%", right: "20%",
                  height: "2.5px",
                  borderRadius: "0 0 3px 3px",
                  background: item.color,
                }} />
              )}
              <Icon style={{
                width: "1.25rem",
                height: "1.25rem",
                flexShrink: 0,
                transition: "transform 0.1s",
                transform: isActive ? "scale(1.1)" : "scale(1)",
              }} />
              <span style={{
                fontSize: "0.6rem",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.01em",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
