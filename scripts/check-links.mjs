import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");
const site = JSON.parse(fs.readFileSync(path.join(root, "src", "_data", "site.json"), "utf8"));

const port = 8080;
const serveOrigin = `http://127.0.0.1:${port}`;
const startUrl = `${serveOrigin}${site.basePath}`;

// 0.18.x accepts --include-fragments but never reports a missing fragment on a
// trailing-slash URL, so the pin has to stay on a release that does.
const lycheeVersion = "0.24.2";
const lycheeAssets = {
  "linux-x64": {
    target: "x86_64-unknown-linux-gnu",
    sha256: "1f4e0ef7f6554a6ed33dd7ac144fb2e1bbed98598e7af973042fc5cd43951c9a",
  },
  "linux-arm64": {
    target: "aarch64-unknown-linux-gnu",
    sha256: "91a7bd65685da41b90ccb9bc867a3d649a7818042dae04ff405e55a25bddee4c",
  },
  "darwin-arm64": {
    target: "aarch64-apple-darwin",
    sha256: "c9d3740ea2d891854d37116c9fba840f37b6e7c89d330e7db84ac333631c4977",
  },
  "darwin-x64": {
    target: "x86_64-apple-darwin",
    sha256: "887503a9cff667d322b8d0892b40bf49976eb9507af8483220a3706cdad55978",
  },
};

function ensureLychee() {
  if (process.env.LYCHEE_BIN) return process.env.LYCHEE_BIN;

  const asset = lycheeAssets[`${process.platform}-${process.arch}`];
  if (!asset) {
    console.error(`No pinned lychee build for ${process.platform}-${process.arch}. Set LYCHEE_BIN to a lychee 0.24 or newer binary.`);
    process.exit(1);
  }
  const cacheDir = path.join(root, ".cache");
  const bin = path.join(cacheDir, `lychee-${lycheeVersion}`);
  if (fs.existsSync(bin)) return bin;

  fs.mkdirSync(cacheDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lychee-"));
  const file = `lychee-${asset.target}.tar.gz`;
  const tar = path.join(tmp, file);
  const url = `https://github.com/lycheeverse/lychee/releases/download/lychee-v${lycheeVersion}/${file}`;
  const dl = spawnSync("curl", ["-sfL", "--retry", "3", url, "-o", tar], { stdio: "inherit" });
  if (dl.status !== 0) {
    console.error(`Could not download ${url}`);
    process.exit(1);
  }
  const digest = crypto.createHash("sha256").update(fs.readFileSync(tar)).digest("hex");
  if (digest !== asset.sha256) {
    console.error(`Checksum mismatch for ${file}: expected ${asset.sha256}, got ${digest}`);
    process.exit(1);
  }
  const extract = spawnSync("tar", ["-xzf", tar, "-C", tmp], { stdio: "inherit" });
  if (extract.status !== 0) process.exit(1);
  fs.copyFileSync(path.join(tmp, `lychee-${asset.target}`, "lychee"), bin);
  fs.chmodSync(bin, 0o755);
  fs.rmSync(tmp, { recursive: true, force: true });
  return bin;
}

// Lychee reads the links on each page it is given and does not follow them, so every
// built route is passed in. Anything linked only from a page we skip would go unchecked.
function builtRoutes() {
  if (!fs.existsSync(siteDir)) {
    console.error("_site is missing. Run `npm run build` first.");
    process.exit(1);
  }
  const urls = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".html")) {
        const rel = path.relative(siteDir, full).split(path.sep).join("/");
        const route = rel === "index.html" ? "" : rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel;
        urls.push(`${startUrl}${route}`);
      }
    }
  };
  walk(siteDir);
  return urls.sort();
}

async function serverResponds() {
  try {
    const res = await fetch(startUrl, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await serverResponds()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Eleventy did not answer at ${startUrl} within ${maxMs / 1000}s`);
}

const lychee = ensureLychee();
const routes = builtRoutes();

if (await serverResponds()) {
  console.error(`Something is already serving ${startUrl}. Stop it, then run the link check again.`);
  process.exit(1);
}

let serverLog = "";
const server = spawn("npx", ["@11ty/eleventy", "--serve", `--port=${port}`, "--quiet"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

function stopServer() {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // already gone
  }
}
process.on("SIGINT", () => {
  stopServer();
  process.exit(130);
});

function runLychee(args) {
  return spawnSync(lychee, ["--no-progress", "--timeout", "30", "--include-fragments", ...args], {
    cwd: root,
    stdio: "inherit",
  }).status ?? 1;
}

// Every external URL the built pages point at, once each. TREC answers the same URL with 200
// and then 403 a few seconds later, so each URL gets its own spaced retries instead of being
// requested once per page that links to it.
function externalLinks() {
  const found = new Set();
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".html")) {
        for (const m of fs.readFileSync(full, "utf8").matchAll(/\b(?:href|src)="(https?:\/\/[^"]+)"/g)) {
          if (!m[1].startsWith(site.demoOrigin)) found.add(m[1]);
        }
      }
    }
  };
  walk(siteDir);
  return [...found].sort();
}

let status = 1;
try {
  await waitForServer();

  console.log(`Checking ${routes.length} routes on ${serveOrigin}:\n  ${routes.join("\n  ")}`);
  // Only http: the local server. https links are checked one at a time below.
  status = runLychee(["--scheme", "http", ...routes]);

  const external = externalLinks();
  console.log(`\nChecking ${external.length} external links:\n  ${external.join("\n  ")}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "links-"));
  for (const url of external) {
    const list = path.join(tmp, "url.txt");
    fs.writeFileSync(list, `${url}\n`);
    let externalStatus = 1;
    for (let attempt = 1; attempt <= 5 && externalStatus !== 0; attempt++) {
      if (attempt > 1) await new Promise((r) => setTimeout(r, 4000 * attempt));
      externalStatus = runLychee([
        "--max-retries",
        "3",
        "--retry-wait-time",
        "2",
        "--user-agent",
        // TREC returns 403 to bare script user agents.
        `Mozilla/5.0 (compatible; anthonylongrealty-demo/1.0; +${site.demoOrigin}${site.basePath})`,
        list,
      ]);
    }
    if (externalStatus !== 0) status = externalStatus;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
} catch (error) {
  console.error(String(error.message || error));
  if (serverLog) console.error(serverLog);
} finally {
  stopServer();
}
process.exit(status);
