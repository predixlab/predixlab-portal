import { blogPosts, blogUpdated, docs, docsUpdated } from "@/content/documents";
import { stockSignalsUpdated } from "@/content/stockSignals";

export type SiteLanguage = "zh" | "en";

export const siteLanguages: SiteLanguage[] = ["en", "zh"];

export const sitePages = [
  { key: "home", path: "/" },
  { key: "stockSignals", path: "/us-stock-signals/", lastmod: stockSignalsUpdated },
  { key: "stockScreener", path: "/quantitative-stock-screener/" },
  { key: "unusualOptions", path: "/unusual-options-activity/" },
  { key: "pricing", path: "/pricing/" },
  { key: "about", path: "/about/" },
  { key: "terms", path: "/terms/" },
  { key: "privacy", path: "/privacy/" },
  { key: "docs", path: "/docs/", lastmod: docsUpdated },
  ...docs.map((doc) => ({ key: "doc" as const, path: doc.path, lastmod: doc.updated })),
  { key: "blog", path: "/blog/", lastmod: blogUpdated },
  ...blogPosts.map((post) => ({ key: "blogPost" as const, path: post.path, lastmod: post.updated })),
] as const;

export type PageKey = (typeof sitePages)[number]["key"];

export const normalizePath = (pathname: string) => {
  const path = pathname.replace(/\/+$/, "");
  return path ? `${path}/` : "/";
};

export const publicPath = (path: string) => {
  const url = new URL(path, "https://predixlab.com");
  const pathname = normalizePath(url.pathname);
  return `${pathname}${url.search}${url.hash}`;
};

export const getPageForPath = (pathname: string) =>
  sitePages.find((page) => page.path === normalizePath(pathname));
