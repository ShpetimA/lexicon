import { v } from "convex/values";
import { query } from "./_generated/server";
import { userQuery, userMutation } from "./lib/auth";
import { requireAppAccess } from "./lib/roles";

export const listGlobal = query({
  handler: async (ctx) => {
    return await ctx.db.query("globalLocales").order("asc").collect();
  },
});

export const list = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    const appLocales = await ctx.db
      .query("appLocales")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

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
          requiresReview: appLocale.requiresReview,
          addedAt: appLocale.addedAt,
          appLocaleId: appLocale._id,
        };
      }),
    );

    return locales.filter((l) => l !== null);
  },
});

export const get = query({
  args: { id: v.id("globalLocales") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = userMutation({
  args: {
    appId: v.id("apps"),
    localeId: v.id("globalLocales"),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin"]);

    const existing = await ctx.db
      .query("appLocales")
      .withIndex("by_app_locale", (q) =>
        q.eq("appId", args.appId).eq("localeId", args.localeId),
      )
      .first();

    if (existing) {
      throw new Error("Locale already added to app");
    }

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

export const update = userMutation({
  args: {
    appLocaleId: v.id("appLocales"),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const appLocale = await ctx.db.get(args.appLocaleId);
    if (!appLocale) throw new Error("App locale not found");

    await requireAppAccess(ctx, appLocale.appId, ["owner", "admin"]);

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

export const remove = userMutation({
  args: { appLocaleId: v.id("appLocales") },
  handler: async (ctx, args) => {
    const appLocale = await ctx.db.get(args.appLocaleId);
    if (!appLocale) throw new Error("App locale not found");

    await requireAppAccess(ctx, appLocale.appId, ["owner", "admin"]);

    await ctx.db.delete(args.appLocaleId);
    return args.appLocaleId;
  },
});

export const toggleReviewRequired = userMutation({
  args: {
    appLocaleId: v.id("appLocales"),
    requiresReview: v.boolean(),
  },
  handler: async (ctx, args) => {
    const appLocale = await ctx.db.get(args.appLocaleId);
    if (!appLocale) throw new Error("App locale not found");

    await requireAppAccess(ctx, appLocale.appId, ["owner", "admin"]);

    const app = await ctx.db.get(appLocale.appId);
    if (!app) throw new Error("App not found");

    const customerUsers = await ctx.db
      .query("customerUsers")
      .withIndex("by_customer", (q) => q.eq("customerId", app.customerId))
      .collect();

    if (args.requiresReview && customerUsers.length < 2) {
      throw new Error("Review mode requires at least 2 users");
    }

    if (!args.requiresReview && appLocale.requiresReview) {
      const pendingReviews = await ctx.db
        .query("translationReviews")
        .withIndex("by_locale", (q) => q.eq("localeId", appLocale.localeId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      for (const review of pendingReviews) {
        const key = await ctx.db.get(review.keyId);
        if (key?.appId === appLocale.appId) {
          await ctx.db.delete(review._id);
        }
      }
    }

    await ctx.db.patch(args.appLocaleId, {
      requiresReview: args.requiresReview,
    });

    return args.appLocaleId;
  },
});

export const getUserCount = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    const app = await ctx.db.get(args.appId);
    if (!app) throw new Error("App not found");

    const customerUsers = await ctx.db
      .query("customerUsers")
      .withIndex("by_customer", (q) => q.eq("customerId", app.customerId))
      .collect();

    return customerUsers.length;
  },
});
