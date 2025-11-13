import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const syncUser = mutation({
  args: {
    betterAuthUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUserByAuthId = await ctx.db
      .query("users")
      .withIndex("by_betterauth_id", (q) =>
        q.eq("betterAuthUserId", args.betterAuthUserId),
      )
      .first();

    if (existingUserByAuthId) {
      return existingUserByAuthId._id;
    }

    const existingUserByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUserByEmail) {
      await ctx.db.patch(existingUserByEmail._id, {
        betterAuthUserId: args.betterAuthUserId,
        name: args.name || existingUserByEmail.name,
      });
      return existingUserByEmail._id;
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      hashedPassword: "",
      betterAuthUserId: args.betterAuthUserId,
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Get user by Better-Auth user ID
 * Used internally by auth helpers
 */
export const getUserByBetterAuthId = query({
  args: {
    betterAuthUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_betterauth_id", (q) =>
        q.eq("betterAuthUserId", args.betterAuthUserId),
      )
      .first();

    return user;
  },
});

/**
 * Get current user from Better-Auth and sync to our users table
 * Returns our users table record
 */
export const getCurrentUserRecord = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await authComponent.getAuthUser(ctx);
    if (!betterAuthUser) return null;

    let user = await ctx.db
      .query("users")
      .withIndex("by_betterauth_id", (q) =>
        q.eq("betterAuthUserId", betterAuthUser._id),
      )
      .first();

    return user;
  },
});
