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

const lycheeVersion = "0.18.1";
const lycheeAssets = {
  "linux-x64": {
    file: "lychee-x86_64-unknown-linux-gnu.tar.gz",
    sha256: "0d48569e2dc11c1917fa98321dfd7aa675fba03b79f41e8e74afa3223e30d379",
  },
  "linux-arm64": {
    file: "lychee-aarch64-unknown-linux-gnu.tar.gz",
    sha256: "225908398609a7b552a20ecd67b6e88d1f4899ada51c3122d457d1740c70fe44",
  },
};

function onPath(name) {
  const probe = spawnSync(name, ["--version"], { stdio: "ignore" });
  return probe.status === 0;
}

function ensureLychee() {
  if (process.env.LYCHEE_BIN) return process.env.LYCHEE_BIN;
  if (onPath("lychee")) return "lychee";

  const asset = lycheeAssets[`${process.platform}-${process.arch}`];
  if (!asset) {
    console.error(`No pinned lychee build for ${process.platform}-${process.arch}. Install lychee or set LYCHEE_BIN.`);
    process.exit(1);
  }
  const cacheDir = path.join(root, ".cache");
  const bin = path.join(cacheDir, `lychee-${lycheeVersion}`);
  if (fs.existsSync(bin)) return bin;

  fs.mkdirSync(cacheDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lychee-"));
  const tar = path.join(tmp, asset.file);
  const url = `https://github.com/lycheeverse/lychee/releases/download/lychee-v${lycheeVersion}/${asset.file}`;
  const dl = spawnSync("curl", ["-sfL", "--retry", "3", url, "-o", tar], { stdio: "inherit" });
  if (dl.status !== 0) {
    console.error(`Could not download ${url}`);
    process.exit(1);
  }
  const digest = crypto.createHash("sha256").update(fs.readFileSync(tar)).digest("hex");
  if (digest !== asset.sha256) {
    console.error(`Checksum mismatch for ${asset.file}: expected ${asset.sha256}, got ${digest}`);
    process.exit(1);
  }
  const extract = spawnSync("tar", ["-xzf", tar, "-C", tmp], { stdio: "inherit" });
  if (extract.status !== 0) process.exit(1);
  fs.copyFileSync(path.join(tmp, "lychee"), bin);
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

let status = 1;
try {
  await waitForServer();
  console.log(`Checking ${routes.length} routes:\n  ${routes.join("\n  ")}`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const run = spawnSync(
      lychee,
      [
        "--no-progress",
        "--max-retries",
        "5",
        "--retry-wait-time",
        "2",
        "--timeout",
        "30",
        "--include-fragments",
        "--user-agent",
        // TREC returns 403 to bare script user agents.
        `Mozilla/5.0 (compatible; anthonylongrealty-demo/1.0; +${site.demoOrigin}${site.basePath})`,
        // The demo origin is not live until Pages is on, so its own URLs cannot be fetched yet.
        "--exclude",
        `^${site.demoOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`,
        ...routes,
      ],
      { cwd: root, stdio: "inherit" },
    );
    status = run.status ?? 1;
    if (status === 0) break;
    if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
  }
} catch (error) {
  console.error(String(error.message || error));
  if (serverLog) console.error(serverLog);
} finally {
  stopServer();
}
process.exit(status);
