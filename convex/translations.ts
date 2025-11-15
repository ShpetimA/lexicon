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

export const createBatchWithTranslations = mutation({
  args: {
    appId: v.id("apps"),
    localeId: v.id("locales"),
    translations: v.array(
      v.object({
        keyName: v.string(),
        value: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const createdCount = { keys: 0, translations: 0 };
    
    for (const item of args.translations) {
      let key = await ctx.db
        .query("keys")
        .withIndex("by_name_app", (q) =>
          q.eq("name", item.keyName).eq("appId", args.appId),
        )
        .first();

      if (!key) {
        const keyId = await ctx.db.insert("keys", {
          name: item.keyName,
          appId: args.appId,
          createdAt: Date.now(),
        });
        key = await ctx.db.get(keyId);
        createdCount.keys++;
      }

      if (key) {
        const existingTranslation = await ctx.db
          .query("translations")
          .withIndex("by_key_locale", (q) =>
            q.eq("keyId", key._id).eq("localeId", args.localeId),
          )
          .first();

        if (!existingTranslation) {
          await ctx.db.insert("translations", {
            value: item.value,
            keyId: key._id,
            localeId: args.localeId,
            updatedAt: Date.now(),
          });
          createdCount.translations++;
        }
      }
    }

    return createdCount;
  },
});

export const autoTranslate = action({
  args: {
    keyId: v.id("keys"),
    sourceLocaleId: v.id("locales"),
    targetLocaleIds: v.array(v.id("locales")),
    instructions: v.optional(v.string()),
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

    const sourceLocale = locales.find((l) => l._id === args.sourceLocaleId);
    if (!sourceLocale) {
      throw new Error("Source locale not found");
    }

    const sourceTranslation = translations.find(
      (t) => t.localeId === args.sourceLocaleId,
    );
    if (!sourceTranslation?.value) {
      throw new Error("No translation found for source locale");
    }

    const sourceText = sourceTranslation.value;
    const targetLocales = locales.filter((l) =>
      args.targetLocaleIds.includes(l._id),
    );

    const results: Array<{ locale: string; success: boolean; error?: string }> =
      [];

    const systemContent = args.instructions
      ? `Translate the following text to the following locales: ${targetLocales.map((l) => l.code).join(", ")}. Follow these instructions: ${args.instructions}. Return only the translated text without any explanation or additional context.`
      : `Translate the following text to the following locales: ${targetLocales.map((l) => l.code).join(", ")}. Return only the translated text without any explanation or additional context.`;

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        translations: z.record(z.string(), z.string()),
      }),
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: sourceText,
        },
      ],
    });
    const translatedTexts = result.object.translations;

    for (const [localeCode, translatedText] of Object.entries(
      translatedTexts,
    )) {
      try {
        const locale = targetLocales.find((l) => l.code === localeCode);
        if (!locale) {
          throw new Error(`Locale ${localeCode} not found`);
        }
        await ctx.runMutation(api.translations.upsert, {
          keyId: args.keyId,
          localeId: locale._id,
          value: translatedText,
        });

        results.push({ locale: localeCode, success: true });
      } catch (error) {
        console.error(error);
        results.push({
          locale: localeCode,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

export const bulkAutoTranslate = action({
  args: {
    appId: v.id("apps"),
    sourceLocaleId: v.id("locales"),
    targetLocaleIds: v.array(v.id("locales")),
    actionType: v.union(
      v.literal("translateAll"),
      v.literal("fillMissing"),
      v.literal("refreshLocale")
    ),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allKeys = await ctx.runQuery(api.translations.listByApp, { 
      appId: args.appId 
    });
    
    const keysData = await ctx.runQuery(api.translations.getEditorData, {
      appId: args.appId,
      page: 1,
      limit: 10000,
    });
    
    const keys = Object.values(keysData.data).map(item => item.key);
    const locales = await ctx.runQuery(api.locales.list, { appId: args.appId });
    
    const sourceLocale = locales.find((l) => l._id === args.sourceLocaleId);
    if (!sourceLocale) {
      throw new Error("Source locale not found");
    }

    const targetLocales = locales.filter((l) =>
      args.targetLocaleIds.includes(l._id),
    );

    const results: Array<{ keyName: string; locale: string; success: boolean; error?: string }> = [];

    for (const key of keys) {
      const translations = await ctx.runQuery(api.translations.list, {
        keyId: key._id,
      });

      const sourceTranslation = translations.find(
        (t) => t.localeId === args.sourceLocaleId,
      );

      if (!sourceTranslation?.value) {
        for (const targetLocale of targetLocales) {
          results.push({
            keyName: key.name,
            locale: targetLocale.code,
            success: false,
            error: "No source translation",
          });
        }
        continue;
      }

      const sourceText = sourceTranslation.value;

      for (const targetLocale of targetLocales) {
        const existingTranslation = translations.find(
          (t) => t.localeId === targetLocale._id,
        );

        if (args.actionType === "fillMissing" && existingTranslation?.value) {
          continue;
        }

        try {
          const systemContent = args.instructions
            ? `Translate the following text to ${targetLocale.code}. Follow these instructions: ${args.instructions}. Return only the translated text without any explanation or additional context.`
            : `Translate the following text to ${targetLocale.code}. Return only the translated text without any explanation or additional context.`;

          const result = await generateObject({
            model: openai("gpt-4o"),
            schema: z.object({
              translation: z.string(),
            }),
            messages: [
              {
                role: "system",
                content: systemContent,
              },
              {
                role: "user",
                content: sourceText,
              },
            ],
          });

          await ctx.runMutation(api.translations.upsert, {
            keyId: key._id,
            localeId: targetLocale._id,
            value: result.object.translation,
          });

          results.push({
            keyName: key.name,
            locale: targetLocale.code,
            success: true,
          });
        } catch (error) {
          console.error(error);
          results.push({
            keyName: key.name,
            locale: targetLocale.code,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return results;
  },
});

export const copyLocale = mutation({
  args: {
    appId: v.id("apps"),
    sourceLocaleId: v.id("locales"),
    targetLocaleId: v.id("locales"),
  },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    let copiedCount = 0;

    for (const key of keys) {
      const sourceTranslation = await ctx.db
        .query("translations")
        .withIndex("by_key_locale", (q) =>
          q.eq("keyId", key._id).eq("localeId", args.sourceLocaleId),
        )
        .first();

      if (!sourceTranslation?.value) continue;

      const existingTarget = await ctx.db
        .query("translations")
        .withIndex("by_key_locale", (q) =>
          q.eq("keyId", key._id).eq("localeId", args.targetLocaleId),
        )
        .first();

      if (existingTarget) {
        await ctx.db.patch(existingTarget._id, {
          value: sourceTranslation.value,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("translations", {
          value: sourceTranslation.value,
          keyId: key._id,
          localeId: args.targetLocaleId,
          updatedAt: Date.now(),
        });
      }

      copiedCount++;
    }

    return { copiedCount };
  },
});
