export const i18n = {
    defaultLocale: "ja",
    locales: ["en", "ja","ko","zh"],
  } as const;
  
  export type Locale = (typeof i18n)["locales"][number];