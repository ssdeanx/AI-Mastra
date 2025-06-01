import { Agent } from '@mastra/core/agent';
import { stockPriceTool } from '../tools/stock-tools';
import { agentMemory } from '../agentMemory';
import { vectorQueryTool } from '../tools/vectorQueryTool';
import { createTracedGoogleModel } from '../observability';
export const stockAgent = new Agent({
  name: 'Stock Agent',
  instructions: `
      You are a helpful stock assistant that provides accurate stock information.

      Your primary function is to help users get stock details for specific companies. When responding:
      - Always ask for a company name if none is provided
      - If the company name isn't in English, please translate it
      - If giving a company with multiple parts (e.g. "Apple Inc."), use the most relevant part (e.g. "Apple")
      - Include relevant details like stock price, market cap, and P/E ratio
      - Keep responses concise but informative

      Use the stockTool to fetch current stock data.
`,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'stock-agent-model',
    tags: ['agent', 'stock', 'financial-data']
  }),
  tools: { stockPriceTool, vectorQueryTool },
  memory: agentMemory
});