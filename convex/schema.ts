import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customers: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),

  customerUsers: defineTable({
    customerId: v.id("customers"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_user", ["userId"])
    .index("by_customer_user", ["customerId", "userId"]),

  apps: defineTable({
    name: v.string(),
    apiKey: v.string(),
    customerId: v.id("customers"),
    createdAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_api_key", ["apiKey"]),

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    hashedPassword: v.string(), // Kept for backward compatibility, empty for Better-Auth users
    betterAuthUserId: v.optional(v.string()), // Link to Better-Auth user table
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_betterauth_id", ["betterAuthUserId"]),

  globalLocales: defineTable({
    code: v.string(),
    name: v.string(),
    nativeName: v.string(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  appLocales: defineTable({
    appId: v.id("apps"),
    localeId: v.id("globalLocales"),
    isDefault: v.boolean(),
    requiresReview: v.optional(v.boolean()),
    addedAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_locale", ["localeId"])
    .index("by_app_locale", ["appId", "localeId"]),

  keys: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    appId: v.id("apps"),
    createdAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_name_app", ["name", "appId"]),

  translations: defineTable({
    value: v.string(),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    keyId: v.id("keys"),
    localeId: v.id("globalLocales"),
  })
    .index("by_key", ["keyId"])
    .index("by_locale", ["localeId"])
    .index("by_key_locale", ["keyId", "localeId"])
    .index("by_updatedBy", ["updatedBy"]),

  environments: defineTable({
    name: v.string(),
    appId: v.id("apps"),
    createdAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_name_app", ["name", "appId"]),

  snapshots: defineTable({
    appId: v.id("apps"),
    environmentId: v.id("environments"),
    version: v.number(),
    data: v.string(),
    publishedBy: v.id("users"),
    publishedAt: v.number(),
    metadata: v.optional(v.string()),
    cdnUrl: v.optional(v.string()),
    latestUrl: v.optional(v.string()),
  })
    .index("by_app", ["appId"])
    .index("by_environment", ["environmentId"])
    .index("by_app_env_version", ["appId", "environmentId", "version"])
    .index("by_publishedBy", ["publishedBy"]),

  instructionTemplates: defineTable({
    name: v.string(),
    instructions: v.string(),
    appId: v.id("apps"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_app", ["appId"]),

  translationReviews: defineTable({
    translationId: v.optional(v.id("translations")),
    keyId: v.id("keys"),
    localeId: v.id("globalLocales"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    proposedValue: v.string(),
    currentValue: v.optional(v.string()),
    requestedBy: v.id("users"),
    reviewedBy: v.optional(v.id("users")),
    requestedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    comment: v.optional(v.string()),
  })
    .index("by_translation", ["translationId"])
    .index("by_key_locale", ["keyId", "localeId"])
    .index("by_status", ["status"])
    .index("by_requested_by", ["requestedBy"])
    .index("by_reviewed_by", ["reviewedBy"])
    .index("by_locale", ["localeId"]),

  scrapeJobs: defineTable({
    appId: v.id("apps"),
    userId: v.id("users"),
    url: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_app", ["appId"])
    .index("by_user", ["userId"])
    .index("by_app_user", ["appId", "userId"])
    .index("by_status", ["status"])
    .index("by_completed_at", ["completedAt"]),
});
