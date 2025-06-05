import { createTool } from "@mastra/core/tools";
import { MCPServer } from "@mastra/mcp";
import { z } from "zod";
import { createTracedGoogleModel } from '../observability';
import { weatherAgent } from '../agents/weather-agent';
import { mcpAgent } from '../agents/mcpAgent';
import { ragAgent } from '../agents/ragAgent';
import { evaluationAgent } from '../agents/evaluationAgent';
import { dataManagerAgent } from '../agents/dataManagerAgent';
import { stockAgent } from '../agents/stockAgent';
import { supervisorAgent } from '../agents/supervisorAgent';
import { masterAgent } from '../agents/masterAgent';
import { workerAgent } from '../agents/workerAgent';
import { mcp } from "../tools/mcp";
import { vectorQueryTool } from '../tools/vectorQueryTool';
import { graphTool } from '../tools/graphRAGTool';
import { weatherWorkflow } from '../workflows/weather-workflow';
import { taskOrchestrationWorkflow } from '../workflows/multi-agent-workflow';
import { researchAnalysisWorkflow } from '../workflows/research-analysis-workflow';
import { contentCreationWorkflow } from '../workflows/content-creation-workflow';
import { dataProcessingWorkflow } from '../workflows/data-processing-workflow';
import { ragKnowledgeWorkflow } from '../workflows/rag-knowledge-workflow';
import { evaluationTestingWorkflow } from '../workflows/evaluation-testing-workflow';
import { intelligentCoordinationWorkflow } from '../workflows/inngest/intelligent-coordination-workflow';
import { agentTrainingWorkflow } from '../workflows/inngest/agent-training-workflow';
import { agentDeploymentWorkflow } from '../workflows/inngest/agent-deployment-workflow';
import { agentMonitoringWorkflow } from '../workflows/inngest/agent-monitoring-workflow';
import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({ name: 'AI-Mastra-MCP-Server', level: 'info' });

logger.info('MCP Server initialized');

export const mcpServer = new MCPServer({
    name: "AI-Mastra-MCP-Server",
    version: "1.0.0",
    tools: {
        vectorQueryTool,
        graphTool,
        ...(await mcp.getTools())
      },
    agents: { weatherAgent, mcpAgent, ragAgent, evaluationAgent, dataManagerAgent, stockAgent, supervisorAgent, masterAgent, workerAgent }, // this agent will become tool "ask_myAgent"
    workflows: {
      weatherWorkflow, taskOrchestrationWorkflow, researchAnalysisWorkflow, contentCreationWorkflow, dataProcessingWorkflow, ragKnowledgeWorkflow, evaluationTestingWorkflow, intelligentCoordinationWorkflow, agentTrainingWorkflow, agentDeploymentWorkflow, agentMonitoringWorkflow // this workflow will become tool "run_dataProcessingWorkflow"
    }
  });