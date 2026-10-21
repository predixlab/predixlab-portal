import {
  loadBlogPosts,
  parseMarkdownDocument,
  validateDate,
  type ContentPage,
} from "@/content/markdown";

const pageSources = import.meta.glob<string>("./pages/*.md", {
  query: "?raw", import: "default", eager: true,
});

const loadPage = (slug: string): ContentPage => {
  const filename = `./pages/${slug}.md`;
  const source = pageSources[filename];
  if (!source) throw new Error(`Missing content page ${filename}`);
  return { ...parseMarkdownDocument(source, filename), kind: "page" };
};

export const contentPages = {
  methodology: loadPage("methodology"),
  openSource: loadPage("open-source"),
};
for (const [name, page] of Object.entries(contentPages)) {
  for (const field of ["datePublished", "dateModified"]) {
    validateDate(page.frontmatter[field], field, name);
  }
  if (page.frontmatter.dateModified < page.frontmatter.datePublished) {
    throw new Error(`${name}: dateModified precedes datePublished`);
  }
}

export const blogPosts = loadBlogPosts(import.meta.glob<string>("./blog/*.md", {
  query: "?raw", import: "default", eager: true,
}));

export const blogUpdated = blogPosts.reduce<string | undefined>(
  (latest, post) => !latest || post.updated > latest ? post.updated : latest, undefined,
);

export const getContentForPath = (pathname: string) => {
  const path = `${pathname.replace(/\/+$/, "")}/`;
  if (path === "/methodology/") return contentPages.methodology;
  if (path === "/open-source/") return contentPages.openSource;
  return blogPosts.find((post) => post.path === path);
};
