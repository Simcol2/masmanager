"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Library, ChevronRight, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SETTINGS_SECTIONS = [
  {
    href: "/pieces",
    icon: Library,
    color: "#FF6B9D",
    label: "Costume Pieces — Master List",
    description: "Manage the universal list of costume pieces. Add, edit, or remove pieces that can be selected for any season.",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Settings2 className="w-6 h-6 text-gold-400" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <p style={{ color: "rgba(180,200,240,0.6)" }} className="mt-1">
          Admin configuration and master data management
        </p>
      </motion.div>

      <div className="space-y-3 max-w-2xl">
        {SETTINGS_SECTIONS.map((s, i) => (
          <motion.div
            key={s.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href={s.href}>
              <Card className="glass-card border-void-800/50 hover:border-void-700/60 transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{s.label}</p>
                    <p className="text-sm text-void-400 mt-0.5">{s.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-void-600 group-hover:text-void-400 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
