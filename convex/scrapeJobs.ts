import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { getUser, requireAppAccess } from "./lib/roles";
import { userMutation } from "./lib/auth";

export const createScrapeJobInternal = internalMutation({
  args: {
    appId: v.id("apps"),
    userId: v.id("users"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("scrapeJobs", {
      appId: args.appId,
      userId: args.userId,
      url: args.url,
      status: "pending",
      startedAt: Date.now(),
    });
    return jobId;
  },
});

export const createScrapeJob = userMutation({
  args: {
    appId: v.id("apps"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    const jobId = await ctx.db.insert("scrapeJobs", {
      appId: args.appId,
      userId: user._id,
      url: args.url,
      status: "pending",
      startedAt: Date.now(),
    });
    return jobId;
  },
});

export const getScrapeJob = internalQuery({
  args: {
    jobId: v.id("scrapeJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    return job;
  },
});

export const updateScrapeJobStatus = internalMutation({
  args: {
    jobId: v.id("scrapeJobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
    });
  },
});

export const completeScrapeJob = internalMutation({
  args: {
    jobId: v.id("scrapeJobs"),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
      result: args.result,
      completedAt: Date.now(),
    });
  },
});

export const failScrapeJob = internalMutation({
  args: {
    jobId: v.id("scrapeJobs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const listUserScrapeJobs = query({
  args: {
    appId: v.id("apps"),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const jobs = await ctx.db
      .query("scrapeJobs")
      .withIndex("by_app_user", (q) => q.eq("appId", args.appId))
      .filter((q) => q.gte(q.field("startedAt"), cutoff))
      .order("desc")
      .collect();

    return jobs;
  },
});

export const getScrapeJobStatus = query({
  args: {
    jobId: v.id("scrapeJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    return job;
  },
});

export const cleanupOldJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const oldJobs = await ctx.db
      .query("scrapeJobs")
      .filter((q) => q.lt(q.field("startedAt"), cutoff))
      .collect();

    for (const job of oldJobs) {
      await ctx.db.delete(job._id);
    }

    return { deleted: oldJobs.length };
  },
});
