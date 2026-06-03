# Scripts Directory

One-time utility scripts and maintenance tasks.

## Files

### **migrate-excel.ts**
One-time script to import data from Excel files to Firestore.

**Usage:**
```bash
npx ts-node scripts/migrate-excel.ts
```

**Purpose:**
- Import historical registration data
- Import inventory records
- Bootstrap initial database setup

**Notes:**
- Designed to run once during initial setup
- Should have data validation and duplicate checking
- Include error handling and logging
- Document input file format requirements

## Best Practices

- Use TypeScript for all scripts
- Add logging for progress and errors
- Include dry-run option when modifying data
- Document script usage and parameters
- Keep scripts focused on a single task
