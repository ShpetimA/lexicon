# CONVEX RULES

import { query } from "./_generated/server";
import { customQuery, customCtx } from "convex-helpers/server/customFunctions";

// Use `userQuery` instead of `query` to add this behavior.
const userQuery = customQuery(
  query, // The base function we're extending
  // Here we're using a `customCtx` helper because our modification
  // only modifies the `ctx` argument to the function.
  customCtx(async (ctx) => {
    // Look up the logged in user
    const user = await getUser(ctx);
    if (!user) throw new Error("Authentication required");
    // Pass in a user to use in evaluating rules,
    // which validate data access at access / write time.
    const db = wrapDatabaseReader({ user }, ctx.db, rules);
    // This new ctx will be applied to the function's.
    // The user is a new field, the db replaces ctx.db
    return { user, db };
  })
);

// Used elsewhere

// Defines a publicly-accessible mutation endpoint called "myInfo"
// Returns basic info for the authenticated user.
export const myInfo = userQuery({
  args: { includeTeam: v.boolean() },
  handler: async (ctx, args) => {
    // Note: `ctx.user` is defined. It will show up in types too!
    const userInfo = { name: ctx.user.name, profPic: ctx.user.profilePic };
    if (args.includeTeam) {
      // If there are any rules around the teams table,
      // the wrapped `ctx.db` can ensure we don't accidentally
      // fetch a team the user doesn't have access to.
      const team = await ctx.db.get(ctx.user.teamId);
      return { ...userInfo, teamName: team.name, teamId: team._id };
    }
    return userInfo;
  }
});



Most logic should be written as plain TypeScript functions, with the query, mutation, and action wrapper functions being a thin wrapper around one or more helper function.

Concretely, most of your code should live in a directory like convex/model, and your public API, which is defined with query, mutation, and action, should have very short functions that mostly just call into convex/model.
convex/model/users.ts

TS

import { QueryCtx } from '../_generated/server';

export async function getCurrentUser(ctx: QueryCtx) {
  const userIdentity = await ctx.auth.getUserIdentity();
  if (userIdentity === null) {
    throw new Error("Unauthorized");
  }
  const user = /* query ctx.db to load the user */
  const userSettings = /* load other documents related to the user */
  return { user, settings: userSettings };
}



convex/model/conversations.ts
TS

import { QueryCtx, MutationCtx } from '../_generated/server';
import * as Users from './users';

export async function ensureHasAccess(
  ctx: QueryCtx,
  { conversationId }: { conversationId: Id<"conversations"> },
) {
  const user = await Users.getCurrentUser(ctx);
  const conversation = await ctx.db.get(conversationId);
  if (conversation === null || !conversation.members.includes(user._id)) {
    throw new Error("Unauthorized");
  }
  return conversation;
}