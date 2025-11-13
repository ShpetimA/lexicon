import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { requireAppAccess } from "./lib/roles";

export const list = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    return await ctx.db
      .query("locales")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const get = userQuery({
  args: { id: v.id("locales") },
  handler: async (ctx, args) => {
    const locale = await ctx.db.get(args.id);
    if (!locale) return null;

    await requireAppAccess(ctx, locale.appId, ["owner", "admin", "member"]);

    return locale;
  },
});

export const create = userMutation({
  args: {
    appId: v.id("apps"),
    code: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin"]);

    const localeId = await ctx.db.insert("locales", {
      code: args.code,
      isDefault: args.isDefault,
      appId: args.appId,
      createdAt: Date.now(),
    });
    return localeId;
  },
});

export const update = userMutation({
  args: {
    id: v.id("locales"),
    code: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const locale = await ctx.db.get(args.id);
    if (!locale) throw new Error("Locale not found");

    await requireAppAccess(ctx, locale.appId, ["owner", "admin"]);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = userMutation({
  args: { id: v.id("locales") },
  handler: async (ctx, args) => {
    const locale = await ctx.db.get(args.id);
    if (!locale) throw new Error("Locale not found");

    await requireAppAccess(ctx, locale.appId, ["owner", "admin"]);
    await ctx.db.delete(args.id);

    return args.id;
  },
});
