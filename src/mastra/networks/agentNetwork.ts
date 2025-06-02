import { AgentNetwork } from '@mastra/core/network';
import { createTracedGoogleModel } from '../observability';

// Import existing agents
import { masterAgent } from '../agents/masterAgent';
import { supervisorAgent } from '../agents/supervisorAgent';
import { mcpAgent } from '../agents/mcpAgent';
import { ragAgent } from '../agents/ragAgent';
import { stockAgent } from '../agents/stockAgent';
import { weatherAgent } from '../agents/weather-agent';
import { workerAgent } from '../agents/workerAgent';

import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({ name: 'agent-network', level: 'info' });

/**
 * Research & Analysis Network
 * Coordinates specialized agents for comprehensive research tasks
 */
export const researchNetwork = () => new AgentNetwork({
  name: 'Research Network',
  instructions: `
    You are the coordinator for a research network with specialized agents.
    
    Available agents:
    - supervisorAgent: Handles MCP operations, file management, and general coordination
    - ragAgent: Performs semantic search and knowledge retrieval from documents
    - stockAgent: Provides financial data, market analysis, and stock information
    - weatherAgent: Provides weather data and meteorological analysis
    - mcpAgent: Specialized for Model Context Protocol interactions and tool usage
    
    Route tasks to the most appropriate agent based on:
    - Research topics requiring document analysis → ragAgent
    - Financial or market research → stockAgent  
    - Weather-related queries → weatherAgent
    - File operations or MCP tool usage → supervisorAgent or mcpAgent
    - General coordination or multi-step tasks → supervisorAgent
    
    Always provide clear context about why you're routing to a specific agent.
  `,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'research-network-router',
    tags: ['network', 'research', 'coordination']
  }),
  agents: [supervisorAgent, ragAgent, stockAgent, weatherAgent, mcpAgent]
});

/**
 * Data Processing Network
 * Specializes in data analysis, transformation, and insights
 */
export const dataProcessingNetwork = () => new AgentNetwork({
  name: 'Data Processing Network',
  instructions: `
    You coordinate data processing tasks across specialized agents.
    
    Available agents:
    - ragAgent: Document analysis, chunking, and semantic processing
    - stockAgent: Financial data processing and market analysis
    - supervisorAgent: File operations and general data coordination
    - workerAgent: Task execution and processing workflows
    
    Route tasks based on data type:
    - Document processing, chunking, embeddings → ragAgent
    - Financial data, market metrics → stockAgent
    - File I/O, data transformation → supervisorAgent
    - Task execution, workflows → workerAgent
    
    Focus on efficient data flow and processing pipelines.
  `,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'data-processing-router',
    tags: ['network', 'data-processing', 'analysis']
  }),
  agents: [ragAgent, stockAgent, supervisorAgent, workerAgent]
});

/**
 * Content Creation Network
 * Coordinates agents for comprehensive content generation and analysis
 */
export const contentCreationNetwork = () => new AgentNetwork({
  name: 'Content Creation Network',
  instructions: `
    You coordinate content creation and enhancement tasks.
    
    Available agents:
    - masterAgent: High-level content strategy and comprehensive analysis
    - ragAgent: Research and knowledge synthesis from documents
    - supervisorAgent: Content organization and file management
    - stockAgent: Financial content and market analysis
    - weatherAgent: Weather-related content and meteorological data
    
    Route based on content needs:
    - Strategic content planning → masterAgent
    - Research-backed content → ragAgent
    - Financial/market content → stockAgent
    - Weather/climate content → weatherAgent
    - Content organization → supervisorAgent
    
    Ensure high-quality, well-researched content output.
  `,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'content-creation-router',
    tags: ['network', 'content', 'creation']
  }),
  agents: [masterAgent, ragAgent, supervisorAgent, stockAgent, weatherAgent]
});

/**
 * Technical Operations Network
 * Handles technical tasks, tool usage, and system operations
 */
export const technicalOpsNetwork = () => new AgentNetwork({
  name: 'Technical Operations Network',
  instructions: `
    You coordinate technical operations and tool usage across agents.
    
    Available agents:
    - mcpAgent: Model Context Protocol operations and tool interactions
    - supervisorAgent: General technical coordination and file operations  
    - workerAgent: Task execution and operational workflows
    - ragAgent: Technical document analysis and knowledge retrieval
    
    Route based on technical requirements:
    - MCP tool operations → mcpAgent
    - File system operations → supervisorAgent
    - Task automation → workerAgent
    - Technical documentation → ragAgent
    
    Focus on efficient tool usage and technical problem solving.
  `,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'technical-ops-router', 
    tags: ['network', 'technical', 'operations']
  }),
  agents: [mcpAgent, supervisorAgent, workerAgent, ragAgent]
});

/**
 * Comprehensive Multi-Agent Network
 * Uses all available agents for complex, multi-domain tasks
 */
export const comprehensiveNetwork = () => new AgentNetwork({
  name: 'Comprehensive Network',
  instructions: `
    You have access to all specialized agents for comprehensive task handling.
    
    Available agents and their expertise:
    - masterAgent: Strategic oversight, complex analysis, high-level coordination
    - supervisorAgent: MCP operations, file management, general coordination
    - ragAgent: Document analysis, semantic search, knowledge synthesis
    - stockAgent: Financial data, market analysis, investment insights
    - weatherAgent: Weather data, meteorological analysis, climate information
    - mcpAgent: Model Context Protocol tools, specialized integrations
    - workerAgent: Task execution, operational workflows, processing tasks
    
    Routing strategy:
    1. Analyze the task complexity and domain requirements
    2. For multi-domain tasks, coordinate multiple agents sequentially or in parallel
    3. Use masterAgent for strategic oversight of complex workflows
    4. Route domain-specific subtasks to specialized agents
    5. Use supervisorAgent for coordination and file operations
    
    Always explain your routing decisions and coordinate agent interactions effectively.
  `,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'comprehensive-router',
    tags: ['network', 'comprehensive', 'multi-agent']
  }),
  agents: [masterAgent, supervisorAgent, ragAgent, stockAgent, weatherAgent, mcpAgent, workerAgent]
});

/**
 * Network Analytics and Monitoring
 */
export class NetworkAnalytics {
  private static interactions: Array<{
    timestamp: string;
    network: string;
    routedTo: string;
    task: string;
    duration?: number;
    success: boolean;
  }> = [];

  /**
   * Records a network interaction for analytics
   */
  static recordInteraction(
    network: string,
    routedTo: string,
    task: string,
    success: boolean,
    duration?: number
  ): void {
    const record = {
      timestamp: new Date().toISOString(),
      network,
      routedTo,
      task,
      duration,
      success
    };

    this.interactions.push(record);
    
    // Keep only last 1000 interactions
    if (this.interactions.length > 1000) {
      this.interactions.shift();
    }

    logger.info(`Network interaction: ${network} → ${routedTo}`, record);
  }

  /**
   * Gets network performance analytics
   */
  static getNetworkAnalytics() {
    const interactions = this.interactions;
    const totalInteractions = interactions.length;
    
    if (totalInteractions === 0) {
      return {
        totalInteractions: 0,
        successRate: 0,
        avgDuration: 0,
        networkBreakdown: {},
        agentUsage: {},
        recentInteractions: []
      };
    }

    const successful = interactions.filter(i => i.success);
    const successRate = (successful.length / totalInteractions) * 100;
    
    const durationsWithTime = interactions.filter(i => i.duration !== undefined);
    const avgDuration = durationsWithTime.length > 0 
      ? durationsWithTime.reduce((sum, i) => sum + (i.duration || 0), 0) / durationsWithTime.length
      : 0;

    const networkBreakdown = interactions.reduce((acc, i) => {
      acc[i.network] = (acc[i.network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const agentUsage = interactions.reduce((acc, i) => {
      acc[i.routedTo] = (acc[i.routedTo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInteractions,
      successRate: Math.round(successRate * 100) / 100,
      avgDuration: Math.round(avgDuration * 100) / 100,
      networkBreakdown,
      agentUsage,
      recentInteractions: interactions.slice(-20)
    };
  }

  /**
   * Gets analytics for a specific network
   */
  static getNetworkSpecificAnalytics(networkName: string) {
    const networkInteractions = this.interactions.filter(i => i.network === networkName);
    return {
      interactions: networkInteractions,
      totalTasks: networkInteractions.length,
      successRate: networkInteractions.length > 0 
        ? (networkInteractions.filter(i => i.success).length / networkInteractions.length) * 100
        : 0,
      mostUsedAgent: this.getMostUsedAgent(networkInteractions),
      recentTasks: networkInteractions.slice(-10)
    };
  }

  private static getMostUsedAgent(interactions: typeof NetworkAnalytics.interactions) {
    const usage = interactions.reduce((acc, i) => {
      acc[i.routedTo] = (acc[i.routedTo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(usage).reduce((max, [agent, count]) => 
      count > (max.count || 0) ? { agent, count } : max, 
      {} as { agent?: string; count?: number }
    );
  }

  /**
   * Clears all network analytics
   */
  static clearAnalytics(): void {
    this.interactions = [];
    logger.info('Network analytics cleared');
  }
}

/**
 * Enhanced network execution with analytics tracking
 */
export const executeNetworkTask = async (
  network: AgentNetwork,
  task: string,
  options?: any
): Promise<any> => {
  const networkName = network.name || 'unknown-network';
  const startTime = Date.now();
  
  try {
    logger.info(`Executing task on ${networkName}`, { task });
    
    const result = await network.generate(task, options);
    const duration = Date.now() - startTime;
    
    // Try to extract which agent was used from the result or network history
    const routedAgent = 'auto-routed'; // AgentNetwork handles this internally
    
    NetworkAnalytics.recordInteraction(
      networkName,
      routedAgent,
      task,
      true,
      duration
    );
    
    logger.info(`Task completed on ${networkName}`, { 
      task, 
      duration: `${duration}ms`,
      success: true 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    NetworkAnalytics.recordInteraction(
      networkName,
      'error',
      task,
      false,
      duration
    );
    
    logger.error(`Task failed on ${networkName}`, {
      task,
      duration: `${duration}ms`,
      error: errorMessage
    });
    
    throw error;
  }
};

/**
 * Network health check utility
 */
export const checkNetworkHealth = async (): Promise<Record<string, any>> => {
  const networks = {
    research: researchNetwork(),
    dataProcessing: dataProcessingNetwork(),
    contentCreation: contentCreationNetwork(),
    technicalOps: technicalOpsNetwork(),
    comprehensive: comprehensiveNetwork()
  };

  const healthStatus: Record<string, any> = {};

  for (const [name, network] of Object.entries(networks)) {
    try {
      // Test basic functionality
      const testResult = await network.generate('Hello, confirm you are operational', {
        maxTokens: 50
      });
      
      healthStatus[name] = {
        status: 'healthy',
        agents: network.getAgents().length,
        routingAgent: network.getRoutingAgent().name,
        testResponse: testResult.text.substring(0, 100)
      };
    } catch (error) {
      healthStatus[name] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  return healthStatus;
};

// Generated on 2025-06-01 - Comprehensive AgentNetwork implementation with full observability