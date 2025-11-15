import { v } from "convex/values";
import { userQuery, userMutation } from "./lib/auth";
import { getUser } from "./lib/roles";

export const list = userQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
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
    await ctx.db.patch(args.id, {
      name: args.name,
      instructions: args.instructions,
    });
  },
});

export const remove = userMutation({
  args: { id: v.id("instructionTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
