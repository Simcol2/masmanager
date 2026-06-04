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

// Parse price from strings like "$3.50 - $12.00 / Pack" or "US $0.50/piece" or "USD1.50"
function parsePrice(text: string): { amount: number; unit: string } | null {
  const clean = text.replace(/,/g, "");
  // Patterns: "$3.50", "US $3.50", "USD 3.50", "USD3.50"
  const priceMatch = clean.match(/(?:US[D]?\s*)?\$\s*([\d.]+)|USD\s*([\d.]+)/i);
  if (!priceMatch) return null;
  const amount = parseFloat(priceMatch[1] ?? priceMatch[2]);
  if (!amount || isNaN(amount) || amount <= 0) return null;

  // Try to find unit after a slash
  const unitMatch = clean.match(/\/\s*(pack|bag|piece|pcs|pc|yard|metre|meter|roll|spool|sheet|feet|gram|kg|box|set)/i);
  let unit = unitMatch ? unitMatch[1].toLowerCase() : "pcs";
  if (unit === "piece" || unit === "pc") unit = "pcs";
  if (unit === "meter") unit = "metre";

  return { amount, unit };
}

// Try to extract price from JSON-LD structured data embedded in the page
function extractJsonLdPrice(html: string): { amount: number; unit: string } | null {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, json] of scripts) {
    try {
      const data = JSON.parse(json);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const offers = item?.offers ?? item?.["@graph"]?.find?.((n: Record<string, unknown>) => n?.["@type"] === "Offer");
        const offer = Array.isArray(offers) ? offers[0] : offers;
        const raw = offer?.price ?? offer?.lowPrice ?? item?.price;
        if (raw) {
          const amount = parseFloat(String(raw).replace(/,/g, ""));
          if (!isNaN(amount) && amount > 0) return { amount, unit: "pcs" };
        }
      }
    } catch { /* ignore malformed JSON */ }
  }
  return null;
}

// Scan all <script> tag content for JSON price keys (catches Alibaba window state injection)
function extractScriptPrice(html: string): { amount: number; unit: string } | null {
  // Collect all script tag bodies
  const scriptBodies: string[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (body.length > 20) scriptBodies.push(body);
  }
  const combined = scriptBodies.join("\n");

  // Price keys to look for, in priority order
  const priceKeys = [
    "\"price\"", "\"priceFrom\"", "\"minPrice\"", "\"startPrice\"", "\"lowPrice\"",
    "'price'", "price:", "priceMin:", "priceFrom:",
  ];
  for (const key of priceKeys) {
    // Match key followed by colon/equals and a numeric value (optionally quoted)
    const pat = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:\\=]\\s*["']?([0-9]+\\.?[0-9]*)["']?`, "i");
    const m = combined.match(pat);
    if (m?.[1]) {
      const amount = parseFloat(m[1]);
      if (!isNaN(amount) && amount > 0 && amount < 100000) return { amount, unit: "pcs" };
    }
  }
  return null;
}

// Try itemprop="price" or data-price attributes in HTML markup
function extractAttributePrice(html: string): { amount: number; unit: string } | null {
  const patterns = [
    /itemprop=["'](?:low)?[Pp]rice["'][^>]*content=["']([\d.,]+)["']/i,
    /content=["']([\d.,]+)["'][^>]*itemprop=["'](?:low)?[Pp]rice["']/i,
    /data-price=["']([\d.,]+)["']/i,
    /data-min-price=["']([\d.,]+)["']/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m?.[1]) {
      const amount = parseFloat(m[1].replace(/,/g, ""));
      if (!isNaN(amount) && amount > 0) return { amount, unit: "pcs" };
    }
  }
  return null;
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

  // Price: cascade through extraction methods — most specific first
  const priceInfo =
    parsePrice(ogDesc) ??
    parsePrice(name) ??
    extractJsonLdPrice(html) ??
    extractAttributePrice(html) ??
    extractScriptPrice(html);

  // Quantity: usually in product title
  const qtyInfo = parseQty(name) ?? parseQty(ogDesc);
  // Min order: often in description or early HTML
  const minInfo = parseMinOrder(ogDesc) ?? parseMinOrder(html.slice(0, 12000));

  let costAmount: number | undefined;
  let costQty: number | undefined;
  let costUnit: string | undefined;

  if (priceInfo) {
    costAmount = priceInfo.amount;
    costUnit   = priceInfo.unit;
    // If a qty was in the title AND the price appears to be per-lot, use that qty
    if (qtyInfo && (qtyInfo.unit === costUnit || ["pcs", "pack", "bag", "box", "set"].includes(costUnit))) {
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
