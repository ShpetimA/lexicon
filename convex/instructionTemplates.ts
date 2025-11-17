import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { getUser, requireAppAccess } from "./lib/roles";

export const list = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    return await ctx.db
      .query("instructionTemplates")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const create = userMutation({
  args: {
    name: v.string(),
    instructions: v.string(),
    appId: v.id("apps"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    const templateId = await ctx.db.insert("instructionTemplates", {
      name: args.name,
      instructions: args.instructions,
      appId: args.appId,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    return templateId;
  },
});

export const update = userMutation({
  args: {
    id: v.id("instructionTemplates"),
    name: v.string(),
    instructions: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Instruction template not found");
    }

    await requireAppAccess(ctx, template.appId, ["owner", "admin", "member"]);

    await ctx.db.patch(args.id, {
      name: args.name,
      instructions: args.instructions,
    });
  },
});

export const remove = userMutation({
  args: { id: v.id("instructionTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throw new Error("Instruction template not found");
    }

    await requireAppAccess(ctx, template.appId, ["owner", "admin", "member"]);

    await ctx.db.delete(args.id);
  },
});
