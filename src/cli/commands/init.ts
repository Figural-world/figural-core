import path from "node:path";
import { ensureDir, writeJsonFileIfMissing } from "../../core/files.js";
import { getEmptyLog, getSpecpackTemplate } from "../../core/templates.js";

export async function runInit(opts: { cwd: string }): Promise<void> {
  const repoRoot = opts.cwd;

  const figuralDir = path.join(repoRoot, ".figural");
  const logPath = path.join(figuralDir, "log.json");
  const specPath = path.join(repoRoot, ".specpack.json");

  await ensureDir(figuralDir);

  await writeJsonFileIfMissing(logPath, getEmptyLog());
  await writeJsonFileIfMissing(specPath, getSpecpackTemplate());

  const claudeLines = [
    "Before you act, read the current spec pack.",
    "After you make a significant decision, call figural_log_decision.",
    "When you detect a contradiction with a prior decision, flag it."
  ];

  const cursorMcpConfig = {
    mcpServers: {
      figural: {
        command: "npx",
        args: ["-y", "figural-core", "mcp"]
      }
    }
  };

  const claudeCodeMcpConfig = {
    mcpServers: {
      figural: {
        command: "npx",
        args: ["-y", "figural-core", "mcp"]
      }
    }
  };

  process.stdout.write(
    [
      "",
      "Created:",
      `- ${path.relative(repoRoot, logPath)}`,
      `- ${path.relative(repoRoot, specPath)}`,
      "",
      "Paste these lines into CLAUDE.md:",
      ...claudeLines.map((l) => `- ${l}`),
      "",
      "Cursor MCP config JSON:",
      JSON.stringify(cursorMcpConfig, null, 2),
      "",
      "Claude Code MCP config JSON:",
      JSON.stringify(claudeCodeMcpConfig, null, 2),
      ""
    ].join("\n")
  );
}

