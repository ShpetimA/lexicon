# Locale Migration Guide

## Overview
We've centralized locales in the database. Locales are now global and apps select which ones they want to use.

## Changes
- **Old structure**: Each app had its own `locales` table entries
- **New structure**: 
  - `globalLocales`: Central list of all available locales
  - `appLocales`: Junction table linking apps to selected locales
  - Translations now reference `globalLocales` instead of app-specific locales

## Running the Migration

### Step 1: Deploy the schema changes
```bash
npx convex deploy
```

### Step 2: Run the migration script
```bash
npx convex run migrate:migrateToGlobalLocales
```

This will:
1. Seed the `globalLocales` table with standard BCP 47 locales
2. Migrate existing app-specific locales to the new structure
3. Create `appLocales` entries for each app's existing locales
4. Preserve all translation data (no data loss)

### Step 3: Verify migration
- Check that all apps have their locales in the Locales page
- Verify translations are still visible in the editor
- Test adding new locales (should now show a picker)

## Benefits
- ✅ Single source of truth for locale definitions
- ✅ Consistent locale codes across all apps
- ✅ Better UX with searchable locale picker
- ✅ Easier to add new standard locales globally
- ✅ No more typos in locale codes

## Rollback
If needed, the old locale data is preserved during migration. Contact support for rollback assistance.
