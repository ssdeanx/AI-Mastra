
import { Agent } from '@mastra/core/agent';
import { mcp } from "../tools/mcp";
import { agentMemory } from '../agentMemory';
import { PinoLogger } from '@mastra/loggers';
import { vectorQueryTool } from '../tools/vectorQueryTool';
import { createTracedGoogleModel } from '../observability';
import { graphTool } from '../tools/graphRAGTool';
const logger = new PinoLogger({
    name: 'Mastra',
    level: 'info',

  })
// Initialize the Mastra logger
logger.info('Mastra mcpAgent initialized');


/**
 * MCP Agent instance for handling Model Context Protocol interactions
 */
export const mcpAgent: Agent = new Agent({
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
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'mcp-agent-model',
    tags: ['agent', 'mcp', 'protocol-interactions']
  }),
  tools: {
    vectorQueryTool,  
    graphTool,
    ...(await mcp.getTools())
  },
  memory: agentMemory,
});