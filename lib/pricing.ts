// ── The Black Stars 2026 pricing (from The Black Stars Binder PDF) ────────────

export const COSTUME_PRICES: Record<string, number> = {
  girls_backline:        150,
  boys_backline:         150,
  toddler_frontline:     280,
  girls_frontline:       280,
  boys_frontline:        280,
  girls_ultra_frontline: 420,
  boys_ultra_frontline:  420,
};

export const MODEL_DISCOUNT = 150;

export const ADD_ON_ITEMS: { key: string; label: string; price: number }[] = [
  { key: "medium_backpack_ostrich",  label: "Medium Backpack w/ Ostrich",  price: 115 },
  { key: "small_girls_backpack",     label: "Small Girls Backpack",         price:  75 },
  { key: "ultra_frontline_backpack", label: "Ultra Frontline Backpack",     price: 100 },
  { key: "child_headband",           label: "Child Headband",               price:  30 },
  { key: "adult_headband",           label: "Adult Headband",               price:  40 },
  { key: "small_crown",              label: "Small Crown",                  price:  40 },
  { key: "large_diamond_flag",       label: "Large Diamond Flag",           price:  60 },
  { key: "cage_skirt_metallic",      label: "Cage Skirt & Metallic Shorts", price: 130 },
  { key: "tiara",                    label: "Tiara",                        price:  30 },
  { key: "toddler_collar",           label: "Toddler Collar",               price:  35 },
  { key: "boys_large_feather_head",  label: "Boys Large Feather Head",      price:  30 },
  { key: "sunglasses",               label: "Sun Glasses",                  price:   5 },
  { key: "ultra_frontline_crown",    label: "Ultra Frontline Crown",        price:  60 },
];
