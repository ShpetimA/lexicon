"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import Firecrawl from "@mendable/firecrawl-js";
import z from "zod";

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

const extractionPrompt = `
Extract all text content from this web page for translation purposes. Include:
- All visible or hidden page text, headings, and body content
- Button labels and link text
- Navigation menu items
- Form labels and placeholders
- Alt text from images
Ensure each text item is complete and preserves the original context. Do not translate - only extract and organize for translation.
`;

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

export const scrapeWebsite = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    const firecrawl = new Firecrawl({ apiKey });

    try {
      const prompt = extractionPrompt;

      const resultExtract = await firecrawl.extract({
        urls: [args.url],
        systemPrompt: prompt,
        scrapeOptions: {
          onlyMainContent: true,
        },
        schema: schemaJson,
      });

      console.log("RESULT EXTRACT", resultExtract.data);

      const jsonData = schemaTranslations.parse(resultExtract.data);

      const result: Record<string, string> = {};
      for (const item of jsonData.translations) {
        result[item.key_name] = item.value;
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Firecrawl error: ${error.message}`);
      }
      throw new Error("Unknown error occurred while scraping");
    }
  },
});
