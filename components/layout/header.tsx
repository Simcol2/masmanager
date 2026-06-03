"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Bell, Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";

export function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className="lg:hidden" style={{ height: "4rem", position: "sticky", top: 0, zIndex: 30, background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem", borderRadius: "0.5rem", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Menu style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FF006E,#1A73E8)", boxShadow: "0 2px 6px rgba(255,0,110,0.3)" }}>
                <span style={{ color: "#fff", fontWeight: "bold", fontSize: "0.85rem" }}>M</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1E2029", fontFamily: "inherit" }}>MasManager</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem", borderRadius: "0.5rem", color: "#6B7280", position: "relative", display: "flex" }}>
              <Bell style={{ width: "1.25rem", height: "1.25rem" }} />
              <span style={{ position: "absolute", top: "0.375rem", right: "0.375rem", width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "#FF006E" }} />
            </button>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FF006E,#1A73E8)", color: "#fff", fontWeight: "bold", fontSize: "0.75rem" }}>
              {user?.displayName?.charAt(0) || "U"}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer — no Radix, no Tailwind width classes */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          {/* Backdrop */}
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }}
            onClick={() => setOpen(false)}
          />
          {/* Drawer panel */}
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "16rem", background: "#FFFFFF", borderRight: "1px solid #E5E7EB", boxShadow: "4px 0 24px rgba(0,0,0,0.15)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <button
              onClick={() => setOpen(false)}
              style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: "0.25rem", borderRadius: "0.375rem", zIndex: 1 }}
            >
              <X style={{ width: "1rem", height: "1rem" }} />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}
    </>
  );
}
