import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const startUrl = "http://127.0.0.1:8080/anthonylongrealty/";
const lycheeVersion = "0.18.1";
const lycheeBin = path.join(root, ".cache", "lychee");

function ensureLychee() {
  if (fs.existsSync(lycheeBin)) return lycheeBin;
  fs.mkdirSync(path.dirname(lycheeBin), { recursive: true });
  const tar = path.join(root, ".cache", "lychee.tar.gz");
  const url = `https://github.com/lycheeverse/lychee/releases/download/lychee-v${lycheeVersion}/lychee-x86_64-unknown-linux-gnu.tar.gz`;
  const dl = spawnSync("curl", ["-sfL", url, "-o", tar], { stdio: "inherit" });
  if (dl.status !== 0) process.exit(1);
  const extract = spawnSync("tar", ["-xzf", tar, "-C", path.dirname(lycheeBin)], { stdio: "inherit" });
  if (extract.status !== 0) process.exit(1);
  fs.chmodSync(lycheeBin, 0o755);
  return lycheeBin;
}

function waitForServer(maxMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const probe = spawnSync("curl", ["-sf", "-o", "/dev/null", startUrl], { encoding: "utf8" });
      if (probe.status === 0) return resolve();
      if (Date.now() - start > maxMs) return reject(new Error("Server did not start"));
      setTimeout(tick, 500);
    };
    tick();
  });
}

const lychee = ensureLychee();
const server = spawn("npx", ["@11ty/eleventy", "--serve", "--port=8080"], {
  cwd: root,
  stdio: "ignore",
  detached: true,
});

try {
  await waitForServer();
  let lastStatus = 1;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const run = spawnSync(
      lychee,
      [
        "--verbose",
        "--no-progress",
        "--max-retries",
        "5",
        "--retry-wait-time",
        "2",
        "--include-fragments",
        "--user-agent",
        "Mozilla/5.0 (compatible; anthonylongrealty-demo/1.0; +https://danielsimonjr.com/anthonylongrealty/)",
        "--exclude",
        "^https://danielsimonjr\\.com/",
        startUrl,
      ],
      { cwd: root, stdio: "inherit" },
    );
    lastStatus = run.status ?? 1;
    if (lastStatus === 0) break;
    if (attempt < 5) await new Promise((r) => setTimeout(r, 2000));
  }
  if (lastStatus !== 0) process.exit(lastStatus);
} finally {
  process.kill(-server.pid, "SIGTERM");
}
