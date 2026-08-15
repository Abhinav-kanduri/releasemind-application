import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

const port = 3000;
const devDistDirName = ".next-dev";

function assertPortAvailable() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(port, () => server.close(resolve));
  });
}

try {
  await assertPortAvailable();
} catch (error) {
  if (error?.code === "EADDRINUSE") {
    console.error(
      `\nPort ${port} is already in use. ReleaseMind may already be running.`,
    );
    console.error(
      "Stop the existing server with Ctrl+C before starting another one.\n",
    );
    process.exit(1);
  }
  throw error;
}

const projectRoot = path.resolve(process.cwd());
const devDistDir = path.resolve(projectRoot, devDistDirName);
if (path.dirname(devDistDir) !== projectRoot) {
  throw new Error("Refusing to clean a development cache outside the project.");
}
await rm(devDistDir, {
  recursive: true,
  force: true,
  maxRetries: 5,
  retryDelay: 100,
});

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, "dev", "-p", String(port)], {
  stdio: "inherit",
  env: {
    ...process.env,
    RELEASEMIND_NEXT_DIST_DIR: devDistDirName,
  },
});

child.once("error", (error) => {
  console.error("Failed to start Next.js:", error.message);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
