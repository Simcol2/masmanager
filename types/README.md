# Types Directory

TypeScript types, interfaces, and Zod validation schemas.

## Structure

- **index.ts** - Central file containing all types and schemas

## Contents

Define the following with Zod schemas + TypeScript types:

- **User** - User profile and roles
- **Registration** - Dancer and parent registration data
- **Season** - Costume season information
- **CostumeRecipe** - Costume specifications and materials
- **InventoryItem** - Costume inventory records
- **Production** - Production scheduling and tracking
- **ParentShirt** - Parent shirt order information
- **Report** - Report metadata and results
- **Settings** - Application configuration

## Pattern

```typescript
import { z } from 'zod';

// Zod schema for validation
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'user']),
});

// TypeScript type (inferred from schema)
export type User = z.infer<typeof UserSchema>;

// Input type for mutations (subset of User)
export const CreateUserInput = UserSchema.omit({ id: true });
export type CreateUserInput = z.infer<typeof CreateUserInput>;
```

## Usage

```typescript
import { User, UserSchema, CreateUserInput } from '@/types';

// In Server Actions
const result = UserSchema.safeParse(data);
if (!result.success) {
  return { error: result.error.flatten() };
}
```

## Notes

- Keep all types in one file for now (can split later if needed)
- Always export both Zod schema and TypeScript type
- Use Zod for runtime validation of user input
- TypeScript types for compile-time type checking
