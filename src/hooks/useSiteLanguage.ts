import { useTranslation } from "react-i18next";
import { setPreferredLanguage } from "@/i18n/language";
import { publicPath, type SiteLanguage } from "@/routing";

export const useSiteLanguage = () => {
  const { i18n } = useTranslation();
  const language: SiteLanguage = i18n.resolvedLanguage === "zh" ? "zh" : "en";
  return {
    language,
    isEnglish: language === "en",
    localPath: publicPath,
    changeLanguage: (nextLanguage: SiteLanguage) => {
      setPreferredLanguage(nextLanguage);
      void i18n.changeLanguage(nextLanguage);
    },
  };
};
