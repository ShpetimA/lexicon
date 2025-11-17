import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { requireAppAccess } from "./lib/roles";

export const list = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    return await ctx.db
      .query("environments")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const get = userQuery({
  args: { id: v.id("environments") },
  handler: async (ctx, args) => {
    const environment = await ctx.db.get(args.id);
    if (!environment) return null;

    await requireAppAccess(ctx, environment.appId, [
      "owner",
      "admin",
      "member",
    ]);

    return environment;
  },
});

export const create = userMutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin"]);

    const environmentId = await ctx.db.insert("environments", {
      name: args.name,
      appId: args.appId,
      createdAt: Date.now(),
    });
    return environmentId;
  },
});

export const update = userMutation({
  args: {
    id: v.id("environments"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const environment = await ctx.db.get(args.id);
    if (!environment) throw new Error("Environment not found");

    await requireAppAccess(ctx, environment.appId, ["owner", "admin"]);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = userMutation({
  args: { id: v.id("environments") },
  handler: async (ctx, args) => {
    const environment = await ctx.db.get(args.id);
    if (!environment) throw new Error("Environment not found");

    await requireAppAccess(ctx, environment.appId, ["owner", "admin"]);

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Generate export JSON (all translations for app)
export const generateExportData = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    // Get all keys for the app
    const keys = await ctx.db
      .query("keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    // Get all app locales
    const appLocales = await ctx.db
      .query("appLocales")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    const locales = await Promise.all(
      appLocales.map(async (al) => await ctx.db.get(al.localeId)),
    );

    // Build nested object: { locale: { key: value } }
    const result: Record<string, Record<string, string>> = {};

    for (const locale of locales) {
      if (!locale) continue;
      result[locale.code] = {};

      for (const key of keys) {
        const translation = await ctx.db
          .query("translations")
          .withIndex("by_key_locale", (q) =>
            q.eq("keyId", key._id).eq("localeId", locale._id),
          )
          .first();

        if (translation) {
          result[locale.code][key.name] = translation.value;
        }
      }
    }

    return result;
  },
});

// List snapshots for environment
export const listSnapshots = userQuery({
  args: { environmentId: v.id("environments") },
  handler: async (ctx, args) => {
    const environment = await ctx.db.get(args.environmentId);
    if (!environment) throw new Error("Environment not found");

    await requireAppAccess(ctx, environment.appId, [
      "owner",
      "admin",
      "member",
    ]);

    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.environmentId),
      )
      .order("desc")
      .take(3);

    const CDN_BASE_URL = "https://lex-icon.me";

    const enriched = await Promise.all(
      snapshots.map(async (snapshot) => {
        const user = await ctx.db.get(snapshot.publishedBy);

        const cdnUrl = snapshot.cdnUrl || `${CDN_BASE_URL}/${snapshot.data}`;
        const latestUrl =
          snapshot.latestUrl ||
          `${CDN_BASE_URL}/${environment.appId}/${args.environmentId}/latest.json`;

        return {
          ...snapshot,
          publishedByUser: user
            ? { _id: user._id, email: user.email, name: user.name }
            : null,
          cdnUrl,
          latestUrl,
        };
      }),
    );

    return enriched;
  },
});
