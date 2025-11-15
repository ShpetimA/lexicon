import { v } from "convex/values";
import { query } from "./_generated/server";
import { userQuery, userMutation } from "./lib/auth";
import { requireAppAccess } from "./lib/roles";

// List all global locales (admin/system use)
export const listGlobal = query({
  handler: async (ctx) => {
    return await ctx.db.query("globalLocales").order("asc").collect();
  },
});

// List locales for a specific app (with join to get full locale data)
export const list = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    const appLocales = await ctx.db
      .query("appLocales")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    // Join with globalLocales to get full locale data
    const locales = await Promise.all(
      appLocales.map(async (appLocale) => {
        const globalLocale = await ctx.db.get(appLocale.localeId);
        if (!globalLocale) return null;
        return {
          _id: globalLocale._id,
          _creationTime: globalLocale._creationTime,
          code: globalLocale.code,
          name: globalLocale.name,
          nativeName: globalLocale.nativeName,
          isDefault: appLocale.isDefault,
          addedAt: appLocale.addedAt,
          appLocaleId: appLocale._id,
        };
      }),
    );

    return locales.filter((l) => l !== null);
  },
});

// Get single locale by ID
export const get = userQuery({
  args: { id: v.id("globalLocales") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Add locale to app
export const create = userMutation({
  args: {
    appId: v.id("apps"),
    localeId: v.id("globalLocales"),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin"]);

    // Check if locale already added to app
    const existing = await ctx.db
      .query("appLocales")
      .withIndex("by_app_locale", (q) =>
        q.eq("appId", args.appId).eq("localeId", args.localeId),
      )
      .first();

    if (existing) {
      throw new Error("Locale already added to app");
    }

    // If setting as default, unset other defaults
    if (args.isDefault) {
      const otherDefaults = await ctx.db
        .query("appLocales")
        .withIndex("by_app", (q) => q.eq("appId", args.appId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();

      for (const other of otherDefaults) {
        await ctx.db.patch(other._id, { isDefault: false });
      }
    }

    const appLocaleId = await ctx.db.insert("appLocales", {
      appId: args.appId,
      localeId: args.localeId,
      isDefault: args.isDefault,
      addedAt: Date.now(),
    });

    return appLocaleId;
  },
});

// Update locale settings for app (only isDefault can be changed)
export const update = userMutation({
  args: {
    appLocaleId: v.id("appLocales"),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const appLocale = await ctx.db.get(args.appLocaleId);
    if (!appLocale) throw new Error("App locale not found");

    await requireAppAccess(ctx, appLocale.appId, ["owner", "admin"]);

    // If setting as default, unset other defaults
    if (args.isDefault) {
      const otherDefaults = await ctx.db
        .query("appLocales")
        .withIndex("by_app", (q) => q.eq("appId", appLocale.appId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();

      for (const other of otherDefaults) {
        if (other._id !== args.appLocaleId) {
          await ctx.db.patch(other._id, { isDefault: false });
        }
      }
    }

    const { appLocaleId, ...updates } = args;
    await ctx.db.patch(appLocaleId, updates);
    return appLocaleId;
  },
});

// Remove locale from app
export const remove = userMutation({
  args: { appLocaleId: v.id("appLocales") },
  handler: async (ctx, args) => {
    const appLocale = await ctx.db.get(args.appLocaleId);
    if (!appLocale) throw new Error("App locale not found");

    await requireAppAccess(ctx, appLocale.appId, ["owner", "admin"]);

    // TODO: Check if there are translations using this locale
    // and prevent deletion or cascade delete

    await ctx.db.delete(args.appLocaleId);
    return args.appLocaleId;
  },
});
