import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { getUserCustomers, getUser, requireRole } from "./lib/roles";

export const list = userQuery({
  args: {},
  handler: async (ctx) => {
    return await getUserCustomers(ctx);
  },
});

export const get = userQuery({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) return null;

    const customerUser = await ctx.db
      .query("customerUsers")
      .withIndex("by_customer_user", (q) =>
        q.eq("customerId", args.id).eq("userId", ctx.user._id as any),
      )
      .first();

    if (!customerUser) {
      throw new Error("Unauthorized: No access to this customer");
    }

    return {
      ...customer,
      userRole: customerUser.role,
    };
  },
});

export const create = userMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userRecord = await getUser(ctx);

    const customerId = await ctx.db.insert("customers", {
      name: args.name,
      createdAt: Date.now(),
    });

    await ctx.db.insert("customerUsers", {
      customerId,
      userId: userRecord._id,
      role: "owner",
      createdAt: Date.now(),
    });

    return customerId;
  },
});

export const update = userMutation({
  args: {
    id: v.id("customers"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.id, ["owner", "admin"]);

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = userMutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.id, ["owner"]);

    await ctx.db.delete(args.id);
    return args.id;
  },
});
