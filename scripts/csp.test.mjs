import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkCspOutput, validateInlineScripts } from "./check-csp.mjs";

const script = "\nwindow.theme = 'light';\n";
const hash = `sha256-${createHash("sha256").update(script).digest("base64")}`;
const csp = `default-src 'self'; script-src 'self' '${hash}'`;

test("inline executable scripts require hashes of their exact bytes, including whitespace", () => {
  assert.deepEqual([...validateInlineScripts(`<script>${script}</script>`, csp, "index.html")], [hash]);
  assert.throws(() => validateInlineScripts(`<script>${script.trim()}</script>`, csp, "index.html"), /index\.html: inline executable script requires 'sha256-/);
  assert.throws(() => validateInlineScripts("<script>alert(1)</script>", csp, "new.html"), /new\.html: inline executable script requires/);
});

test("classic scripts, modules and attribute quoting cannot bypass hash checks", () => {
  for (const attrs of [
    "", ' type="module"', " TYPE='text/javascript'", " type=application/javascript",
    " type='text/ecmascript'", " type='text/javascript1.5'", " data-src='/not-a-source.js'",
    ' data-note=">"', " nonce='untrusted'",
  ]) {
    assert.deepEqual([...validateInlineScripts(`<script${attrs}>${script}</script>`, csp, "page.html")], [hash]);
    assert.throws(() => validateInlineScripts(`<script${attrs}>changed()</script>`, csp, "page.html"), /requires 'sha256-/);
  }
});

test("JSON-LD and other data blocks, external scripts and HTML comments need no inline allowance", () => {
  const html = [
    '<script type="application/ld+json">{"different":"on each page"}</script>',
    "<script type='application/json'>{\"data\":true}</script>",
    '<script type="text/plain">not executable</script>',
    '<script type="module" src="/assets/app.js"></script>',
    '<script src="https://www.googletagmanager.com/gtag/js"></script>',
    "<!-- <script>commentedOut()</script> -->",
  ].join("");
  assert.deepEqual([...validateInlineScripts(html, csp, "data.html")], []);
});

test("hashes in other directives and unsafe-inline do not authorize scripts", () => {
  const html = `<script>${script}</script>`;
  for (const policy of [
    "default-src 'self'",
    `script-src 'self'; style-src '${hash}'`,
    "script-src 'self' 'unsafe-inline'",
  ]) assert.throws(() => validateInlineScripts(html, policy, "page.html"));
  assert.throws(() => validateInlineScripts(html, undefined, "page.html"), /missing Content-Security-Policy/);
});

test("the SWA configuration includes all six required global security headers", async () => {
  const config = JSON.parse(await readFile(new URL("../staticwebapp.config.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(config.globalHeaders).sort(), [
    "Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options",
    "Referrer-Policy", "X-Content-Type-Options", "Permissions-Policy",
  ].sort());
  assert.equal(config.globalHeaders["Strict-Transport-Security"], "max-age=31536000; includeSubDomains");
  assert.equal(config.globalHeaders["X-Frame-Options"], "DENY");
  assert.equal(config.globalHeaders["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(config.globalHeaders["X-Content-Type-Options"], "nosniff");
  assert.equal(config.globalHeaders["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
});

test("the output checker scans nested HTML, rejects unlisted scripts and detects lost headers", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "predixlab-csp-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const output = join(directory, "dist");
  const nested = join(output, "blog", "example");
  await mkdir(nested, { recursive: true });
  const configPath = join(directory, "staticwebapp.config.json");
  const deployedPath = join(output, "staticwebapp.config.json");
  const config = JSON.stringify({ globalHeaders: { "Content-Security-Policy": csp } });
  await writeFile(configPath, config);
  await writeFile(deployedPath, config);
  await assert.rejects(checkCspOutput(output, configPath), /No built HTML documents/);
  await writeFile(join(output, "index.html"), `<script>${script}</script>`);
  await writeFile(join(nested, "index.html"), `<script>${script}</script><script type="application/ld+json">{}</script>`);
  assert.deepEqual(await checkCspOutput(output, configPath), { pages: 2, hashes: [hash] });
  await writeFile(join(nested, "index.html"), "<script>unlisted()</script>");
  await assert.rejects(checkCspOutput(output, configPath), /blog[/\\]example[/\\]index\.html: inline executable script requires/);
  await writeFile(deployedPath, "{}");
  await assert.rejects(checkCspOutput(output, configPath), /Built globalHeaders must match/);
});
