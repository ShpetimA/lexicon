# Locales Centralization - Summary

## What Changed

### Before
- Each app created its own locale entries in the `locales` table
- Locales had: `code`, `isDefault`, `appId`, `createdAt`
- Users manually typed locale codes (prone to typos)

### After
- Global `globalLocales` table with all standard BCP 47 locales
- Junction `appLocales` table links apps to selected locales  
- Locales have: `code`, `name`, `nativeName`, `createdAt`
- App-locale relationships have: `isDefault`, `addedAt`
- Users pick from dropdown of standard locales

## Database Schema

```typescript
globalLocales {
  code: string          // e.g., "en", "fr-CA"
  name: string          // e.g., "English", "French (Canada)"
  nativeName: string    // e.g., "English", "Français (Canada)"
  createdAt: number
}

appLocales {
  appId: Id<"apps">
  localeId: Id<"globalLocales">
  isDefault: boolean
  addedAt: number
}

translations {
  keyId: Id<"keys">
  localeId: Id<"globalLocales">  // Changed from Id<"locales">
  value: string
  updatedBy?: Id<"users">
  updatedAt: number
}
```

## Files Changed

### Backend (Convex)
- `convex/schema.ts` - New schema definitions
- `convex/locales.ts` - Manage app-locale relationships
- `convex/translations.ts` - Updated to use globalLocales
- `convex/seedLocales.ts` - Seed data for 40+ standard locales
- `convex/migrate.ts` - One-time migration script

### Frontend
- `CreateLocaleDialog.tsx` - Now shows locale picker
- `UpdateLocaleDialog.tsx` - Only updates isDefault
- `DeleteLocaleDialog.tsx` - Removes app-locale relationship
- `locales.tsx` - Display page with new columns
- All editor components - Updated type definitions

## Features

✅ 40+ standard locales pre-seeded  
✅ Searchable locale picker  
✅ Consistent codes across apps  
✅ Native names displayed (日本語, Français, etc.)  
✅ Zero data loss in migration  
✅ Custom locales still supported  

## Migration Steps

1. Deploy: `npx convex deploy`
2. Migrate: `npx convex run migrate:migrateToGlobalLocales`
3. Verify in UI

## Future Enhancements

- Add more locale metadata (RTL, region, currency)
- Allow admins to add custom global locales
- Locale usage statistics across apps
