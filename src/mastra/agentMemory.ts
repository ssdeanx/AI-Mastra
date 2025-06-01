import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { fastembed } from '@mastra/fastembed';
import { z } from 'zod';
import { PinoLogger } from '@mastra/loggers';
import type { CoreMessage, Telemetry } from '@mastra/core';
import { maskStreamTags } from '@mastra/core/utils';
import { MemoryProcessor } from '@mastra/core/memory';
import { TokenLimiter } from '@mastra/memory/processors';
import { RegisteredLogger, IMastraLogger } from '@mastra/core/logger';
import { Tracer } from '@opentelemetry/api';
import { google } from '@ai-sdk/google';

const logger = new PinoLogger({ name: 'agentMemory', level: 'info' });

// Create shared storage instance
export const agentStorage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:./memory.db',
  authToken: process.env.DATABASE_AUTH_TOKEN || '',
});

export const agentVector = new LibSQLVector({
  connectionUrl: process.env.DATABASE_URL || 'file:./vector.db',
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
    lastMessages: 50,
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
export async function createThread(resourceId: string, title?: string, metadata?: Record<string, unknown>, threadId?: string) {
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
export async function getThreadMessages(resourceId: string, threadId: string, last = 10) {
  const params = getMessagesSchema.parse({ resourceId, threadId, last });
  try {
    return await agentMemory.query({ resourceId: params.resourceId, threadId: params.threadId, selectBy: { last: params.last } });
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
  before = 0,
  after = 0
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
export async function getUIThreadMessages(threadId: string, last = 10): Promise<any[]> {
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
    const model = google('gemini-2.0-flash-exp');
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

// Generated on 2025-06-01 - Enhanced with shared storage export and improved TSDoc
