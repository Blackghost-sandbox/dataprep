import { accessSync, constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const supportedTools = new Set(["opennextjs-cloudflare", "wrangler"]);
const requestedTools = process.argv.slice(2);

if (requestedTools.length === 0) {
  throw new Error("Specify at least one Cloudflare executable to check.");
}

for (const tool of requestedTools) {
  if (!supportedTools.has(tool)) {
    throw new Error(`Unknown Cloudflare executable: ${tool}`);
  }
}

if (process.platform === "win32" && process.arch === "arm64") {
  console.error(
    [
      "Cloudflare tooling is unavailable on native Windows ARM64.",
      "The Cloudflare workerd runtime does not provide a native Windows ARM64 binary.",
      "Run Cloudflare build/deploy commands on Linux, macOS, Windows x64, or with x64 Node under Windows emulation.",
      "Normal Next.js development remains available through npm run dev.",
    ].join("\n"),
  );
  process.exit(69);
}

const missingTools = requestedTools.filter((tool) => {
  const executable = path.join(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${tool}.cmd` : tool,
  );

  try {
    accessSync(
      executable,
      process.platform === "win32" ? constants.F_OK : constants.X_OK,
    );
    return false;
  } catch {
    return true;
  }
});

if (missingTools.length > 0) {
  console.error(
    [
      `Cloudflare tooling is unavailable: ${missingTools.join(", ")}.`,
      `Current platform: ${process.platform}-${process.arch}.`,
      "Install optional dependencies on a platform supported by Cloudflare workerd.",
      "Normal Next.js development remains available through npm run dev.",
    ].join("\n"),
  );
  process.exit(69);
}
