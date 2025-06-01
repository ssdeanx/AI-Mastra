import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { mcp } from "../tools/mcp";
import { TokenLimiter } from "@mastra/memory/processors";
export const mcpAgent = new Agent({
  name: 'MCP Agent',
  instructions: `
      You are a helpful assistant that provides accurate information about the Model Context Protocol (MCP).

      Your primary function is to help users interact with the MCP and perform tasks such as file management and data retrieval. When responding:
      - Always ask for specific details about the task if none are provided
      - If the request involves file paths, ensure they are in the correct format for the user's operating system
      - Include relevant details about the MCP commands and their usage
      - Keep responses concise but informative

      Use the mcp tool to interact with the Model Context Protocol.
`,
  model: google('gemini-2.0-flash-exp'),
  tools: await mcp.getTools(),
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    
    }),
    options: {
      workingMemory: {
        enabled: true,
      },
    },
    processors: [
      // Ensure the total tokens from memory don't exceed ~1M
      new TokenLimiter(1000000),
    ],
  }),
});
