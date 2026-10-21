import { loadBlogPosts, loadDocs } from "@/content/markdown";

export const docsPages = loadDocs(import.meta.glob<string>("./docs/*.md", {
  query: "?raw", import: "default", eager: true,
}));

const index = docsPages.find((page) => page.slug === "index");
if (!index) throw new Error("Missing docs index");
export const docsIndex = index;
export const docs = docsPages.filter((page) => page.slug !== "index");
if (!docs.length) throw new Error("Docs requires at least one document");
export const docsUpdated = docs.reduce((latest, page) => page.updated > latest ? page.updated : latest, docs[0].updated);

export const blogPosts = loadBlogPosts(import.meta.glob<string>("./blog/*.md", {
  query: "?raw", import: "default", eager: true,
}));

export const blogUpdated = blogPosts.reduce<string | undefined>(
  (latest, post) => !latest || post.updated > latest ? post.updated : latest, undefined,
);

export const getContentForPath = (pathname: string) => {
  const path = `${pathname.replace(/\/+$/, "")}/`;
  return docsPages.find((page) => page.path === path) ?? blogPosts.find((post) => post.path === path);
};
