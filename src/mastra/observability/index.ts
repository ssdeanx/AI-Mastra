// Generated on 2025-06-01
/**
 * LangSmith Observability for Mastra
 * 
 * This module provides tracing using LangSmith's traceable decorator
 * and your configured environment variables.
 * 
 * @module observability
 */

import { traceable } from "langsmith/traceable";
import { wrapAISDKModel } from "langsmith/wrappers/vercel";
import { AISDKExporter } from "langsmith/vercel";
import { PinoLogger } from '@mastra/loggers';
import { google } from '@ai-sdk/google';
import { formatISO } from 'date-fns';

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
  // Initialize observability automatically when telemetry config is created
  initializeObservability();
  
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
 * Initialize observability system
 * This initialization logs the configuration
 */
export const initializeObservability = () => {
  observabilityLogger.info('Mastra observability initialized', {
    langsmithProject: langsmithConfig.project,
    tracingEnabled: langsmithConfig.tracingEnabled,
    environment: process.env.NODE_ENV || 'development'
  });

  if (!langsmithConfig.apiKey) {
    observabilityLogger.warn('LANGSMITH_API_KEY not found in environment variables');
  }

  if (langsmithConfig.tracingEnabled) {
    observabilityLogger.info('LangSmith tracing is enabled');
  } else {
    observabilityLogger.info('LangSmith tracing is disabled');
  }
};

/**
 * Creates a Google AI model with LangSmith tracing enabled
 * 
 * @param modelId - Google AI model ID (e.g., 'gemini-2.0-flash-exp')
 * @param options - LangSmith tracing options
 * @returns Wrapped Google AI model with automatic tracing
 */
export const createTracedGoogleModel = (
  modelId: string = 'gemini-2.0-flash-exp',
  options?: { name?: string; tags?: string[] }
) => {
  const baseModel = google(modelId);
  
  if (!langsmithConfig.tracingEnabled) {
    observabilityLogger.debug('LangSmith tracing disabled, returning unwrapped model');
    return baseModel;
  }
  
  return wrapAISDKModel(baseModel, {
    name: options?.name || `google-${modelId}`,
    tags: ['google-ai', 'ai-sdk', 'mastra', ...(options?.tags || [])],
    metadata: {
      provider: 'google',
      modelId,
      project: langsmithConfig.project,
      timestamp: formatISO(new Date())
    }
  });
};

// Export everything needed
export {
  traceable,
  wrapAISDKModel,
  AISDKExporter
};

// TODO: 2025-06-01 - promptManager.js does not export any members or is not a module. Remove or fix as needed.
// export {
//   pushPrompt,
//   pullPrompt,
//   listPrompts,
//   deletePrompt,
//   likePrompt,
//   unlikePrompt,
//   loadSystemPrompts,
//   getSystemPrompt,
//   SYSTEM_PROMPTS,
//   langsmithClient
// } from './promptManager.js';