import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { requireAppAccess } from "./lib/roles";
import { paginationOptsValidator } from "convex/server";
import type { Id } from "./_generated/dataModel";

export const list = userQuery({
  args: {
    appId: v.id("apps"),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    let keysQuery = ctx.db
      .query("keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc");

    if (args.search) {
      const allKeys = await keysQuery.collect();
      const filtered = allKeys.filter((key) =>
        key.name.toLowerCase().includes(args.search!.toLowerCase()),
      );
      const startIndex = 0;
      const endIndex = startIndex + args.paginationOpts.numItems;
      return {
        page: filtered.slice(startIndex, endIndex),
        continueCursor: endIndex < filtered.length ? endIndex : null,
        isDone: endIndex >= filtered.length,
      };
    }

    return await keysQuery.paginate(args.paginationOpts);
  },
});

export const get = userQuery({
  args: { id: v.id("keys") },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.id);
    if (!key) return null;

    await requireAppAccess(ctx, key.appId, ["owner", "admin", "member"]);

    return key;
  },
});

export const create = userMutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin"]);

    const keyId = await ctx.db.insert("keys", {
      name: args.name,
      description: args.description,
      appId: args.appId,
      createdAt: Date.now(),
    });
    return keyId;
  },
});

export const update = userMutation({
  args: {
    id: v.id("keys"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.id);
    if (!key) throw new Error("Key not found");

    await requireAppAccess(ctx, key.appId, ["owner", "admin"]);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = userMutation({
  args: { id: v.id("keys") },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.id);
    if (!key) throw new Error("Key not found");

    await requireAppAccess(ctx, key.appId, ["owner", "admin"]);

    const translations = await ctx.db
      .query("translations")
      .withIndex("by_key", (q) => q.eq("keyId", args.id))
      .collect();

    for (const translation of translations) {
      await ctx.db.delete(translation._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const createBatch = userMutation({
  args: {
    appId: v.id("apps"),
    keys: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin"]);

    const keyIds: Id<"keys">[] = [];
    for (const key of args.keys) {
      const existingKey = await ctx.db
        .query("keys")
        .withIndex("by_name_app", (q) =>
          q.eq("name", key.name).eq("appId", args.appId),
        )
        .first();

      if (!existingKey) {
        const keyId = await ctx.db.insert("keys", {
          name: key.name,
          description: key.description,
          appId: args.appId,
          createdAt: Date.now(),
        });
        keyIds.push(keyId);
      }
    }
    return keyIds;
  },
});
