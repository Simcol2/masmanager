# MasManager — Step-by-Step Implementation Plan

> Build order: Foundation → Auth → Data → UI → Features → Polish → Deploy

---

## Phase 0: Project Initialization

### Step 0.1: Initialize Next.js Project
```bash
npx create-next-app@latest masmanager --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd masmanager
```

### Step 0.2: Install Core Dependencies
```bash
npm install firebase firebase-admin zustand react-hook-form @hookform/resolvers zod
npm install -D @types/node @types/react @types/react-dom
```

### Step 0.3: Initialize shadcn/ui
```bash
npx shadcn-ui@latest init
# Select: Default base color (neutral), CSS variables enabled
```

### Step 0.4: Install shadcn Components
```bash
npx shadcn-ui@latest add button card input label select table dialog sheet avatar badge separator scroll-area
npx shadcn-ui@latest add dropdown-menu tabs data-table
```

### Step 0.5: Install Additional Libraries
```bash
npm install lucide-react framer-motion clsx tailwind-merge
npm install recharts  # For dashboard charts
npm install jspdf xlsx  # For report exports
npm install date-fns  # For date formatting
```

### Step 0.6: Create Project Directory Structure
```
app/
  (dashboard)/
    layout.tsx
    page.tsx
    seasons/
    registrations/
    inventory/
    production/
    parent-shirts/
    reports/
    settings/
  login/
  layout.tsx
  globals.css
components/
  ui/           # shadcn components
  layout/       # Sidebar, header, mobile nav
  forms/        # Registration, inventory forms
  tables/       # Data tables
  charts/       # Dashboard charts
lib/
  firebase.ts
  firebase-admin.ts
  auth.ts
  utils.ts
server/
  actions/
  services/
types/
  index.ts
public/
  logo.svg
  fonts/
```

---

## Phase 1: Design System & Global Styles

### Step 1.1: Configure Tailwind with Luxury Gold Theme
- Extend `tailwind.config.ts` with custom colors, fonts, spacing
- Define gold palette: 50-950 scale with metallic accents
- Add custom font families: Playfair Display (headings), Inter (body)
- Configure border-radius: sharp edges (2px-4px max) for luxury feel

### Step 1.2: Create Global CSS Variables
- CSS custom properties for gold tones, accent colors, glass effects
- Dark mode as default (deep black backgrounds)
- Scrollbar styling, selection colors, focus rings

### Step 1.3: Build Layout Components
- `AppShell`: Main layout wrapper with sidebar + content area
- `Sidebar`: Collapsible navigation with role-based links
- `Header`: Top bar with season selector, notifications, user menu
- `MobileNav`: Bottom tab bar for mobile (critical for on-the-go use)
- `PageHeader`: Consistent page title + action buttons + breadcrumbs

### Step 1.4: Create Reusable UI Components
- `GoldButton`: Primary CTA with gold gradient + hover shine effect
- `GlassCard`: Semi-transparent card with subtle border
- `MetricCard`: Dashboard stat card with trend indicator
- `StatusBadge`: Color-coded status labels
- `DataTable`: Sortable, filterable table with mobile card view
- `ImageUploader`: Drag-drop + camera capture for inventory photos
- `SearchBar`: Global search with command palette style

---

## Phase 2: Firebase Setup & Authentication

### Step 2.1: Initialize Firebase Client SDK
- Create `lib/firebase.ts` with client-side Firebase config
- Initialize Auth, Firestore, Storage instances
- Set up persistence for offline support

### Step 2.2: Initialize Firebase Admin SDK
- Create `lib/firebase-admin.ts` for server-side operations
- Secure credential management via environment variables
- Initialize Admin Auth and Admin Firestore

### Step 2.3: Build Authentication System
- Create `app/login/page.tsx` — luxury dark login screen
- Email/password + Google sign-in options
- Password reset flow
- Auth state listener with Zustand store

### Step 2.4: Implement Role-Based Access Control
- Create `lib/auth.ts` with auth context and hooks
- `useAuth()` hook: current user, role, loading state
- `useRequireAuth(role)` hook: route protection
- `withRole(Component, roles)` HOC for page-level protection
- Firestore rules for data-level protection

### Step 2.5: Create User Management (Admin Only)
- Invite users by email
- Assign roles (Admin/Registrar/Production)
- Set custom claims via Admin SDK
- User list with role editing

---

## Phase 3: Type System & Data Models

### Step 3.1: Define Zod Schemas
Create `types/index.ts` with strict schemas for:
- `SeasonSchema`: year, theme, dates, status
- `RegistrationSchema`: all participant fields, payment info
- `InventoryItemSchema`: SKU, name, category, cost, stock
- `CostumeRecipeSchema`: piece definitions, material lists
- `ProductionPieceSchema`: needed, completed, remaining
- `ParentShirtSchema`: parent, participant, size, quantity
- `UserSchema`: email, name, role, permissions

### Step 3.2: Create TypeScript Types
- Derive types from Zod schemas using `z.infer<>`
- Create union types for enums (costume types, sizes, statuses)
- Define Firestore document types with timestamps

### Step 3.3: Build Firestore Helpers
- `lib/firestore.ts`: Typed collection references
- CRUD helpers: `createDoc`, `getDoc`, `updateDoc`, `deleteDoc`
- Query helpers: `queryByField`, `queryCollection`, `subscribeToCollection`
- Batch operations for atomic updates
- Converter functions for Firestore timestamps

---

## Phase 4: Core Data Operations (Server Actions)

### Step 4.1: Season Management Actions
- `createSeason(data)` — create new season with duplicate option
- `getSeasons()` — list all seasons with status
- `getActiveSeason()` — get currently active season
- `updateSeason(id, data)` — edit season details
- `archiveSeason(id)` — archive without deleting
- `duplicateSeason(id, newYear)` — copy recipes, settings to new season

### Step 4.2: Registration Actions
- `createRegistration(data)` — add participant, trigger cascade
- `getRegistrations(seasonId, filters)` — list with search/filter
- `getRegistration(id)` — single participant view
- `updateRegistration(id, data)` — edit details
- `deleteRegistration(id)` — remove + reverse cascade
- `searchRegistrations(query)` — full-text search
- `exportRegistrations(seasonId, format)` — Excel/CSV export

### Step 4.3: Inventory Actions
- `createInventoryItem(data)` — add new inventory item
- `getInventoryItems(filters)` — list with category filter
- `getInventoryItem(id)` — single item with history
- `updateInventoryItem(id, data)` — edit stock, cost, location
- `adjustStock(id, quantity, reason)` — atomic stock adjustment
- `getLowStockItems()` — items below reorder threshold
- `uploadInventoryPhoto(id, file)` — Firebase Storage upload

### Step 4.4: Parent Shirt Actions
- `createParentShirt(data)` — add shirt order
- `getParentShirts(seasonId)` — list for season
- `getShirtTotals(seasonId)` — aggregate by size (XS-XXXL)
- `updateParentShirt(id, data)` — edit order
- `deleteParentShirt(id)` — remove order
- `exportShirtOrder(seasonId)` — formatted order sheet

### Step 4.5: Production Actions
- `getProductionPlan(seasonId)` — calculate from registrations
- `updateProductionStatus(pieceId, completed)` — mark pieces done
- `getProductionProgress(seasonId)` — overall completion %
- `assignPiece(pieceId, builder)` — assign to production team

---

## Phase 5: Business Logic Services

### Step 5.1: Costume Recipe Engine
- `server/services/costume-recipe.ts`
- Define all costume types from your Excel breakdown:
  - Girls Backline, Boys Backline, Toddler Frontline
  - Girls Frontline, Boys Frontline
  - Girls Ultra Frontline, Boys Ultra Frontline
- Each costume = array of pieces (necklace, belt, headband, etc.)
- Each piece = array of materials (inventory items + quantities)
- Function: `getRecipeForCostume(costumeType)`

### Step 5.2: Production Calculator
- `server/services/production-calculator.ts`
- Function: `calculateProductionNeeds(seasonId)`
- Input: all registrations for season
- Process: group by costume type → multiply by recipe → aggregate materials
- Output: total needed per piece, per material, per size

### Step 5.3: Inventory Manager
- `server/services/inventory-manager.ts`
- Function: `allocateInventory(seasonId, materials)`
- Check stock availability for all required materials
- Reserve/allocate stock to season
- Return: available, shortfall, reorder recommendations
- Function: `consumeInventory(seasonId, pieceId)` — when piece completed

### Step 5.4: Cost Calculator
- `server/services/cost-calculator.ts`
- Function: `calculateSeasonCosts(seasonId)`
- Material costs: sum of (unit cost × quantity) for all pieces
- Production costs: labor + overhead (v2 feature)
- Per-costume cost, per-category cost, total season cost
- Function: `calculateCostPerParticipant(registrationId)`

### Step 5.5: Cascade Trigger
- `server/services/cascade.ts`
- Function: `onRegistrationChange(registration, action)`
- Called on create/update/delete of registration
- Action: "create" | "update" | "delete"
- Steps:
  1. Get old + new costume type (for updates)
  2. Reverse old production needs (if update/delete)
  3. Apply new production needs (if create/update)
  4. Update inventory allocations
  5. Recalculate costs
  6. Update dashboard metrics

---

## Phase 6: Dashboard & Navigation

### Step 6.1: Build Dashboard Layout
- `app/(dashboard)/layout.tsx`
- Responsive: sidebar (desktop) + bottom nav (mobile)
- Collapsible sidebar with gold accent on active item
- User avatar + role badge in header
- Season selector dropdown in header

### Step 6.2: Create Dashboard Home Page
- `app/(dashboard)/page.tsx`
- Key metrics row: Total Registrations, Revenue, Outstanding, Inventory Alerts
- Registration breakdown chart by costume type
- Production progress bars by category
- Low stock alerts list
- Recent activity feed
- Quick action buttons: Add Registration, Update Inventory

### Step 6.3: Build Navigation System
- Desktop: Vertical sidebar with icons + labels
- Mobile: Bottom tab bar (5 items max for thumb reach)
- Active state: Gold left border + gold icon
- Collapse: Icons only on desktop, full hide on mobile
- Role-based link visibility

---

## Phase 7: Feature Modules

### Step 7.1: Season Management Module
- `app/(dashboard)/seasons/page.tsx`
- Season list: card grid with year, theme, status badge
- Create season: modal form with year, theme, dates
- Duplicate season: copy recipes + settings to new year
- Archive: soft delete with restore option
- Set active: switch context for all other modules

### Step 7.2: Registrations Module
- `app/(dashboard)/registrations/page.tsx`
- Data table: sortable columns, row actions
- Filters: costume type, gender, payment status, size
- Search: name, parent name, phone
- Add registration: multi-step form
  - Step 1: Participant info (name, age, gender, photo)
  - Step 2: Costume selection (type, style, sizes)
  - Step 3: Parent info + payment
- Registration detail page: full profile, edit, delete
- Bulk actions: export, status update
- Mobile: Card list view instead of table

### Step 7.3: Inventory Module
- `app/(dashboard)/inventory/page.tsx`
- Grid view: photo + key info cards
- List view: dense table for quick scanning
- Categories: color-coded badges
- Add item: form with photo upload, category select
- Item detail: stock history graph, usage by season
- Low stock: dedicated alert page
- Mobile: Card grid with swipe actions

### Step 7.4: Production Planner Module
- `app/(dashboard)/production/page.tsx`
- Overview: total needed vs completed per piece type
- Progress bars with gold fill
- Piece detail: list of individual items to build
- Mark complete: checkbox + builder assignment
- Material shortfall alerts
- Mobile: Collapsible sections by piece type

### Step 7.5: Parent Shirts Module
- `app/(dashboard)/parent-shirts/page.tsx`
- Order form: parent name, participant, size dropdown
- Live totals: XS through XXXL with count + visual bar
- Order summary: formatted for vendor submission
- Export: PDF order sheet
- Mobile: Simple form + totals view

### Step 7.6: Reports Module
- `app/(dashboard)/reports/page.tsx`
- Report list: Registration Summary, Inventory Usage, Production Status, Cost Summary, Parent Shirt Summary
- Each report: filterable date range, visual charts
- Export: PDF (print-optimized) + Excel + CSV
- Mobile: Report selector + scrollable view

### Step 7.7: Settings Module
- `app/(dashboard)/settings/page.tsx`
- User profile: name, email, role display
- Band settings: name, logo, contact info
- Costume recipes: visual builder (drag-drop pieces)
- Notification preferences
- Data export: full season backup

---

## Phase 8: Excel Migration

### Step 8.1: Create Migration Script
- `scripts/migrate-excel.ts`
- Read `Main Black Star Tracker.xlsx`
- Parse each sheet: Registrations, Parent T-Shirts, Costume Pieces
- Map Excel columns to Firestore schema
- Handle missing/invalid data gracefully

### Step 8.2: Run Migration
```bash
npx ts-node scripts/migrate-excel.ts
```
- Validate data integrity after import
- Check for duplicate registrations
- Verify costume type mappings
- Confirm inventory totals match

### Step 8.3: Verify & Clean
- Spot-check registrations against original Excel
- Confirm parent shirt totals
- Validate inventory stock levels
- Test cascade: edit a registration, verify production updates

---

## Phase 9: Polish & Optimization

### Step 9.1: Mobile Optimization
- Test all pages on iPhone SE (375px) through iPhone 15 Pro Max
- Ensure bottom nav doesn't obscure content
- Touch targets minimum 44px
- Swipe gestures for common actions
- Pull-to-refresh on lists
- Optimize images: WebP format, lazy loading

### Step 9.2: Performance
- Add React Server Components where possible
- Implement Firestore query pagination
- Add loading skeletons for all data views
- Optimize re-renders with React.memo
- Add service worker for offline support

### Step 9.3: Animations & Micro-interactions
- Page transitions: subtle fade + slide
- Button hover: gold shimmer effect
- Card hover: subtle lift + shadow
- Loading states: gold pulse animation
- Success toasts: slide in from top
- Error states: shake animation

### Step 9.4: Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation for all features
- Focus visible states
- Color contrast ratios (WCAG AA minimum)
- Screen reader testing

---

## Phase 10: Deployment

### Step 10.1: Firebase Production Setup
- Create production Firebase project
- Configure Firestore security rules
- Set up Storage rules for image access
- Configure Auth authorized domains
- Enable Firebase Analytics (optional)

### Step 10.2: Vercel Deployment
- Connect GitHub repo to Vercel
- Configure build settings:
  - Framework: Next.js
  - Build command: `npm run build`
  - Output directory: `.next`
- Add all environment variables
- Deploy production branch

### Step 10.3: Post-Deploy Verification
- Test authentication flow
- Verify Firestore data persistence
- Test image uploads to Storage
- Check all role-based permissions
- Run through complete registration → production workflow
- Test mobile responsiveness on real devices

### Step 10.4: Domain & SSL
- Add custom domain (optional)
- Configure SSL certificates (auto via Vercel)
- Set up redirect rules

---

## Phase 11: Training & Handoff

### Step 11.1: Create User Guides
- `docs/registrar-guide.md` — Adding registrations, managing payments
- `docs/production-guide.md` — Updating pieces, inventory counts
- `docs/admin-guide.md` — Season setup, user management, recipes

### Step 11.2: Record Video Walkthroughs
- 5-min overview for each role
- Common tasks: add registration, check inventory, run reports

### Step 11.3: Onboard Team
- Create accounts for all team members
- Assign correct roles
- Walk through first registration together
- Verify everyone can access on mobile

---

## Implementation Order Summary

| Phase | Focus | Est. Effort |
|-------|-------|-------------|
| 0 | Project Init | 2 hours |
| 1 | Design System | 4 hours |
| 2 | Firebase + Auth | 6 hours |
| 3 | Types + Models | 3 hours |
| 4 | Server Actions | 8 hours |
| 5 | Business Logic | 6 hours |
| 6 | Dashboard + Nav | 4 hours |
| 7 | Feature Modules | 16 hours |
| 8 | Excel Migration | 3 hours |
| 9 | Polish | 6 hours |
| 10 | Deploy | 2 hours |
| 11 | Training | 2 hours |
| **Total** | | **~62 hours** |

---

## Critical Path (Minimum Viable Product)

If time-constrained, build in this exact order:

1. **Auth + Season selector** — can't use app without login
2. **Registration CRUD** — core value, replaces Excel immediately
3. **Dashboard metrics** — visibility into numbers
4. **Parent shirt totals** — quick win, under 1 minute as per goal
5. **Inventory list** — basic tracking
6. **Production overview** — manual status updates
7. **Cost tracking** — simple calculations
8. **Export functions** — PDF/Excel for external sharing

This gives you a functional replacement for your Excel tracker in approximately **30-35 hours**.

---

## Phase 12: Applique Builder (Visual Cost Calculator)

> **Priority: HIGH — build this next.**

### What it is
A visual drag-and-select interface for building appliques from individual gem supplies, with real-time cost rollup. Separate from the "Add Purchased Applique" flow.

### Step 12.1: Applique Builder Dialog ✅ IN PROGRESS
- Two-panel layout inside a wide dialog
- **Left panel** — Gem picker:
  - Search bar (filters by name / item number in real time)
  - Category filter chips (Rhinestone, Gem/Stone, Trim, Feather, etc.)
  - Scrollable grid of gem cards showing: photo, name, unit cost, category badge
  - Clicking a card adds it to the applique (card highlights if already added)
- **Right panel** — Applique builder:
  - Applique name field
  - Photo upload
  - List of selected gems with inline quantity spinner
  - Per-gem line cost (qty × unit cost)
  - Running total cost at the bottom
  - Save button → writes to Firestore as `Applique` doc with `ingredients[]`
- **Two buttons on Appliques page:**
  - "Build Applique" → opens the visual builder (new flow)
  - "Add Purchased" → opens the simple form for pre-made appliques bought externally

### Step 12.2: Applique Edit via Builder
- Clicking Edit on an existing built applique opens the builder pre-populated
- Can add/remove/adjust quantities and re-save

### Step 12.3: Cost Summary View
- On the applique card, show cost breakdown on hover/expand:
  - Each ingredient: name × qty = line cost
  - Total cost
- On the Appliques list page, show:
  - Total inventory value of all appliques if made once
  - Which applique is most expensive

---

## Phase 13: Customer CRM + Email Broadcasts

> **Priority: MEDIUM — build after applique builder.**

### What it is
A simple CRM storing masquerader/parent contact info, with the ability to send branded email blasts (season updates, payment reminders, pickup notices).

### Step 13.1: Customer Data Model
- Firestore `customers` collection:
  - `name`, `email`, `phone`, `costumeType`, `registrationId` (link), `tags[]`, `notes`, `createdAt`
- Service: `getCustomers()`, `createCustomer()`, `updateCustomer()`, `deleteCustomer()`

### Step 13.2: Customers Page
- `/customers` route in dashboard nav
- List view: name, costume type, email, phone, tags
- Search + filter by costume type / tag
- Add / Edit / Delete customer
- Import from existing registrations (one-click sync)

### Step 13.3: Email with Resend
- Sign up at resend.com (free: 3,000 emails/month)
- Add `RESEND_API_KEY` to Vercel env vars
- Install: `npm install resend`
- API route: `POST /api/email/send`
- Email templates in React Email matching app brand colors

### Step 13.4: Email Broadcasts
- "Send Update" button on Customers page
- Select recipients: all, by costume type, by tag, or manual pick
- Compose: subject + message body
- Preview before sending
- Templates: Season Update, Payment Reminder, Pickup Notice
- Sent log: timestamp, recipients, subject

---

## Phase 14: Pending / Backlog Items

- [ ] **Registrations page** — table is rendering without Tailwind grid styles, needs inline-style rewrite like dashboard
- [ ] **Parent Shirts page** — same dark-theme void-* class cleanup
- [ ] **Production page** — same cleanup
- [ ] **Reports page** — same cleanup + add actual report generation (PDF/CSV)
- [ ] **Pieces page** — same cleanup
- [ ] **Settings page** — same cleanup
- [ ] **Login page** — update to new bold color theme
- [ ] **All dialogs in non-gems pages** — apply same dialog.tsx inline-style fix
- [ ] **Mobile nav dot indicator** — `absolute` span inside Link needs `relative` on parent
