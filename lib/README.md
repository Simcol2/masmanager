# Lib Directory

Utility functions, configurations, and helper modules.

## Key Files

### **firebase.ts**
- Firebase client initialization
- Firebase Admin SDK setup for server-side operations
- Export configured instances for use throughout the app

### **firestore.ts**
- Typed Firestore helper functions
- Query builders
- Data validation helpers
- Batch operations

### **auth.ts**
- Authentication context and hooks
- useAuth hook for accessing current user
- useRequireAuth hook for protected routes
- Auth state management

### **utils.ts**
- Common utility functions
- Date/time helpers
- String manipulation
- Number formatting

## Usage

```typescript
// Import Firebase instances
import { db, auth } from '@/lib/firebase';

// Use Firestore helpers
import { getDocument, setDocument } from '@/lib/firestore';

// Use auth hooks
import { useAuth } from '@/lib/auth';

// Use utilities
import { formatDate, formatCurrency } from '@/lib/utils';
```

## Notes

- Keep utilities pure and free of side effects where possible
- Add JSDoc comments for all exported functions
- Group related utilities into separate files if lib/ grows too large
