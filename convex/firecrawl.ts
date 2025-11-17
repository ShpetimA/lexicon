"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Firecrawl from "@mendable/firecrawl-js";
import z from "zod";
import { Id } from "./_generated/dataModel";
import { getUser } from "./lib/roles";

const TIMEOUT = 5 * 60 * 1000;

const schemaJson = {
  type: "object",
  properties: {
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key_name: { type: "string" },
          value: { type: "string" },
        },
        required: ["key_name", "value"],
      },
    },
  },
  required: ["translations"],
};

const extractionPrompt = `Extract all text content from this web page for translation purposes. Do not translate - only extract and organize for translation.`;

const schemaTranslations = z.object({
  translations: z
    .array(
      z.object({
        key_name: z.string().describe("The name of the translation key"),
        value: z.string().describe("The value of the translation"),
      }),
    )
    .describe("An array of translation objects"),
});

export const startScrapeJob = action({
  args: {
    appId: v.id("apps"),
    url: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"scrapeJobs">> => {
    const currentUser = await getUser(ctx);
    const jobId = await ctx.runMutation(
      internal.scrapeJobs.createScrapeJobInternal,
      {
        appId: args.appId,
        userId: currentUser._id,
        url: args.url,
      },
    );

    await ctx.scheduler.runAfter(0, internal.firecrawl.processScrapeJob, {
      jobId,
      url: args.url,
    });

    return jobId;
  },
});

export const processScrapeJob = internalAction({
  args: {
    jobId: v.id("scrapeJobs"),
    url: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.scrapeJobs.updateScrapeJobStatus, {
      jobId: args.jobId,
      status: "processing",
    });

    try {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        throw new Error("FIRECRAWL_API_KEY not configured");
      }

      const firecrawl = new Firecrawl({ apiKey });
      const resultExtract = await firecrawl.extract({
        urls: [args.url],
        timeout: TIMEOUT,
        systemPrompt: extractionPrompt,
        scrapeOptions: {
          onlyMainContent: true,
        },
        schema: schemaJson,
      });

      const jsonData = schemaTranslations.parse(resultExtract.data);
      const result: Record<string, string> = {};
      for (const item of jsonData.translations) {
        result[item.key_name] = item.value;
      }

      await ctx.runMutation(internal.scrapeJobs.completeScrapeJob, {
        jobId: args.jobId,
        result: JSON.stringify(result),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.scrapeJobs.failScrapeJob, {
        jobId: args.jobId,
        error: `Firecrawl error: ${errorMessage}`,
      });
    }
  },
});
