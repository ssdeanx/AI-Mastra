import { stockAgent } from './agents/stockAgent';
import { supervisorAgent } from './agents/supervisorAgent';
import { masterAgent } from './agents/masterAgent';
import { workerAgent } from './agents/workerAgent';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
//import { serve as inngestServe } from "@mastra/inngest";
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { mcpAgent } from './agents/mcpAgent';
//import { inngest } from "./inngest";

import { LibSQLStore, LibSQLVector } from '@mastra/libsql';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, mcpAgent, stockAgent, supervisorAgent, masterAgent, workerAgent },
  // Conversational memory  // Persistent evals/telemetry storage
  storage: new LibSQLStore({ url: process.env.DATABASE_URL || 'file:./mastra.db', authToken: process.env.DATABASE_AUTH_TOKEN || '' }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
//  server: {
    // The server configuration is required to allow local docker container can connect to the mastra server
//    host: "0.0.0.0",
//    apiRoutes: [
      // This API route is used to register the Mastra workflow (inngest function) on the inngest server
//      {
//        path: "/api/inngest",
//        method: "ALL",
//        createHandler: async ({ mastra }) => inngestServe({ mastra, inngest }),
        // The inngestServe function integrates Mastra workflows with Inngest by:
        // 1. Creating Inngest functions for each workflow with unique IDs (workflow.${workflowId})
        // 2. Setting up event handlers that:
        //    - Generate unique run IDs for each workflow execution
        //    - Create an InngestExecutionEngine to manage step execution
        //    - Handle workflow state persistence and real-time updates
        // 3. Establishing a publish-subscribe system for real-time monitoring
        //    through the workflow:${workflowId}:${runId} channel
//      },
//    ]
//  }
});