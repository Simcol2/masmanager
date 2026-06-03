"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Library, ChevronRight, Settings2 } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    href: "/pieces",
    icon: Library,
    color: "#FF006E",
    label: "Costume Pieces - Master List",
    description: "Manage the universal list of costume pieces. Add, edit, or remove pieces that can be selected for any season.",
  },
];

export default function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Settings2 style={{ width: "1.5rem", height: "1.5rem", color: "#1A73E8" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0 }}>Settings</h1>
        </div>
        <p style={{ color: "#6B7280", marginTop: "0.25rem", fontSize: "0.9rem" }}>
          Admin configuration and master data management
        </p>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "42rem" }}>
        {SETTINGS_SECTIONS.map((s, i) => (
          <motion.div
            key={s.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href={s.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)", padding: "1.25rem",
                display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer",
              }}>
                <div style={{
                  width: "2.75rem", height: "2.75rem", borderRadius: "0.625rem",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: `${s.color}18`, border: `1px solid ${s.color}30`,
                }}>
                  <s.icon style={{ width: "1.25rem", height: "1.25rem", color: s.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: "#1E2029", margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.2rem" }}>{s.description}</p>
                </div>
                <ChevronRight style={{ width: "1.25rem", height: "1.25rem", color: "#9CA3AF", flexShrink: 0 }} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
