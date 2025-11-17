import { api } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { authComponent } from "../auth";

export type Role = "owner" | "admin" | "member";
const isActionCtx = (
  ctx: MutationCtx | QueryCtx | ActionCtx,
): ctx is ActionCtx => {
  return "runQuery" in ctx;
};

export async function getUser(ctx: MutationCtx | QueryCtx | ActionCtx) {
  const betterAuthUser = await authComponent.getAuthUser(ctx);

  if (!betterAuthUser) throw new Error("Authentication required");

  if (isActionCtx(ctx)) {
    const user: any = await ctx.runQuery(api.users.getUserByBetterAuthId, {
      betterAuthUserId: betterAuthUser._id,
    });

    if (!user) throw new Error("User not found");
    return user;
  }

  let user = await ctx.db
    .query("users")
    .withIndex("by_betterauth_id", (q) =>
      q.eq("betterAuthUserId", betterAuthUser._id),
    )
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getCustomerUser(
  ctx: QueryCtx | MutationCtx,
  customerId: Id<"customers">,
) {
  const user = await getUser(ctx);

  return await ctx.db
    .query("customerUsers")
    .withIndex("by_customer_user", (q) =>
      q.eq("customerId", customerId).eq("userId", user._id),
    )
    .first();
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  customerId: Id<"customers">,
  allowedRoles: Role[],
) {
  const customerUser = await getCustomerUser(ctx, customerId);
  if (!customerUser || !allowedRoles.includes(customerUser.role)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
  return customerUser;
}

export async function isRole(
  ctx: QueryCtx | MutationCtx,
  customerId: Id<"customers">,
  allowedRoles: Role[],
) {
  const customerUser = await getCustomerUser(ctx, customerId);
  return customerUser ? allowedRoles.includes(customerUser.role) : false;
}

export async function getUserCustomers(ctx: QueryCtx | MutationCtx) {
  const user = await getUser(ctx);

  const customerUsers = await ctx.db
    .query("customerUsers")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();

  return await Promise.all(
    customerUsers.map(async (cu) => {
      const customer = await ctx.db.get(cu.customerId);
      return {
        ...customer,
        userRole: cu.role,
      };
    }),
  );
}

export async function requireAppAccess(
  ctx: QueryCtx | MutationCtx,
  appId: Id<"apps">,
  allowedRoles: Role[],
) {
  const app = await ctx.db.get(appId);
  if (!app) throw new Error("App not found");

  const appWithCustomerId = app;
  return await requireRole(ctx, appWithCustomerId.customerId, allowedRoles);
}
