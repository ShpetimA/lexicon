import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    appId: v.id("apps"),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let keysQuery = ctx.db
      .query("keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc");

    if (args.search) {
      const allKeys = await keysQuery.collect();
      const filtered = allKeys.filter((key) =>
        key.name.toLowerCase().includes(args.search!.toLowerCase())
      );
      const startIndex = typeof args.paginationOpts.cursor === 'number' ? args.paginationOpts.cursor : 0;
      const endIndex = startIndex + args.paginationOpts.numItems;
      return {
        page: filtered.slice(startIndex, endIndex),
        continueCursor: endIndex < filtered.length ? endIndex as number : null,
        isDone: endIndex >= filtered.length,
      };
    }

    return await keysQuery.paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { id: v.id("keys") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const keyId = await ctx.db.insert("keys", {
      name: args.name,
      description: args.description,
      appId: args.appId,
      createdAt: Date.now(),
    });
    return keyId;
  },
});

export const update = mutation({
  args: {
    id: v.id("keys"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("keys") },
  handler: async (ctx, args) => {
    // Delete all translations for this key first
    const translations = await ctx.db
      .query("translations")
      .withIndex("by_key", (q) => q.eq("keyId", args.id))
      .collect();

    for (const translation of translations) {
      await ctx.db.delete(translation._id);
    }

    // Delete the key
    await ctx.db.delete(args.id);
  },
});
