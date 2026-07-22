// ─── Spandex Yardage Guide ──────────────────────────────────────────────────────
// Planning estimates from "Master Size Chart & Spandex Yardage Guide" (58-60" wide
// four-way stretch spandex). Used to auto-estimate fabric needed when a piece is
// "made" rather than bought finished. These are starting points, always editable
// in the UI: rise, leg length, and pattern ease vary, so cut a test piece before a
// full run.

// A piece is classified by what it consumes fabric like: a bottom (shorts), a top
// (tank/tee), or something the guide does not cover (bands, headpieces, etc.).
export type FabricPieceType = "bottom" | "top" | "other";

// Which master pieces read fabric like a bottom vs a top. Anything not listed is
// "other" and gets no auto-yardage (user enters it directly).
const PIECE_FABRIC_TYPE: Record<string, FabricPieceType> = {
  "Shorts": "bottom",
  "Top": "top",
};

export function fabricPieceType(pieceName: string): FabricPieceType {
  return PIECE_FABRIC_TYPE[pieceName] ?? "other";
}

// Yards per bottom (shorts), by app size. From guide section 6.
const BOTTOM_YARDAGE: Record<string, number> = {
  "2T": 0.375, "3T": 0.375, "4T": 0.375, "5T": 0.375,
  "Youth XS": 0.375, "Youth S": 0.375, "Youth M": 0.5, "Youth L": 0.5, "Youth XL": 0.625,
  "Adult XS": 0.5, "Adult S": 0.5, "Adult M": 0.5, "Adult L": 0.5, "Adult XL": 0.625,
};

// Yards per top (tank), by app size. From guide section 7 (tank averages).
const TOP_YARDAGE: Record<string, number> = {
  "2T": 0.5, "3T": 0.5, "4T": 0.5, "5T": 0.5,
  "Youth XS": 0.75, "Youth S": 0.75, "Youth M": 0.75, "Youth L": 0.75, "Youth XL": 0.75,
  "Adult XS": 1.125, "Adult S": 1.125, "Adult M": 1.125, "Adult L": 1.125, "Adult XL": 1.125,
};

// Representative default when no specific size is chosen (mid of the kids range).
const DEFAULT_YARDAGE: Record<FabricPieceType, number> = {
  bottom: 0.5,
  top: 0.75,
  other: 0,
};

// Look up yardage for a piece at a given size. Falls back to the piece-type
// default when the size is unknown, and 0 for pieces the guide does not cover.
export function yardageFor(pieceName: string, size?: string | null): number {
  const type = fabricPieceType(pieceName);
  if (type === "other") return 0;
  const table = type === "bottom" ? BOTTOM_YARDAGE : TOP_YARDAGE;
  if (size && table[size] != null) return table[size];
  return DEFAULT_YARDAGE[type];
}

// Average yardage for a piece across a set of sizes (e.g. the actual registrations
// of a costume type). Returns the piece-type default if no sizes are given.
export function averageYardage(pieceName: string, sizes: (string | null | undefined)[]): number {
  const type = fabricPieceType(pieceName);
  if (type === "other") return 0;
  const known = sizes.filter((s): s is string => !!s);
  if (known.length === 0) return DEFAULT_YARDAGE[type];
  const total = known.reduce((sum, s) => sum + yardageFor(pieceName, s), 0);
  return Math.round((total / known.length) * 1000) / 1000;
}
