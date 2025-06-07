import { contextualRecallMetric } from './../evals/index';
import { Agent } from '@mastra/core/agent';
import { mcp } from "../tools/mcp";
import { agentMemory } from '../agentMemory';
import { PinoLogger } from '@mastra/loggers';
import { vectorQueryTool } from '../tools/vectorQueryTool';
import { createTracedGoogleModel } from '../observability';

const logger = new PinoLogger({
    name: 'Mastra',
    level: 'info',

  })
// Initialize the Mastra logger
logger.info('Mastra supervisorAgent initialized');


/**
 * Supervisor Agent instance for handling user interactions
 */
export const supervisorAgent: Agent = new Agent({
  name: 'Supervisor Agent',
  instructions: `
      You are a helpful assistant that provides accurate information about the Model Context Protocol (MCP).

      Your primary function is to help users interact with the MCP and perform tasks such as file management and data retrieval. When responding:
      - Always ask for specific details about the task if none are provided
      - If the request involves file paths, ensure they are in the correct format for the user's operating system
      - Include relevant details about the MCP commands and their usage
      - Keep responses concise but informative

      Use the mcp tool to interact with the Model Context Protocol.
`,
  model: createTracedGoogleModel('gemini-2.5-flash-preview-05-20', {
    name: 'supervisor-agent-model',
    tags: ['agent', 'supervisor', 'MCP'],
    thinkingConfig: { thinkingBudget: 2048 },
    
    maxTokens: 64000,
    temperature: 0.7,
  }),
  tools: {
    vectorQueryTool,
    ...(await mcp.getTools())
  },
  
  memory: agentMemory,
});