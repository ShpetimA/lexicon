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
import { userQuery } from "./lib/auth";
import { getUser, requireAppAccess, requireAppAccessAction } from "./lib/roles";

const CDN_BASE_URL = "https://lex-icon.me";

export const getNextVersion = internalQuery({
  args: { environmentId: v.id("environments") },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.environmentId),
      )
      .order("desc")
      .collect();

    if (snapshots.length === 0) return 1;

    // Get max version and add 1
    const maxVersion = Math.max(...snapshots.map((s) => s.version));
    return maxVersion + 1;
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

export const getCdnUrl = userQuery({
  args: {
    appId: v.id("apps"),
    environmentId: v.id("environments"),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const app = await ctx.db
      .query("apps")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();

    await requireAppAccess(ctx, args.appId, ["owner", "admin", "member"]);

    if (!app || app._id !== args.appId) {
      throw new Error("Invalid API key");
    }

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
  },
  handler: async (ctx, args) => {
    await requireAppAccessAction(ctx, args.appId, ["owner", "admin", "member"]);
    const user = await getUser(ctx);
    const data = await ctx.runQuery(
      (api as any).environments.generateExportData,
      {
        appId: args.appId,
      },
    );

    const nextVersion: number = await ctx.runQuery(
      (internal as any).publishing.getNextVersion,
      {
        environmentId: args.environmentId,
      },
    );

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    const versionedKey = `${args.appId}/${args.environmentId}/v${nextVersion}.json`;
    const latestKey = `${args.appId}/${args.environmentId}/latest.json`;

    try {
      await r2.deleteObject(ctx, versionedKey);
    } catch (e) {}

    await r2.store(ctx, blob, {
      key: versionedKey,
      type: "application/json",
    });

    try {
      await r2.deleteObject(ctx, latestKey);
    } catch (e) {}

    await r2.store(ctx, blob, {
      key: latestKey,
      type: "application/json",
    });

    const cdnUrl = `${CDN_BASE_URL}/${versionedKey}`;
    const latestUrl = `${CDN_BASE_URL}/${latestKey}`;

    const snapshotId: Id<"snapshots"> = await ctx.runMutation(
      (internal as any).publishing.createSnapshot,
      {
        appId: args.appId,
        environmentId: args.environmentId,
        version: nextVersion,
        data: versionedKey,
        publishedBy: user._id,
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
