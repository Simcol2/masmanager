# MasManager

A comprehensive Next.js application for managing costumes, registrations, inventory, and production for the MAS organization.

## Project Structure

```
masmanager/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Group route for dashboard layout
│   │   ├── dashboard/            # Main dashboard page
│   │   ├── layout.tsx            # Sidebar + auth check
│   │   ├── page.tsx              # Dashboard metrics
│   │   ├── seasons/              # Manage costume seasons
│   │   ├── registrations/        # Register dancers/parents
│   │   ├── inventory/            # Costume inventory tracking
│   │   ├── production/           # Production workflow & scheduling
│   │   ├── parent-shirts/        # Parent shirt orders & management
│   │   ├── reports/              # Analytics & reporting
│   │   └── settings/             # Application settings
│   └── login/                    # Authentication pages
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Registration, inventory forms
│   ├── tables/                   # Data tables with sorting/filtering
│   ├── charts/                   # Dashboard metrics & visualizations
│   └── layout/                   # Layout components (sidebar, header, etc)
├── lib/                          # Utility functions & configurations
│   ├── firebase.ts               # Firebase init (client + admin)
│   ├── firestore.ts              # Typed Firestore helpers
│   ├── auth.ts                   # Auth context + hooks
│   └── utils.ts                  # Common utilities
├── server/                       # Server-side logic
│   ├── actions/                  # Next.js Server Actions
│   │   ├── registrations.ts
│   │   ├── inventory.ts
│   │   ├── production.ts
│   │   └── reports.ts
│   └── services/                 # Business logic layer
│       ├── costume-recipe.ts     # Costume cost calculation logic
│       ├── cost-calculator.ts    # Production cost management
│       └── inventory-manager.ts  # Inventory operations
├── types/                        # TypeScript types & Zod schemas
│   └── index.ts
├── public/                       # Static assets
├── docs/                         # Documentation
└── scripts/                      # Utility scripts
    └── migrate-excel.ts          # One-time Excel import script
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project setup

### Installation

```bash
# Install dependencies
npm install

# Create .env.local with Firebase credentials
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Features

- **Dashboard**: Real-time metrics and overview
- **Season Management**: Create and manage costume seasons
- **Registrations**: Track dancer and parent registrations
- **Inventory**: Manage costume inventory and availability
- **Production**: Schedule and track production workflows
- **Parent Shirts**: Order and manage parent organization shirts
- **Reports**: Generate analytics and performance reports
- **Settings**: Configure application preferences

## Development

```bash
# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm test

# Lint code
npm run lint
```

## Contributing

Please follow the project structure and coding conventions. Create feature branches and submit pull requests for review.

## License

Proprietary - MAS Organization
