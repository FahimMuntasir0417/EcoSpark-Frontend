const { existsSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const distDir = join(process.cwd(), ".dist");

if (!existsSync(distDir)) {
  process.exit(0);
}

function removeWithFs() {
  rmSync(distDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  });
}

if (process.platform === "win32") {
  const literalPath = distDir.replace(/'/g, "''");
  const cleanupCommand = [
    `$target = '${literalPath}'`,
    "if (Test-Path -LiteralPath $target) {",
    "  Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop",
    "}",
  ].join("; ");

  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-Command", cleanupCommand],
    { stdio: "inherit" },
  );

  if (result.status === 0 || !existsSync(distDir)) {
    process.exit(0);
  }
}

removeWithFs();
