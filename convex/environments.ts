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
