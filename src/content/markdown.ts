import { Marked, type Tokens } from "marked";

export interface MarkdownDocument {
  title: string;
  shortTitle: string;
  description: string;
  lang: "en";
  h1: string;
  html: string;
  frontmatter: Record<string, string>;
  body: string;
}

export interface BlogPost extends MarkdownDocument {
  kind: "post";
  slug: string;
  path: string;
  date: string;
  updated: string;
  category: string;
  translationKey: string;
  image?: string;
  imageAlt?: string;
}

export interface DocPage extends MarkdownDocument {
  kind: "doc";
  slug: string;
  path: string;
  summary: string;
  date: string;
  updated: string;
  order: number;
  translationKey: string;
}

export const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]!);

// Content uses a deliberately small frontmatter subset: flat string fields only.
export const parseFrontmatter = (source: string, filename: string) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${filename}: missing frontmatter`);
  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const field = line.match(/^([a-zA-Z][\w-]*):\s*(.+)$/);
    if (!field) throw new Error(`${filename}: invalid frontmatter line: ${line}`);
    const [, key, rawValue] = field;
    if (Object.prototype.hasOwnProperty.call(frontmatter, key)) throw new Error(`${filename}: duplicate field ${key}`);
    const raw = rawValue.trim();
    let value: unknown = raw;
    if (raw.startsWith('"')) {
      try {
        value = JSON.parse(raw);
      } catch {
        throw new Error(`${filename}: invalid quoted string for ${key}`);
      }
    } else if (raw.startsWith("'")) {
      if (!/^'(?:[^']|'')*'$/.test(raw)) throw new Error(`${filename}: invalid quoted string for ${key}`);
      value = raw.slice(1, -1).replace(/''/g, "'");
    } else if (/^[{[|>]|^(?:true|false|null|~|[-+]?\d+(?:\.\d+)?)$/i.test(raw)) {
      throw new Error(`${filename}: ${key} must be a string`);
    }
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`${filename}: ${key} must be a nonempty string`);
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body: source.slice(match[0].length).trim() };
};

const requireFields = (fields: Record<string, string>, keys: string[], filename: string) => {
  for (const key of keys) {
    if (!fields[key]?.trim()) throw new Error(`${filename}: missing required field ${key}`);
  }
};

export const validateDate = (value: string, field: string, filename: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime())
    || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${filename}: invalid ${field} (expected YYYY-MM-DD)`);
  }
};

export const headingId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const parseMarkdownDocument = (
  source: string,
  filename: string,
): MarkdownDocument => {
  const { frontmatter, body } = parseFrontmatter(source, filename);
  requireFields(frontmatter, ["title", "shortTitle", "description", "lang"], filename);
  if (frontmatter.lang !== "en") throw new Error(`${filename}: lang must be en`);
  if (frontmatter.title.length > 60) throw new Error(`${filename}: title exceeds 60 characters`);
  if (frontmatter.description.length > 155) throw new Error(`${filename}: description exceeds 155 characters`);
  if (/<!--|\[待核实\]|\[发布日填写\]|\/learn\/(?:walk-forward-validation|look-ahead-bias)\//.test(source)) {
    throw new Error(`${filename}: remove reviewer notes/placeholders and migrate legacy links`);
  }
  if (/real[- ]?time|实时/i.test(source)) throw new Error(`${filename}: content must describe daily data only`);
  const usedIds = new Set<string>();
  const markdown = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const base = headingId(text) || "section";
        let id = base;
        for (let suffix = 2; usedIds.has(id); suffix += 1) id = `${base}-${suffix}`;
        usedIds.add(id);
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        if (!/^(?:https?:\/\/|\/(?!\/)|#)/.test(href)) {
          throw new Error(`${filename}: unsupported link ${href}`);
        }
        const external = /^https?:\/\//.test(href) && new URL(href).origin !== "https://predixlab.com";
        return `<a href="${escapeXml(href)}"${title ? ` title="${escapeXml(title)}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${this.parser.parseInline(tokens)}</a>`;
      },
      table(token) {
        const header = token.header.map((cell) => this.tablecell({ ...cell, header: true })).join("");
        const rows = token.rows.map((row) => this.tablerow({
          text: row.map((cell) => this.tablecell({ ...cell, header: false })).join(""),
        })).join("");
        return `<div class="markdown-table" role="region" aria-label="Scrollable table" tabindex="0"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
      html() {
        throw new Error(`${filename}: use Markdown rather than raw HTML`);
      },
    },
  });
  const tokens = markdown.lexer(body).filter((token) => token.type !== "space");
  const headings = tokens.filter((token): token is Tokens.Heading => token.type === "heading" && token.depth === 1);
  let h1Count = 0;
  markdown.walkTokens(tokens, (token) => {
    if (token.type === "heading" && token.depth === 1) h1Count += 1;
  });
  if (h1Count !== 1 || headings.length !== 1 || tokens[0] !== headings[0]) {
    throw new Error(`${filename}: start the document with exactly one H1`);
  }
  const h1 = headings[0].text;
  if (frontmatter.h1 && frontmatter.h1 !== h1) throw new Error(`${filename}: h1 does not match the document`);
  return {
    title: frontmatter.title,
    shortTitle: frontmatter.shortTitle,
    description: frontmatter.description,
    lang: "en",
    h1,
    html: markdown.parser(tokens),
    frontmatter,
    body,
  };
};

export const loadBlogPosts = (sources: Record<string, string>): BlogPost[] => {
  const slugs = new Set<string>();
  return Object.entries(sources).map(([filename, source]): BlogPost => {
    const slug = filename.split("/").pop()?.replace(/\.md$/, "") ?? "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${filename}: invalid slug`);
    if (slugs.has(slug)) throw new Error(`${filename}: duplicate slug ${slug}`);
    slugs.add(slug);
    const document = parseMarkdownDocument(source, filename);
    const { frontmatter } = document;
    requireFields(frontmatter, ["date", "updated", "category", "translationKey"], filename);
    validateDate(frontmatter.date, "date", filename);
    validateDate(frontmatter.updated, "updated", filename);
    if (frontmatter.updated < frontmatter.date) throw new Error(`${filename}: updated precedes date`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.translationKey)) {
      throw new Error(`${filename}: invalid translationKey`);
    }
    if (Boolean(frontmatter.image) !== Boolean(frontmatter.imageAlt)) {
      throw new Error(`${filename}: image and imageAlt must be provided together`);
    }
    if (frontmatter.image && !/^\/(?:[\w-]+\/)*[\w-]+\.png$/.test(frontmatter.image)) {
      throw new Error(`${filename}: image must be a local PNG path (1200x630)`);
    }
    return {
      ...document, kind: "post", slug, path: `/blog/${slug}/`,
      date: frontmatter.date, updated: frontmatter.updated,
      category: frontmatter.category, translationKey: frontmatter.translationKey,
      image: frontmatter.image, imageAlt: frontmatter.imageAlt,
    };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
};

export const loadDocs = (sources: Record<string, string>): DocPage[] => {
  const slugs = new Set<string>();
  const orders = new Set<number>();
  const translationKeys = new Set<string>();
  return Object.entries(sources).map(([filename, source]): DocPage => {
    const slug = filename.split("/").pop()?.replace(/\.md$/, "") ?? "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${filename}: invalid slug`);
    if (slugs.has(slug)) throw new Error(`${filename}: duplicate slug ${slug}`);
    slugs.add(slug);
    const document = parseMarkdownDocument(source, filename);
    const { frontmatter } = document;
    requireFields(frontmatter, ["summary", "date", "updated", "order", "translationKey"], filename);
    validateDate(frontmatter.date, "date", filename);
    validateDate(frontmatter.updated, "updated", filename);
    if (frontmatter.updated < frontmatter.date) throw new Error(`${filename}: updated precedes date`);
    if (!/^(?:0|[1-9]\d*)$/.test(frontmatter.order) || !Number.isSafeInteger(Number(frontmatter.order))) {
      throw new Error(`${filename}: order must be a nonnegative integer string`);
    }
    const order = Number(frontmatter.order);
    if (orders.has(order)) throw new Error(`${filename}: duplicate order ${order}`);
    orders.add(order);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.translationKey)) {
      throw new Error(`${filename}: invalid translationKey`);
    }
    if (translationKeys.has(frontmatter.translationKey)) throw new Error(`${filename}: duplicate translationKey`);
    translationKeys.add(frontmatter.translationKey);
    return {
      ...document, kind: "doc", slug, path: slug === "index" ? "/docs/" : `/docs/${slug}/`,
      summary: frontmatter.summary, date: frontmatter.date,
      updated: frontmatter.updated, order, translationKey: frontmatter.translationKey,
    };
  }).sort((a, b) => a.order - b.order);
};

export const sourceRepositories = (document: MarkdownDocument) => {
  const table = new Marked().lexer(document.body).find((token): token is Tokens.Table =>
    token.type === "table" && token.header[0]?.text === "Repository" && token.header[2]?.text === "Stack",
  );
  if (!table) throw new Error("Self-hosting content requires a repository table");
  return table.rows.map((row) => {
    const link = row[0].tokens.find((token): token is Tokens.Link => token.type === "link");
    const languages = row[2].text.match(/\b(?:Python|TypeScript|Bicep|shell)\b/g);
    if (!link || !languages) throw new Error("Invalid repository table row");
    return {
      name: link.text,
      description: row[1].text,
      codeRepository: link.href,
      programmingLanguage: languages.map((language) => language === "shell" ? "Shell" : language),
    };
  });
};
