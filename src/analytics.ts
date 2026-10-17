export type AnalyticsConsent = "accepted" | "declined" | null;

export const ANALYTICS_CONSENT_STORAGE_KEY = "predixlab-analytics-consent";
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? "";
let initialized = false;
let memoryConsent: AnalyticsConsent = null;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const isAnalyticsConfigured = () => Boolean(measurementId);

export const getAnalyticsConsent = (): AnalyticsConsent => {
  if (memoryConsent !== null) return memoryConsent;
  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    memoryConsent = stored === "accepted" || stored === "declined" ? stored : null;
    return memoryConsent;
  } catch {
    return null;
  }
};

const applyAnalyticsConsent = (consent: Exclude<AnalyticsConsent, null>) => {
  memoryConsent = consent;
  if (!initialized) return;

  window.gtag("consent", "update", {
    analytics_storage: consent === "accepted" ? "granted" : "denied",
  });
};

export const setAnalyticsConsent = (consent: Exclude<AnalyticsConsent, null>) => {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
  } catch {
    // The in-memory choice still applies for the current visit.
  }
  applyAnalyticsConsent(consent);
};

export const syncAnalyticsConsent = (consent: Exclude<AnalyticsConsent, null>) => {
  applyAnalyticsConsent(consent);
};

export const enableGoogleAnalytics = () => {
  if (!measurementId || initialized) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  if (getAnalyticsConsent() === "accepted") {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.predixlabAnalytics = "true";
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  initialized = true;
};
