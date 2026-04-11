const { existsSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const buildDirs = [".next", ".dist"].map((dir) => join(process.cwd(), dir));

function removeWithFs(targetDir) {
  rmSync(targetDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  });
}

for (const targetDir of buildDirs) {
  if (!existsSync(targetDir)) {
    continue;
  }

  if (process.platform === "win32") {
    const literalPath = targetDir.replace(/'/g, "''");
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

    if (result.status === 0 || !existsSync(targetDir)) {
      continue;
    }
  }

  removeWithFs(targetDir);
}
