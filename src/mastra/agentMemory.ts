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
  createTraceableMemoryOperation, 
  createTraceableThreadOperation, 
  measureMemoryOperation,
  MemoryTracker,
  observabilityLogger,
  createTracedGoogleModel 
} from './observability';

const logger = new PinoLogger({ name: 'agentMemory', level: 'info' });

// Create shared storage instance
export const agentStorage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:./memory.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || ''
});

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
 * - Uses LibSQLStore for persistent storage (file:./memory.db)
 * - Uses LibSQLVector for semantic search (file:./vector.db)
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
# Tasks & Goals
- Goal ID:
- Goal Name:
- Description:
- Status:
- Due Date:
- Task ID:
- Title:
- Task Name:
- Description:
- Assigned To:
- Priority:
- Due Date:
- Status:
`,
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
export const createThread = createTraceableThreadOperation(
  'createThread',
  async (resourceId: string, title?: string, metadata?: Record<string, unknown>, threadId?: string) => {
    const params = createThreadSchema.parse({ resourceId, threadId, title, metadata });
    
    return await measureMemoryOperation(
      'createThread',
      resourceId,
      threadId,
      async () => {
        try {
          const result = await agentMemory.createThread(params);
          observabilityLogger.debug('Thread created successfully', {
            resourceId,
            threadId: threadId || 'auto-generated',
            title,
            metadata,
            resultType: typeof result
          });
          return result;
        } catch (error: unknown) {
          const errorMessage = (error as Error).message;
          logger.error(`createThread failed: ${errorMessage}`);
          observabilityLogger.error('Thread creation failed', {
            resourceId,
            threadId,
            error: errorMessage
          });
          throw error;
        }
      }
    );
  }
);

/**
 * Query messages for a thread
 * @param resourceId - User/resource ID
 * @param threadId - Thread ID
 * @param last - Number of last messages to retrieve
 * @returns Promise resolving to thread messages
 */
export const getThreadMessages = createTraceableThreadOperation(
  'getThreadMessages',
  async (resourceId: string, threadId: string, last = 10) => {
    const params = getMessagesSchema.parse({ resourceId, threadId, last });
    
    return await measureMemoryOperation(
      'getThreadMessages',
      resourceId,
      threadId,
      async () => {
        try {
          const result = await agentMemory.query({ 
            resourceId: params.resourceId, 
            threadId: params.threadId, 
            selectBy: { last: params.last } 
          });
          
          observabilityLogger.debug('Thread messages retrieved successfully', {
            resourceId,
            threadId,
            messageCount: result.messages?.length || 0,
            requestedLast: last
          });
          
          return result;
        } catch (error: unknown) {
          const errorMessage = (error as Error).message;
          logger.error(`getThreadMessages failed: ${errorMessage}`);
          observabilityLogger.error('Thread message retrieval failed', {
            resourceId,
            threadId,
            requestedLast: last,
            error: errorMessage
          });
          throw error;
        }
      }
    );
  }
);

/**
 * Retrieve a memory thread by its ID.
 * @param threadId - Thread identifier
 * @returns Promise resolving to thread information
 */
export const getThreadById = createTraceableThreadOperation(
  'getThreadById',
  async (threadId: string) => {
    const id = threadIdSchema.parse(threadId);
    
    return await measureMemoryOperation(
      'getThreadById',
      undefined,
      threadId,
      async () => {
        try {
          const result = await agentMemory.getThreadById({ threadId: id });
          observabilityLogger.debug('Thread retrieved by ID successfully', {
            threadId
          });
          return result;
        } catch (error: unknown) {
          const errorMessage = (error as Error).message;
          logger.error(`getThreadById failed: ${errorMessage}`);
          observabilityLogger.error('Thread retrieval by ID failed', {
            threadId,
            error: errorMessage
          });
          throw error;
        }
      }
    );
  }
);

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
export const enhancedSearchMessages = createTraceableMemoryOperation(
  'enhancedSearchMessages',
  async (
    threadId: string,
    vectorSearchString: string,
    topK = 3,
    before = 2,
    after = 1
  ): Promise<{ messages: CoreMessage[]; uiMessages: any[]; searchMetadata: any }> => {
    const params = searchMessagesSchema.parse({ threadId, vectorSearchString, topK, before, after });
    
    return await measureMemoryOperation(
      'enhancedSearchMessages',
      undefined,
      threadId,
      async () => {
        try {
          const startTime = Date.now();
          const result = await agentMemory.query({
            threadId: params.threadId,
            selectBy: { vectorSearchString: params.vectorSearchString },
            threadConfig: { 
              semanticRecall: { 
                topK: params.topK, 
                messageRange: { before: params.before, after: params.after } 
              } 
            },
          });
          const searchDuration = Date.now() - startTime;
          
          const searchMetadata = {
            searchDuration: `${searchDuration}ms`,
            query: vectorSearchString,
            resultCount: result.messages?.length || 0,
            topK,
            contextWindow: { before, after },
            timestamp: new Date().toISOString()
          };
          
          observabilityLogger.info('Enhanced semantic search completed', {
            threadId,
            vectorSearchString,
            searchMetadata
          });
          
          return {
            ...result,
            searchMetadata
          };
        } catch (error: unknown) {
          const errorMessage = (error as Error).message;
          logger.error(`enhancedSearchMessages failed: ${errorMessage}`);
          observabilityLogger.error('Enhanced semantic search failed', {
            threadId,
            vectorSearchString,
            error: errorMessage
          });
          throw error;
        }
      }
    );
  }
);

// Generated on 2025-06-01 - Enhanced with observability and tracing capabilities
