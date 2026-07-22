import { z } from "zod";

// Enums
export const UserRole = z.enum(["admin", "registrar", "production"]);
export const SeasonStatus = z.enum(["active", "archived", "draft"]);
export const PaymentStatus = z.enum(["paid", "partial", "deposit", "unpaid"]);
export const Gender = z.enum(["boy", "girl"]);

export const CostumeType = z.enum([
  "girls_backline",
  "boys_backline",
  "toddler_frontline",
  "girls_frontline",
  "boys_frontline",
  "girls_ultra_frontline",
  "boys_ultra_frontline",
]);

export const ShirtSize = z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);

export const InventoryCategory = z.enum([
  "gems",
  "trims",
  "feathers",
  "elastic",
  "wire",
  "appliques",
  "bases",
  "packaging",
  "miscellaneous",
]);

// User
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: UserRole,
  photoURL: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Season
export const SeasonSchema = z.object({
  id: z.string(),
  year: z.string().regex(/^\d{4}$/),
  theme: z.string().min(1),
  registrationOpenDate: z.date().optional(),
  registrationCloseDate: z.date().optional(),
  status: SeasonStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Registration
export const RegistrationSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.number().min(0).max(18),
  gender: Gender,
  costumeType: CostumeType,
  style: z.string().optional(),
  topSize: z.string().optional(),
  bottomSize: z.string().optional(),
  bandSize: z.string().optional(),
  girlsTopSize: z.string().optional(),
  waist: z.string().optional(),
  shoeSize: z.string().optional(),
  shoeCategory: z.string().optional(),
  addOns: z.string().optional(),           // human-readable list, auto-populated
  selectedAddOns: z.array(z.string()).default([]),  // structured add-on keys
  isModel: z.boolean().default(false),      // models get $150 off
  costumeBasePrice: z.number().min(0).default(0),
  addOnTotal: z.number().min(0).default(0),
  modelDiscount: z.number().min(0).default(0),
  totalCost: z.number().min(0).default(0),
  parentName: z.string().min(1),
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().optional(),
  participantPhoto: z.string().url().optional(),
  registrationDate: z.date(),
  paymentStatus: PaymentStatus,
  amountPaid: z.number().min(0).default(0),
  balanceOwing: z.number().min(0).default(0),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Parent Shirt
export const ParentShirtSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  parentName: z.string().min(1),
  participantName: z.string().optional(),
  style: z.string().optional(),
  size: ShirtSize,
  quantity: z.number().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Inventory
export const InventoryItemSchema = z.object({
  id: z.string(),
  sku: z.string().min(1),
  name: z.string().min(1),
  category: InventoryCategory,
  supplier: z.string().optional(),
  photoURL: z.string().url().optional(),
  unitCost: z.number().min(0).default(0),
  quantityOnHand: z.number().min(0).default(0),
  reorderThreshold: z.number().min(0).default(0),
  storageLocation: z.string().optional(),
  seasonsUsed: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Inventory Transaction
export const InventoryTransactionSchema = z.object({
  id: z.string(),
  inventoryItemId: z.string(),
  seasonId: z.string().optional(),
  quantityChange: z.number(),
  reason: z.string(),
  timestamp: z.date(),
});

// ─── Master Piece Library ────────────────────────────────────────────────────

export const PieceCategory = z.enum([
  "bands",
  "tops_bottoms",
  "skirts_tutus",
  "accessories",
  "collars",
  "backpacks",
  "headpieces",
  "jewelry",
  "footwear",
]);

// Size groups — each piece belongs to exactly one group which determines
// which sizes are available for selection when assigning to a season.
export const PieceSizeGroup = z.enum([
  "bands",        // Small, Large
  "tops_bottoms", // Toddler (2T-5T), Youth XS-XL, Adult XS-XL
  "sml_only",     // Small, Medium, Large  (tutus, skirts, belts, chest pieces, backpacks, collars, headpieces)
  "necklace",     // Small, Large
  "none",         // No sizing (e.g. a custom piece with no standard sizing)
]);

// The canonical size options per group
export const BAND_SIZES = ["Small", "Large"] as const;
export const TOPS_SIZES = [
  "2T", "3T", "4T", "5T",
  "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
  "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL",
] as const;
export const SML_SIZES = ["Small", "Medium", "Large"] as const;
export const NECKLACE_SIZES = ["Small", "Large"] as const;

export type BandSize = typeof BAND_SIZES[number];
export type TopsSize = typeof TOPS_SIZES[number];
export type SmlSize = typeof SML_SIZES[number];
export type NecklaceSize = typeof NECKLACE_SIZES[number];

// All default pieces seeded into the master library
export const DEFAULT_PIECE_NAMES = [
  "Arm Bands",
  "Leg Bands",
  "Thigh Bands",
  "Shorts",
  "Top",
  "Half Skirt",
  "Tutu",
  "Belt",
  "Chest Piece",
  "Collar",
  "Backpack",
  "Head Piece",
  "Necklace",
  "Shoes",
] as const;

// Default size group per piece name — drives the multiselect options in season config
export const DEFAULT_PIECE_SIZE_GROUPS: Record<string, z.infer<typeof PieceSizeGroup>> = {
  "Arm Bands":   "bands",
  "Leg Bands":   "bands",
  "Thigh Bands": "bands",
  "Shorts":      "tops_bottoms",
  "Top":         "tops_bottoms",
  "Half Skirt":  "sml_only",
  "Tutu":        "sml_only",
  "Belt":        "sml_only",
  "Chest Piece": "sml_only",
  "Collar":      "sml_only",
  "Backpack":    "sml_only",
  "Head Piece":  "sml_only",
  "Necklace":    "necklace",
  "Shoes":       "none",
};

// A single entry in the master piece library (lives in Firestore `masterPieces/`)
export const MasterPieceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: PieceCategory,
  sizeGroup: PieceSizeGroup,
  photoURL: z.string().url().optional(),
  isDefault: z.boolean().default(false), // true for the seeded list
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ─── Season Costume Configuration ────────────────────────────────────────────
// When starting a new season the admin picks which pieces apply to each
// costume type, and selects which sizes are available for each piece.

export const SeasonPieceConfigSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  costumeType: CostumeType,
  masterPieceId: z.string(),    // ref → masterPieces/{id}
  pieceName: z.string(),        // denormalised for display
  availableSizes: z.array(z.string()), // subset of sizes from the piece's sizeGroup
  photoURL: z.string().url().optional(), // season-specific photo (overrides master)
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SeasonAssetCategory = z.enum([
  "costume_style_photo",   // internal — costume card photos
  "instagram",
  "website",
  "binder",
  "models_photoshoot",
  "email_templates",
  "costume_templates",
  "miscellaneous",
]);

export const SeasonAssetSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  category: SeasonAssetCategory,
  costumeType: CostumeType.optional(),
  title: z.string().min(1),          // display name (can be renamed)
  fileName: z.string().min(1),       // original file name
  fileURL: z.string().url(),
  mimeType: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ─── Gems & Supplies ─────────────────────────────────────────────────────────
// Individual raw materials: rhinestones, gems, trims, glue, fabric, etc.
// These feed into the Applique builder so cost rolls up automatically.

export const SupplyCategory = z.enum([
  "rhinestone",
  "gem",
  "trim",
  "fabric",
  "feather",
  "frame",
  "wire",
  "elastic",
  "chain",
  "applique_material",
  "htv",
  "cardstock",
  "glue",
  "tool",
  "hardware",
  "paint",
  "bodywear",
  "other",
]);

export const GemSupplySchema = z.object({
  id: z.string(),
  itemNumber: z.string(),
  name: z.string().min(1),
  category: SupplyCategory,
  availableColours: z.array(z.string()).default([]), // multiselect, e.g. ["Gold", "Silver", "Clear"]
  photoURL: z.string().url().optional(),
  // Cost structure: "$X for Y <unit>" — e.g. "$13 for 200 pcs"
  costAmount: z.number().min(0).default(0),     // price paid, e.g. 13
  costQty: z.number().min(0).default(1),         // how many units that covers, e.g. 200
  costUnit: z.string().default("pcs"),           // unit for cost qty: pcs, bag, yard, metre…
  unitCost: z.number().min(0).default(0),        // auto-calc: costAmount / costQty (per individual piece)
  quantityOnHand: z.number().min(0).default(0), // how many pieces/units you have
  // Min order: e.g. "3 bags"
  minOrderQty: z.number().min(0).default(0),
  minOrderUnit: z.string().default("pcs"),
  supplierLink: z.string().optional(), // URL to product listing
  supplier: z.string().optional(),
  shape: z.string().optional(),            // e.g. "Round", "Teardrop", "Rectangle"
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SupplyCategory = z.infer<typeof SupplyCategory>;
export type GemSupply = z.infer<typeof GemSupplySchema>;

// ─── Applique Library ────────────────────────────────────────────────────────
// An applique is a decorative element (stone, gem, trim piece, etc.) that gets
// used on costume pieces. Cost is derived from the linked inventory item's unit
// price. Each usage record ties the applique to a specific master piece with a
// quantity, so the system can calculate total materials needed per registration.

// An ingredient: one gem/supply used in an applique
export const AppliqueIngredientSchema = z.object({
  gemSupplyId: z.string(),
  gemSupplyName: z.string(),       // denormalised
  quantity: z.number().min(0.001),
  unitCost: z.number().min(0),     // snapshotted from GemSupply at time of save
  lineCost: z.number().min(0),     // quantity × unitCost
});

export type AppliqueIngredient = z.infer<typeof AppliqueIngredientSchema>;

export const AppliqueSchema = z.object({
  id: z.string(),
  itemNumber: z.string(),           // auto-generated, e.g. "APL-0001"
  name: z.string().min(1),
  photoURL: z.string().url().optional(),
  ingredients: z.array(AppliqueIngredientSchema).default([]),
  totalCost: z.number().min(0).default(0), // sum of ingredient line costs
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Tracks how many of a given applique are used on a specific costume piece
// in a specific season. e.g. "3 × APL-0001 on Girls Belt in 2026"
export const AppliqueUsageSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  appliqueId: z.string(),
  appliqueName: z.string(),         // denormalised
  appliqueItemNumber: z.string(),   // denormalised
  masterPieceId: z.string(),        // which costume piece this applies to
  pieceName: z.string(),            // denormalised
  costumeType: CostumeType,
  quantityPerCostume: z.number().min(1).default(1),
  // Computed from inventory: unitCost × quantityPerCostume
  costPerCostume: z.number().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Applique = z.infer<typeof AppliqueSchema>;
export type AppliqueUsage = z.infer<typeof AppliqueUsageSchema>;

// ─── Piece Builder ────────────────────────────────────────────────────────────
// Direct supply and applique assignments to a master piece (season-agnostic).
// Cost traces back to GemSupply.unitCost (supplies) or Applique.totalCost (appliques).
export const PieceIngredientSchema = z.object({
  id: z.string(),
  masterPieceId: z.string(),
  pieceName: z.string(),
  type: z.enum(["supply", "applique"]),
  // supply fields
  gemSupplyId: z.string().optional(),
  gemSupplyName: z.string().optional(),
  gemSupplyItemNumber: z.string().optional(),
  // applique fields
  appliqueId: z.string().optional(),
  appliqueName: z.string().optional(),
  appliqueItemNumber: z.string().optional(),
  // cost fields (snapshotted at save time)
  quantity: z.number().min(0).default(1),
  unitCost: z.number().min(0).default(0),
  lineCost: z.number().min(0).default(0),
  dimWidth: z.number().optional(),   // inches, for linear supplies (fabric, trim, elastic)
  dimLength: z.number().optional(),  // inches, drives qty calculation for linear supplies
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PieceIngredient = z.infer<typeof PieceIngredientSchema>;

// ─── Bodywear Recipes ─────────────────────────────────────────────────────────
// A bodywear item (supply category "bodywear") decorated with appliques and
// fabric to determine its full cost for a specific costume type.
export const BodywearIngredientSchema = z.object({
  type: z.enum(["supply", "applique"]),
  gemSupplyId: z.string().optional(),
  gemSupplyName: z.string().optional(),
  gemSupplyItemNumber: z.string().optional(),
  appliqueId: z.string().optional(),
  appliqueName: z.string().optional(),
  appliqueItemNumber: z.string().optional(),
  quantity: z.number().min(0).default(1),
  unitCost: z.number().min(0).default(0),
  lineCost: z.number().min(0).default(0),
  dimWidth: z.number().optional(),
  dimLength: z.number().optional(),
});
export const BodywearRecipeSchema = z.object({
  id: z.string(),
  bodywearSupplyId: z.string(),
  bodywearName: z.string(),
  costumeType: CostumeType,
  ingredients: z.array(BodywearIngredientSchema).default([]),
  totalCost: z.number().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BodywearIngredient = z.infer<typeof BodywearIngredientSchema>;
export type BodywearRecipe = z.infer<typeof BodywearRecipeSchema>;

// ─── Costume Recipe ───────────────────────────────────────────────────────────
export const CostumeMaterialSchema = z.object({
  inventoryItemId: z.string(),
  quantityPerPiece: z.number().min(0),
});

export const CostumePieceSchema = z.object({
  name: z.string().min(1),
  materials: z.array(CostumeMaterialSchema),
});

export const CostumeRecipeSchema = z.object({
  id: z.string(),
  costumeType: CostumeType,
  name: z.string().min(1),
  pieces: z.array(CostumePieceSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Production
export const ProductionPieceSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  pieceName: z.string().min(1),
  costumeType: CostumeType,
  totalNeeded: z.number().min(0).default(0),
  completed: z.number().min(0).default(0),
  remaining: z.number().min(0).default(0),
  assignedTo: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).default("not_started"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ─── Build Tracker ───────────────────────────────────────────────────────────

// Full pool of possible production steps
export const ALL_PRODUCTION_STEPS = [
  "Fabric cut",
  "Straps added",
  "Gems added",
  "Iron on completed",
  "Wire wrapped",
  "Wire bent",
  "Base layer cut",
  "Grommets added",
  "Kente added",
  "Necklaces added",
  "HTV added",
  "Trims added",
  "D-rings added",
  "Fabric added",
  "Base layer back side fabric added",
  "Feathers added",
] as const;

export type ProductionStep = (typeof ALL_PRODUCTION_STEPS)[number];

// Default step list per piece name (suggested starting point in step picker)
export const PIECE_STEP_DEFAULTS: Record<string, string[]> = {
  "Arm Bands":   ["Fabric cut", "Straps added", "Gems added", "Iron on completed"],
  "Leg Bands":   ["Fabric cut", "Straps added", "Gems added", "Iron on completed"],
  "Thigh Bands": ["Fabric cut", "Straps added", "Gems added", "Iron on completed"],
  "Belt":        ["Fabric cut", "Straps added", "Gems added", "Iron on completed"],
  "Head Piece":  ["Wire wrapped", "Gems added"],
  "Collar":      ["Base layer cut", "Gems added"],
  "Top":         ["Base layer cut", "Grommets added", "Kente added", "Necklaces added", "Straps added", "HTV added"],
  "Shorts":      ["Kente added", "Gems added"],
  "Backpack":    ["Wire bent", "Wire wrapped", "D-rings added", "Fabric added", "Base layer back side fabric added", "Gems added", "Feathers added"],
  "Shoes":       ["Kente added", "Gems added"],
  "Chest Piece": ["Base layer cut", "Trims added", "Gems added", "Grommets added", "Straps added", "Wire wrapped"],
  "Necklace":    ["Base layer cut", "Gems added"],
  "Half Skirt":  ["Base layer cut", "Gems added"],
  "Tutu":        ["Base layer cut", "Gems added"],
};

// A single build step for one piece+costumeType in a season
export const SeasonPieceStepSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  costumeType: CostumeType,
  pieceName: z.string(),
  stepName: z.string(),
  sortOrder: z.number().int().min(0).default(0),
  status: z.enum(["not_started", "material_needed", "completed"]).default("not_started"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// A scheduled task: assign a step to a volunteer on a date with a quantity
export const ProductionTaskSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  costumeType: CostumeType,
  pieceName: z.string(),
  stepName: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  assignedTo: z.string().optional(),
  dueDate: z.date().optional(),
  completed: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ─── Costume Costing ────────────────────────────────────────────────────────────
// Per-piece sourcing (buy finished vs make), selling price per costume type, and
// the band's configurable model/calc policies. Cost still traces back to GemSupply
// unit costs (fabric) and the applique/supply recipes.

// How a single piece is obtained for a costume type this season.
export const PieceSourcingMode = z.enum([
  "buy_finished", // bought already made — a single purchase price
  "make",         // fabric + labor (labor 0 = sewn in-house)
]);

export const PieceSourcingSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  costumeType: CostumeType,
  masterPieceId: z.string(),
  pieceName: z.string(),          // denormalised for display
  mode: PieceSourcingMode.default("make"),
  // buy_finished
  finishedPrice: z.number().min(0).default(0),
  // make
  fabricSupplyId: z.string().optional(),   // a GemSupply of category "fabric"
  fabricSupplyName: z.string().optional(),
  fabricYardage: z.number().min(0).default(0),   // auto-seeded from the yardage guide, editable
  fabricUnitCost: z.number().min(0).default(0),  // $/yard snapshot at save time
  laborCost: z.number().min(0).default(0),       // charge to have it made (0 if self-sewn)
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Selling price for a whole costume of a given type, this season.
export const CostumePricingSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  costumeType: CostumeType,
  sellingPrice: z.number().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Band-wide policies the user chooses (single "global" document).
export const ModelPolicyType = z.enum([
  "discount",     // models pay full price minus a fixed discount
  "free_costume", // models pay nothing
]);

export const AppSettingsSchema = z.object({
  id: z.string(), // always "global"
  modelPolicyType: ModelPolicyType.default("discount"),
  modelDiscountAmount: z.number().min(0).default(150),
  // When making a piece, include its gems/appliques in the cost, or just fabric+labor?
  includeEmbellishmentsInPieceCost: z.boolean().default(true),
  // Fallback $/yard when a fabric supply has no unit cost yet.
  defaultFabricPricePerYard: z.number().min(0).default(0),
  updatedAt: z.date(),
});

export type PieceSourcingMode = z.infer<typeof PieceSourcingMode>;
export type PieceSourcing = z.infer<typeof PieceSourcingSchema>;
export type CostumePricing = z.infer<typeof CostumePricingSchema>;
export type ModelPolicyType = z.infer<typeof ModelPolicyType>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;

// ─── Social Media ───────────────────────────────────────────────────────────────
// A per-season brand + strategy profile that drives the content planner. Captured
// through a short onboarding wizard, then used to generate a posting schedule.

export const SocialPlatform = z.enum([
  "instagram", "facebook", "tiktok", "whatsapp", "twitter", "youtube",
]);
export const SocialGoal = z.enum([
  "registrations", "promote_costumes", "grow_followers", "build_hype",
  "band_launch", "showcase_models", "sell_shirts",
]);
export const PostingCadence = z.enum(["daily", "few_weekly", "weekly", "few_monthly"]);
export const BrandTone = z.enum(["fun", "bold", "elegant", "cultural", "family", "hype"]);
export const TargetAudience = z.enum([
  "toddler_parents", "kids_parents", "teens", "young_adults", "whole_family",
]);

export const SocialColorSchema = z.object({
  name: z.string(),
  hex: z.string(),
});
export const SocialKeyDateSchema = z.object({
  label: z.string(),
  date: z.date(),
});

export const SocialProfileSchema = z.object({
  id: z.string(),           // "2026" (one profile per season)
  seasonId: z.string(),
  // Brand basics
  sectionName: z.string().min(1),
  slogan: z.string().optional(),
  description: z.string().optional(),
  colors: z.array(SocialColorSchema).default([]),
  // Strategy
  goals: z.array(SocialGoal).default([]),
  platforms: z.array(SocialPlatform).default([]),
  cadence: PostingCadence.default("few_weekly"),
  tones: z.array(BrandTone).default([]),
  audiences: z.array(TargetAudience).default([]),
  // Key dates
  registrationOpen: z.date().optional(),
  registrationClose: z.date().optional(),
  bandLaunch: z.date().optional(),
  carnivalDate: z.date().optional(),
  customDates: z.array(SocialKeyDateSchema).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SocialPlatform = z.infer<typeof SocialPlatform>;
export type SocialGoal = z.infer<typeof SocialGoal>;
export type PostingCadence = z.infer<typeof PostingCadence>;
export type BrandTone = z.infer<typeof BrandTone>;
export type TargetAudience = z.infer<typeof TargetAudience>;
export type SocialColor = z.infer<typeof SocialColorSchema>;
export type SocialKeyDate = z.infer<typeof SocialKeyDateSchema>;
export type SocialProfile = z.infer<typeof SocialProfileSchema>;

export const SocialPlatformLabels: Record<SocialPlatform, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok",
  whatsapp: "WhatsApp", twitter: "X (Twitter)", youtube: "YouTube",
};
export const SocialGoalLabels: Record<SocialGoal, string> = {
  registrations: "Get registrations",
  promote_costumes: "Promote the costumes",
  grow_followers: "Grow followers",
  build_hype: "Build hype and awareness",
  band_launch: "Drive to band launch",
  showcase_models: "Showcase models",
  sell_shirts: "Sell parent shirts",
};
export const PostingCadenceLabels: Record<PostingCadence, string> = {
  daily: "Daily",
  few_weekly: "A few times a week",
  weekly: "Weekly",
  few_monthly: "A few times a month",
};
export const BrandToneLabels: Record<BrandTone, string> = {
  fun: "Fun and playful",
  bold: "Bold and vibrant",
  elegant: "Elegant and luxe",
  cultural: "Cultural and authentic",
  family: "Family friendly",
  hype: "High energy hype",
};
export const TargetAudienceLabels: Record<TargetAudience, string> = {
  toddler_parents: "Parents of toddlers",
  kids_parents: "Parents of kids",
  teens: "Teens",
  young_adults: "Young adults",
  whole_family: "Whole family",
};

// Dashboard Metrics
export const DashboardMetricsSchema = z.object({
  totalRegistrations: z.number(),
  totalRevenue: z.number(),
  outstandingBalance: z.number(),
  inventoryAlerts: z.number(),
  productionAlerts: z.number(),
  parentShirtTotals: z.record(ShirtSize, z.number()),
  registrationsByCostumeType: z.record(CostumeType, z.number()),
  productionProgress: z.number(),
});

// Types
export type UserRole = z.infer<typeof UserRole>;
export type SeasonStatus = z.infer<typeof SeasonStatus>;
export type PaymentStatus = z.infer<typeof PaymentStatus>;
export type Gender = z.infer<typeof Gender>;
export type CostumeType = z.infer<typeof CostumeType>;
export type ShirtSize = z.infer<typeof ShirtSize>;
export type InventoryCategory = z.infer<typeof InventoryCategory>;
export type PieceCategory = z.infer<typeof PieceCategory>;
export type PieceSizeGroup = z.infer<typeof PieceSizeGroup>;
export type MasterPiece = z.infer<typeof MasterPieceSchema>;
export type SeasonPieceConfig = z.infer<typeof SeasonPieceConfigSchema>;
export type SeasonAssetCategory = z.infer<typeof SeasonAssetCategory>;
export type SeasonAsset = z.infer<typeof SeasonAssetSchema>;

export type User = z.infer<typeof UserSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type Registration = z.infer<typeof RegistrationSchema>;
export type ParentShirt = z.infer<typeof ParentShirtSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryTransaction = z.infer<typeof InventoryTransactionSchema>;
export type CostumeMaterial = z.infer<typeof CostumeMaterialSchema>;
export type CostumePiece = z.infer<typeof CostumePieceSchema>;
export type CostumeRecipe = z.infer<typeof CostumeRecipeSchema>;
export type ProductionPiece = z.infer<typeof ProductionPieceSchema>;
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
export type SeasonPieceStep = z.infer<typeof SeasonPieceStepSchema>;
export type ProductionTask = z.infer<typeof ProductionTaskSchema>;

// Costume type display names
export const CostumeTypeLabels: Record<CostumeType, string> = {
  girls_backline: "Girls Backline",
  boys_backline: "Boys Backline",
  toddler_frontline: "Toddler Frontline",
  girls_frontline: "Girls Frontline",
  boys_frontline: "Boys Frontline",
  girls_ultra_frontline: "Girls Ultra Frontline",
  boys_ultra_frontline: "Boys Ultra Frontline",
};

// Inventory category display names
export const InventoryCategoryLabels: Record<InventoryCategory, string> = {
  gems: "Gems",
  trims: "Trims",
  feathers: "Feathers",
  elastic: "Elastic",
  wire: "Wire",
  appliques: "Appliques",
  bases: "Bases",
  packaging: "Packaging",
  miscellaneous: "Miscellaneous",
};

// Role display names
export const UserRoleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  registrar: "Registrar",
  production: "Production Team",
};

// Role permissions
export const RolePermissions: Record<UserRole, string[]> = {
  admin: ["all"],
  registrar: ["registrations", "parent_shirts", "reports"],
  production: ["inventory", "production", "reports"],
};
