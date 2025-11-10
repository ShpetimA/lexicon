import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locales")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("locales") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    appId: v.id("apps"),
    code: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const localeId = await ctx.db.insert("locales", {
      code: args.code,
      isDefault: args.isDefault,
      appId: args.appId,
      createdAt: Date.now(),
    });
    return localeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("locales"),
    code: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("locales") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
