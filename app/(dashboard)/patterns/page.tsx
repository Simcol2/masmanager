"use client";

import { useState } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#ffffff",
  surface: "#f7f8ff",
  surfaceAlt: "#fff9f0",
  blue: "#1a6bff",
  blueDark: "#0047cc",
  blueLight: "#e8f0ff",
  pink: "#ff2d8a",
  pinkLight: "#fff0f7",
  yellow: "#ffcc00",
  yellowLight: "#fffbe6",
  yellowDark: "#cc9900",
  teal: "#00bfae",
  tealLight: "#e0faf7",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  white: "#ffffff",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────

const sizeChartData: Record<string, { label: string; color: string; sizes: Record<string, number | string>[] }> = {
  toddler: {
    label: "Toddler", color: C.pink,
    sizes: [
      { us:"2T", age:"2yr",  head:19.5, waist:20,   halfWaist:10,    thigh:13,   calf:9.5,  hip:19.5, neck:10,   upperArm:7,    wrist:4.5, knee:9,    shoulder:10.5, pitToPit:10,   torso:12 },
      { us:"3T", age:"3yr",  head:20,   waist:21,   halfWaist:10.5,  thigh:13.5, calf:10,   hip:20.5, neck:10.5, upperArm:7.5,  wrist:4.8, knee:9.5,  shoulder:11,   pitToPit:10.5, torso:13 },
      { us:"4T", age:"4yr",  head:20.5, waist:22,   halfWaist:11,    thigh:14,   calf:10.5, hip:21.5, neck:11,   upperArm:8,    wrist:5,   knee:10,   shoulder:11.5, pitToPit:11,   torso:14 },
    ],
  },
  youth: {
    label: "Youth Girls", color: C.blue,
    sizes: [
      { us:"5",  age:"5yr",  head:21,   waist:23,   halfWaist:11.5,  thigh:15,   calf:11,   hip:23,   neck:11.5, upperArm:8.5,  wrist:5.2, knee:10.5, shoulder:12,   pitToPit:11.5, torso:15 },
      { us:"6",  age:"6yr",  head:21.5, waist:24,   halfWaist:12,    thigh:15.5, calf:11.5, hip:24,   neck:12,   upperArm:9,    wrist:5.4, knee:11,   shoulder:12.5, pitToPit:12,   torso:16 },
      { us:"6X", age:"6-7",  head:21.5, waist:24.5, halfWaist:12.25, thigh:16,   calf:11.8, hip:24.5, neck:12,   upperArm:9.2,  wrist:5.4, knee:11.2, shoulder:12.7, pitToPit:12.2, torso:16.5 },
      { us:"7",  age:"7yr",  head:22,   waist:25,   halfWaist:12.5,  thigh:16.5, calf:12,   hip:25,   neck:12.5, upperArm:9.5,  wrist:5.5, knee:11.5, shoulder:13,   pitToPit:12.5, torso:17 },
      { us:"8",  age:"8yr",  head:22,   waist:26,   halfWaist:13,    thigh:17.5, calf:12.5, hip:26.5, neck:13,   upperArm:10,   wrist:5.7, knee:12,   shoulder:13.5, pitToPit:13,   torso:18 },
      { us:"10", age:"10yr", head:22.5, waist:27,   halfWaist:13.5,  thigh:18.5, calf:13,   hip:28,   neck:13.5, upperArm:10.5, wrist:5.9, knee:12.5, shoulder:14,   pitToPit:13.5, torso:19 },
      { us:"12", age:"12yr", head:22.5, waist:28.5, halfWaist:14.25, thigh:20,   calf:13.5, hip:30,   neck:13.8, upperArm:11,   wrist:6,   knee:13,   shoulder:14.5, pitToPit:14,   torso:20 },
      { us:"14", age:"14yr", head:22.8, waist:30,   halfWaist:15,    thigh:21.5, calf:14,   hip:32,   neck:14,   upperArm:11.5, wrist:6.2, knee:13.5, shoulder:15,   pitToPit:14.5, torso:21 },
      { us:"16", age:"16yr", head:23,   waist:31.5, halfWaist:15.75, thigh:23,   calf:14.5, hip:34,   neck:14.5, upperArm:12,   wrist:6.4, knee:14,   shoulder:15.5, pitToPit:15,   torso:22 },
    ],
  },
  adult: {
    label: "Adult Women", color: C.teal,
    sizes: [
      { us:"XS", age:"Adult", head:21.5, waist:26,  halfWaist:13,   thigh:20.5, calf:13,   hip:35, neck:13,   upperArm:11,   wrist:6,   knee:13,   shoulder:15,   pitToPit:15,   torso:24 },
      { us:"S",  age:"Adult", head:22,   waist:28,  halfWaist:14,   thigh:21.5, calf:13.5, hip:37, neck:13.5, upperArm:11.5, wrist:6.2, knee:13.5, shoulder:15.5, pitToPit:15.5, torso:25 },
      { us:"M",  age:"Adult", head:22.5, waist:31,  halfWaist:15.5, thigh:23,   calf:14,   hip:40, neck:14,   upperArm:12.5, wrist:6.5, knee:14,   shoulder:16,   pitToPit:16,   torso:25.5 },
      { us:"L",  age:"Adult", head:23,   waist:35,  halfWaist:17.5, thigh:25,   calf:15,   hip:43, neck:14.5, upperArm:13.5, wrist:6.8, knee:15,   shoulder:16.5, pitToPit:17,   torso:26 },
      { us:"XL", age:"Adult", head:23,   waist:38,  halfWaist:19,   thigh:27,   calf:15.5, hip:46, neck:15,   upperArm:14.5, wrist:7,   knee:15.5, shoulder:17,   pitToPit:17.5, torso:26.5 },
    ],
  },
};

const measurementCols = [
  { key:"head",      label:"Head Circ." },
  { key:"waist",     label:"Waist Circ." },
  { key:"halfWaist", label:"Half Waist" },
  { key:"thigh",     label:"Upper Thigh" },
  { key:"calf",      label:"Calf" },
  { key:"hip",       label:"Hip (belt)" },
  { key:"neck",      label:"Neck Circ." },
  { key:"upperArm",  label:"Upper Arm" },
  { key:"wrist",     label:"Wrist" },
  { key:"knee",      label:"Knee" },
  { key:"shoulder",  label:"Shoulder W." },
  { key:"pitToPit",  label:"Pit to Pit" },
  { key:"torso",     label:"Torso Len." },
];

const shoeData: Record<string, { label: string; color: string; rows: { us: string; cn: string; footIn: number }[] }> = {
  toddler: { label:"Toddler", color: C.pink,
    rows:[{us:"3T",cn:"19",footIn:4.0},{us:"4T",cn:"20",footIn:4.4},{us:"5T",cn:"21",footIn:4.7},{us:"6T",cn:"22",footIn:5.1},{us:"7T",cn:"23",footIn:5.5},{us:"8T",cn:"24",footIn:5.9},{us:"9T",cn:"25",footIn:6.1},{us:"10T",cn:"26",footIn:6.5}]},
  youth: { label:"Youth", color: C.blue,
    rows:[{us:"1Y",cn:"32",footIn:7.7},{us:"2Y",cn:"33",footIn:8.1},{us:"3Y",cn:"34",footIn:8.5},{us:"4Y",cn:"35",footIn:8.9},{us:"5Y",cn:"36",footIn:9.3},{us:"6Y",cn:"37",footIn:9.6},{us:"7Y",cn:"38",footIn:10.0}]},
  adult: { label:"Adult Women", color: C.teal,
    rows:[{us:"5",cn:"35",footIn:8.7},{us:"6",cn:"36",footIn:9.1},{us:"7",cn:"37",footIn:9.5},{us:"8",cn:"38",footIn:9.8},{us:"9",cn:"39",footIn:10.2},{us:"10",cn:"40",footIn:10.6},{us:"11",cn:"41",footIn:11.0},{us:"12",cn:"42",footIn:11.4}]},
};

const halfCircleData = [
  { size:"2T",  fullWaist:20,   halfWaist:10,    innerR:3.18, l1Len:6,    l2Len:7.5,  l3Len:9,    l1Square:18.36, l2Square:21.36, l3Square:24.36 },
  { size:"3T",  fullWaist:21,   halfWaist:10.5,  innerR:3.34, l1Len:7,    l2Len:8.5,  l3Len:10,   l1Square:20.68, l2Square:23.68, l3Square:26.68 },
  { size:"4T",  fullWaist:22,   halfWaist:11,    innerR:3.50, l1Len:7.5,  l2Len:9,    l3Len:10.5, l1Square:22.00, l2Square:25.00, l3Square:28.00 },
  { size:"5",   fullWaist:23,   halfWaist:11.5,  innerR:3.66, l1Len:8,    l2Len:9.5,  l3Len:11,   l1Square:23.32, l2Square:26.32, l3Square:29.32 },
  { size:"6",   fullWaist:24,   halfWaist:12,    innerR:3.82, l1Len:9,    l2Len:10.5, l3Len:12,   l1Square:25.64, l2Square:28.64, l3Square:31.64 },
  { size:"6X",  fullWaist:24.5, halfWaist:12.25, innerR:3.90, l1Len:9.5,  l2Len:11,   l3Len:12.5, l1Square:26.80, l2Square:29.80, l3Square:32.80 },
  { size:"7",   fullWaist:25,   halfWaist:12.5,  innerR:3.98, l1Len:10,   l2Len:11.5, l3Len:13,   l1Square:27.96, l2Square:30.96, l3Square:33.96 },
  { size:"8",   fullWaist:26,   halfWaist:13,    innerR:4.14, l1Len:11,   l2Len:12.5, l3Len:14,   l1Square:30.28, l2Square:33.28, l3Square:36.28 },
  { size:"10",  fullWaist:27,   halfWaist:13.5,  innerR:4.30, l1Len:12,   l2Len:13.5, l3Len:15,   l1Square:32.60, l2Square:35.60, l3Square:38.60 },
  { size:"12",  fullWaist:28.5, halfWaist:14.25, innerR:4.54, l1Len:13,   l2Len:14.5, l3Len:16,   l1Square:35.08, l2Square:38.08, l3Square:41.08 },
  { size:"14",  fullWaist:30,   halfWaist:15,    innerR:4.77, l1Len:14,   l2Len:15.5, l3Len:17,   l1Square:37.54, l2Square:40.54, l3Square:43.54 },
  { size:"16",  fullWaist:31.5, halfWaist:15.75, innerR:5.01, l1Len:15,   l2Len:16.5, l3Len:18,   l1Square:40.02, l2Square:43.02, l3Square:46.02 },
];

const highLowData = halfCircleData.map(r => ({ ...r, frontLength:3.5, backLength:r.l1Len }));

const halfCircleCols = [
  { key:"size",     label:"Size" },
  { key:"fullWaist",label:'Full Waist"' },
  { key:"innerR",   label:'Inner Radius"' },
  { key:"l1Len",    label:'L1 Length"' },
  { key:"l1Square", label:'L1 Cut Square"' },
  { key:"l2Len",    label:'L2 Length"' },
  { key:"l2Square", label:'L2 Cut Square"' },
  { key:"l3Len",    label:'L3 Length"' },
  { key:"l3Square", label:'L3 Cut Square"' },
];

const highLowCols = [
  { key:"size",        label:"Size" },
  { key:"fullWaist",   label:'Full Waist"' },
  { key:"halfWaist",   label:'Half Waist"' },
  { key:"innerR",      label:'Inner Radius"' },
  { key:"frontLength", label:'Front Len"' },
  { key:"backLength",  label:'Back Len"' },
  { key:"fabricSquare",label:'Cut Square"' },
];

const beltData = [
  { size:"2T",  waist:20,   ease:1.0, overlap:2, cutLength:23.0, velcro:2 },
  { size:"3T",  waist:21,   ease:1.0, overlap:2, cutLength:24.0, velcro:2 },
  { size:"4T",  waist:22,   ease:1.0, overlap:2, cutLength:25.0, velcro:2 },
  { size:"5",   waist:23,   ease:1.5, overlap:2, cutLength:26.5, velcro:2 },
  { size:"6",   waist:24,   ease:1.5, overlap:2, cutLength:27.5, velcro:2 },
  { size:"6X",  waist:24.5, ease:1.5, overlap:2, cutLength:28.0, velcro:2 },
  { size:"7",   waist:25,   ease:1.5, overlap:2, cutLength:28.5, velcro:2 },
  { size:"8",   waist:26,   ease:1.5, overlap:2, cutLength:29.5, velcro:2 },
  { size:"10",  waist:27,   ease:1.5, overlap:2, cutLength:30.5, velcro:2 },
  { size:"12",  waist:28.5, ease:1.5, overlap:2, cutLength:32.0, velcro:2 },
  { size:"14",  waist:30,   ease:1.5, overlap:2, cutLength:33.5, velcro:2 },
  { size:"16",  waist:31.5, ease:1.5, overlap:2, cutLength:35.0, velcro:2 },
];

const beltCols = [
  { key:"size",      label:"Size" },
  { key:"waist",     label:'Waist"' },
  { key:"ease",      label:'Ease"' },
  { key:"overlap",   label:'Velcro Overlap"' },
  { key:"cutLength", label:'Cut Length"' },
  { key:"velcro",    label:'Velcro Each End"' },
];

const grommetBeltData = [
  { label:"Toddler",           sizes:"2T - 6X",     avgWaist:22.4, halfWrap:11.2, threeQWrap:16.8, cutLength:12.0, grommets:"2 per end", beltWidth:'2.5"' },
  { label:"Kids Small/Medium", sizes:"6 - 12",      avgWaist:25.8, halfWrap:12.9, threeQWrap:19.4, cutLength:16.0, grommets:"2 per end", beltWidth:'2.5"' },
  { label:"Kids Medium/Large", sizes:"12 - 16",     avgWaist:30.0, halfWrap:15.0, threeQWrap:22.5, cutLength:19.0, grommets:"2 per end", beltWidth:'3"' },
  { label:"Adult Medium",      sizes:"M - L Women", avgWaist:33.0, halfWrap:16.5, threeQWrap:24.8, cutLength:22.5, grommets:"2 per end", beltWidth:'3"' },
];

const grommetBeltCols = [
  { key:"label",      label:"Belt Size" },
  { key:"sizes",      label:"Fits Sizes" },
  { key:"avgWaist",   label:'Avg Waist"' },
  { key:"halfWrap",   label:'1/2 Wrap"' },
  { key:"threeQWrap", label:'3/4 Wrap"' },
  { key:"cutLength",  label:'Cut Length"' },
  { key:"grommets",   label:"Grommets" },
  { key:"beltWidth",  label:"2026 Black Star Belt Width" },
];

type PieceDef = {
  name: string; emoji: string; color: string; tagline: string; tags: string[];
  data: Record<string, number | string>[]; cols: { key: string; label: string }[];
  highlightCol: string | null; note?: string;
  cutSteps: string[]; buildSteps: string[];
};

const catalog: Record<string, { emoji: string; color: string; pieces: PieceDef[] }> = {
  Girls: {
    emoji: "👗", color: C.pink,
    pieces: [
      {
        name: "Half Circle Skirt", emoji: "🌀", color: C.blue,
        tagline: "Hip-to-hip back coverage · 3 layers · Front-closing elastic belt",
        tags: ["2T - 16", "3 Layers", "Half Coverage"],
        data: halfCircleData, cols: halfCircleCols, highlightCol: "l1Square",
        note: 'LAYER RULE: No seam allowance -- raw edge cuts. Cut square = (Inner Radius + skirt length) x 2. L1 = top layer (shortest, closest to belt). L2 = L1 square + 3". L3 = L1 square + 6". Each extra 3" on the square adds 1.5" of visible skirt length. Example for 2T: L1 = 18.36" square = 6" skirt. L2 = 21.36" square = 7.5" skirt. L3 = 24.36" square = 9" skirt. INNER RADIUS: fold fabric into 4 quarters, place tape at the folded corner, swing an arc at that distance -- that is your waistline cut. For the half-circle skirt this does not apply since the full circle gets cut in half and the straight edge attaches to the belt.',
        cutSteps: [
          "Each skirt requires 3 squares -- all different sizes. Use the L1, L2, L3 columns from the chart for your size.",
          "Cut all 3 fabric squares to their individual dimensions. Do NOT cut them all the same.",
          "For each square: fold in half lengthwise, then fold in half again -- now in 4 quarters.",
          'From the folded corner, mark the Inner Radius as a quarter-arc. This is your waistline on every layer. The inner radius is the SAME for all 3 layers of the same size.',
          "From the same corner, measure outward to the edge of the folded square -- cut this as your outer hem arc. No seam allowance.",
          "Unfold -- you have one full circle panel. Cut straight across the diameter. You now have TWO half-circle panels from one square.",
          "Repeat for all 3 squares. Each skirt needs 1 half-circle from each of L1, L2, and L3. Save the other halves for the next same-size skirt -- zero waste.",
        ],
        buildSteps: [
          "Layer order from belt downward: L1 shortest on top (closest to belt), L2 middle, L3 longest on the bottom.",
          "Align all 3 straight edges at the waistline. The layers fan outward in length automatically.",
          "Baste all 3 straight top edges together before attaching to belt.",
          "Attach the combined straight edge to the back half of your velcro belt only.",
          "The two curved side edges of each half-circle meet the belt ends at each hip.",
          "Belt closes at center front with velcro.",
        ],
      },
      {
        name: "High-Low Circle Skirt", emoji: "✨", color: C.pink,
        tagline: "Full circle · 3.5\" front · Full length back · Carnival drama",
        tags: ["2T - 16", "Full Circle", "High-Low Hem"],
        data: highLowData, cols: highLowCols, highlightCol: "fabricSquare",
        cutSteps: [
          "Cut full fabric square to the Cut Square dimension from the chart.",
          "Fold into 4 quarters and mark the Inner Radius arc for the waistline -- cut that curve.",
          "Unfold the full circle. Do NOT cut the outer hem yet.",
          "Mark the CENTER FRONT point on the outer edge.",
          'From center front, mark only 3.5" outward for the front hem point.',
          "From center back, mark the full Back Length outward.",
          'Draw a smooth gradual hem line sweeping from front (3.5") around both sides up to back (full length). Symmetrical on both sides.',
          "Cut along your marked hem line. No seam allowance.",
        ],
        buildSteps: [
          "This is a full circle skirt -- it wraps all the way around the waist.",
          "Attach the inner waistline edge to a full encircling elastic waistband or front-closing belt.",
          'For multiple layers, stagger outer hem lengths by 1.5" per layer for a cascading effect.',
          'The 3.5" front hem reads as raw edge on sequin mesh -- intentional and clean.',
          "Steam or hang overnight before final hem. Circle skirts bias-stretch and the hem drops slightly.",
          "Do a final hem check on a dress form or the child model before final attachment.",
        ],
      },
    ],
  },
  Boys: {
    emoji: "👦", color: C.blue,
    pieces: [
      {
        name: "Chest Piece", emoji: "🛡️", color: C.blue,
        tagline: "Details coming soon · Scaffolding only",
        tags: ["2T - 16", "Coming Soon"],
        data: [], cols: [], highlightCol: null,
        note: "Chest piece details have not been added yet. Check back once measurements and construction method are confirmed.",
        cutSteps: ["Details to be added."],
        buildSteps: ["Details to be added."],
      },
    ],
  },
  Accessories: {
    emoji: "🎀", color: C.teal,
    pieces: [
      {
        name: "Velcro Belt", emoji: "🎗️", color: C.teal,
        tagline: 'Unisex · Front-closing velcro · 2.5" finished width · Attaches skirt at back',
        tags: ["2T - 16", "Unisex", "Velcro Close"],
        data: beltData, cols: beltCols, highlightCol: "cutLength",
        note: 'Cut Length = waist + ease + 2" velcro overlap. The 2" overlap is NOT extra fabric -- it is the closing section where velcro grabs. Toddler ease = 1" (snug but comfortable). Youth ease = 1.5". Belt finished width = 2.5". Always use SEW-ON velcro, not iron-on -- iron-on delaminates under heat and sweat at carnival.',
        cutSteps: [
          'Cut one strip of belt fabric: Cut Length (from chart) x 6" wide.',
          'Fold the strip in half lengthwise with right sides together. Sew along the long edge and one short end with a 0.5" seam.',
          'Trim corners, turn right side out through the open short end. Press flat. Top-stitch all edges if desired.',
          'The finished belt is approximately 2.5" wide.',
          'Cut two pieces of sew-on velcro, each 2" long.',
          'If using 1" wide velcro tape, cut four pieces and place two side-by-side on each end for a stronger hold.',
        ],
        buildSteps: [
          "Sew the LOOP side of velcro to the INSIDE of the LEFT end of the belt.",
          "Sew the HOOK side of velcro to the OUTSIDE of the RIGHT end of the belt.",
          "When worn, the right end laps over the left at center front. Velcro grabs through the overlap.",
          "Attach the skirt panels to the belt BEFORE closing. Baste the straight top edge of all 3 skirt layers to the BACK half of the belt only.",
          "The skirt spans from left hip to right hip across the back. The front of the belt is bare.",
          "Try the belt on the child and adjust skirt position before final stitching.",
        ],
      },
      {
        name: "Grommet Belt", emoji: "⚙️", color: C.yellow,
        tagline: "Closes at center back · 2 grommets per end · 4 consolidated sizes · 1/2 to 3/4 wrap",
        tags: ["4 Sizes", "Back Closure", "Unisex", "Grommet"],
        data: grommetBeltData, cols: grommetBeltCols, highlightCol: "cutLength",
        note: "This belt does NOT go all the way around -- it covers the front and sides only, closing at center back with grommets. Toddler sits closer to 1/2 wrap (12.5\"). Adult Medium sits closer to 3/4 wrap (22.5\"). Use 2 grommets per end spaced 1\" apart for adjustability -- this lets you fit kids who fall between sizes without cutting a new belt. Cut Length includes 0.5\" per end for grommet reinforcement fold.",
        cutSteps: [
          'Only 4 belt lengths to cut -- Toddler (12.5"), Kids S/M (16"), Kids M/L (19"), Adult Medium (22.5").',
          'Cut belt fabric strips at the Cut Length x 6" wide.',
          'Fold in half lengthwise, sew long edge and one short end, turn right side out. Finished width approximately 2.5".',
          'Fold and press 0.5" at each open end before setting grommets -- this reinforces the grommet hole and prevents tearing.',
          "Set 2 grommets per end, spaced 1\" apart, centered on the belt width.",
          "Use a grommet setter and hammer or grommet press -- do NOT skip the backing washer on each grommet.",
        ],
        buildSteps: [
          "Belt sits across the front and wraps to the sides. The two ends meet at CENTER BACK.",
          "Thread a lace, ribbon, or pin through the grommets at center back to close.",
          "Two grommets per end gives one hole of adjustment -- useful for fitting multiple kids to the same belt size.",
          "For carnival: pre-lace the grommets with a short ribbon tied in a bow at the back. Fast to put on, looks intentional.",
          "Attach any front decorative pieces (buckle, emblem, Cricut cut) to the belt BEFORE fitting on the child.",
          "If attaching a skirt to this belt, baste the skirt to the INSIDE of the belt along the bottom edge before adding grommets.",
        ],
      },
    ],
  },
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Pill({ text, bg, textColor = "#fff" }: { text: string; bg: string; textColor?: string }) {
  return (
    <span style={{ background: bg, color: textColor, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace" }}>
      {text}
    </span>
  );
}

function SectionHeader({ children, color = C.blue, sub }: { children: React.ReactNode; color?: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 5, height: 28, background: color, borderRadius: 3 }} />
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 900, color, letterSpacing: "-0.02em" }}>{children}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginLeft: 15, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
    </div>
  );
}

function Card({ children, style = {}, accent }: { children: React.ReactNode; style?: React.CSSProperties; accent?: string }) {
  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: 20,
      border: `2px solid ${accent || C.border}`,
      boxShadow: accent ? `0 4px 0 0 ${accent}` : "0 2px 8px rgba(0,0,0,0.06)",
      ...style,
    }}>{children}</div>
  );
}

function TabGroup({ options, active, onSelect, colorMap }: { options: string[]; active: string; onSelect: (v: string) => void; colorMap?: Record<string, string> }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {options.map(opt => {
        const col = colorMap?.[opt] || C.blue;
        const isActive = active === opt;
        return (
          <button key={opt} onClick={() => onSelect(opt)} style={{
            background: isActive ? col : C.white, color: isActive ? C.white : col,
            border: `2px solid ${col}`, borderRadius: 10, padding: "6px 16px", cursor: "pointer",
            fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800,
            boxShadow: isActive ? `0 3px 0 ${col}aa` : "none",
          }}>{opt}</button>
        );
      })}
    </div>
  );
}

function DataTable({ cols, rows, highlightCol }: { cols: { key: string; label: string }[]; rows: Record<string, number | string>[]; highlightCol: string | null }) {
  const headerColors = [C.blue, C.pink, C.teal, C.yellow, C.blue, C.pink, C.teal];
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: `2px solid ${C.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
        <thead>
          <tr style={{ background: C.surface }}>
            {cols.map((col, i) => (
              <th key={col.key} style={{
                padding: "10px 12px", textAlign: "left",
                color: highlightCol === col.key ? C.pink : headerColors[i % headerColors.length],
                fontWeight: 900, fontSize: 11, letterSpacing: "0.05em",
                borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap",
                fontFamily: "'Nunito', sans-serif",
              }}>{col.label}{highlightCol === col.key ? " ★" : ""}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ background: i % 2 === 0 ? C.white : C.surface }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.blueLight}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.white : C.surface}>
              {cols.map((col, ci) => (
                <td key={col.key} style={{
                  padding: "9px 12px",
                  color: ci === 0 ? C.blue : highlightCol === col.key ? C.pink : C.text,
                  fontWeight: ci === 0 || highlightCol === col.key ? 800 : 400,
                  borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap",
                }}>
                  {typeof row[col.key] === "number" ? Number(row[col.key]).toFixed(2) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ items, color, title }: { items: string[]; color: string; title: string }) {
  return (
    <div style={{ background: color + "0f", borderRadius: 12, padding: 16, border: `2px solid ${color}33` }}>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 14, color, marginBottom: 12 }}>{title}</div>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        {items.map((step, i) => (
          <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.7, color: C.text, marginBottom: 5 }}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

// ─── PATTERN DETAIL VIEW ──────────────────────────────────────────────────────

function PatternView({ piece, onBack }: { piece: PieceDef; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} style={{
        background: C.white, border: `2px solid ${C.border}`, color: C.muted,
        borderRadius: 10, padding: "6px 14px", cursor: "pointer",
        fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 20,
      }}>← Back</button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <span style={{ fontSize: 36 }}>{piece.emoji}</span>
        <div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 28, fontWeight: 900, color: piece.color, letterSpacing: "-0.02em" }}>{piece.name}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.muted }}>{piece.tagline}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {piece.tags.map(t => <Pill key={t} text={t} bg={piece.color} />)}
        <Pill text="All measurements in inches" bg={C.yellow} textColor={C.text} />
        <Pill text='1" seam allowance on outer edge' bg={C.teal} />
      </div>

      {piece.note && (
        <div style={{ background: C.yellow + "33", border: `2px solid ${C.yellow}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📐</span>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text, lineHeight: 1.6 }}>
            <strong style={{ fontFamily: "'Nunito', sans-serif", color: C.yellowDark }}>LAYER SIZING NOTE: </strong>
            {piece.note}
          </div>
        </div>
      )}

      {piece.data.length > 0 && (
        <Card accent={piece.color} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15, color: piece.color, marginBottom: 12 }}>SIZE CHART</div>
          <DataTable cols={piece.cols} rows={piece.data} highlightCol={piece.highlightCol} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
            No seam allowance -- raw edge finish. L1 = top layer. L2 = L1 square + 3". L3 = L1 square + 6". Each +3" square = +1.5" visible length.
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Steps items={piece.cutSteps} color={C.blue} title="✂️  Cut Instructions" />
        <Steps items={piece.buildSteps} color={C.pink} title="🪡  Build Instructions" />
      </div>
    </div>
  );
}

// ─── BODY MEASUREMENT TABLE ───────────────────────────────────────────────────

function BodyMeasurementView() {
  const groups = Object.keys(sizeChartData);
  const colorMap: Record<string, string> = { toddler: C.pink, youth: C.blue, adult: C.teal };
  const [active, setActive] = useState("toddler");
  const current = sizeChartData[active];
  return (
    <Card accent={current.color}>
      <SectionHeader color={current.color} sub='All measurements in inches. Torso = shoulder to hip. Hip = belt line.'>
        Body Measurements
      </SectionHeader>
      <TabGroup options={groups} active={active} onSelect={setActive} colorMap={colorMap} />
      <div style={{ overflowX: "auto", borderRadius: 12, border: `2px solid ${C.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
          <thead>
            <tr style={{ background: current.color }}>
              <th style={{ padding: "10px 10px", textAlign: "left", color: C.white, fontSize: 11, borderBottom: `2px solid ${current.color}`, whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>Size</th>
              <th style={{ padding: "10px 10px", textAlign: "left", color: C.white, fontSize: 11, borderBottom: `2px solid ${current.color}`, whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>Age</th>
              {measurementCols.map(col => (
                <th key={col.key} style={{ padding: "10px 10px", textAlign: "left", color: C.white, fontSize: 10, borderBottom: `2px solid ${current.color}`, whiteSpace: "nowrap", fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.sizes.map((row, i) => (
              <tr key={i}
                style={{ background: i % 2 === 0 ? C.white : C.surface }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = current.color + "15"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.white : C.surface}>
                <td style={{ padding: "8px 10px", color: current.color, fontWeight: 900, borderBottom: `1px solid ${C.border}`, fontFamily: "'Nunito', sans-serif" }}>{row.us}</td>
                <td style={{ padding: "8px 10px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{row.age}</td>
                {measurementCols.map(col => (
                  <td key={col.key} style={{ padding: "8px 10px", color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{row[col.key]}"</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── SHOE TABLE ───────────────────────────────────────────────────────────────

function ShoeView() {
  const groups = Object.keys(shoeData);
  const colorMap: Record<string, string> = { toddler: C.pink, youth: C.blue, adult: C.teal };
  const [active, setActive] = useState("toddler");
  const current = shoeData[active];
  return (
    <Card accent={current.color}>
      <SectionHeader color={current.color} sub="US size, Chinese CN number, foot length in inches.">
        Shoe Size Reference
      </SectionHeader>
      <TabGroup options={groups} active={active} onSelect={setActive} colorMap={colorMap} />
      <div style={{ overflowX: "auto", borderRadius: 12, border: `2px solid ${C.border}`, maxWidth: 380 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
          <thead>
            <tr style={{ background: current.color }}>
              {['US Size', 'CN Size', 'Foot Length"'].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.white, fontSize: 11, borderBottom: `2px solid ${current.color}`, fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.rows.map((row, i) => (
              <tr key={i}
                style={{ background: i % 2 === 0 ? C.white : C.surface }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = current.color + "15"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.white : C.surface}>
                <td style={{ padding: "9px 16px", color: current.color, fontWeight: 900, borderBottom: `1px solid ${C.border}`, fontFamily: "'Nunito', sans-serif" }}>{row.us}</td>
                <td style={{ padding: "9px 16px", color: C.blue, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>{row.cn}</td>
                <td style={{ padding: "9px 16px", color: C.text, borderBottom: `1px solid ${C.border}` }}>{row.footIn}"</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PatternsPage() {
  const [activePiece, setActivePiece] = useState<PieceDef | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;600&display=swap');`}</style>

      {/* Page header — matches masmanager style */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1E2029", margin: 0, fontFamily: "'Nunito', sans-serif" }}>
            Mas Mentality — Patterns
          </h1>
          <p style={{ color: "#6B7280", marginTop: "0.2rem", fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif" }}>
            Pattern archive, size charts & cut instructions · TJC 2026
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill text="@mas.mentality" bg={C.blue} />
          <Pill text="Ghana Theme" bg={C.pink} />
          <Pill text="25 Costumes" bg={C.teal} />
        </div>
      </div>

      {activePiece ? (
        <PatternView piece={activePiece} onBack={() => setActivePiece(null)} />
      ) : (
        <>
          {/* Pattern Catalog */}
          <div>
            <SectionHeader color={C.blue} sub="Click any piece to open its full size chart and build instructions.">
              Pattern Catalog
            </SectionHeader>
            {Object.entries(catalog).map(([gender, group]) => (
              <div key={gender} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>{group.emoji}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 14, color: C.white, background: group.color, borderRadius: 8, padding: "3px 12px", letterSpacing: "0.04em" }}>
                    {gender.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                  {group.pieces.map(piece => (
                    <button key={piece.name} onClick={() => setActivePiece(piece)} style={{
                      background: C.white, border: `2px solid ${piece.color}`,
                      borderRadius: 14, padding: "16px 20px", cursor: "pointer", textAlign: "left",
                      minWidth: 220, maxWidth: 280,
                      boxShadow: `0 4px 0 ${piece.color}`,
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 0 ${piece.color}`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 0 ${piece.color}`; }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{piece.emoji}</div>
                      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16, color: piece.color, marginBottom: 4 }}>{piece.name}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>{piece.tagline}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {piece.tags.map(t => <Pill key={t} text={t} bg={piece.color + "22"} textColor={piece.color} />)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Body + Shoe */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <BodyMeasurementView />
            <ShoeView />
          </div>
        </>
      )}
    </div>
  );
}
