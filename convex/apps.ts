import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { requireRole, requireAppAccess, getCustomerUser } from "./lib/roles";

const generateApiKey = () => {
  return `app_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
};

export const list = userQuery({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.customerId, ["owner", "admin", "member"]);

    return await ctx.db
      .query("apps")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const get = userQuery({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.id, ["owner", "admin", "member"]);

    return await ctx.db.get(args.id);
  },
});

export const create = userMutation({
  args: {
    customerId: v.id("customers"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.customerId, ["owner", "admin"]);

    const apiKey = generateApiKey();
    const appId = await ctx.db.insert("apps", {
      name: args.name,
      apiKey,
      customerId: args.customerId,
      createdAt: Date.now(),
    });
    return appId;
  },
});

export const update = userMutation({
  args: {
    id: v.id("apps"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.id, ["owner", "admin"]);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = userMutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.id, ["owner", "admin"]);

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const regenerateApiKey = userMutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.id, ["owner", "admin"]);

    const apiKey = generateApiKey();
    await ctx.db.patch(args.id, { apiKey });
    return apiKey;
  },
});
