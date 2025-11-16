import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalAction,
  internalQuery,
  query,
} from "./_generated/server";
import { r2 } from "./storage";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

const CDN_BASE_URL = "https://lex-icon.me";

export const getSnapshotCount = internalQuery({
  args: { environmentId: v.id("environments") },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.environmentId),
      )
      .collect();
    return snapshots.length;
  },
});

export const createSnapshot = internalMutation({
  args: {
    appId: v.id("apps"),
    environmentId: v.id("environments"),
    version: v.number(),
    data: v.string(),
    publishedBy: v.id("users"),
    cdnUrl: v.optional(v.string()),
    latestUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("snapshots", {
      appId: args.appId,
      environmentId: args.environmentId,
      version: args.version,
      data: args.data,
      publishedBy: args.publishedBy,
      publishedAt: Date.now(),
      cdnUrl: args.cdnUrl,
      latestUrl: args.latestUrl,
    });
  },
});

export const getAllSnapshots = internalQuery({
  args: { environmentId: v.id("environments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("snapshots")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.environmentId),
      )
      .order("desc")
      .collect();
  },
});

export const deleteSnapshot = internalMutation({
  args: { id: v.id("snapshots") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const cleanupOldSnapshots = internalAction({
  args: { environmentId: v.id("environments") },
  handler: async (ctx, args) => {
    const allSnapshots: Array<Doc<"snapshots">> = await ctx.runQuery(
      internal.publishing.getAllSnapshots,
      {
        environmentId: args.environmentId,
      },
    );

    const toDelete = allSnapshots.slice(3);

    for (const snapshot of toDelete) {
      await r2.deleteObject(ctx, snapshot.data);
      await ctx.runMutation(internal.publishing.deleteSnapshot, {
        id: snapshot._id,
      });
    }

    return { deleted: toDelete.length };
  },
});

// Public query for customers to get CDN URL (with API key auth)
export const getCdnUrl = query({
  args: {
    appId: v.id("apps"),
    environmentId: v.id("environments"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify API key matches app
    const app = await ctx.db
      .query("apps")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();

    if (!app || app._id !== args.appId) {
      throw new Error("Invalid API key");
    }

    // Get latest snapshot
    const snapshot = await ctx.db
      .query("snapshots")
      .withIndex("by_app_env_version", (q) =>
        q.eq("appId", args.appId).eq("environmentId", args.environmentId),
      )
      .order("desc")
      .first();

    if (!snapshot) {
      return null;
    }

    // Return CDN URLs
    return {
      version: snapshot.version,
      cdnUrl: snapshot.cdnUrl || `${CDN_BASE_URL}/${snapshot.data}`,
      latestUrl:
        snapshot.latestUrl ||
        `${CDN_BASE_URL}/${args.appId}/${args.environmentId}/latest.json`,
      publishedAt: snapshot.publishedAt,
    };
  },
});

export const publish = action({
  args: {
    appId: v.id("apps"),
    environmentId: v.id("environments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      (api as any).environments.generateExportData,
      {
        appId: args.appId,
      },
    );

    const count: number = await ctx.runQuery(
      (internal as any).publishing.getSnapshotCount,
      {
        environmentId: args.environmentId,
      },
    );
    const nextVersion = count + 1;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    // Generate keys
    const versionedKey = `${args.appId}/${args.environmentId}/v${nextVersion}.json`;
    const latestKey = `${args.appId}/${args.environmentId}/latest.json`;

    // Store versioned file
    await r2.store(ctx, blob, {
      key: versionedKey,
      type: "application/json",
    });

    // Store as latest.json (same content)
    await r2.store(ctx, blob, {
      key: latestKey,
      type: "application/json",
    });

    // Generate CDN URLs
    const cdnUrl = `${CDN_BASE_URL}/${versionedKey}`;
    const latestUrl = `${CDN_BASE_URL}/${latestKey}`;

    const snapshotId: Id<"snapshots"> = await ctx.runMutation(
      (internal as any).publishing.createSnapshot,
      {
        appId: args.appId,
        environmentId: args.environmentId,
        version: nextVersion,
        data: versionedKey,
        publishedBy: args.userId,
        cdnUrl,
        latestUrl,
      },
    );

    await ctx.runAction((internal as any).publishing.cleanupOldSnapshots, {
      environmentId: args.environmentId,
    });

    return {
      snapshotId,
      version: nextVersion,
      key: versionedKey,
      cdnUrl,
      latestUrl,
    };
  },
});
