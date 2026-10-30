import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, files);
    else if (/\.(html?|css|svg)$/i.test(name)) files.push(full);
  }
  return files;
}

const targets = walk(siteDir);
const vnuJar = path.join(root, "node_modules", "vnu-jar", "build", "dist", "vnu.jar");
const result = spawnSync(
  "java",
  ["-jar", vnuJar, "--also-check-css", "--also-check-svg", ...targets],
  { stdio: "inherit", cwd: root },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
