import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";
import { components, internal } from "./_generated/api";
import { type AuthFunctions } from "@convex-dev/better-auth";

const authFunctions: AuthFunctions = internal.auth;

const siteUrl = process.env.SITE_URL!;
export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        await ctx.db.insert("users", {
          email: doc.email,
          name: doc.name,
          hashedPassword: "",
          betterAuthUserId: doc._id,
          createdAt: Date.now(),
        });
      },
    },
  },
});

/**
 * Creates Better-Auth instance with Convex integration
 *
 * Note: User sync to our custom users table happens via:
 * 1. Frontend calls api.users.getCurrentUserRecord() after signup (immediate sync)
 * 2. Auto-sync in convex/lib/roles.ts on first authenticated mutation (fallback)
 *
 * This two-tier approach ensures users are always synced without needing
 * Better-Auth hooks (which can't access Convex mutation context).
 */
export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  return betterAuth({
    // disable logging when createAuth is called just to generate options.
    // this is not required, but there's a lot of noise in logs without it.
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex()],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
