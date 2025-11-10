import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apps")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = `app_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    const appId = await ctx.db.insert("apps", {
      name: args.name,
      apiKey,
      customerId: args.customerId,
      createdAt: Date.now(),
    });
    return appId;
  },
});

export const update = mutation({
  args: {
    id: v.id("apps"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const regenerateApiKey = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    const apiKey = `app_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    await ctx.db.patch(args.id, { apiKey });
    return apiKey;
  },
});
