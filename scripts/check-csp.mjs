import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDirectory = fileURLToPath(new URL("../", import.meta.url));
const executableType = /^(?:(?:text|application)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript))$/;
const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)]
    .map(([, key, doubleQuoted, singleQuoted, unquoted]) => [
      key.toLowerCase(), doubleQuoted ?? singleQuoted ?? unquoted ?? "",
    ]),
);

export const validateInlineScripts = (html, csp, filename) => {
  assert.equal(typeof csp, "string", `${filename}: missing Content-Security-Policy`);
  const sources = csp.split(";").map((directive) => directive.trim().split(/\s+/))
    .find(([name]) => name === "script-src");
  assert.ok(sources, `${filename}: missing script-src`);
  assert.ok(!sources.includes("'unsafe-inline'"), `${filename}: script-src must use hashes, not unsafe-inline`);
  const hashes = new Set();
  // Match comments separately so commented-out markup is not treated as executable.
  const scripts = /<!--[\s\S]*?-->|<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script\s*>/gi;
  for (const [, tag, content] of html.matchAll(scripts)) {
    if (tag === undefined) continue;
    const attrs = attributes(tag);
    const type = (attrs.type ?? "").trim().toLowerCase();
    if ("src" in attrs || (type && type !== "module" && !executableType.test(type))) continue;
    const hash = `sha256-${createHash("sha256").update(content, "utf8").digest("base64")}`;
    assert.ok(sources.includes(`'${hash}'`), `${filename}: inline executable script requires '${hash}' in script-src`);
    hashes.add(hash);
  }
  return hashes;
};

export const checkCspOutput = async (
  directory = join(rootDirectory, "dist"),
  configPath = join(rootDirectory, "staticwebapp.config.json"),
) => {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const deployedConfig = JSON.parse(await readFile(join(directory, "staticwebapp.config.json"), "utf8"));
  assert.deepEqual(deployedConfig.globalHeaders, config.globalHeaders, "Built globalHeaders must match the source configuration");
  const hashes = new Set();
  let pages = 0;
  const visit = async (folder) => {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const filename = join(folder, entry.name);
      if (entry.isDirectory()) await visit(filename);
      else if (entry.isFile() && entry.name.endsWith(".html")) {
        const html = await readFile(filename, "utf8");
        for (const hash of validateInlineScripts(html, config.globalHeaders?.["Content-Security-Policy"], filename)) {
          hashes.add(hash);
        }
        pages++;
      }
    }
  };
  await visit(directory);
  assert.ok(pages > 0, "No built HTML documents found; run npm run build first");
  return { pages, hashes: [...hashes].sort() };
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { pages, hashes } = await checkCspOutput();
  console.log(`CSP inline-script hashes verified across ${pages} HTML documents: ${hashes.join(", ")}`);
}
