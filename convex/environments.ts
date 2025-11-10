import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("environments")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("environments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const environmentId = await ctx.db.insert("environments", {
      name: args.name,
      appId: args.appId,
      createdAt: Date.now(),
    });
    return environmentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("environments"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("environments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
