import { MCPClient } from "@mastra/mcp";

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
  },
});