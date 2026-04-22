import path from "node:path";
import { createInterface } from "node:readline";
import { z } from "zod";

import { readJsonFile, writeJsonFile } from "../core/files.js";
import { appendDecision } from "./tools/logDecision.js";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
};

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: string | number | null; result: unknown }
  | { jsonrpc: "2.0"; id: string | number | null; error: { code: number; message: string; data?: unknown } };

function respond(res: JsonRpcResponse): void {
  process.stdout.write(JSON.stringify(res) + "\n");
}

function errorResponse(id: JsonRpcRequest["id"], message: string, data?: unknown): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code: -32000, message, data }
  };
}

function okResponse(id: JsonRpcRequest["id"], result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

const ToolCallParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.any()).optional()
});

export async function runMcpServer(opts: { cwd: string }): Promise<void> {
  const repoRoot = opts.cwd;
  const specPath = path.join(repoRoot, ".specpack.json");
  const logPath = path.join(repoRoot, ".figural", "log.json");

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

  let chain = Promise.resolve();

  rl.on("line", (line: string) => {
    chain = chain.then(() => handleLine(line)).catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      respond(errorResponse(null, msg));
    });
  });

  async function handleLine(line: string): Promise<void> {
    if (!line.trim()) return;

    let req: JsonRpcRequest;
    try {
      req = JSON.parse(line) as JsonRpcRequest;
    } catch {
      respond(errorResponse(null, "Invalid JSON", { line }));
      return;
    }

    // Minimal MCP-ish JSON-RPC surface:
    // - initialize
    // - tools/list
    // - tools/call
    if (req.method === "initialize") {
      respond(
        okResponse(req.id, {
          protocolVersion: "0.1",
          serverInfo: { name: "figural-core", version: "0.1.0" },
          capabilities: { tools: {} }
        })
      );
      return;
    }

    if (req.method === "tools/list") {
      respond(
        okResponse(req.id, {
          tools: [
            {
              name: "figural_get_spec",
              description: "Read the current .specpack.json from the repo.",
              inputSchema: { type: "object", properties: {}, additionalProperties: false }
            },
            {
              name: "figural_log_decision",
              description: "Append a decision to .figural/log.json with basic same-domain conflict marking.",
              inputSchema: {
                type: "object",
                properties: {
                  decision: { type: "string" },
                  rationale: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  domain: { type: "string" },
                  source: { type: "string", enum: ["human", "agent", "extension"] },
                  evidence_refs: { type: "array", items: { type: "string" } },
                  context: { type: "object" }
                },
                required: ["decision", "rationale", "confidence", "domain"],
                additionalProperties: true
              }
            }
          ]
        })
      );
      return;
    }

    if (req.method === "tools/call") {
      const parsed = ToolCallParamsSchema.safeParse(req.params ?? {});
      if (!parsed.success) {
        respond(errorResponse(req.id, "Invalid tools/call params", parsed.error.flatten()));
        return;
      }

      const { name, arguments: args } = parsed.data;

      if (name === "figural_get_spec") {
        const spec = await readJsonFile<Record<string, unknown>>(specPath);
        respond(okResponse(req.id, { content: [{ type: "text", text: JSON.stringify(spec, null, 2) }] }));
        return;
      }

      if (name === "figural_log_decision") {
        const result = await appendDecision({
          logPath,
          input: args ?? {}
        });
        await writeJsonFile(logPath, result.updatedLog);
        respond(
          okResponse(req.id, {
            content: [{ type: "text", text: String(result.entry.id) }],
            data: { entry: result.entry }
          })
        );
        return;
      }

      respond(errorResponse(req.id, `Unknown tool: ${name}`));
      return;
    }

    respond(errorResponse(req.id, `Unknown method: ${req.method}`));
  }
}

