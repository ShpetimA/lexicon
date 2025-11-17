import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { getUser, requireRole } from "./lib/roles";

export const list = userQuery({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.customerId, ["owner", "admin", "member"]);

    const customerUsers = await ctx.db
      .query("customerUsers")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    const users = await Promise.all(
      customerUsers.map(async (customerUser) => {
        const user = await ctx.db.get(customerUser.userId);
        return {
          ...customerUser,
          user: user ? { name: user.name, email: user.email } : null,
        };
      }),
    );

    return users;
  },
});

export const invite = userMutation({
  args: {
    customerId: v.id("customers"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, args.customerId, ["owner", "admin"]);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User with this email does not exist");
    }

    const existingMember = await ctx.db
      .query("customerUsers")
      .withIndex("by_customer_user", (q) =>
        q.eq("customerId", args.customerId).eq("userId", user._id),
      )
      .first();

    if (existingMember) {
      throw new Error("User is already a member of this customer");
    }

    const customerUserId = await ctx.db.insert("customerUsers", {
      customerId: args.customerId,
      userId: user._id,
      role: args.role,
      createdAt: Date.now(),
    });

    return customerUserId;
  },
});

export const updateRole = userMutation({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const customerUser = await requireRole(ctx, args.customerId, ["owner"]);

    if (args.userId === user._id) {
      throw new Error("Cannot change your own role");
    }

    await ctx.db.patch(customerUser._id, { role: args.role });
    return customerUser._id;
  },
});

export const remove = userMutation({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const customerUser = await requireRole(ctx, args.customerId, ["owner"]);

    if (args.userId === user._id) {
      throw new Error("Cannot remove yourself");
    }

    const owners = await ctx.db
      .query("customerUsers")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .filter((q) => q.eq(q.field("role"), "owner"))
      .collect();

    if (owners.length === 1) {
      throw new Error("Cannot remove the last owner of a customer");
    }

    await ctx.db.delete(customerUser._id);
    return customerUser._id;
  },
});

export const countByCustomer = userQuery({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const customerUsers = await ctx.db
      .query("customerUsers")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    return customerUsers.length;
  },
});

export const getByCustomerAndUser = userQuery({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customerUsers")
      .withIndex("by_customer_user", (q) =>
        q.eq("customerId", args.customerId).eq("userId", args.userId),
      )
      .first();
  },
});
