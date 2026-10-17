import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import type { SiteLanguage } from "@/routing";
import { DEFAULT_SITE_LANGUAGE } from "./language";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export const createSiteI18n = (language: SiteLanguage = DEFAULT_SITE_LANGUAGE) => {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources: { en: { translation: en }, zh: { translation: zh } },
    lng: language,
    fallbackLng: DEFAULT_SITE_LANGUAGE,
    supportedLngs: ["zh", "en"],
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
};
