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

  locales: defineTable({
    code: v.string(),
    isDefault: v.boolean(),
    appId: v.id("apps"),
    createdAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_code_app", ["code", "appId"]),

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
    localeId: v.id("locales"),
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
});
