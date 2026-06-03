# App Directory

Contains the Next.js App Router pages and layouts.

## Structure

- **(dashboard)/** - Group route containing the main dashboard pages with shared sidebar layout
  - `layout.tsx` - Dashboard layout with sidebar and authentication
  - `page.tsx` - Dashboard metrics page
  - **dashboard/** - Main dashboard page
  - Subdirectories for each feature module (seasons, registrations, etc.)
  
- **login/** - Authentication pages (login, signup, password reset)

- `layout.tsx` - Root layout wrapper for the entire application

## Key Files

- **layout.tsx** - Configures font loading, providers, and app-wide styles
- **(dashboard)/layout.tsx** - Wraps dashboard pages with sidebar navigation and auth checks

## Notes

- Use Server Actions in `app/` for mutations when possible
- Keep page components lightweight; move logic to server actions and services
- Leverage Next.js 14+ features like dynamic imports and streaming
