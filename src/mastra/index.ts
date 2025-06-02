import { agentEvaluationWorkflow } from './workflows/inngest/agent-evaluation-workflow';
import { Inngest } from 'inngest';
import { stockAgent } from './agents/stockAgent';
import { supervisorAgent } from './agents/supervisorAgent';
import { masterAgent } from './agents/masterAgent';
import { workerAgent } from './agents/workerAgent';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { weatherWorkflow } from './workflows/weather-workflow';
import { taskOrchestrationWorkflow } from './workflows/multi-agent-workflow';
import { researchAnalysisWorkflow } from './workflows/research-analysis-workflow';
import { contentCreationWorkflow } from './workflows/content-creation-workflow';
import { dataProcessingWorkflow } from './workflows/data-processing-workflow';
import { ragKnowledgeWorkflow } from './workflows/rag-knowledge-workflow';
import { evaluationTestingWorkflow } from './workflows/evaluation-testing-workflow';
import { intelligentCoordinationWorkflow } from './workflows/inngest/intelligent-coordination-workflow';
import { agentTrainingWorkflow } from './workflows/inngest/agent-training-workflow';
import { agentDeploymentWorkflow } from './workflows/inngest/agent-deployment-workflow';
import { agentMonitoringWorkflow } from './workflows/inngest/agent-monitoring-workflow';
import { weatherAgent } from './agents/weather-agent';
import { mcpAgent } from './agents/mcpAgent';
import { ragAgent } from './agents/ragAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { dataManagerAgent } from './agents/dataManagerAgent';
import { agentStorage, agentVector } from './agentMemory';
// Import Inngest for workflow management
import { inngest } from './inngest/index';
import { serve as inngestServe } from "@mastra/inngest";
// Import agent networks
import {
  researchNetwork,
  dataProcessingNetwork,
  contentCreationNetwork,
  technicalOpsNetwork,
  comprehensiveNetwork
} from './networks/agentNetwork';

import { 
  createTelemetryConfig,
  EnhancedAISDKExporter
} from './observability';

/**
 * Main Mastra instance with integrated multi-agent workflows and observability
 * 
 * @remarks
 * - Configured with 7 production-ready workflows for different AI use cases
 * - Includes RAG Agent for knowledge retrieval and semantic search
 * - Features 5 specialized agent networks for intelligent task routing
 * - Uses shared storage from agentMemory for consistency
 * - Integrated LangSmith tracing for comprehensive observability
 * - All agents use traced Google AI models for monitoring
 * 
 * @see {@link https://github.com/mastra-ai/mastra} - Mastra documentation
 * 
 * Generated on 2025-06-01
 */
export const mastra = new Mastra({
  workflows: { 
    weatherWorkflow, 
    taskOrchestrationWorkflow,
    researchAnalysisWorkflow,
    contentCreationWorkflow,
    dataProcessingWorkflow,
    ragKnowledgeWorkflow,
    evaluationTestingWorkflow,
    intelligentCoordinationWorkflow,
    agentTrainingWorkflow,
    agentDeploymentWorkflow,
    agentMonitoringWorkflow,
    agentEvaluationWorkflow
  },
  agents: { weatherAgent, mcpAgent, stockAgent, supervisorAgent, masterAgent, workerAgent, ragAgent, evaluationAgent, dataManagerAgent },
  networks: {
    researchNetwork: researchNetwork(),
    dataProcessingNetwork: dataProcessingNetwork(),
    contentCreationNetwork: contentCreationNetwork(),
    technicalOpsNetwork: technicalOpsNetwork(),
    comprehensiveNetwork: comprehensiveNetwork()
  },
  storage: agentStorage,
  vectors: { default: agentVector },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  server: {
    // The server configuration is required to allow local docker container can connect to the mastra server
    host: "0.0.0.0",
    apiRoutes: [
      // This API route is used to register the Mastra workflow (inngest function) on the inngest server
      {
        path: "/api/inngest",
        method: "ALL",
        createHandler: async ({ mastra }) => inngestServe({ mastra, inngest }),
        // The inngestServe function integrates Mastra workflows with Inngest by:
        // 1. Creating Inngest functions for each workflow with unique IDs (workflow.${workflowId})
        // 2. Setting up event handlers that:
        //    - Generate unique run IDs for each workflow execution
        //    - Create an InngestExecutionEngine to manage step execution
        //    - Handle workflow state persistence and real-time updates
        // 3. Establishing a publish-subscribe system for real-time monitoring
        //    through the workflow:${workflowId}:${runId} channel
      },
    ],
  },
  telemetry: createTelemetryConfig({
    serviceName: "pr-warmhearted-jewellery-74",
    enabled: true,
    sampling: {
      type: 'ratio',
      probability: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    },
    export: {
      type: "custom",
      exporter: new EnhancedAISDKExporter(),
    }
  }),
});


