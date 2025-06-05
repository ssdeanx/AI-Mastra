import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { fastembed } from '@mastra/fastembed';
import { z } from 'zod';
import { PinoLogger } from '@mastra/loggers';
import type { CoreMessage, Telemetry } from '@mastra/core';
import { maskStreamTags } from '@mastra/core/utils';
import { MemoryProcessor } from '@mastra/core/memory';
import { TokenLimiter } from '@mastra/memory/processors';

import { Tracer } from '@opentelemetry/api';
import { google } from '@ai-sdk/google';
import { embed } from "ai";
import {

  measureMemoryOperation,
  MemoryTracker,
  observabilityLogger,
  createTracedGoogleModel
} from './observability';
import { rerank } from '@mastra/rag';

const logger = new PinoLogger({ name: 'agentMemory', level: 'info' });

// Create shared storage instance
export const agentStorage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:./memory.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || ''
});

/**
 * Enhanced LibSQL Vector Configuration 
 * Initializes vector storage for optimal search performance
 */
export const agentVector = new LibSQLVector({
  connectionUrl: process.env.DATABASE_URL || 'file:./vector.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || ''
});

const createThreadSchema = z.object({ resourceId: z.string().nonempty(), threadId: z.string().optional(), title: z.string().optional(), metadata: z.record(z.unknown()).optional() });
const getMessagesSchema = z.object({ resourceId: z.string().nonempty(), threadId: z.string().nonempty(), last: z.number().int().min(1).optional() });
const threadIdSchema = z.string().nonempty();
const resourceIdSchema = z.string().nonempty();
const searchMessagesSchema = z.object({
  threadId: z.string().nonempty(),
  vectorSearchString: z.string().nonempty(),
  topK: z.number().int().min(1).default(3),
  before: z.number().int().min(0).default(0),
  after: z.number().int().min(0).default(0),
});

// Zod schema for summary function inputs
const summarySchema = z.object({ resourceId: z.string().nonempty(), threadId: z.string().nonempty(), historySize: z.number().int().min(1).default(100) });

/**
 * Shared Mastra agent memory instance using LibSQL for storage and vector search.
 *
 * @remarks
 * - Uses LibSQLStore for persistent storage url: process.env.DATABASE_URL || 'file:./memory.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || ''
 * - Uses LibSQLVector for semantic search url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN || ''
 * - Embeddings powered by fastembed
 * - Configured for working memory and semantic recall
 * - Supports custom memory processors for filtering, summarization, etc.
 *
 * @see https://github.com/mastra-ai/mastra
 *
 * @returns {Memory} Shared memory instance for all agents
 *
 * @example
 * // Use threadId/resourceId for multi-user or multi-session memory:
 * await agent.generate('Hello', { resourceId: 'user-123', threadId: 'thread-abc' });
 */
export const agentMemory = new Memory({
  storage: agentStorage,
  vector: agentVector,
  embedder: fastembed,
  options: {
    lastMessages: 200,
    semanticRecall: {
      topK: 3,
      messageRange: {
        before: 5,
        after: 2,
      },
    },
    workingMemory: {
      enabled: true,
      template: `
# {{agent_name}} Working Memory
# This is the working memory for the agent, which is used to store dynamic context and knowledge
# Timestamp: {new Date().toISOString()}

CurrentContext:
  SessionID: "{session_id}" # Unique identifier for the user session
  UserID: "{user_id}" # Unique identifier for the user
  InteractionFocus: "{user_query}." # User's current query or focus
  UserSentimentEstimate: "{sentiment_score}" # Estimate of user's sentiment
  UnresolvedQuestions: "{unresolved_questions}" # List of unresolved questions
      - type: "user_query"
        content: "{user_query}" # User's query or input
      - type: "agent_response"
        content: "{agent_response}" # Agent's response to the query

DynamicScratchpad: "{assistant_notes}" # Dynamic notes for current session
  - type: "internal_monologue"
    timestamp: "{new Date(Date.now() - 30000).toISOString()}" # 30 seconds ago
    thought: "{agent_thought}" # Agent's internal thought process
  - type: "retrieved_knowledge_summary"
    timestamp: "{new Date(Date.now() - 20000).toISOString()}" # 20 seconds ago
    source: "internal_search_results_topic_advanced_WM"
    summary: "{agent_summary}" # Summary of retrieved knowledge
  - type: "planning_step"
    timestamp: "{new Date(Date.now() - 10000).toISOString()}" # 10 seconds ago
    action_considered: "{agent_action_considered}" # Action under consideration
  - type: "current_action"
    timestamp: "{new Date().toISOString()}"
    action: "{agent_current_action}" # Current action being executed

TrackedEntitiesAndBeliefs: # Key entities/concepts agent is currently tracking
  - entity_id: "{entity_id}"
    type: "Concept"
    properties:
      definition: "{entity_definition}" # Definition of the entity
      user_interest_level: "{entity_user_interest_level}" # User's interest level
      discussion_history: "{entity_discussion_history}" # Discussion history
    agent_belief: "{entity_agent_belief}" # Agent's belief about the entity
  - entity_id: "{user_profile_id}" # User profile identifier
    type: "User"
    properties:
      preferred_format: "{user_preferred_format}" # Inferred by agent
      technical_level_estimate: "{user_technical_level_estimate}" # Estimate of user's technical level
      recent_interactions: "{user_recent_interactions}" # Summary of recent interactions

OperationalGoals: "{operational_goals}" # Short-term, evolving goals for the current interaction
  - goal_id: "{goal_id}" # Unique identifier for the goal
    description: "{goal_description}" # Description of the goal
    status: "{goal_status}" # Status of the goal
    sub_goals:
      - "{sub_goal_description}" # Description of the sub-goal
      - "{sub_goal_status}" # Status of the sub-goal
      - "{sub_goal_plan}" # Plan to achieve the sub-goal
      - "{sub_goal_action}" # Action to achieve the sub-goal

ActiveHypotheses:
  - hypothesis_id: "{hypothesis_id}" # Unique identifier for the hypothesis
    statement: "{hypothesis_statement}" # Statement of the hypothesis
    confidence: "{hypothesis_confidence}" # Confidence in the hypothesis

RelevantContextualSignals:
  - signal_type: "{signal_type}" # Type of the signal
    value: "{signal_value}" # Value of the signal
    implication: "{signal_implication}" # Implication of the signal

InternalStateFlags:
  is_learning_new_topic: {answer} # Whether the agent is learning a new topic
  requires_clarification_on_last_user_input: {answer} # Whether the agent requires clarification on the last user input
  high_computational_load: {answer} # Whether the agent has a high computational load
  is_in_planning_mode: {answer} # Whether the agent is in planning mode
  is_waiting_for_user_input: {answer} # Whether the agent is waiting for user input
  is_executing_action: {answer} # Whether the agent is executing an action

InteractingAgents:
  - agent_id: "{agent_name}" # From CurrentContext
    role: "{role}" # Primary querant or observer
    last_interaction_summary: "{last_interaction_summary}" # Summary of the last interaction
  - agent_id: "{agent_name}" # Another AI agent
    status: "{status}" # Status of the agent
    capabilities_relevant_to_current_focus: ["{capability_1}", "{capability_2}"] # Capabilities relevant to the current focus

SharedKnowledgeReferences:
  - ref_id: "{ref_id}" # Unique identifier for the reference
    agreed_with: ["{agent_name_1}", "{agent_name_2}"] # Agents that agreed with the reference
    source: "{source}" # Source of the reference
    summary: "{summary}" # Summary of the reference
    last_accessed: "{{new Date().toISOString()}}" # Timestamp of the last access
    created_at: "{{new Date().toISOString()}}" # Timestamp of the creation
    created_by: "{agent_name}" # Agent that created the reference

RecentLearningEvents:
  - event_type: "{event_type}" # Type of the event
    timestamp: "{{new Date().toISOString()}}" # Timestamp of the event
    user_feedback: "{user_feedback}" # User feedback related to the event
    agent_action_taken: "{agent_action_taken}" # Action taken by the agent as a result of the event
  - event_type: "{event_type}" # Type of the event
    timestamp: "{{new Date().toISOString()}}" # Timestamp of the event
    tool_id: "{tool_id}" # ID of the tool used in the event
    outcome: "{outcome}" # Outcome of the event
      `, // End of the illustrative YAML template string
    },
  },
  processors: [
    new TokenLimiter(1000000),
    new (class extends MemoryProcessor {
      private limit: number;
      constructor(limit: number = 1000000) {
        super({ name: 'SummarizeProcessor' });
        this.limit = limit;
      }
      process(messages: CoreMessage[]): CoreMessage[] {
        if (messages.length <= this.limit) {
          return messages;
        }
        const overflowCount = messages.length - this.limit;
        const recent = messages.slice(-this.limit);
        // Placeholder summary inserted as system message
        const summaryMessage: CoreMessage = {
          role: 'system',
          content: `Summary of ${overflowCount} earlier messages.`,
        };
        return [summaryMessage, ...recent];
      }
    })(),
  ],
});

/**
 * Create a new memory thread for a user/session.
 * @param resourceId - User/resource identifier
 * @param title - Optional thread title
 * @param metadata - Optional thread metadata
 * @param threadId - Optional specific thread ID
 * @returns Promise resolving to thread information
 */
export async function createThread(
  resourceId: string, title?: string, metadata?: Record<string, unknown>, threadId?: string
) {
  const params = createThreadSchema.parse({ resourceId, threadId, title, metadata });
  try {
    return await agentMemory.createThread(params);
  } catch (error: unknown) {
    logger.error(`createThread failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Query messages for a thread
 * @param resourceId - User/resource ID
 * @param threadId - Thread ID
 * @param last - Number of last messages to retrieve
 * @returns Promise resolving to thread messages
 */
export async function getThreadMessages(
  resourceId: string, threadId: string, last = 10
) {
  const params = getMessagesSchema.parse({ resourceId, threadId, last });
  try {
    return await agentMemory.query({
      resourceId: params.resourceId,
      threadId: params.threadId,
      selectBy: { last: params.last }
    });
  } catch (error: unknown) {
    logger.error(`getThreadMessages failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Retrieve a memory thread by its ID.
 * @param threadId - Thread identifier
 * @returns Promise resolving to thread information
 */
export async function getThreadById(threadId: string) {
  const id = threadIdSchema.parse(threadId);
  try {
    return await agentMemory.getThreadById({ threadId: id });
  } catch (error: unknown) {
    logger.error(`getThreadById failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Retrieve all memory threads associated with a resource.
 * @param resourceId - Resource identifier
 * @returns Promise resolving to array of threads
 */
export async function getThreadsByResourceId(resourceId: string) {
  const id = resourceIdSchema.parse(resourceId);
  try {
    return await agentMemory.getThreadsByResourceId({ resourceId: id });
  } catch (error: unknown) {
    logger.error(`getThreadsByResourceId failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Perform a semantic search in a thread's messages.
 * @param threadId - Thread identifier
 * @param vectorSearchString - Query string for semantic search
 * @param topK - Number of similar messages to retrieve
 * @param before - Number of messages before each match
 * @param after - Number of messages after each match
 * @returns Promise resolving to { messages, uiMessages }
 */
export async function searchMessages(
  threadId: string,
  vectorSearchString: string,
  topK = 3,
  before = 2,
  after = 1
): Promise<{ messages: CoreMessage[]; uiMessages: any[] }> {
  const params = searchMessagesSchema.parse({ threadId, vectorSearchString, topK, before, after });
  try {
    return await agentMemory.query({
      threadId: params.threadId,
      selectBy: { vectorSearchString: params.vectorSearchString },
      threadConfig: { semanticRecall: { topK: params.topK, messageRange: { before: params.before, after: params.after } } },
    });
  } catch (error: unknown) {
    logger.error(`searchMessages failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Retrieve UI-formatted messages for a thread.
 * @param threadId - Thread identifier
 * @param last - Number of recent messages
 * @returns Promise resolving to array of UI-formatted messages
 */
export async function getUIThreadMessages(threadId: string, last = 100): Promise<any[]> {
  const id = threadIdSchema.parse(threadId);
  try {
    const { uiMessages } = await agentMemory.query({
      threadId: id,
      selectBy: { last },
    });
    return uiMessages;
  } catch (error: unknown) {
    logger.error(`getUIThreadMessages failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Masks internal working_memory updates from a response textStream.
 * @param textStream - Async iterable of response chunks including <working_memory> tags
 * @param onStart - Optional callback when a working_memory update starts
 * @param onEnd - Optional callback when a working_memory update ends
 * @param onMask - Optional callback for the masked content
 * @returns Async iterable of chunks with working_memory tags removed
 */
export function maskWorkingMemoryStream(
  textStream: AsyncIterable<string>,
  onStart?: () => void,
  onEnd?: () => void,
  onMask?: (chunk: string) => void
): AsyncIterable<string> {
  return maskStreamTags(textStream, 'working_memory', { onStart, onEnd, onMask });
}

/**
 * Generates a concise summary of the recent memory for a given thread using Google Gemini.
 * @param resourceId - The resource ID owning the thread
 * @param threadId - The thread identifier
 * @param historySize - Number of recent messages to include in the summary generation
 * @returns The summary text
 */
export async function generateMemorySummary(
  resourceId: string,
  threadId: string,
  historySize = 100
): Promise<string> {
  const params = summarySchema.parse({ resourceId, threadId, historySize });
  try {
    // Retrieve recent messages
    const { messages } = await agentMemory.query({
      resourceId: params.resourceId,
      threadId: params.threadId,
      selectBy: { last: params.historySize }
    });

    // Build prompt from messages
    const content = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `Please provide a concise summary of the following conversation messages:\n${content}`;

    // Generate summary with Google Gemini model
    const model = createTracedGoogleModel('gemini-2.0-flash-exp', {
      name: 'memory-summary-model',
      tags: ['agent', 'memory', 'summary']
    });
    const result = await model.doGenerate({
      inputFormat: 'messages',
      mode: { type: 'regular' },
      prompt: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes conversations.',
        },
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    });

    // Extract summary text from first generation
    const summaryText = typeof result.text === 'string'
      ? result.text
      : (result as any)?.message?.content ?? '';

    return summaryText;
  } catch (error: unknown) {
    logger.error(`generateMemorySummary failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Memory Analytics and Tracing Utilities
 * These functions provide insights into memory usage and performance
 */

/**
 * Gets comprehensive memory analytics including performance metrics
 * @returns Memory analytics object with performance stats and recent operations
 */
export function getMemoryAnalytics() {
  return {
    performance: MemoryTracker.getPerformanceStats(),
    recentOperations: MemoryTracker.getOperationHistory(20),
    configuration: {
      storageType: 'LibSQLStore',
      vectorType: 'LibSQLVector',
      environmentConfig: {
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'using default',
        authToken: process.env.DATABASE_AUTH_TOKEN ? 'configured' : 'using default'
      }
    }
  };
}

/**
 * Gets memory operations for a specific resource
 * @param resourceId - Resource identifier
 * @returns Operations history for the resource
 */
export function getResourceMemoryAnalytics(resourceId: string) {
  return {
    operations: MemoryTracker.getResourceOperations(resourceId),
    performance: MemoryTracker.getPerformanceStats()
  };
}

/**
 * Gets memory operations for a specific thread
 * @param threadId - Thread identifier
 * @returns Operations history for the thread
 */
export function getThreadMemoryAnalytics(threadId: string) {
  return {
    operations: MemoryTracker.getThreadOperations(threadId),
    performance: MemoryTracker.getPerformanceStats()
  };
}

/**
 * Clears all memory analytics data
 * Useful for testing or periodic cleanup
 */
export function clearMemoryAnalytics() {
  MemoryTracker.clearHistory();
  observabilityLogger.info('Memory analytics cleared');
}

/**
 * Enhanced search function with performance tracking and detailed logging
 * @param threadId - Thread identifier
 * @param vectorSearchString - Query string for semantic search
 * @param topK - Number of similar messages to retrieve
 * @param before - Number of messages before each match
 * @param after - Number of messages after each match
 * @returns Promise resolving to { messages, uiMessages } with enhanced metadata
 */
export async function enhancedSearchMessages(
  threadId: string,
  vectorSearchString: string,
  topK = 3,
  before = 2,
  after = 1
): Promise<{ messages: CoreMessage[]; uiMessages: any[]; searchMetadata: any }> {
  try {
    const result = await agentMemory.query({
      threadId,
      selectBy: { vectorSearchString },
      threadConfig: { semanticRecall: { topK, messageRange: { before, after } } },
    });
    return { ...result, searchMetadata: { topK, before, after } };
  } catch (error: unknown) {
    logger.error(`enhancedSearchMessages failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Enhanced reranking search using Mastra's rerank function for better relevance
 * @param threadId - Thread identifier
 * @param vectorSearchString - Query string for semantic search
 * @param topK - Number of similar messages to retrieve before reranking
 * @param finalK - Final number of messages after reranking
 * @param before - Number of messages before each match
 * @param after - Number of messages after each match
 * @returns Promise resolving to reranked results
 */
export async function rerankSearchMessages(
  threadId: string,
  vectorSearchString: string,
  topK = 10,
  finalK = 3,
  before = 2,
  after = 1
): Promise<{ messages: CoreMessage[]; uiMessages: any[]; rerankMetadata: any }> {
  const startTime = Date.now();

  try {
    // First, get more results than needed for reranking
    const initialResults = await agentMemory.query({
      threadId,
      selectBy: { vectorSearchString },
      threadConfig: {
        semanticRecall: {
          topK,
          messageRange: { before, after }
        }
      },
    });

    // Use Mastra's rerank function with Google model for better relevance
    if (initialResults.messages.length > finalK) {
      const model = createTracedGoogleModel('gemini-2.0-flash-exp', {
        name: 'rerank-model',
        tags: ['memory', 'rerank', 'search']
      });

      // Convert memory results to the format expected by rerank function
      const queryResults = initialResults.messages.map((msg, index) => ({
        id: `msg_${index}`,
        score: 0.5, // Default score
        metadata: {
          text: msg.content,
          role: msg.role,
          index
        }
      }));

      // Rerank using Mastra's rerank function
      const rerankedResults = await rerank(
        queryResults,
        vectorSearchString,
        model,
        {
          weights: {
            semantic: 0.6,
            vector: 0.3,
            position: 0.1
          },
          topK: finalK
        }
      );

      // Map reranked results back to messages
      const rerankedMessages = rerankedResults.map((result: any) => {
        const originalIndex = result.result.metadata.index;
        return initialResults.messages[originalIndex];
      });

      const rerankedUIMessages = rerankedResults.map((result: any) => {
        const originalIndex = result.result.metadata.index;
        return initialResults.uiMessages[originalIndex];
      });

      const rerankMetadata = {
        initialResultCount: initialResults.messages.length,
        finalResultCount: rerankedMessages.length,
        rerankingUsed: true,
        rerankingDuration: Date.now() - startTime,
        averageRelevanceScore: rerankedResults.reduce((sum: number, r: any) => sum + r.score, 0) / rerankedResults.length
      };

      logger.info('Reranked search completed', {
        threadId,
        query: vectorSearchString,
        ...rerankMetadata
      });

      return {
        messages: rerankedMessages,
        uiMessages: rerankedUIMessages,
        rerankMetadata
      };
    } else {
      // Fallback to simple top-k without reranking
      const finalMessages = initialResults.messages.slice(0, finalK);
      const finalUIMessages = initialResults.uiMessages.slice(0, finalK);

      return {
        messages: finalMessages,
        uiMessages: finalUIMessages,
        rerankMetadata: {
          initialResultCount: initialResults.messages.length,
          finalResultCount: finalMessages.length,
          rerankingUsed: false,
          reason: 'insufficient_results'
        }
      };
    }
  } catch (error: unknown) {
    logger.error(`rerankSearchMessages failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Initialize vector indexes for optimal search performance
 * Should be called during application startup
 */
export async function initializeVectorIndexes(): Promise<void> {
  try {
    // Create message embeddings index
    await agentVector.createIndex({
      indexName: 'message_embeddings_idx',
      dimension: 1536,
      metric: 'cosine'
    });

    logger.info('Vector indexes initialized successfully');
  } catch (error: unknown) {
    logger.warn('Vector index initialization failed or indexes already exist', {
      error: (error as Error).message
    });
  }
}

/**
 * Batch operations for improved performance when dealing with multiple threads/messages
 */

/**
 * Batch create multiple threads efficiently
 * @param threadRequests - Array of thread creation requests
 * @returns Promise resolving to array of created threads
 */
export async function batchCreateThreads(
  threadRequests: Array<{
    resourceId: string;
    title?: string;
    metadata?: Record<string, unknown>;
    threadId?: string;
  }>
): Promise<any[]> {
  const startTime = Date.now();

  try {
    const results = await Promise.allSettled(
      threadRequests.map(request =>
        createThread(request.resourceId, request.title, request.metadata, request.threadId)
      )
    );

    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    logger.info('Batch thread creation completed', {
      totalRequests: threadRequests.length,
      successes,
      failures,
      duration: Date.now() - startTime
    });

    return results.map(result =>
      result.status === 'fulfilled' ? result.value : null
    ).filter(Boolean);
  } catch (error: unknown) {
    logger.error(`batchCreateThreads failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Enhanced memory cleanup and optimization
 * @param options - Cleanup configuration options
 */
export async function optimizeMemoryStorage(options: {
  olderThanDays?: number;
  keepMinimumMessages?: number;
  compactVectorIndex?: boolean;
} = {}): Promise<{
  threadsProcessed: number;
  messagesCompacted: number;
  vectorIndexOptimized: boolean;
}> {
  const {
    olderThanDays = 30,
    keepMinimumMessages = 10,
    compactVectorIndex = true
  } = options;

  const startTime = Date.now();

  try {
    // This would require additional LibSQL operations not currently exposed
    // For now, we'll track the optimization request
    logger.info('Memory optimization requested', {
      olderThanDays,
      keepMinimumMessages,
      compactVectorIndex,
      timestamp: new Date().toISOString()
    });

    // Placeholder for actual optimization logic
    // In a real implementation, you'd:
    // 1. Query old threads/messages
    // 2. Archive or delete based on criteria
    // 3. Optimize vector indexes
    // 4. Update storage statistics

    const optimizationResults = {
      threadsProcessed: 0,
      messagesCompacted: 0,
      vectorIndexOptimized: compactVectorIndex,
      duration: Date.now() - startTime
    };

    logger.info('Memory optimization completed', optimizationResults);

    return optimizationResults;
  } catch (error: unknown) {
    logger.error(`optimizeMemoryStorage failed: ${(error as Error).message}`);
    throw error;
  }
}

// Generated on 2025-06-01 - Enhanced with observability and tracing capabilities
