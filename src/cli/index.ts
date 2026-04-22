#!/usr/bin/env node

import { runInit } from "./commands/init.js";
import { runWatch } from "./commands/watch.js";
import { runMcpServer } from "../mcp/server.js";

function printHelp(): void {
  process.stdout.write(`figural\n\nUsage:\n  figural init\n  figural mcp\n  figural watch\n`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
    printHelp();
    process.exit(0);
  }

  if (cmd === "init") {
    await runInit({ cwd: process.cwd() });
    return;
  }

  if (cmd === "mcp") {
    await runMcpServer({ cwd: process.cwd() });
    return;
  }

  if (cmd === "watch") {
    await runWatch({ cwd: process.cwd() });
    return;
  }

  process.stderr.write(`Unknown command: ${cmd}\n\n`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});

