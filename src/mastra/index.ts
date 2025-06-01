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
import { weatherAgent } from './agents/weather-agent';
import { mcpAgent } from './agents/mcpAgent';
import { agentStorage, agentVector } from './agentMemory';
import { 
  createTelemetryConfig,
  AISDKExporter
} from './observability';

/**
 * Main Mastra instance with integrated multi-agent workflows and observability
 * 
 * @remarks
 * - Configured with 7 production-ready workflows for different AI use cases
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
    evaluationTestingWorkflow
  },
  agents: { weatherAgent, mcpAgent, stockAgent, supervisorAgent, masterAgent, workerAgent },
  storage: agentStorage,
  vectors: { default: agentVector },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: createTelemetryConfig({
    serviceName: "pr-warmhearted-jewellery-74",
    enabled: true,
    sampling: {
      type: 'ratio',
      probability: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    },
    export: {
      type: "custom",
      exporter: new AISDKExporter(),
    }
  }),
});