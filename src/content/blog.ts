import { config } from "@/config";
import { escapeXml, type BlogPost } from "@/content/markdown";

export const blogContent = {
  title: "PredixLab Blog | Backtesting, Validation & Stock Analysis",
  description: "Practical guides to backtesting, walk-forward validation, and the limitations of stock-signal research.",
};

export const firstBlogCategory = "Backtesting & validation";

export const groupBlogPosts = (posts: BlogPost[]) => {
  const categories = [...new Set(posts.map((post) => post.category))].sort((a, b) =>
    a === firstBlogCategory ? -1 : b === firstBlogCategory ? 1 : a.localeCompare(b),
  );
  return categories.map((category) => ({
    category,
    posts: posts.filter((post) => post.category === category)
      .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)),
  }));
};

export const relatedBlogPosts = (posts: BlogPost[], current: BlogPost) =>
  posts.filter((post) => post.slug !== current.slug).sort((a, b) =>
    Number(b.category === current.category) - Number(a.category === current.category)
    || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );

export const formatPostDate = (date: string) => new Intl.DateTimeFormat("en", {
  dateStyle: "long", timeZone: "UTC",
}).format(new Date(`${date}T00:00:00Z`));

export const renderBlogRss = (posts: BlogPost[]) => {
  const blogUrl = new URL("/blog/", config.siteUrl).href;
  const items = [...posts].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
    .map((post) => {
      const url = escapeXml(new URL(post.path, config.siteUrl).href);
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        "    </item>",
      ].join("\n");
    });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(blogContent.title)}</title>`,
    `    <link>${escapeXml(blogUrl)}</link>`,
    `    <description>${escapeXml(blogContent.description)}</description>`,
    `    <atom:link href="${escapeXml(new URL("rss.xml", blogUrl).href)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
};
