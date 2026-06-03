# Components Directory

Reusable React components organized by purpose.

## Structure

- **ui/** - Base UI components from shadcn/ui
  - Button, Input, Select, Modal, etc.
  - Import and customize as needed
  
- **forms/** - Form components for data entry
  - Registration forms
  - Inventory forms
  - Production forms
  - Filters and search forms
  
- **tables/** - Data table components
  - Reusable table wrapper with sorting/filtering
  - Status indicators
  - Action menus
  
- **charts/** - Visualization components
  - Dashboard charts
  - Metrics displays
  - Analytics components

- **layout/** - Layout components
  - Sidebar navigation
  - Header and footer
  - Page containers

## Best Practices

- Keep components small and focused on a single responsibility
- Use TypeScript for all components
- Pass data via props and callbacks
- Use Zod for prop validation when appropriate
- Document complex component APIs with JSDoc comments
- Prefer functional components with hooks
