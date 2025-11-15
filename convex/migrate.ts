/**
 * Migration script to move from old locales structure to new global locales
 * Run this once via: npx convex run migrate:migrateToGlobalLocales
 */

import { internalMutation } from "./_generated/server";
import { STANDARD_LOCALES } from "./seedLocales";

export const migrateToGlobalLocales = internalMutation({
  handler: async (ctx) => {
    console.log("Starting migration to global locales...");

    // Step 1: Seed global locales if not already done
    const existingGlobal = await ctx.db.query("globalLocales").first();
    if (!existingGlobal) {
      console.log("Seeding global locales...");
      for (const locale of STANDARD_LOCALES) {
        await ctx.db.insert("globalLocales", {
          ...locale,
          createdAt: Date.now(),
        });
      }
      console.log(`Seeded ${STANDARD_LOCALES.length} global locales`);
    } else {
      console.log("Global locales already seeded, skipping...");
    }

    // Step 2: Check if old table exists by trying to query it
    let oldLocales: any[] = [];
    try {
      oldLocales = await ctx.db.query("locales" as any).collect();
      console.log(`Found ${oldLocales.length} old locales to migrate`);
    } catch (error) {
      console.log("Old locales table doesn't exist or is empty, migration complete");
      return {
        message: "Migration complete - no old locales to migrate",
        migrated: 0,
      };
    }

    // Step 3: For each old locale, find matching global locale and create appLocale entry
    let migratedCount = 0;
    const globalLocales = await ctx.db.query("globalLocales").collect();

    for (const oldLocale of oldLocales) {
      // Find matching global locale by code
      const matchingGlobal = globalLocales.find(
        (gl: any) => gl.code === oldLocale.code
      );

      if (!matchingGlobal) {
        console.log(
          `Warning: No global locale found for code "${oldLocale.code}", creating custom entry...`
        );
        // Create a custom global locale for codes not in standard list
        const customGlobalId = await ctx.db.insert("globalLocales", {
          code: oldLocale.code,
          name: oldLocale.code,
          nativeName: oldLocale.code,
          createdAt: Date.now(),
        });
        const customGlobal = await ctx.db.get(customGlobalId);

        // Create appLocale entry
        await ctx.db.insert("appLocales", {
          appId: oldLocale.appId,
          localeId: customGlobalId,
          isDefault: oldLocale.isDefault,
          addedAt: oldLocale.createdAt,
        });
        migratedCount++;
        continue;
      }

      // Check if appLocale already exists
      const existingAppLocale = await ctx.db
        .query("appLocales")
        .withIndex("by_app_locale", (q: any) =>
          q.eq("appId", oldLocale.appId).eq("localeId", matchingGlobal._id)
        )
        .first();

      if (!existingAppLocale) {
        await ctx.db.insert("appLocales", {
          appId: oldLocale.appId,
          localeId: matchingGlobal._id,
          isDefault: oldLocale.isDefault,
          addedAt: oldLocale.createdAt,
        });
        migratedCount++;
      }
    }

    console.log(`Migration complete! Migrated ${migratedCount} locale entries`);

    return {
      message: "Migration successful",
      oldLocalesFound: oldLocales.length,
      migrated: migratedCount,
    };
  },
});
