import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { Doc } from "./_generated/dataModel";

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

    const data: Record<string, { key: Doc<"keys">; translations: Doc<"translations">[] }> = {};

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

export const autoTranslate = action({
  args: {
    keyId: v.id("keys"),
  },
  handler: async (ctx, args) => {
    const key = await ctx.runQuery(api.keys.get, { id: args.keyId });
    if (!key) {
      throw new Error("Key not found");
    }

    const locales = await ctx.runQuery(api.locales.list, { appId: key.appId });
    const translations = await ctx.runQuery(api.translations.list, {
      keyId: args.keyId,
    });

    const defaultLocale = locales.find((l) => l.isDefault);
    if (!defaultLocale) {
      throw new Error("No default locale found");
    }

    const defaultTranslation = translations.find(
      (t) => t.localeId === defaultLocale._id,
    );
    if (!defaultTranslation?.value) {
      throw new Error("No default translation found");
    }

    const englishText = defaultTranslation.value;
    const results: Array<{ locale: string; success: boolean; error?: string }> =
      [];

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        translations: z.record(z.string(), z.string()),
      }),
      messages: [
        {
          role: "system",
          content: `Translate the following text to the following locales: ${locales.map((l) => l.code).join(", ")}. Return only the translated text without any explanation or additional context.`,
        },
        {
          role: "user",
          content: englishText,
        },
      ],
    });
    const translatedTexts = result.object.translations;

    for (const [localeId, translatedText] of Object.entries(translatedTexts)) {
      try {
        const locale = locales.find((l) => l.code === localeId);
        if (!locale) {
          throw new Error(`Locale ${localeId} not found`);
        }
        await ctx.runMutation(api.translations.upsert, {
          keyId: args.keyId,
          localeId: locale._id,
          value: translatedText,
        });

        results.push({ locale: localeId, success: true });
      } catch (error) {
        console.error(error);
        results.push({
          locale: localeId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});
