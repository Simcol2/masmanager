# MasManager - Project Reference

MasManager is a costume management system for Mas Mentality / TJC 2026, a Trinidad-style carnival band. It tracks registrations, costume pieces, applique production, supplies, inventory, and payments for a full season of masqueraders.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript |
| Database | Firebase 11 - Firestore |
| Auth | Firebase Auth |
| File Storage | Firebase Storage |
| Styling | Inline styles + `<style>` JSX tags (see below) |
| Component primitives | Radix UI (`@radix-ui/*`), shadcn wrappers in `components/ui/` |
| Icons | lucide-react |
| Animation | framer-motion |
| Forms | react-hook-form + Zod |
| State | React state + zustand |
| Charts | recharts |
| PDF export | jspdf |
| Deployment | Vercel - auto-deploys from `master` branch |

---

## Repository Layout

```
app/
  (dashboard)/         # All authenticated pages
    layout.tsx         # Shell with Sidebar (desktop) + MobileNav (mobile)
    page.tsx           # Dashboard
    seasons/           # Season & costume type management
    registrations/     # Masquerader registrations
    gems/              # Supplies / gem library
    appliques/         # Applique builder & library
    patterns/          # Pattern & measurement reference (TJC 2026)
    pieces/            # Master piece library
    inventory/         # Inventory tracking
    production/        # Production tracking
    parent-shirts/     # Parent shirt orders
    reports/           # Reports & analytics
    settings/          # Admin settings
  (auth)/              # Login page
components/
  layout/
    sidebar.tsx        # Desktop fixed sidebar nav
    mobile-nav.tsx     # Mobile bottom nav bar (fixed, safe-area-aware)
  ui/                  # shadcn wrappers: dialog, button, input, select, badge, card, label, sheet
lib/
  firebase.ts          # Firebase app init - exports auth, db, storage
  firebase-admin.ts    # Admin SDK (server-side only)
  auth.tsx             # useAuth() hook - user, isAdmin, logout
  pricing.ts           # Pricing helpers
  utils.ts             # cn() and other utilities
  services/            # Firestore CRUD for each collection
    appliques.ts
    gems.ts
    inventory.ts
    parent-shirts.ts
    pieces.ts
    registrations.ts
    seasonAssets.ts
    storage.ts
types/
  index.ts             # ALL data models - Zod schemas + TypeScript types
```

---

## Firestore Collections

| Collection | Schema | Notes |
|-----------|--------|-------|
| `users` | `UserSchema` | Roles: admin, registrar, production |
| `seasons` | `SeasonSchema` | Status: active, archived, draft |
| `registrations` | `RegistrationSchema` | Per-masquerader records |
| `parentShirts` | `ParentShirtSchema` | Shirt orders |
| `masterPieces` | `MasterPieceSchema` | Canonical piece library (seeded) |
| `seasonPieceConfigs` | `SeasonPieceConfigSchema` | Which pieces apply to each costume type per season |
| `seasonAssets` | `SeasonAssetSchema` | Photos and documents per season |
| `gemSupplies` | `GemSupplySchema` | Raw materials / supplies |
| `appliques` | `AppliqueSchema` | Applique designs with ingredient lists |
| `appliqueUsages` | `AppliqueUsageSchema` | Applique-to-piece assignments |
| `inventoryItems` | `InventoryItemSchema` | Physical inventory |
| `inventoryTransactions` | `InventoryTransactionSchema` | Stock movement log |
| `productionPieces` | `ProductionPieceSchema` | Production progress tracking |

---

## Central Cost Formula Chain

**Every cost in the system traces back to GemSupply unit costs. Nothing should be standalone.**

```
GemSupply.costAmount / GemSupply.costQty = GemSupply.unitCost
     |
     v
AppliqueIngredient.lineCost = quantity × unitCost   (snapshotted at save time)
     |
     v
Applique.totalCost = sum of all ingredient lineCosts
     |
     v
AppliqueUsage.costPerCostume = Applique.totalCost × quantityPerCostume
     |
     v
Registration.totalCost = costumeBasePrice + addOnTotal - modelDiscount
Registration.balanceOwing = totalCost - amountPaid
```

When a GemSupply price changes, re-saving any applique that uses it will propagate the new cost forward. Costs are snapshotted at save time intentionally - this preserves historical accuracy.

---

## Central Production Formula

```
Production quantity needed = registrationCount × quantityPerCostume

Where registrationCount = number of registrations with that costumeType in the active season
And   quantityPerCostume comes from AppliqueUsage.quantityPerCostume
```

`ProductionPiece.totalNeeded` = number of costume pieces to make
`ProductionPiece.remaining` = totalNeeded - completed

Every new feature that involves materials, pieces, or registrations must connect back to these formulas. Nothing should be freestanding.

---

## Data Relationships

```
Season
  └── Registration (many per season, costumeType determines which pieces apply)
  └── SeasonPieceConfig (maps MasterPiece to costumeType, with available sizes)
  └── ProductionPiece (tracks completion per piece per costumeType)
  └── SeasonAsset (photos, documents)

MasterPiece (canonical library, reused across seasons)
  └── SeasonPieceConfig (season-specific activation & photo override)
  └── AppliqueUsage (which appliques are used on this piece)

GemSupply (raw materials)
  └── AppliqueIngredient (used in appliques, cost snapshotted)

Applique (decorative element)
  └── AppliqueIngredient[] (list of supplies with quantities)
  └── AppliqueUsage (assigned to MasterPiece + CostumeType + Season)
```

---

## Roles & Permissions

| Role | Access |
|------|--------|
| `admin` | Everything |
| `registrar` | Registrations, Seasons view, Parent Shirts, Reports |
| `production` | Seasons view, Supplies (gems), Appliques, Patterns, Inventory, Production, Reports |

Nav items are filtered by role in both `sidebar.tsx` and `mobile-nav.tsx`.

Use `const { user, isAdmin } = useAuth()` to get the current user and check admin status.

---

## Navigation Structure

**Desktop**: Fixed left sidebar (`components/layout/sidebar.tsx`), 16rem wide, collapsible to 5rem icon-only mode.

**Mobile**: Fixed bottom bar (`components/layout/mobile-nav.tsx`), hidden at `min-width: 1024px`.

### Adding a new nav item

Add to BOTH files:
1. Import the icon from `lucide-react`
2. Add an entry to the `navItems` / `mobileNavItems` array with `href`, `label`, `icon`, `color`, and `roles`

---

## Styling Conventions

**Do not use Tailwind utility classes for new UI.** The codebase uses inline styles everywhere. Tailwind is installed but only used in legacy/shadcn boilerplate.

### Responsive layouts

Use `<style>` JSX tags with media queries:

```tsx
<style>{`
  .my-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  @media (min-width: 900px) {
    .my-grid {
      flex-direction: row;
    }
  }
`}</style>
```

Mobile-first: column layout by default, row layout at 900px+.

### Global Design Tokens

```
Background:     #F9FAFB (page bg) / #FFFFFF (card/surface bg)
Border:         #E5E7EB (default) / #F3F4F6 (subtle)
Text primary:   #111827
Text secondary: #6B7280
Text muted:     #9CA3AF

Brand pink:     #FF006E
Brand blue:     #1A73E8
Orange:         #FF6B35
Amber:          #F59E0B / #D97706
Green:          #10B981 / #059669
Purple:         #8B5CF6 / #7C3AED
Teal:           #00BCD4 / #0891B2
Red (error):    #EF4444

Font:           system-ui / inherit (no custom fonts on core UI)
Border radius:  0.5rem (cards), 0.375rem (inputs/buttons), 1rem (dialogs)
Shadow (card):  0 1px 3px rgba(0,0,0,0.1)
Shadow (dialog):0 20px 60px rgba(0,0,0,0.15)
```

### Buttons

```tsx
// Primary action
style={{ background: "#1A73E8", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 600, cursor: "pointer" }}

// Destructive
style={{ background: "#EF4444", color: "#fff", ... }}

// Secondary / ghost
style={{ background: "#F3F4F6", color: "#374151", border: "none", ... }}
```

### Cards

```tsx
style={{
  background: "#FFFFFF",
  borderRadius: "0.75rem",
  border: "1px solid #E5E7EB",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  padding: "1rem",
}}
```

---

## Dialog / Modal Pattern

Located at `components/ui/dialog.tsx` - wraps Radix `DialogPrimitive.Content`.

Default styles applied automatically:
- `position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%)`
- `zIndex: 51`
- `width: calc(100% - 2rem); maxWidth: 32rem`
- `maxHeight: 90vh; overflowY: auto`
- `background: #FFFFFF; borderRadius: 1rem; padding: 1.5rem`

Pass `style` prop to override (it merges, with caller winning). Pass `showCloseButton` for a built-in X button.

**Mobile dialog layout rule**: If a dialog has two tall panels (e.g. picker + form), use tabs - never stack them vertically. Stacking always breaks on phones because both panels compete for the fixed 90vh height.

---

## Photo / Image Rules

- **All photo boxes must use a 1:1 square aspect ratio.**
- Use `paddingBottom: "100%"` trick for responsive squares:

```tsx
<div style={{ position: "relative", paddingBottom: "100%", borderRadius: "0.5rem", overflow: "hidden", background: "#F3F4F6" }}>
  <img src={url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
</div>
```

- For file upload on mobile (especially iOS Safari), always use a `<label>` wrapping the `<input type="file">`. Do NOT use `ref.current?.click()` - it is unreliable on iOS:

```tsx
<label style={{ cursor: "pointer" }}>
  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
  <div style={{ /* button appearance */ }}>Upload Photo</div>
</label>
```

---

## Mobile-First Rules

Every new feature must work on mobile before anything else.

1. Test at 375px width (iPhone SE baseline)
2. Use `<style>` media queries for desktop enhancements - never the other way around
3. Touch targets minimum 44px tall
4. Fixed elements must account for `safe-area-inset-bottom` (iOS home indicator)
5. No hover-only interactions - anything that requires hover is inaccessible on touch devices
6. Dialogs: tab-based layout when content is too tall to scroll comfortably

---

## Writing Rules

- **Never use an em dash (---)** anywhere in the UI: labels, descriptions, notes, error messages, comments. Use a comma, colon, or rewrite the sentence instead.
- No multi-paragraph comments in code
- No standalone features - everything connects to cost or production formulas

---

## Git & Deployment Workflow

- **Development branch**: `claude/uncommitted-changes-deploy-xZllA`
- **Production**: `master` branch - Vercel auto-deploys on every push
- To deploy: develop on the dev branch, merge to `master`, push `master`

```bash
# Develop
git checkout claude/uncommitted-changes-deploy-xZllA
# ... make changes, commit ...

# Deploy
git checkout master
git merge claude/uncommitted-changes-deploy-xZllA
git push origin master
```

If push to master fails due to divergence (e.g. a PR was merged via GitHub UI):
```bash
git fetch origin master
git rebase origin/master
git push origin master
```

---

## Costume Types

```
girls_backline         "Girls Backline"
boys_backline          "Boys Backline"
toddler_frontline      "Toddler Frontline"
girls_frontline        "Girls Frontline"
boys_frontline         "Boys Frontline"
girls_ultra_frontline  "Girls Ultra Frontline"
boys_ultra_frontline   "Boys Ultra Frontline"
```

---

## Size Groups

| Group | Sizes |
|-------|-------|
| `bands` | Small, Large |
| `tops_bottoms` | 2T 3T 4T 5T, Youth XS-XL, Adult XS-XL |
| `sml_only` | Small, Medium, Large |
| `necklace` | Small, Large |
| `none` | No sizing |

---

## Environment Variables

All Firebase config is in `.env.local` (not committed):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## Key Patterns

### Fetching data

```tsx
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const snap = await getDocs(query(collection(db, "appliques")));
const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
```

### Auth check

```tsx
import { useAuth } from "@/lib/auth";
const { user, isAdmin } = useAuth();
```

### Cost propagation on save

When saving an applique, always recompute `lineCost` for each ingredient and `totalCost` for the applique from current `GemSupply.unitCost` values. When saving an `AppliqueUsage`, compute `costPerCostume = applique.totalCost * quantityPerCostume`.

### Production quantity

When displaying or calculating production needs:
```
totalNeeded = registrations.filter(r => r.seasonId === activeSeasonId && r.costumeType === costumeType).length
            × appliqueUsage.quantityPerCostume
```
