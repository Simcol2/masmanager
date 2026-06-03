# MasManager

**The luxury operations platform for Caribbean Carnival bands.**

MasManager replaces spreadsheets with a centralized, real-time web application for managing registrations, costume production, inventory, and financials across multiple carnival seasons.

---

## Product Vision

Create a centralized web application that manages all operational aspects of a Caribbean Carnival band — from registration to distribution — with the polish of a luxury brand and the power of real-time data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Storage | Firebase Storage |
| Hosting | Vercel |
| State | React Server Components + Zustand |
| Forms | React Hook Form + Zod |

---

## Design Philosophy

**Luxury Carnival Aesthetic**
- Deep black backgrounds with rich gold accents
- High-contrast typography with editorial spacing
- Saturated accent colors (crimson, emerald, royal purple)
- Mobile-first, touch-optimized interfaces
- GQ Magazine-inspired layouts: bold headlines, generous whitespace, sharp edges

---

## Core Business Logic

```
Registration → Costume Recipe → Production Requirements → Inventory Consumption → Cost Calculation
```

A participant registers for `Girls Frontline, Size Small` → the system automatically identifies required costume pieces, materials, calculates production demand, updates inventory requirements, and projects costs.

---

## Data Architecture

### Multi-Year Seasons
All registration and production data belongs to a specific season (e.g., "2026 Black Stars"). Users can switch between active and archived seasons.

### Global Inventory
Inventory exists permanently across all seasons. Stock is allocated per season but history is retained permanently. Example: `Gold Braid — 500 yards on hand` can be used across 2026, 2027, and 2028.

### Role-Based Access
- **Admin**: Full system access, season creation, inventory editing, cost management, user management
- **Registrar**: Add registrations, upload photos, manage payments, view reports. Cannot edit inventory or costs.
- **Production Team**: View production lists, update completed pieces, update inventory counts. Cannot modify registrations or financials.

---

## Project Structure

```
masmanager/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── layout.tsx            # Sidebar + auth check
│   │   ├── page.tsx              # Dashboard home
│   │   ├── seasons/              # Season CRUD
│   │   ├── registrations/        # Participant management
│   │   ├── inventory/            # Global inventory
│   │   ├── production/           # Production planner
│   │   ├── parent-shirts/        # Parent shirt orders
│   │   ├── reports/              # Analytics & exports
│   │   └── settings/             # User & system settings
│   ├── login/                    # Authentication page
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Registration, inventory forms
│   ├── tables/                   # Data tables
│   ├── charts/                   # Dashboard metrics
│   └── layout/                   # Sidebar, header, navigation
├── lib/
│   ├── firebase.ts               # Firebase client init
│   ├── firebase-admin.ts         # Firebase admin (server)
│   ├── auth.ts                   # Auth context & hooks
│   └── utils.ts                  # Utilities
├── server/
│   ├── actions/                  # Next.js Server Actions
│   │   ├── registrations.ts
│   │   ├── inventory.ts
│   │   ├── production.ts
│   │   └── reports.ts
│   └── services/                 # Business logic
│       ├── costume-recipe.ts
│       ├── cost-calculator.ts
│       └── inventory-manager.ts
├── types/
│   └── index.ts                  # Zod schemas + TypeScript types
├── public/                       # Static assets
├── scripts/                      # Migration & utility scripts
└── docs/                         # Documentation
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase account
- Vercel account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/masmanager.git
cd masmanager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Firebase configuration

# Run development server
npm run dev
```

### Environment Variables

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — Vercel handles CI/CD automatically

### Firebase Configuration

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password + Google)
3. Create Firestore database in production mode
4. Enable Storage for image uploads
5. Download service account key for admin SDK

---

## Features

### v1.0 — Core Operations
- [x] Dashboard with real-time metrics
- [x] Multi-year season management
- [x] Registration management with search/filter/export
- [x] Parent shirt aggregation by size
- [x] Global inventory with photo upload
- [x] Costume recipe builder
- [x] Production planner with auto-calculation
- [x] Cost tracking & projections
- [x] Reporting with PDF/Excel export

### v2.0 — Advanced Operations
- [ ] Purchase order tracking
- [ ] Costume distribution tracking (Built → Packed → Assigned → Distributed)
- [ ] QR code generation for inventory & costumes
- [ ] Labor tracking (builder hours & costs)
- [ ] Supplier management with cost trends
- [ ] Advanced financial reporting (P&L, cost per participant)

### v3.0 — Intelligence
- [ ] AI inventory recognition (photo → category/item)
- [ ] Recipe suggestions based on historical seasons
- [ ] Demand forecasting & reorder timing

---

## Success Metrics

- Reduce spreadsheet usage by 90%
- Reduce inventory counting time by 75%
- Eliminate duplicate purchasing
- Reduce production planning time by 80%
- Generate parent shirt orders in under 1 minute
- Provide real-time inventory visibility

---

## License

MIT License — Built with pride for the mas community.

---

## Credits

Designed and built for **The Black Stars** and carnival bands worldwide.
