import type { SiteLanguage } from "@/routing";

export const DEFAULT_SITE_LANGUAGE: SiteLanguage = "en";
export const LANGUAGE_STORAGE_KEY = "predixlab-language";

export const getPreferredLanguage = (): SiteLanguage => {
  if (typeof window !== "undefined") {
    const language = new URLSearchParams(window.location.search).get("lng");
    if (language === "zh" || language === "en") return language;
  }

  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "zh" ? "zh" : DEFAULT_SITE_LANGUAGE;
  } catch {
    return DEFAULT_SITE_LANGUAGE;
  }
};

export const setPreferredLanguage = (language: SiteLanguage) => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    return;
  }
};