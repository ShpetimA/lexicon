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
    localeId: v.id("globalLocales"),
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
    localeId: v.id("globalLocales"),
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
    localeId: v.id("globalLocales"),
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
    localeId: v.id("globalLocales"),
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
    sourceLocaleId: v.id("globalLocales"),
    targetLocaleIds: v.array(v.id("globalLocales")),
    instructions: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
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

    const results: Array<{ locale: string; success: boolean; error?: string; requiresReview?: boolean }> =
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

        // Check if locale requires review
        const requiresReview = locale.requiresReview || false;

        if (requiresReview && args.updatedBy) {
          // Submit for review
          await ctx.runMutation(api.translations.submitForReview, {
            keyId: args.keyId,
            localeId: locale._id,
            value: translatedText,
            updatedBy: args.updatedBy,
          });
          results.push({ locale: localeCode, success: true, requiresReview: true });
        } else {
          // Direct save
          await ctx.runMutation(api.translations.upsert, {
            keyId: args.keyId,
            localeId: locale._id,
            value: translatedText,
            updatedBy: args.updatedBy,
          });
          results.push({ locale: localeCode, success: true, requiresReview: false });
        }
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
    sourceLocaleId: v.id("globalLocales"),
    targetLocaleIds: v.array(v.id("globalLocales")),
    actionType: v.union(
      v.literal("translateAll"),
      v.literal("fillMissing"),
      v.literal("refreshLocale")
    ),
    instructions: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
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

    const results: Array<{ keyName: string; locale: string; success: boolean; error?: string; requiresReview?: boolean }> = [];

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

          // Check if locale requires review
          const requiresReview = targetLocale.requiresReview || false;

          if (requiresReview && args.updatedBy) {
            // Submit for review
            await ctx.runMutation(api.translations.submitForReview, {
              keyId: key._id,
              localeId: targetLocale._id,
              value: result.object.translation,
              updatedBy: args.updatedBy,
            });
            results.push({
              keyName: key.name,
              locale: targetLocale.code,
              success: true,
              requiresReview: true,
            });
          } else {
            // Direct save
            await ctx.runMutation(api.translations.upsert, {
              keyId: key._id,
              localeId: targetLocale._id,
              value: result.object.translation,
              updatedBy: args.updatedBy,
            });
            results.push({
              keyName: key.name,
              locale: targetLocale.code,
              success: true,
              requiresReview: false,
            });
          }
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
    sourceLocaleId: v.id("globalLocales"),
    targetLocaleId: v.id("globalLocales"),
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

// Submit translation for review
export const submitForReview = mutation({
  args: {
    keyId: v.id("keys"),
    localeId: v.id("globalLocales"),
    value: v.string(),
    updatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get existing translation if any
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_key_locale", (q) =>
        q.eq("keyId", args.keyId).eq("localeId", args.localeId),
      )
      .first();

    // Create new review request (allow stacking multiple reviews for same key/locale)
    const reviewId = await ctx.db.insert("translationReviews", {
      translationId: existing?._id,
      keyId: args.keyId,
      localeId: args.localeId,
      status: "pending",
      proposedValue: args.value,
      currentValue: existing?.value,
      requestedBy: args.updatedBy!,
      requestedAt: Date.now(),
    });

    return reviewId;
  },
});

// Approve review
export const approveReview = mutation({
  args: {
    reviewId: v.id("translationReviews"),
    reviewedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    if (review.status !== "pending") {
      throw new Error("Review is not pending");
    }

    if (review.requestedBy === args.reviewedBy) {
      throw new Error("Cannot review your own changes");
    }

    // Update or create translation
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_key_locale", (q) =>
        q.eq("keyId", review.keyId).eq("localeId", review.localeId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: review.proposedValue,
        updatedBy: review.requestedBy,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("translations", {
        value: review.proposedValue,
        keyId: review.keyId,
        localeId: review.localeId,
        updatedBy: review.requestedBy,
        updatedAt: Date.now(),
      });
    }

    // Update review status
    await ctx.db.patch(args.reviewId, {
      status: "approved",
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
    });

    return args.reviewId;
  },
});

// Reject review
export const rejectReview = mutation({
  args: {
    reviewId: v.id("translationReviews"),
    reviewedBy: v.id("users"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    if (review.status !== "pending") {
      throw new Error("Review is not pending");
    }

    if (review.requestedBy === args.reviewedBy) {
      throw new Error("Cannot review your own changes");
    }

    await ctx.db.patch(args.reviewId, {
      status: "rejected",
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
      comment: args.comment,
    });

    return args.reviewId;
  },
});

// Cancel review (only by requestor)
export const cancelReview = mutation({
  args: {
    reviewId: v.id("translationReviews"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    if (review.requestedBy !== args.userId) {
      throw new Error("Only the requestor can cancel a review");
    }

    if (review.status !== "pending") {
      throw new Error("Can only cancel pending reviews");
    }

    await ctx.db.patch(args.reviewId, {
      status: "cancelled",
      reviewedAt: Date.now(),
    });

    return args.reviewId;
  },
});

// List pending reviews
export const listPendingReviews = query({
  args: {
    appId: v.id("apps"),
    localeId: v.optional(v.id("globalLocales")),
  },
  handler: async (ctx, args) => {
    // Get all keys for this app
    const keys = await ctx.db
      .query("keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();

    const keyIds = keys.map((k) => k._id);

    let reviews = await ctx.db
      .query("translationReviews")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Filter by keys belonging to this app
    reviews = reviews.filter((r) => keyIds.includes(r.keyId));

    // Filter by locale if specified
    if (args.localeId) {
      reviews = reviews.filter((r) => r.localeId === args.localeId);
    }

    // Enrich with key, locale, user data, and ALL translations for context
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const key = await ctx.db.get(review.keyId);
        const locale = await ctx.db.get(review.localeId);
        const requestedBy = await ctx.db.get(review.requestedBy);

        // Get all translations for this key (for drawer context)
        const allTranslations = await ctx.db
          .query("translations")
          .withIndex("by_key", (q) => q.eq("keyId", review.keyId))
          .collect();

        // Enrich with locale info
        const contextTranslations = await Promise.all(
          allTranslations.map(async (trans) => {
            const transLocale = await ctx.db.get(trans.localeId);
            return {
              ...trans,
              locale: transLocale,
            };
          }),
        );

        return {
          ...review,
          key,
          locale,
          requestedBy: requestedBy
            ? {
                _id: requestedBy._id,
                email: requestedBy.email,
                name: requestedBy.name,
              }
            : null,
          contextTranslations,
        };
      }),
    );

    return enrichedReviews;
  },
});

// Get review history for a translation
export const getReviewHistory = query({
  args: {
    keyId: v.id("keys"),
    localeId: v.id("globalLocales"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("translationReviews")
      .withIndex("by_key_locale", (q) =>
        q.eq("keyId", args.keyId).eq("localeId", args.localeId),
      )
      .collect();

    // Enrich with user data
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const requestedBy = await ctx.db.get(review.requestedBy);
        const reviewedBy = review.reviewedBy
          ? await ctx.db.get(review.reviewedBy)
          : null;

        return {
          ...review,
          requestedBy: requestedBy
            ? {
                _id: requestedBy._id,
                email: requestedBy.email,
                name: requestedBy.name,
              }
            : null,
          reviewedBy: reviewedBy
            ? {
                _id: reviewedBy._id,
                email: reviewedBy.email,
                name: reviewedBy.name,
              }
            : null,
        };
      }),
    );

    return enrichedReviews.sort((a, b) => b.requestedAt - a.requestedAt);
  },
});

// Check if locale requires review
export const checkReviewRequired = query({
  args: {
    appId: v.id("apps"),
    localeId: v.id("globalLocales"),
  },
  handler: async (ctx, args) => {
    const appLocale = await ctx.db
      .query("appLocales")
      .withIndex("by_app_locale", (q) =>
        q.eq("appId", args.appId).eq("localeId", args.localeId),
      )
      .first();

    if (!appLocale) return false;

    return appLocale.requiresReview || false;
  },
});
