# Server Directory

Server-side logic including Next.js Server Actions and business logic services.

## Structure

### **actions/**
Next.js Server Actions for data mutations.

- **registrations.ts** - Registration CRUD operations
- **inventory.ts** - Inventory management operations
- **production.ts** - Production workflow operations
- **reports.ts** - Report generation and data aggregation

Each file exports async functions that:
- Accept validated input
- Perform database operations
- Return results or errors
- Handle authentication checks

### **services/**
Business logic layer - reusable functions called by Server Actions.

- **costume-recipe.ts** - Logic for costume specifications and templates
- **cost-calculator.ts** - Production cost calculation and analysis
- **inventory-manager.ts** - Inventory operations and analytics

## Best Practices

### Server Actions
```typescript
'use server'

export async function createRegistration(data: RegisterInput) {
  // Validate input
  // Check authentication
  // Call service layer
  // Return result
}
```

### Services
```typescript
// Pure business logic
export async function calculateCostumeRecipePrice(recipe: CostumeRecipe): Promise<number> {
  // Calculation logic
}
```

## Notes

- Server Actions should be thin wrappers around services
- Services contain reusable business logic
- Both layers have access to Firestore and admin SDK
- Avoid importing client components here
- Always validate input and check permissions
