"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Users,
  ChevronRight,
  Package,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CostumeTypeLabels, type CostumeType } from "@/types";

// ── 2026 Season data — mapped from Main Black Star Tracker.xlsx ───────────────

const SEASONS = ["2026"] as const;

// Pieces per costume type mapped from the Costume Breakdown sheet.
// Each piece is matched to the master piece library names.
const COSTUME_BREAKDOWN: Record<CostumeType, { piece: string; notes?: string }[]> = {
  girls_backline: [
    { piece: "Arm Bands" },
    { piece: "Thigh Bands" },
    { piece: "Half Skirt" },
    { piece: "Shorts" },
    { piece: "Top" },
    { piece: "Necklace" },
    { piece: "Head Piece", notes: "Headband" },
  ],
  boys_backline: [
    { piece: "Arm Bands" },
    { piece: "Shorts" },
    { piece: "Top" },
    { piece: "Belt" },
    { piece: "Chest Piece" },
    { piece: "Head Piece", notes: "Headband" },
  ],
  toddler_frontline: [
    { piece: "Arm Bands" },
    { piece: "Thigh Bands" },
    { piece: "Half Skirt" },
    { piece: "Shorts" },
    { piece: "Top" },
    { piece: "Necklace" },
    { piece: "Head Piece", notes: "Small Crown" },
    { piece: "Collar", notes: "Yellow Feather Collar" },
  ],
  girls_frontline: [
    { piece: "Arm Bands" },
    { piece: "Thigh Bands" },
    { piece: "Half Skirt" },
    { piece: "Shorts" },
    { piece: "Top" },
    { piece: "Necklace" },
    { piece: "Head Piece", notes: "Small Crown" },
    { piece: "Backpack", notes: "Small Backpack" },
  ],
  boys_frontline: [
    { piece: "Arm Bands" },
    { piece: "Shorts" },
    { piece: "Top" },
    { piece: "Belt" },
    { piece: "Chest Piece" },
    { piece: "Head Piece", notes: "Feather Headband" },
    { piece: "Backpack", notes: "Small Backpack" },
  ],
  girls_ultra_frontline: [
    { piece: "Arm Bands" },
    { piece: "Leg Bands" },
    { piece: "Shorts", notes: "Green Shorts" },
    { piece: "Top" },
    { piece: "Necklace" },
    { piece: "Head Piece", notes: "Large Crown" },
    { piece: "Collar", notes: "Large Red Feather Collar" },
    { piece: "Backpack", notes: "Large Backpack" },
    { piece: "Half Skirt", notes: "Cage Skirt" },
  ],
  boys_ultra_frontline: [
    { piece: "Arm Bands" },
    { piece: "Leg Bands" },
    { piece: "Shorts" },
    { piece: "Top" },
    { piece: "Belt" },
    { piece: "Chest Piece" },
    { piece: "Head Piece", notes: "Feather Headband" },
    { piece: "Backpack", notes: "Soccer Ball Backpack" },
  ],
};

// Registration counts from spreadsheet (12 total)
const REGISTRATION_COUNTS: Record<CostumeType, number> = {
  girls_backline: 3,    // Ciara, Emelia, Olivia Jade
  boys_backline: 4,     // Zayne, Caleeb, Tristin, Quintin
  toddler_frontline: 1, // Kaylaha
  girls_frontline: 0,
  boys_frontline: 0,
  girls_ultra_frontline: 1,  // Ava
  boys_ultra_frontline: 3,   // Mateo, Max, Parker
};

// Appliques mapped from Appliques & Trims sheet
const APPLIQUES_2026 = [
  { name: "Applique 1", usedOn: ["Thigh Bands", "Belt", "Necklace", "Head Piece", "Arm Bands"] },
  { name: "Applique 2", usedOn: ["Arm Bands", "Head Piece"] },
  { name: "Rectangle Hot Fix Trim", color: "Gold", usedOn: ["Chest Piece", "Belt"] },
  { name: "Gold Half Pearl Trim", color: "Gold", usedOn: ["Belt", "Necklace"] },
  { name: "Gold Pointy Half Pearl", color: "Gold", usedOn: ["Necklace"] },
];

// Category colours matching master piece library
const PIECE_COLORS: Record<string, string> = {
  "Arm Bands":   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Leg Bands":   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Thigh Bands": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Shorts":      "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Top":         "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Half Skirt":  "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Tutu":        "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Belt":        "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Chest Piece": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Collar":      "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Backpack":    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Head Piece":  "bg-red-500/10 text-red-400 border-red-500/20",
  "Necklace":    "bg-gold-500/10 text-gold-400 border-gold-500/20",
  "Shoes":       "bg-void-600/30 text-void-300 border-void-600/20",
};

const COSTUME_ORDER: CostumeType[] = [
  "girls_backline",
  "boys_backline",
  "toddler_frontline",
  "girls_frontline",
  "boys_frontline",
  "girls_ultra_frontline",
  "boys_ultra_frontline",
];

// ── Costume detail card ───────────────────────────────────────────────────────

function CostumeCard({
  costumeType,
  index,
}: {
  costumeType: CostumeType;
  index: number;
}) {
  const pieces = COSTUME_BREAKDOWN[costumeType];
  const count = REGISTRATION_COUNTS[costumeType];
  const appliquesUsed = APPLIQUES_2026.filter((a) =>
    pieces.some((p) => a.usedOn.includes(p.piece))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="glass-card border-void-800/50 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="font-display text-base text-foreground">
                {CostumeTypeLabels[costumeType]}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-3.5 h-3.5 text-void-500" />
                <span className="text-sm text-void-400">
                  {count} registered
                </span>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs shrink-0",
                count > 0
                  ? "bg-emerald/10 text-emerald border-emerald/20"
                  : "bg-void-800/40 text-void-500 border-void-700/40"
              )}
            >
              {count > 0 ? "Active" : "Empty"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pieces */}
          <div>
            <p className="text-xs font-semibold text-void-500 uppercase tracking-wider mb-2">
              Costume Pieces ({pieces.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pieces.map((p) => (
                <div key={p.piece + (p.notes ?? "")} className="flex flex-col">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs border",
                      PIECE_COLORS[p.piece] ?? "bg-void-800/30 text-void-400 border-void-700/30"
                    )}
                  >
                    {p.piece}
                  </Badge>
                  {p.notes && (
                    <span className="text-[10px] text-void-600 pl-1 mt-0.5">{p.notes}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Appliques */}
          {appliquesUsed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-void-500 uppercase tracking-wider mb-2">
                Appliques Used
              </p>
              <div className="space-y-1">
                {appliquesUsed.map((a) => (
                  <div key={a.name} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-2.5 h-2.5 text-gold-400" />
                    </div>
                    <span className="text-xs text-void-300">{a.name}</span>
                    {a.color && (
                      <span className="text-[10px] text-void-500">· {a.color}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SeasonsPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("2026");

  const totalRegistrations = Object.values(REGISTRATION_COUNTS).reduce((s, n) => s + n, 0);
  const totalPieces = Object.values(COSTUME_BREAKDOWN).reduce((s, p) => s + p.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Seasons
          </h1>
          <p className="text-void-400 mt-1">
            Costume configurations by season year
          </p>
        </div>

        {/* Year selector */}
        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
          <SelectTrigger className="luxury-input w-36">
            <CalendarDays className="w-4 h-4 mr-2 text-void-500" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-void-900 border-void-700">
            {SEASONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s} Season
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSeason}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6"
        >
          {/* Season summary bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card border border-gold-500/20 rounded-lg p-4 flex flex-wrap items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <p className="text-lg font-bold font-display gold-text">{selectedSeason}</p>
                <p className="text-xs text-void-500">The Black Stars</p>
              </div>
            </div>

            <div className="h-8 w-px bg-void-800 hidden sm:block" />

            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xl font-bold text-foreground">{totalRegistrations}</p>
                <p className="text-xs text-void-500">Registrations</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {COSTUME_ORDER.filter((c) => REGISTRATION_COUNTS[c] > 0).length}
                </p>
                <p className="text-xs text-void-500">Active costume types</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{APPLIQUES_2026.length}</p>
                <p className="text-xs text-void-500">Appliques</p>
              </div>
            </div>

            <div className="ml-auto">
              <Badge className="bg-emerald/10 text-emerald border border-emerald/20">
                Active Season
              </Badge>
            </div>
          </motion.div>

          {/* Costume type grid */}
          <div>
            <h2 className="text-sm font-semibold text-void-400 uppercase tracking-wider mb-4">
              Costume Styles — {selectedSeason}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {COSTUME_ORDER.map((costumeType, i) => (
                <CostumeCard
                  key={costumeType}
                  costumeType={costumeType}
                  index={i}
                />
              ))}
            </div>
          </div>

          {/* Appliques overview */}
          <div>
            <h2 className="text-sm font-semibold text-void-400 uppercase tracking-wider mb-4">
              Appliques & Trims — {selectedSeason}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {APPLIQUES_2026.map((a, i) => (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="glass-card border border-void-800/50 rounded-lg p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-sm bg-gold-500/5 border border-gold-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-gold-400/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    {a.color && (
                      <p className="text-xs text-void-500 mt-0.5">{a.color}</p>
                    )}
                    <p className="text-xs text-void-500 mt-1">
                      Used on:{" "}
                      <span className="text-void-300">{a.usedOn.join(", ")}</span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
