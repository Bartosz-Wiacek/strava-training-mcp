import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { ZodError } from "zod";

import { StravaClient, stravaEnvSchema } from "./strava.js";
import { registerStravaTools } from "./tools.js";

config();

function formatEnvError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

async function main(): Promise<void> {
  const parsedEnv = stravaEnvSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    throw new Error(`Invalid environment configuration: ${formatEnvError(parsedEnv.error)}`);
  }

  const client = new StravaClient(parsedEnv.data);
  const server = new McpServer(
    {
      name: "strava-training-mcp",
      version: "0.1.0",
    },
    {
      instructions:
        "Use these tools for private Strava training analysis. Prefer weekly summaries for trend analysis and activity details or streams for workout inspection.",
    },
  );

  registerStravaTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Strava Training MCP server running on stdio");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Server startup failed: ${message}`);
  process.exit(1);
});
