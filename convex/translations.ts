import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { keyId: v.id("keys") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("translations")
      .withIndex("by_key", (q) => q.eq("keyId", args.keyId))
      .collect();
  },
});

export const listByApp = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    const allTranslations = await Promise.all(
      keys.map(async (key) => {
        return await ctx.db
          .query("translations")
          .withIndex("by_key", (q) => q.eq("keyId", key._id))
          .collect();
      }),
    );

    return allTranslations.flat();
  },
});

export const getEditorData = query({
  args: {
    appId: v.id("apps"),
    page: v.number(),
    limit: v.number(),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let keysQuery = ctx.db
      .query("keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc");

    let allKeys = await keysQuery.collect();

    if (args.search) {
      allKeys = allKeys.filter((key) =>
        key.name.toLowerCase().includes(args.search!.toLowerCase()),
      );
    }

    const total = allKeys.length;
    const totalPages = Math.ceil(total / args.limit);
    const startIndex = (args.page - 1) * args.limit;
    const endIndex = startIndex + args.limit;
    const paginatedKeys = allKeys.slice(startIndex, endIndex);

    const data: Record<string, any> = {};

    for (const key of paginatedKeys) {
      const translations = await ctx.db
        .query("translations")
        .withIndex("by_key", (q) => q.eq("keyId", key._id))
        .collect();

      data[key.name] = {
        key,
        translations,
      };
    }

    return {
      data,
      pagination: {
        page: args.page,
        limit: args.limit,
        total,
        totalPages,
      },
    };
  },
});

export const get = query({
  args: { id: v.id("translations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    keyId: v.id("keys"),
    localeId: v.id("locales"),
    value: v.string(),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const translationId = await ctx.db.insert("translations", {
      value: args.value,
      keyId: args.keyId,
      localeId: args.localeId,
      updatedBy: args.updatedBy,
      updatedAt: Date.now(),
    });
    return translationId;
  },
});

export const update = mutation({
  args: {
    keyId: v.id("keys"),
    localeId: v.id("locales"),
    value: v.string(),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_key_locale", (q) =>
        q.eq("keyId", args.keyId).eq("localeId", args.localeId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: args.updatedBy,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return null;
  },
});

export const upsert = mutation({
  args: {
    keyId: v.id("keys"),
    localeId: v.id("locales"),
    value: v.string(),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_key_locale", (q) =>
        q.eq("keyId", args.keyId).eq("localeId", args.localeId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: args.updatedBy,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const translationId = await ctx.db.insert("translations", {
      value: args.value,
      keyId: args.keyId,
      localeId: args.localeId,
      updatedBy: args.updatedBy,
      updatedAt: Date.now(),
    });
    return translationId;
  },
});

export const remove = mutation({
  args: { id: v.id("translations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
