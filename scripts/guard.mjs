import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");
const srcData = path.join(root, "src", "_data");

function walk(dir, ext, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, ext, files);
    else if (!ext || full.endsWith(ext)) files.push(full);
  }
  return files;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

const errors = [];

function fail(msg) {
  errors.push(msg);
}

const htmlFiles = walk(siteDir, ".html");
if (!htmlFiles.some((f) => path.basename(f) === "404.html")) {
  fail("404.html is missing from _site");
}

for (const file of htmlFiles) {
  const html = read(file);
  const rel = path.relative(siteDir, file);

  if (path.basename(file) !== "404.html") {
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1Count !== 1) fail(`${rel}: expected exactly one h1, found ${h1Count}`);
    if (!html.includes('rel="canonical"')) fail(`${rel}: missing canonical link`);
    if (!html.includes("https://danielsimonjr.com/anthonylongrealty/")) {
      fail(`${rel}: canonical must use demo origin and base path`);
    }
    if (!html.match(/<meta\s+name="description"/i)) fail(`${rel}: missing meta description`);
  }

  if (html.includes("<base")) fail(`${rel}: must not contain a base tag`);
  if (/href="tel:/i.test(html)) fail(`${rel}: must not use tel: links`);
  if (/href="mailto:/i.test(html)) fail(`${rel}: must not use mailto: links`);
  if (/REALTOR/i.test(html)) fail(`${rel}: must not contain REALTOR mark`);
  if (/IDX feed is connected/i.test(html)) fail(`${rel}: forbidden IDX phrase`);

  const rootRefs = [
    ...html.matchAll(/\b(?:href|src)="(\/[^"]*)"/gi),
    ...html.matchAll(/url\(\s*(\/[^)]+)\)/gi),
  ];
  for (const m of rootRefs) {
    const ref = m[1];
    if (!ref.startsWith("/anthonylongrealty/") && ref !== "/anthonylongrealty/") {
      fail(`${rel}: root-relative URL must start with /anthonylongrealty/: ${ref}`);
    }
  }

  if (/action="https?:\/\//i.test(html)) fail(`${rel}: form action must not start with http`);
  if (/formspree\.io/i.test(html) && !/REPLACE_ME/.test(html)) {
    fail(`${rel}: formspree.io only allowed with REPLACE_ME`);
  }
}

const cssJs = [...walk(siteDir, ".js"), ...walk(siteDir, ".css")];
for (const file of cssJs) {
  const content = read(file);
  const rel = path.relative(siteDir, file);
  for (const m of content.matchAll(/url\(\s*(\/[^)]+)\)/gi)) {
    const ref = m[1];
    if (!ref.startsWith("/anthonylongrealty/")) {
      fail(`${rel}: CSS url must start with /anthonylongrealty/: ${ref}`);
    }
  }
  if (file.endsWith(".js")) {
    if (/fetch\s*\(/i.test(content)) fail(`${rel}: must not use fetch(`);
    if (/XMLHttpRequest/i.test(content)) fail(`${rel}: must not use XMLHttpRequest`);
    if (/sendBeacon/i.test(content)) fail(`${rel}: must not use sendBeacon`);
  }
}

for (const file of walk(siteDir, ".html")) {
  const html = read(file);
  if (!html.includes("Placeholder — not on file")) {
    fail(`${path.relative(siteDir, file)}: must include placeholder contact text`);
  }
}

const listingsPath = path.join(srcData, "listings.json");
if (fs.existsSync(listingsPath)) {
  const listings = JSON.parse(read(listingsPath));
  const text = JSON.stringify(listings);
  if (/\d+\s+[A-Za-z]/.test(text) && /address/i.test(text)) {
    const streetNum = listings.items?.some((item) => /\d/.test(String(item.address || "")));
    if (streetNum) fail("listings.json: sample listing must not contain a street number");
  }
  for (const item of listings.items || []) {
    if (item.address && /\d/.test(String(item.address))) {
      fail(`listings.json: street number in address: ${item.address}`);
    }
  }
}

if (errors.length) {
  console.error("Guard failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("Guard passed.");
