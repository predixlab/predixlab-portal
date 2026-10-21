import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, GithubLogo, List, Moon, Sun, X, XLogo } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import Seo from "@/components/Seo";
import { config, dashboardLink } from "@/config";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";
import { getPreferredLanguage, LANGUAGE_STORAGE_KEY } from "@/i18n/language";
import { normalizePath } from "@/routing";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  enableGoogleAnalytics,
  getAnalyticsConsent,
  isAnalyticsConfigured,
  setAnalyticsConsent,
  syncAnalyticsConsent,
  type AnalyticsConsent,
} from "@/analytics";

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "predixlab-theme";

const Layout = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const { language, localPath, changeLanguage } = useSiteLanguage();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>();
  const [analyticsConsent, setAnalyticsConsentState] = useState<AnalyticsConsent>("declined");
  const mainRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const initialNavigation = useRef(true);
  const isDark = theme === "dark";
  const navItems = [
    { path: "/#tools", label: t("nav.tools") },
    { path: "/pricing/", label: t("nav.pricing") },
    { path: "/docs/", label: t("nav.docs") },
    { path: "/blog/", label: t("nav.blog") },
    { path: "/about/", label: t("nav.about") },
  ];

  useEffect(() => {
    void i18n.changeLanguage(getPreferredLanguage());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
        void i18n.changeLanguage(getPreferredLanguage());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [i18n]);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    if (isAnalyticsConfigured()) {
      setAnalyticsConsentState(getAnalyticsConsent());
      enableGoogleAnalytics();
    }
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = isDark ? "#111c19" : "#f5f6f1";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#111c19" : "#f5f6f1");
  }, [theme, isDark]);

  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ANALYTICS_CONSENT_STORAGE_KEY && event.key !== null) return;
      const consent = event.newValue === "accepted" || event.newValue === "declined" ? event.newValue : null;
      syncAnalyticsConsent(consent ?? "declined");
      setAnalyticsConsentState(consent);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    if (initialNavigation.current) {
      initialNavigation.current = false;
      if (!location.hash) return;
    }
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
        mainRef.current?.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key]);

  useEffect(() => {
    if (!menuOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [menuOpen]);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The preference still applies for this visit if browser storage is blocked.
    }
    setTheme(next);
  };

  const updateConsent = (consent: Exclude<AnalyticsConsent, null>) => {
    setAnalyticsConsent(consent);
    setAnalyticsConsentState(consent);
  };

  const current = (path: string) =>
    !path.includes("#") && normalizePath(location.pathname).startsWith(path);

  return (
    <div className="site-shell">
      <Seo />
      <a className="skip-link" href="#main-content">{t("nav.skipToContent")}</a>
      <header className="site-header">
        <div className="site-container">
          <nav className="site-nav" aria-label={t("nav.primaryLabel")}>
            <Link to={localPath("/")} className="brand-lockup" aria-label={t("nav.homeLabel")}>
              <img className="brand-mark" src="/icons/icon.svg" width="34" height="34" alt="" />
              <span>PredixLab<span className="brand-period">.</span></span>
            </Link>
            <div className="desktop-nav">
              {navItems.map((item) => <Link className="nav-link" key={item.path} to={localPath(item.path)} aria-current={current(item.path) ? "page" : undefined}>{item.label}</Link>)}
            </div>
            <div className="nav-actions">
              <a className="icon-button nav-github" href={config.githubUrl} target="_blank" rel="noopener noreferrer" aria-label={t("footer.githubLabel")}>
                <GithubLogo aria-hidden="true" />
              </a>
              <button className="icon-button theme-button" type="button" onClick={toggleTheme} aria-label={isDark ? t("nav.switchToLight") : t("nav.switchToDark")} title={isDark ? t("nav.switchToLight") : t("nav.switchToDark")}>
                {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="language-button"
                onClick={() => changeLanguage(language === "en" ? "zh" : "en")}
                lang={language === "en" ? "zh-CN" : "en"}
                aria-label={t("nav.switchLanguage", { language: language === "en" ? "中文" : "English" })}
              >{language === "en" ? "中文" : "EN"}</button>
              <a href={dashboardLink("/", "navigation")} className="nav-dashboard">{t("nav.login")}<ArrowUpRight aria-hidden="true" /></a>
              <button
                ref={menuButtonRef}
                className="icon-button menu-button"
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              >{menuOpen ? <X aria-hidden="true" /> : <List aria-hidden="true" />}</button>
            </div>
          </nav>
        </div>
        <nav className="mobile-nav" id="mobile-navigation" aria-label={t("nav.mobileLabel")} hidden={!menuOpen}>
          <div className="site-container">
            {navItems.map((item) => <Link className="nav-link" key={item.path} to={localPath(item.path)} onClick={() => setMenuOpen(false)} aria-current={current(item.path) ? "page" : undefined}>{item.label}<ArrowUpRight aria-hidden="true" /></Link>)}
            <a className="icon-button" href={config.githubUrl} target="_blank" rel="noopener noreferrer" aria-label={t("footer.githubLabel")}><GithubLogo aria-hidden="true" /></a>
            <a href={dashboardLink("/", "mobile-navigation")} className="button button-primary">{t("nav.login")}<ArrowUpRight aria-hidden="true" /></a>
          </div>
        </nav>
      </header>

      <main ref={mainRef} className="page-main" id="main-content" tabIndex={-1}>{children}</main>

      <footer className="site-footer">
        <div className="site-container">
          <div className="footer-main">
            <div className="footer-brand">
              <Link to={localPath("/")} className="brand-lockup"><img className="brand-mark" src="/icons/icon.svg" width="34" height="34" alt="" /><span>PredixLab.</span></Link>
              <p className="footer-manifesto">{t("footer.manifesto")}</p>
              <p>{t("footer.description")}</p>
              <div className="footer-profiles">
                <a className="footer-profile" href={config.githubUrl} target="_blank" rel="noopener noreferrer" aria-label={t("footer.githubLabel")}>
                  <GithubLogo aria-hidden="true" />
                </a>
                <a className="footer-profile" href={config.xUrl} target="_blank" rel="noopener noreferrer" aria-label={t("footer.xLabel")}>
                  <XLogo aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="footer-column">
              <h2>{t("footer.tools")}</h2>
              <ul>
                <li><Link to={localPath("/us-stock-signals/")}>{t("footer.stockSignals")}</Link></li>
                <li><Link to={localPath("/quantitative-stock-screener/")}>{t("footer.stockScreener")}</Link></li>
                <li><Link to={localPath("/unusual-options-activity/")}>{t("footer.unusualOptions")}</Link></li>
                <li><a href={dashboardLink("/", "footer")}>{t("nav.login")}</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h2>{t("footer.explore")}</h2>
              <ul>
                <li><Link to={localPath("/pricing/")}>{t("nav.pricing")}</Link></li>
                <li><Link to={localPath("/docs/")}>{t("nav.docs")}</Link></li>
                <li><Link to={localPath("/blog/")}>{t("nav.blog")}</Link></li>
                <li><Link to={localPath("/about/")}>{t("nav.about")}</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h2>{t("footer.legal")}</h2>
              <ul>
                <li><Link to={localPath("/terms/")}>{t("footer.terms")}</Link></li>
                <li><Link to={localPath("/privacy/")}>{t("footer.privacy")}</Link></li>
                {isAnalyticsConfigured() && <li><button type="button" className="footer-link-button" onClick={() => setAnalyticsConsentState(null)}>{t("footer.analyticsPreferences")}</button></li>}
              </ul>
            </div>
          </div>
          <div className="footer-wordmark" aria-hidden="true">{t("footer.tagline")}</div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} PredixLab</span><span>{t("footer.disclaimer")}</span><span className="footer-coordinate">{t("footer.caption")}</span></div>
        </div>
      </footer>

      {isAnalyticsConfigured() && analyticsConsent === null && (
        <aside className="analytics-consent" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description">
          <div><h2 id="analytics-consent-title">{t("analytics.title")}</h2><p id="analytics-consent-description">{t("analytics.description")}</p></div>
          <div className="analytics-consent-actions">
            <button type="button" className="button button-secondary" onClick={() => updateConsent("declined")}>{t("analytics.decline")}</button>
            <button type="button" className="button button-primary" onClick={() => updateConsent("accepted")}>{t("analytics.accept")}</button>
          </div>
        </aside>
      )}
    </div>
  );
};

export default Layout;
