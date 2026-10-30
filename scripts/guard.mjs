import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");
const srcData = path.join(root, "src", "_data");

const site = JSON.parse(fs.readFileSync(path.join(srcData, "site.json"), "utf8"));
const ORIGIN = site.demoOrigin;
const BASE = site.basePath;
const PLACEHOLDER = site.placeholder;
const TREC_LINKS = new Set([
  "https://www.trec.texas.gov/sites/default/files/pdf-forms/CN%201-5_0.pdf",
  "https://www.trec.texas.gov/sites/default/files/pdf-forms/IABS%201-2.pdf",
]);

function walk(dir, ext, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, ext, files);
    else if (!ext || full.endsWith(ext)) files.push(full);
  }
  return files;
}

const read = (file) => fs.readFileSync(file, "utf8");
const errors = [];
const fail = (msg) => errors.push(msg);

const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, "");
const visibleText = (html) =>
  stripComments(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ");

// Where a page lives on the demo origin, from its path in _site.
function routeFor(rel) {
  const posix = rel.split(path.sep).join("/");
  if (posix === "index.html") return "";
  if (posix.endsWith("/index.html")) return posix.slice(0, -"index.html".length);
  return posix;
}

function checkRootRelative(where, value) {
  if (value.startsWith("//")) fail(`${where}: protocol-relative URL: ${value}`);
  else if (value.startsWith("/") && !value.startsWith(BASE)) {
    fail(`${where}: root-relative URL must start with ${BASE}: ${value}`);
  }
}

// ---- Repository-level rules -------------------------------------------------

for (const forbidden of ["CNAME", path.join("src", "CNAME"), path.join("_site", "CNAME")]) {
  if (fs.existsSync(path.join(root, forbidden))) fail(`${forbidden}: this repo must not claim a custom domain`);
}

const pagesWorkflow = path.join(root, ".github", "workflows", "pages.yml");
if (fs.existsSync(pagesWorkflow)) {
  const yml = read(pagesWorkflow).replace(/^\s*#.*$/gm, "");
  if (!/^\s*workflow_dispatch:/m.test(yml)) fail("pages.yml: must keep workflow_dispatch");
  if (/pull_request|pull_request_target|schedule:|tags:|release:/i.test(yml)) {
    fail("pages.yml: may only trigger on workflow_dispatch and push to main");
  }
  if (!/push:\s*\n\s*branches:\s*\[\s*main\s*\]/.test(yml)) fail("pages.yml: push trigger must be limited to main");
  if (/enablement|configure-pages|api\.github\.com|gh api/i.test(yml)) {
    fail("pages.yml: must not enable Pages or call the Pages API");
  }
}

for (const key of ["phone", "email", "address", "license"]) {
  if (site[key] !== null) fail(`site.json: ${key} must stay null until a real value is supplied in writing`);
}

const listingsPath = path.join(srcData, "listings.json");
if (fs.existsSync(listingsPath)) {
  const listings = JSON.parse(read(listingsPath));
  for (const item of listings.items || []) {
    for (const key of ["address", "price"]) {
      if (/\d/.test(String(item[key] ?? ""))) fail(`listings.json: ${item.id}: ${key} must not contain digits: ${item[key]}`);
    }
    for (const key of ["beds", "baths", "sqft", "photo", "image", "url", "mls"]) {
      if (key in item) fail(`listings.json: ${item.id}: sample listings must not carry ${key}`);
    }
  }
}

// ---- Built HTML -------------------------------------------------------------

const htmlFiles = walk(siteDir, ".html");
if (!htmlFiles.some((f) => path.basename(f) === "404.html" && path.dirname(f) === siteDir)) {
  fail("404.html is missing from the _site root");
}

const seenTitles = new Map();
const seenDescriptions = new Map();

for (const file of htmlFiles) {
  const html = read(file);
  const noComments = stripComments(html);
  const rel = path.relative(siteDir, file);
  const is404 = rel === "404.html";
  const route = routeFor(rel);

  const h1Count = (noComments.match(/<h1[\s>]/gi) || []).length;
  if (h1Count !== 1) fail(`${rel}: expected exactly one h1, found ${h1Count}`);

  const canonicals = [...noComments.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)].map((m) => m[0]);
  if (is404) {
    if (canonicals.length) fail(`${rel}: the 404 page must not have a canonical link`);
  } else {
    const expected = `${ORIGIN}${BASE}${route}`;
    const hrefs = canonicals.map((tag) => tag.match(/\bhref="([^"]*)"/)?.[1]);
    if (hrefs.length !== 1 || hrefs[0] !== expected) {
      fail(`${rel}: canonical must be exactly ${expected}, found ${JSON.stringify(hrefs)}`);
    }
  }

  const descriptions = [...noComments.matchAll(/<meta\s+name="description"\s+content="([^"]*)"/gi)].map((m) => m[1]);
  if (descriptions.length !== 1 || !descriptions[0].trim()) {
    fail(`${rel}: expected exactly one non-empty meta description`);
  } else {
    if (!/demo/i.test(descriptions[0])) fail(`${rel}: meta description must say it is a demo`);
    if (seenDescriptions.has(descriptions[0])) fail(`${rel}: meta description repeats ${seenDescriptions.get(descriptions[0])}`);
    seenDescriptions.set(descriptions[0], rel);
  }

  const title = noComments.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  if (!title) fail(`${rel}: missing title`);
  else {
    if (!/\(demo\)/i.test(title)) fail(`${rel}: title must say (demo): ${title}`);
    if (seenTitles.has(title)) fail(`${rel}: title repeats ${seenTitles.get(title)}`);
    seenTitles.set(title, rel);
  }

  if (title && title.length > 70) fail(`${rel}: title is ${title.length} characters; keep it near 60`);
  if (!is404 && descriptions[0] && (descriptions[0].length < 100 || descriptions[0].length > 170)) {
    fail(`${rel}: meta description is ${descriptions[0].length} characters; keep it near 150`);
  }

  const metaContent = (attr, name) =>
    [...noComments.matchAll(new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`, "gi"))].map((m) => m[1]);
  const socialIssue = (name, expected) => {
    const found = metaContent("property", name);
    if (found.length !== 1 || found[0] !== expected) {
      fail(`${rel}: ${name} must be exactly ${JSON.stringify(expected)}, found ${JSON.stringify(found)}`);
    }
  };
  if (is404) {
    if (/property="og:|name="twitter:/i.test(noComments)) fail(`${rel}: the 404 page carries no social tags`);
    if (/application\/ld\+json/i.test(noComments)) fail(`${rel}: the 404 page carries no JSON-LD`);
  } else {
    socialIssue("og:type", "website");
    socialIssue("og:locale", "en_US");
    socialIssue("og:title", title);
    socialIssue("og:description", descriptions[0]);
    socialIssue("og:url", `${ORIGIN}${BASE}${route}`);
    socialIssue("og:image", `${ORIGIN}${BASE}assets/img/og.png`);
    const card = metaContent("name", "twitter:card");
    if (card.length !== 1 || card[0] !== "summary_large_image") fail(`${rel}: twitter:card must be summary_large_image`);
  }
  const icon = noComments.match(/<link\b[^>]*\brel="icon"[^>]*\bhref="([^"]*)"/i)?.[1];
  if (!icon || !icon.startsWith(BASE) || !fs.existsSync(path.join(siteDir, icon.slice(BASE.length)))) {
    fail(`${rel}: favicon link must point at a built file under ${BASE}: ${icon}`);
  }

  if (/<base[\s>]/i.test(noComments)) fail(`${rel}: must not contain a base tag`);
  if (/\bhref\s*=\s*["']?\s*(tel|mailto|sms|callto):/i.test(html)) fail(`${rel}: must not use tel:, mailto:, sms:, or callto: links`);
  if (/realtor/i.test(html)) fail(`${rel}: must not contain the REALTOR word or mark`);
  if (/IDX feed is connected/i.test(html)) fail(`${rel}: forbidden IDX phrase`);
  if (/noindex/i.test(html)) fail(`${rel}: must not carry noindex`);

  for (const m of noComments.matchAll(/\b(?:href|src|action|poster|data-[\w-]+)\s*=\s*(["'])(.*?)\1/gi)) {
    const value = m[2].trim();
    if (value.startsWith("/")) checkRootRelative(rel, value);
  }
  for (const m of noComments.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gi)) {
    for (const candidate of m[2].split(",")) checkRootRelative(rel, candidate.trim().split(/\s+/)[0]);
  }
  for (const m of noComments.matchAll(/url\(\s*["']?([^)"']+)/gi)) {
    if (m[1].startsWith("/")) checkRootRelative(rel, m[1]);
  }

  // External links are the two TREC PDFs and nothing else. Canonical and Open Graph
  // URLs on the demo origin are the only other absolute URLs a page may carry.
  for (const m of noComments.matchAll(/<a\b[^>]*\bhref\s*=\s*"(https?:[^"]*)"/gi)) {
    if (!TREC_LINKS.has(m[1])) fail(`${rel}: external link is not an approved TREC PDF: ${m[1]}`);
  }
  for (const m of noComments.matchAll(/\b(?:src|action|poster)\s*=\s*"(https?:[^"]*)"/gi)) {
    fail(`${rel}: ${m[0].split("=")[0]} must not point at another host: ${m[1]}`);
  }
  if (/<(iframe|embed|object)[\s>]/i.test(noComments)) fail(`${rel}: must not embed external content`);

  for (const m of noComments.matchAll(/<form\b[^>]*>/gi)) {
    const tag = m[0];
    const action = tag.match(/\baction="([^"]*)"/i)?.[1];
    if (!action || !action.startsWith("#")) fail(`${rel}: form action must be a fragment like #contact-demo, found ${action}`);
    if (!/\bmethod="post"/i.test(tag)) fail(`${rel}: demo forms use method="post"`);
    if (!/\bdata-formspree-action=""/i.test(tag)) fail(`${rel}: form must carry data-formspree-action=""`);
    if (action && action.startsWith("#") && !new RegExp(`\\bid="${action.slice(1)}"`).test(noComments)) {
      fail(`${rel}: form action ${action} has no element with that id`);
    }
  }
  for (const m of html.matchAll(/formspree\.io(\S*)/gi)) {
    if (!m[1].includes("REPLACE_ME")) fail(`${rel}: formspree.io is only allowed as .../REPLACE_ME`);
  }
  if (/formspree\.io/i.test(noComments)) fail(`${rel}: formspree.io may only appear inside an HTML comment`);

  const text = visibleText(html);
  if (!text.includes(PLACEHOLDER)) fail(`${rel}: must include "${PLACEHOLDER}" in the footer contact block`);
  for (const label of ["Phone", "Email", "Office", "License"]) {
    for (const m of text.matchAll(new RegExp(`${label}:\\s*([^\\n]*)`, "g"))) {
      if (!m[1].trim().startsWith(PLACEHOLDER)) fail(`${rel}: ${label} must be "${PLACEHOLDER}", found "${m[1].trim()}"`);
    }
  }
  if (/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/.test(text)) fail(`${rel}: looks like a phone number in visible text`);
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(noComments)) fail(`${rel}: looks like an email address`);

  if (!is404 && !/type="application\/ld\+json"/i.test(noComments)) fail(`${rel}: missing JSON-LD`);

  for (const m of noComments.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (error) {
      fail(`${rel}: JSON-LD does not parse: ${error.message}`);
      continue;
    }
    const expectedKeys = route === "" ? ["@context", "@type", "areaServed", "name", "url"] : ["@context", "@type", "name", "url"];
    if (Object.keys(data).sort().join() !== expectedKeys.join()) {
      fail(`${rel}: JSON-LD keys must be ${expectedKeys.join(", ")}, found ${Object.keys(data).sort().join(", ")}`);
    }
    if (data.url !== `${ORIGIN}${BASE}`) fail(`${rel}: JSON-LD url must be ${ORIGIN}${BASE}`);
    if (data.name !== site.name) fail(`${rel}: JSON-LD name must match site.json`);
    if (route === "" && (data.areaServed || []).map((c) => c.name).join() !== "DeSoto,Cedar Hill,Duncanville,Lancaster,Red Oak,Midlothian") {
      fail(`${rel}: JSON-LD areaServed must list the six demo cities`);
    }
    const scan = (node) => {
      if (Array.isArray(node)) return node.forEach(scan);
      if (node && typeof node === "object") {
        for (const key of ["telephone", "email", "image", "address", "identifier", "aggregateRating", "review"]) {
          if (key in node) fail(`${rel}: JSON-LD must omit ${key}`);
        }
        Object.values(node).forEach(scan);
      }
    };
    scan(data);
  }
}

// ---- Built CSS, JS, and text files ------------------------------------------

for (const file of [...walk(siteDir, ".js"), ...walk(siteDir, ".css")]) {
  const content = read(file);
  const rel = path.relative(siteDir, file);
  for (const m of content.matchAll(/url\(\s*["']?([^)"']+)/gi)) {
    if (m[1].startsWith("/")) checkRootRelative(rel, m[1]);
    if (/^https?:/i.test(m[1])) fail(`${rel}: CSS must not load other hosts: ${m[1]}`);
  }
  if (/@import\s+(url\()?\s*["']?https?:/i.test(content)) fail(`${rel}: CSS must not import other hosts`);
  if (file.endsWith(".js")) {
    if (/\bfetch\s*\(/.test(content)) fail(`${rel}: must not use fetch(`);
    if (/XMLHttpRequest/.test(content)) fail(`${rel}: must not use XMLHttpRequest`);
    if (/sendBeacon/.test(content)) fail(`${rel}: must not use sendBeacon`);
    if (/WebSocket|EventSource/.test(content)) fail(`${rel}: must not open network connections`);
    if (/\.action\s*=[^=]/.test(content)) fail(`${rel}: must not assign form.action`);
    if (/formspree\.io/i.test(content) && !/formspree\.io\S*REPLACE_ME/i.test(content)) {
      fail(`${rel}: formspree.io only allowed as .../REPLACE_ME`);
    }
  }
}

for (const file of [...walk(siteDir, ".txt"), ...walk(siteDir, ".xml")]) {
  const content = read(file);
  const rel = path.relative(siteDir, file);
  for (const m of content.matchAll(/https?:\/\/[^\s<"']+/g)) {
    if (m[0].startsWith("http://www.sitemaps.org/")) continue;
    if (!m[0].startsWith(`${ORIGIN}${BASE}`)) fail(`${rel}: URL must start with ${ORIGIN}${BASE}: ${m[0]}`);
  }
}

// ---- Sitemap, robots, social image ------------------------------------------

const expectedRoutes = htmlFiles
  .map((f) => path.relative(siteDir, f))
  .filter((rel) => rel !== "404.html")
  .map((rel) => `${ORIGIN}${BASE}${routeFor(rel)}`)
  .sort();
const sitemapPath = path.join(siteDir, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) fail("sitemap.xml is missing");
else {
  const xml = read(sitemapPath);
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]).sort();
  if (locs.join("\n") !== expectedRoutes.join("\n")) {
    fail(`sitemap.xml: locations must be exactly the built pages except 404.html.\n    expected ${JSON.stringify(expectedRoutes)}\n    found    ${JSON.stringify(locs)}`);
  }
  const lastmods = [...xml.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)];
  if (lastmods.length !== locs.length) fail("sitemap.xml: every url needs a YYYY-MM-DD lastmod");
}
const robotsPath = path.join(siteDir, "robots.txt");
if (!fs.existsSync(robotsPath)) fail("robots.txt is missing");
else {
  const robots = read(robotsPath).trim().split(/\r?\n/).filter(Boolean);
  const expectedRobots = ["User-agent: *", "Allow: /", `Sitemap: ${ORIGIN}${BASE}sitemap.xml`];
  if (robots.join("\n") !== expectedRobots.join("\n")) fail(`robots.txt must be exactly: ${expectedRobots.join(" | ")}`);
}
const ogPath = path.join(siteDir, "assets", "img", "og.png");
if (!fs.existsSync(ogPath)) fail("assets/img/og.png is missing");
else {
  const png = fs.readFileSync(ogPath);
  const isPng = png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const [w, h] = isPng ? [png.readUInt32BE(16), png.readUInt32BE(20)] : [0, 0];
  if (!isPng || w !== 1200 || h !== 630) fail(`og.png must be a 1200x630 PNG, found ${isPng ? `${w}x${h}` : "not a PNG"}`);
  if (png.length < 10000) fail("og.png is suspiciously small; it should carry the name and the demo notice");
}

if (errors.length) {
  console.error("Guard failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Guard passed (${htmlFiles.length} pages).`);
