
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { mcpAgent } from './agents/mcpAgent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, mcpAgent },
  // You can add more agents and workflows here as needed
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    // Use ':memory:' for in-memory storage, or 'file:../mastra.db' for persistent storage
    url: ":memory:",

  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
