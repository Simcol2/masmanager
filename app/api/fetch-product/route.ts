import { NextRequest, NextResponse } from "next/server";

// Keyword maps for category detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  rhinestone: ["rhinestone", "crystal", "ss6", "ss8", "ss10", "ss12", "ss16", "ss20", "ss30", "flatback", "hotfix", "strass", "diamante"],
  gem: ["gem", "gemstone", "bead", "pearl", "cabochon", "jewel"],
  fabric: ["fabric", "mesh", "lycra", "spandex", "satin", "chiffon", "velvet", "tulle", "organza", "polyester", "nylon", "jersey", "knit"],
  feather: ["feather", "ostrich", "marabou", "fluffy", "plume", "boa"],
  trim: ["trim", "braid", "lace", "ribbon", "fringe", "tassel", "sequin", "fringe", "pom"],
  elastic: ["elastic", "stretch band", "waistband"],
  wire: ["wire", "aluminum wire", "craft wire", "millinery wire"],
  chain: ["chain", "ball chain", "curb chain"],
  htv: ["htv", "heat transfer vinyl", "iron-on vinyl", "vinyl film"],
  cardstock: ["cardstock", "card stock", "foam board", "foam sheet"],
  glue: ["glue", "adhesive", "e6000", "gel nails", "nail gel", "uv gel"],
  tool: ["tool", "plier", "cutter", "applicator", "tweezers", "hot fix tool"],
  hardware: ["d-ring", "d ring", "buckle", "snap", "zipper", "hook", "clasp", "eyelet", "grommet", "rivet"],
  paint: ["paint", "acrylic paint", "fabric paint"],
};

const SHAPE_KEYWORDS: [string, string[]][] = [
  ["Round",      ["round", "circular", "circle", "disc", "disk"]],
  ["Oval",       ["oval"]],
  ["Square",     ["square"]],
  ["Rectangle",  ["rectangle", "rectangular", "oblong"]],
  ["Diamond",    ["diamond"]],
  ["Teardrop",   ["teardrop", "tear drop", "pear shape"]],
  ["Heart",      ["heart"]],
  ["Star",       ["star"]],
  ["Hexagon",    ["hexagon", "hex"]],
  ["Triangle",   ["triangle", "triangular"]],
  ["Navette",    ["navette", "marquise", "boat shape"]],
  ["Flatback",   ["flatback", "flat back"]],
  ["Cabochon",   ["cabochon", "cab"]],
];

function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return null;
}

function detectShape(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [shape, keywords] of SHAPE_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return shape;
  }
  return null;
}

function detectSupplier(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("alibaba.com")) return "Alibaba";
    if (host.includes("aliexpress.com")) return "AliExpress";
    if (host.includes("amazon.com") || host.includes("amazon.ca")) return "Amazon";
    if (host.includes("temu.com")) return "Temu";
    if (host.includes("shein.com")) return "Shein";
    if (host.includes("etsy.com")) return "Etsy";
  } catch { /* ignore */ }
  return null;
}

// Parse price from strings like "$3.50 - $12.00 / Pack" or "US $0.50/piece"
function parsePrice(text: string): { amount: number; qty: number; unit: string } | null {
  // Remove commas from numbers
  const clean = text.replace(/,/g, "");
  // Match first dollar amount (USD or just $)
  const priceMatch = clean.match(/(?:US\s*)?\$\s*([\d.]+)/i);
  if (!priceMatch) return null;
  const amount = parseFloat(priceMatch[1]);
  if (!amount || isNaN(amount)) return null;

  // Try to find unit after the price range
  const unitMatch = clean.match(/\/\s*(pack|bag|piece|pcs|yard|metre|meter|roll|spool|sheet|feet|gram|kg|box|set)/i);
  const unit = unitMatch ? unitMatch[1].toLowerCase().replace("meter", "metre") : "pcs";

  return { amount, qty: 1, unit };
}

// Parse quantity from title like "1440pcs", "200 pieces", "10 yards"
function parseQty(text: string): { qty: number; unit: string } | null {
  const patterns = [
    /\b([\d,]+)\s*(pcs|pieces|pc)\b/i,
    /\b([\d,]+)\s*(yards?)\b/i,
    /\b([\d,]+)\s*(metres?|meters?)\b/i,
    /\b([\d,]+)\s*(bags?)\b/i,
    /\b([\d,]+)\s*(rolls?)\b/i,
  ];
  for (const pat of patterns) {
    const m = text.replace(/,/g, "").match(pat);
    if (m) {
      const qty = parseInt(m[1]);
      if (!isNaN(qty) && qty > 0) {
        let unit = m[2].toLowerCase();
        if (unit.startsWith("piece") || unit === "pc") unit = "pcs";
        if (unit.startsWith("yard")) unit = "yard";
        if (unit.startsWith("metre") || unit.startsWith("meter")) unit = "metre";
        if (unit.startsWith("bag")) unit = "bag";
        if (unit.startsWith("roll")) unit = "roll";
        return { qty, unit };
      }
    }
  }
  return null;
}

// Parse min order from strings like "Min. Order: 3 Bags" or "Minimum order quantity: 5"
function parseMinOrder(text: string): { qty: number; unit: string } | null {
  const m = text.match(/min(?:imum)?\.?\s*order[^:]*:\s*([\d,]+)\s*(\w+)?/i);
  if (!m) return null;
  const qty = parseInt(m[1].replace(/,/g, ""));
  if (isNaN(qty) || qty <= 0) return null;
  const raw = (m[2] ?? "pcs").toLowerCase();
  const unit = raw.startsWith("piece") || raw === "pc" ? "pcs"
    : raw.startsWith("bag") ? "bag"
    : raw.startsWith("pack") ? "pack"
    : raw.startsWith("yard") ? "yard"
    : raw.startsWith("roll") ? "roll"
    : raw.startsWith("metre") || raw.startsWith("meter") ? "metre"
    : "pcs";
  return { qty, unit };
}

function getMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function cleanTitle(title: string): string {
  // Strip common Alibaba suffixes like "- Buy X,Y,Z Product on Alibaba.com"
  return title
    .replace(/\s*[-|]\s*(Buy|Shop|Find|Source|China|Alibaba\.com|AliExpress\.com|Amazon\.com).*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
    new URL(url); // validate
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let html: string;
  let finalUrl = url;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    finalUrl = res.url || url;
    html = await res.text();
  } catch (e) {
    return NextResponse.json({ error: "Could not reach that URL. Try copying the full product page URL." }, { status: 502 });
  }

  const ogTitle = getMeta(html, "og:title");
  const ogImage = getMeta(html, "og:image");
  const ogDesc  = getMeta(html, "og:description") ?? getMeta(html, "description") ?? "";
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";

  const rawTitle = ogTitle || titleTag || "";
  const name = cleanTitle(rawTitle);
  const searchText = `${name} ${ogDesc}`.toLowerCase();

  const category = detectCategory(searchText) ?? "rhinestone";
  const shape    = detectShape(searchText);
  const supplier = detectSupplier(finalUrl);

  // Price: try og:description first, then full page snippet
  const priceInfo = parsePrice(ogDesc) ?? parsePrice(name);
  // Quantity: usually in product title
  const qtyInfo   = parseQty(name) ?? parseQty(ogDesc);
  // Min order: often in description
  const minInfo   = parseMinOrder(ogDesc) ?? parseMinOrder(html.slice(0, 8000));

  // If we found qty in the name, and price is per-unit, the cost is for that many pcs
  let costAmount: number | undefined;
  let costQty: number | undefined;
  let costUnit: string | undefined;

  if (priceInfo) {
    costAmount = priceInfo.amount;
    costUnit   = priceInfo.unit;
    // If qty was found in name, use it as the quantity covered by that price
    if (qtyInfo && (qtyInfo.unit === costUnit || costUnit === "pcs" || costUnit === "pack" || costUnit === "bag")) {
      costQty = qtyInfo.qty;
    } else {
      costQty = 1;
    }
  }

  return NextResponse.json({
    name: name || undefined,
    imageUrl: ogImage || undefined,
    category,
    shape: shape || undefined,
    costAmount,
    costQty,
    costUnit,
    minOrderQty: minInfo?.qty,
    minOrderUnit: minInfo?.unit,
    supplier: supplier || undefined,
    supplierLink: finalUrl,
  });
}
