import { z } from 'zod';
import { MCPClient } from "@mastra/mcp";

// Validate required SMITHERY_API env var
const smitheryApi = z.string().nonempty().parse(process.env.SMITHERY_API);


export const mcp = new MCPClient({
  servers: {
    filesystem: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\dm\\Documents\\AI-Mastra\\data",
      ],
    },
    winterm: {
        command: "npx",
        args: [
          "-y",
          "@smithery/cli@latest",
          "run",
          "@capecoma/winterm-mcp",
          "--key",
          smitheryApi,
        ],
    },
    duckduckgo: {       
        command: "npx",
        args: [
          "-y",
          "@smithery/cli@latest",
          "run",
          "@nickclyde/duckduckgo-mcp-server",
          "--key",
          smitheryApi,
        ],
      },
      jsSandbox: {
        command: "docker",
        args: [
          "run",
          "-i",
          "--rm",
          "-v",
          "/var/run/docker.sock:/var/run/docker.sock",
          "-v",
          "C:\\Users\\dm\\Documents\\node-code-sandbox-mcp\\workspace:/workspace",
          "--env-file",
          "C:\\Users\\dm\\Documents\\node-code-sandbox-mcp\\.env",
          "node-code-sandbox-mcp"
        ]
      },
      docker: {
        command: "docker",
        args:  ["run", "-i", "--rm", "alpine/socat", "STDIO", "TCP:host.docker.internal:8811"],
      },
  },
});