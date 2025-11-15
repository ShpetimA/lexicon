import { internalMutation } from "./_generated/server";

export const STANDARD_LOCALES = [
  { code: "en", name: "English", nativeName: "English" },
  {
    code: "en-US",
    name: "English (United States)",
    nativeName: "English (United States)",
  },
  {
    code: "en-GB",
    name: "English (United Kingdom)",
    nativeName: "English (United Kingdom)",
  },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "es-ES", name: "Spanish (Spain)", nativeName: "Español (España)" },
  { code: "es-MX", name: "Spanish (Mexico)", nativeName: "Español (México)" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "fr-FR", name: "French (France)", nativeName: "Français (France)" },
  { code: "fr-CA", name: "French (Canada)", nativeName: "Français (Canada)" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  {
    code: "de-DE",
    name: "German (Germany)",
    nativeName: "Deutsch (Deutschland)",
  },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  {
    code: "pt-BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
  },
  {
    code: "pt-PT",
    name: "Portuguese (Portugal)",
    nativeName: "Português (Portugal)",
  },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "中文（简体）" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "中文（繁體）" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
];

export const seedGlobalLocales = internalMutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("globalLocales").first();
    if (existing) {
      return { message: "Global locales already seeded", count: 0 };
    }

    let count = 0;
    for (const locale of STANDARD_LOCALES) {
      await ctx.db.insert("globalLocales", {
        ...locale,
        createdAt: Date.now(),
      });
      count++;
    }

    return { message: "Global locales seeded successfully", count };
  },
});
