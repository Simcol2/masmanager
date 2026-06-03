import { z } from "zod";

// Enums
export const UserRole = z.enum(["admin", "registrar", "production"]);
export const SeasonStatus = z.enum(["active", "archived", "draft"]);
export const PaymentStatus = z.enum(["paid", "partial", "unpaid"]);
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
  addOns: z.string().optional(),
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
  participantName: z.string().min(1),
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

// Costume Recipe
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
