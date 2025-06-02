// Generated on 2025-06-01
/**
 * Enhanced LangSmith Observability for Mastra with AI SDK Integration
 * 
 * This module provides comprehensive tracing using LangSmith's traceable decorator,
 * AI SDK telemetry integration, and enhanced prompt management.
 * 
 * @module observability
 */

import { traceable } from "langsmith/traceable";
import { z } from 'zod';

// Re-export existing functionality
export * from './googleProvider';
export * from './langHub';
export * from './promptManager';
import { wrapAISDKModel } from "langsmith/wrappers/vercel";
import { AISDKExporter } from "langsmith/vercel";
import { PinoLogger } from '@mastra/loggers';
import { createMastraGoogleProvider } from './googleProvider';
import { formatISO } from 'date-fns';
import { wrapLanguageModel } from "ai";

/**
 * Observability logger for tracing and monitoring
 */
export const observabilityLogger = new PinoLogger({
  name: 'MastraObservability',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

/**
 * LangSmith configuration using environment variables
 */
export const langsmithConfig = {
  apiKey: process.env.LANGSMITH_API_KEY,
  project: process.env.LANGSMITH_PROJECT || 'pr-warmhearted-jewellery-74',
  endpoint: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
  tracingEnabled: process.env.LANGSMITH_TRACING === 'true',
};

/**
 * Telemetry configuration for Mastra
 * Automatically initializes observability when called
 */
export const createTelemetryConfig = (overrides?: any) => {
  return {
    serviceName: "mastra-ai-system",
    enabled: langsmithConfig.tracingEnabled,
    sampling: {
      type: 'ratio' as const,
      probability: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    },
    export: {
      type: "custom" as const,
      exporter: new AISDKExporter(),
    },
    ...overrides
  };
};

/**
 * Creates a traceable agent wrapper for LangSmith monitoring
 * 
 * @param agentName - Name of the agent for tracing
 * @param agentFunction - The agent function to wrap
 * @returns Traceable agent function
 */
export const createTraceableAgent = <T extends (...args: any[]) => any>(
  agentName: string,
  agentFunction: T
): T => {
  return traceable(agentFunction, {
    name: `agent:${agentName}`,
    tags: ['agent', 'mastra'],
    metadata: {
      agentType: 'mastra-agent',
      project: langsmithConfig.project,
      timestamp: formatISO(new Date())
    }
  }) as T;
};

/**
 * Creates a traceable workflow step for LangSmith monitoring
 * 
 * @param stepName - Name of the workflow step
 * @param workflowName - Name of the parent workflow
 * @param stepFunction - The step function to wrap
 * @returns Traceable step function
 */
export const createTraceableWorkflowStep = <T extends (...args: any[]) => any>(
  stepName: string,
  workflowName: string,
  stepFunction: T
): T => {
  return traceable(stepFunction, {
    name: `workflow:${workflowName}:${stepName}`,
    tags: ['workflow', 'step', 'mastra'],
    metadata: {
      workflowName,
      stepName,
      stepType: 'mastra-workflow-step',
      project: langsmithConfig.project,
      timestamp: formatISO(new Date())
    }
  }) as T;
};

/**
 * Creates a traceable memory operation wrapper for LangSmith monitoring
 * 
 * @param operationName - Name of the memory operation
 * @param memoryFunction - The memory function to wrap
 * @returns Traceable memory function with enhanced metadata
 */
export const createTraceableMemoryOperation = <T extends (...args: any[]) => any>(
  operationName: string,
  memoryFunction: T
): T => {
  return traceable(memoryFunction, {
    name: `memory:${operationName}`,
    tags: ['memory', 'persistence', 'mastra'],
    metadata: {
      operationType: 'memory-operation',
      operationName,
      project: langsmithConfig.project,
      timestamp: formatISO(new Date())
    }
  }) as T;
};

/**
 * Creates a traceable thread operation wrapper for LangSmith monitoring
 * 
 * @param operationName - Name of the thread operation
 * @param threadFunction - The thread function to wrap
 * @returns Traceable thread function with enhanced metadata
 */
export const createTraceableThreadOperation = <T extends (...args: any[]) => any>(
  operationName: string,
  threadFunction: T
): T => {
  return traceable(threadFunction, {
    name: `thread:${operationName}`,
    tags: ['thread', 'conversation', 'memory', 'mastra'],
    metadata: {
      operationType: 'thread-operation',
      operationName,
      project: langsmithConfig.project,
      timestamp: formatISO(new Date())
    }
  }) as T;
};

/**
 * Performance measurement utility
 * 
 * @param operation - Name of the operation to measure
 * @param fn - Function to measure
 * @returns Result of the function with timing logged
 */
export const measureTime = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    observabilityLogger.info(`Operation completed: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    observabilityLogger.error(`Operation failed: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
};

/**
 * Error tracking utility
 */
export class ErrorTracker {
  private static errors: Array<{
    timestamp: string;
    operation: string;
    error: string;
    metadata?: any;
  }> = [];

  /**
   * Records an error for tracking
   * 
   * @param operation - Operation where error occurred
   * @param error - The error that occurred
   * @param metadata - Additional metadata
   */
  static recordError(operation: string, error: Error | string, metadata?: any): void {
    const errorRecord = {
      timestamp: formatISO(new Date()),
      operation,
      error: error instanceof Error ? error.message : error,
      metadata
    };

    this.errors.push(errorRecord);
    
    // Keep only last 100 errors to prevent memory issues
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    observabilityLogger.error(`Error in ${operation}`, errorRecord);
  }

  /**
   * Gets recent errors
   * 
   * @param limit - Number of recent errors to return
   * @returns Recent error records
   */
  static getRecentErrors(limit: number = 10): typeof ErrorTracker.errors {
    return this.errors.slice(-limit);
  }

  /**
   * Clears all recorded errors
   */
  static clearErrors(): void {
    this.errors = [];
  }
}

/**
 * Memory performance tracker for detailed analytics
 */
export class MemoryTracker {
  private static operations: Array<{
    timestamp: string;
    operation: string;
    resourceId?: string;
    threadId?: string;
    duration: number;
    status: 'success' | 'error';
    metadata?: any;
  }> = [];

  /**
   * Records a memory operation for analytics
   * 
   * @param operation - Operation name
   * @param resourceId - Resource identifier
   * @param threadId - Thread identifier
   * @param duration - Operation duration in ms
   * @param status - Operation status
   * @param metadata - Additional metadata
   */
  static recordOperation(
    operation: string,
    resourceId: string | undefined,
    threadId: string | undefined,
    duration: number,
    status: 'success' | 'error',
    metadata?: any
  ): void {
    const record = {
      timestamp: formatISO(new Date()),
      operation,
      resourceId,
      threadId,
      duration,
      status,
      metadata
    };

    this.operations.push(record);
    
    // Keep only last 500 operations to prevent memory issues
    if (this.operations.length > 500) {
      this.operations.shift();
    }

    observabilityLogger.info(`Memory operation: ${operation}`, record);
  }

  /**
   * Gets memory operation analytics
   * 
   * @param limit - Number of recent operations to return
   * @returns Recent memory operation records
   */
  static getOperationHistory(limit: number = 50): typeof MemoryTracker.operations {
    return this.operations.slice(-limit);
  }

  /**
   * Gets memory analytics by resource
   * 
   * @param resourceId - Resource identifier
   * @returns Operations for specific resource
   */
  static getResourceOperations(resourceId: string): typeof MemoryTracker.operations {
    return this.operations.filter(op => op.resourceId === resourceId);
  }

  /**
   * Gets memory analytics by thread
   * 
   * @param threadId - Thread identifier
   * @returns Operations for specific thread
   */
  static getThreadOperations(threadId: string): typeof MemoryTracker.operations {
    return this.operations.filter(op => op.threadId === threadId);
  }

  /**
   * Gets performance statistics
   * 
   * @returns Performance analytics
   */
  static getPerformanceStats(): {
    totalOperations: number;
    avgDuration: number;
    successRate: number;
    operationBreakdown: Record<string, number>;
    errorRate: number;
  } {
    const operations = this.operations;
    const totalOps = operations.length;
    
    if (totalOps === 0) {
      return {
        totalOperations: 0,
        avgDuration: 0,
        successRate: 0,
        operationBreakdown: {},
        errorRate: 0
      };
    }

    const successfulOps = operations.filter(op => op.status === 'success');
    const avgDuration = operations.reduce((sum, op) => sum + op.duration, 0) / totalOps;
    const operationBreakdown = operations.reduce((acc, op) => {
      acc[op.operation] = (acc[op.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOperations: totalOps,
      avgDuration: Math.round(avgDuration * 100) / 100,
      successRate: (successfulOps.length / totalOps) * 100,
      operationBreakdown,
      errorRate: ((totalOps - successfulOps.length) / totalOps) * 100
    };
  }

  /**
   * Clears all recorded operations
   */
  static clearHistory(): void {
    this.operations = [];
  }
}

/**
 * Enhanced performance measurement specifically for memory operations
 * 
 * @param operation - Name of the memory operation
 * @param resourceId - Optional resource identifier
 * @param threadId - Optional thread identifier
 * @param fn - Function to measure
 * @returns Result of the function with memory-specific tracking
 */
export const measureMemoryOperation = async <T>(
  operation: string,
  resourceId: string | undefined,
  threadId: string | undefined,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    MemoryTracker.recordOperation(operation, resourceId, threadId, duration, 'success');
    
    observabilityLogger.debug(`Memory operation completed: ${operation}`, {
      operation,
      resourceId,
      threadId,
      duration: `${duration}ms`,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    MemoryTracker.recordOperation(operation, resourceId, threadId, duration, 'error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    observabilityLogger.error(`Memory operation failed: ${operation}`, {
      operation,
      resourceId,
      threadId,
      duration: `${duration}ms`,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}


/**
 * Enhanced AI SDK Integration
 */

const logger = new PinoLogger({ name: 'enhanced-observability', level: 'info' });

// Export everything needed for LangSmith integration
export {
  traceable,
  wrapAISDKModel,
  AISDKExporter
};

// Re-export formatISO for timestamp formatting
export { formatISO } from 'date-fns';

/**
 * Enhanced AI SDK Exporter with custom configuration
 */
export class EnhancedAISDKExporter extends AISDKExporter {
  constructor(config?: { 
    client?: any; 
    debug?: boolean;
    metadata?: Record<string, any>;
  }) {
    super(config);
    if (config?.debug) {
      logger.info('AI SDK Exporter initialized in debug mode');
    }
    // Observability/tracing system initialization logic placed here as requested
  }

  /**
   * Get enhanced settings with metadata
   */
  static getEnhancedSettings(options?: {
    runName?: string;
    runId?: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }) {
    const baseSettings = this.getSettings(options);
    
    return {
      ...baseSettings,
      metadata: {
        ...baseSettings.metadata,
        ...options?.metadata,
        timestamp: new Date().toISOString(),
        service: 'mastra-ai-sdk'
      }
    };
  }
}

/**
 * Create a traced Google model with LangSmith integration
 * Works with any Google provider configuration from googleProvider.ts
 * 
 * @param modelId - Google AI model ID (e.g., 'gemini-2.0-flash-exp')
 * @param options - Comprehensive options including all Google provider options
 * @returns Wrapped Google AI model with automatic LangSmith tracing
 */
export function createTracedGoogleModel(
  modelId: string,
  options?: {
    // LangSmith tracing options
    name?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    runName?: string;
    
    // Google AI provider options (passed through to createMastraGoogleProvider)
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    seed?: number;
    thinkingConfig?: {
      thinkingBudget?: number;
    };
    
    // Additional Google provider options
    safetySettings?: Array<{
      category: string;
      threshold: string;
    }>;
    generationConfig?: Record<string, any>;
    tools?: Array<any>;
    toolConfig?: Record<string, any>;
    systemInstruction?: string;
    
    // Any other Google provider options
    [key: string]: any;
  }
) {
  // Extract LangSmith-specific options
  const { name, tags, metadata, runName, ...googleProviderOptions } = options || {};
  
  // Use existing provider creation with all Google options
  const baseModel = createMastraGoogleProvider(modelId, googleProviderOptions);

  if (!langsmithConfig.tracingEnabled) {
    observabilityLogger.debug('LangSmith tracing disabled, returning unwrapped model');
    return baseModel;
  }

  // Wrap with LangSmith tracing using AI SDK wrapper
  const tracedModel = wrapAISDKModel(baseModel, {
    name: name || `google-${modelId}`,
    tags: tags || ['google', 'ai-sdk', 'mastra'],
    metadata: {
      modelId,
      provider: 'google',
      framework: 'ai-sdk',
      temperature: googleProviderOptions.temperature,
      maxTokens: googleProviderOptions.maxTokens,
      thinkingBudget: googleProviderOptions.thinkingConfig?.thinkingBudget,
      ...metadata
    }
  });

  logger.info(`Created traced Google model: ${modelId}`, {
    name: name || `google-${modelId}`,
    tags: tags || ['google', 'ai-sdk', 'mastra'],
    temperature: googleProviderOptions.temperature,
    thinkingBudget: googleProviderOptions.thinkingConfig?.thinkingBudget
  });

  return tracedModel;
}
/**
 * Create a traceable function with LangSmith integration
 */
export function createTraceableFunction<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    name: string;
    runType?: 'llm' | 'chain' | 'tool' | 'retriever' | 'embedding' | 'parser';
    tags?: string[];
    metadata?: Record<string, any>;
  }
): T {
  return traceable(fn, {
    name: options.name,
    run_type: options.runType || 'chain',
    tags: options.tags,
    metadata: {
      framework: 'mastra',
      ...options.metadata
    }
  }) as T;
}

/**
 * Trace agent operations with enhanced context
 */
export function traceAgentOperation<T extends (...args: any[]) => any>(
  operation: T,
  agentName: string,
  operationType: 'generate' | 'callTool' | 'processMessage' | 'search' | 'analyze'
): T {
  return createTraceableFunction(operation, {
    name: `${agentName}-${operationType}`,
    runType: operationType === 'generate' ? 'llm' : 'chain',
    tags: ['agent', agentName, operationType],
    metadata: {
      agentName,
      operationType,
      component: 'agent'
    }
  });
}

/**
 * Trace network operations
 */
export function traceNetworkOperation<T extends (...args: any[]) => any>(
  operation: T,
  networkName: string,
  operationType: 'route' | 'coordinate' | 'execute' | 'analyze'
): T {
  // Create the traceable function ONCE, preserving the original context
  const traced = createTraceableFunction(operation, {
    name: `${networkName}-${operationType}`,
    runType: 'chain',
    tags: ['network', networkName, operationType],
    metadata: {
      networkName,
      operationType,
      component: 'network'
    }
  });
  // Return a wrapper that preserves 'this'
  return function(this: any, ...args: any[]) {
    return traced.apply(this, args);
  } as T;
}

/**
 * Trace RAG operations with detailed context
 */
export function traceRAGOperation<T extends (...args: any[]) => any>(
  operation: T,
  operationType: 'vectorSearch' | 'graphSearch' | 'synthesis' | 'analysis'
): T {
  return createTraceableFunction(operation, {
    name: `rag-${operationType}`,
    runType: operationType.includes('Search') ? 'retriever' : 'chain',
    tags: ['rag', operationType, 'knowledge'],
    metadata: {
      operationType,
      component: 'rag'
    }
  });
}

/**
 * Enhanced observability utilities
 */
export const ObservabilityUtils = {
  /**
   * Get AI SDK telemetry settings with project context
   */
  getAISDKSettings(options?: {
    runName?: string;
    agentName?: string;
    operationType?: string;
    metadata?: Record<string, any>;
  }) {
    return EnhancedAISDKExporter.getEnhancedSettings({
      runName: options?.runName || 
               (options?.agentName && options?.operationType) ? 
               `${options.agentName}-${options.operationType}` : 
               undefined,
      metadata: {
        ...options?.metadata,
        agentName: options?.agentName,
        operationType: options?.operationType
      },
      tags: [
        ...(options?.agentName ? [options.agentName] : []),
        ...(options?.operationType ? [options.operationType] : [])
      ]
    });
  },

  /**
   * Create instrumentation for agent methods
   */
  instrumentAgent(agent: any, agentName: string) {
    if (agent.generate) {
      agent.generate = traceAgentOperation(agent.generate.bind(agent), agentName, 'generate');
    }
    if (agent.callTool) {
      agent.callTool = traceAgentOperation(agent.callTool.bind(agent), agentName, 'callTool');
    }
    return agent;
  },

  /**
   * Create instrumentation for network methods
   */
  instrumentNetwork(network: any, networkName: string) {
    if (network.generate) {
      network.generate = traceNetworkOperation(network.generate.bind(network), networkName, 'execute');
    }
    if (network.route) {
      network.route = traceNetworkOperation(network.route.bind(network), networkName, 'route');
    }
    return network;
  }
};
