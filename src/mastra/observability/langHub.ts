import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PinoLogger } from "@mastra/loggers";
import { z } from 'zod';

const logger = new PinoLogger({ name: 'langsmith-hub', level: 'info' });

/**
 * Configuration for LangSmith Hub integration
 */
export const LangSmithHubConfigSchema = z.object({
  apiKey: z.string().optional(),
  endpoint: z.string().default('https://api.smith.langchain.com'),
  project: z.string().default('default'),
  tracing: z.boolean().default(true)
});

export type LangSmithHubConfig = z.infer<typeof LangSmithHubConfigSchema>;

/**
 * LangSmith Hub prompt reference
 */
export const HubPromptRefSchema = z.object({
  hubId: z.string(),
  localId: z.string(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  category: z.enum(['rag', 'agent', 'evaluation', 'workflow', 'general']).default('general'),
  version: z.string().optional(),
  cached: z.boolean().default(false),
  lastPulled: z.string().optional()
});

export type HubPromptRef = z.infer<typeof HubPromptRefSchema>;

/**
 * Enhanced LangSmith Hub integration with caching and error handling
 */
export class LangSmithHub {
  private config: LangSmithHubConfig;
  private promptCache: Map<string, any> = new Map();
  private prompts: Map<string, HubPromptRef> = new Map();

  constructor(config?: Partial<LangSmithHubConfig>) {
    this.config = LangSmithHubConfigSchema.parse({
      apiKey: process.env.LANGSMITH_API_KEY,
      endpoint: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
      project: process.env.LANGSMITH_PROJECT || 'default',
      tracing: process.env.LANGSMITH_TRACING === 'true',
      ...config
    });

    this.initializeBuiltinPrompts();
    logger.info('LangSmith Hub initialized', { 
      project: this.config.project,
      tracing: this.config.tracing 
    });
  }

  /**
   * Initialize built-in prompt references for common use cases
   */
  private initializeBuiltinPrompts(): void {
    const builtinPrompts: HubPromptRef[] = [
      {
        hubId: 'langchain-ai/rag-prompt',
        localId: 'rag-qa-prompt',
        description: 'Standard RAG Q&A prompt for document-based answers',
        tags: ['rag', 'qa', 'documents'],
        category: 'rag',
        cached: false
      },
      {
        hubId: 'langchain-ai/retrieval-qa-chat',
        localId: 'rag-chat-prompt',
        description: 'Conversational RAG prompt with chat history',
        tags: ['rag', 'chat', 'conversation'],
        category: 'rag',
        cached: false
      },
      {
        hubId: 'hwchase17/openai-functions-agent',
        localId: 'agent-functions-prompt',
        description: 'OpenAI functions agent prompt template',
        tags: ['agent', 'functions', 'tools'],
        category: 'agent',
        cached: false
      },
      {
        hubId: 'langchain-ai/sql-agent',
        localId: 'sql-agent-prompt',
        description: 'SQL database query agent prompt',
        tags: ['agent', 'sql', 'database'],
        category: 'agent',
        cached: true
      }
    ];

    builtinPrompts.forEach(prompt => {
      this.prompts.set(prompt.localId, prompt);
    });

    logger.info(`Registered ${builtinPrompts.length} built-in prompt references`);
  }

  /**
   * Pull a prompt from LangChain Hub with caching
   */
  async pullPrompt(hubId: string, version?: string): Promise<ChatPromptTemplate> {
    const cacheKey = version ? `${hubId}:${version}` : hubId;
    
    try {
      // Check cache first
      if (this.promptCache.has(cacheKey)) {
        logger.debug(`Using cached prompt: ${cacheKey}`);
        return this.promptCache.get(cacheKey) as ChatPromptTemplate;
      }

      // Pull from hub
      const fullId = version ? `${hubId}:${version}` : hubId;
      logger.info(`Pulling prompt from hub: ${fullId}`);
      
      const prompt = await pull<ChatPromptTemplate>(fullId);
      
      // Cache the result
      this.promptCache.set(cacheKey, prompt);
      
      // Update local reference if exists
      const localRef = Array.from(this.prompts.values()).find(p => p.hubId === hubId);
      if (localRef) {
        localRef.cached = true;
        localRef.lastPulled = new Date().toISOString();
        this.prompts.set(localRef.localId, localRef);
      }

      logger.info(`Successfully pulled and cached prompt: ${fullId}`);
      return prompt;
    } catch (error) {
      logger.error(`Failed to pull prompt from hub: ${hubId}`, { error });
      throw new Error(`Failed to pull prompt: ${hubId} - ${error}`);
    }
  }
  /**
   * Get a prompt by local ID with automatic hub pulling
   */
  async getPrompt(localId: string, version?: string): Promise<ChatPromptTemplate> {
    const ref = this.prompts.get(localId);
    if (!ref) {
      throw new Error(`Prompt reference not found: ${localId}`);
    }

    return await this.pullPrompt(ref.hubId, version);
  }

  /**
   * Register a new prompt reference
   */
  registerPrompt(prompt: HubPromptRef): void {
    const validated = HubPromptRefSchema.parse(prompt);
    this.prompts.set(validated.localId, validated);
    logger.info(`Registered prompt reference: ${validated.localId} -> ${validated.hubId}`);
  }

  /**
   * List all registered prompt references
   */
  listPrompts(): HubPromptRef[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Get prompts by category
   */
  getPromptsByCategory(category: HubPromptRef['category']): HubPromptRef[] {
    return this.listPrompts().filter(p => p.category === category);
  }

  /**
   * Get prompts by tag
   */
  getPromptsByTag(tag: string): HubPromptRef[] {
    return this.listPrompts().filter(p => p.tags.includes(tag));
  }

  /**
   * Clear the prompt cache
   */
  clearCache(): void {
    this.promptCache.clear();
    this.prompts.forEach(prompt => {
      prompt.cached = false;
      prompt.lastPulled = undefined;
    });
    logger.info('Prompt cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalPrompts: number;
    cachedPrompts: number;
    cacheSize: number;
    byCategory: Record<string, number>;
  } {
    const prompts = this.listPrompts();
    const cached = prompts.filter(p => p.cached);
    
    const byCategory = prompts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPrompts: prompts.length,
      cachedPrompts: cached.length,
      cacheSize: this.promptCache.size,
      byCategory
    };
  }

  /**
   * Format a prompt for AI SDK usage
   */
  async formatForAISDK(localId: string, variables: Record<string, any> = {}): Promise<string> {
    try {
      const prompt = await this.getPrompt(localId);
      const formatted = await prompt.format(variables);
      return formatted;
    } catch (error) {
      logger.error(`Failed to format prompt for AI SDK: ${localId}`, { error });
      throw error;
    }
  }

  /**
   * Create a prompt adapter for LangChain integration
   */
  createPromptAdapter(localId: string) {
    return {
      async format(variables: Record<string, any>): Promise<string> {
        return await langSmithHub.formatForAISDK(localId, variables);
  },
  async getTemplate(): Promise<ChatPromptTemplate> {
    return await langSmithHub.getPrompt(localId);
  }    };
  }
}

/**
 * Global LangSmith Hub instance
 */
export const langSmithHub = new LangSmithHub();

/**
 * Utility functions for LangSmith Hub integration
 */
export const LangSmithHubUtils = {
  /**
   * Quick access to RAG prompts
   */
  async getRagPrompt(variables: { context: string; question: string }): Promise<string> {
    return await langSmithHub.formatForAISDK('rag-qa-prompt', variables);
  },

  /**
   * Quick access to agent prompts
   */
  async getAgentPrompt(variables: Record<string, any>): Promise<string> {
    return await langSmithHub.formatForAISDK('agent-functions-prompt', variables);
  },

  /**
   * Create a prompt registry for workflows
   */
  createWorkflowPrompts() {
    return {
      rag: langSmithHub.createPromptAdapter('rag-qa-prompt'),
      chat: langSmithHub.createPromptAdapter('rag-chat-prompt'),
      agent: langSmithHub.createPromptAdapter('agent-functions-prompt'),
      sql: langSmithHub.createPromptAdapter('sql-agent-prompt')
    };
  }
};
import * as hub from "langchain/hub/node";


//From Sparse to Dense: GPT-4 Summarization with Chain of Density Prompting: https://arxiv.org/abs/2309.04269

// Forked from https://smith.langchain.com/hub/lawwu/chain_of_density?organizationId=ebbaf2eb-769b-4505-aca2-d11de10372a4 to add a better descript  ion
await hub.pull("deanmachines-ai/rag-prompt", {
  includeModel: true
});

// Generation of Q/A Pair Training Data with AI Personality Injection
await hub.pull("deanmachines-ai/chain-of-density", {
  includeModel: true
});

// See documentation here: https://python.langchain.com/v0.2/docs/tutorials/rag/
await hub.pull("deanmachines-ai/synthetic-training-data", {
  includeModel: true
});

//   {tools} Action: the action to take, should be one of [{tool_names}]
// Action Input: the input to the action
// Observation: the result of the action
//Question: {input} Thought:{agent_scratchpad}
await hub.pull("deanmachines-ai/react", {
  includeModel: true
});
//  Get Better System Prompts.
await hub.pull("deanmachines-ai/superb_system_instruction_prompt", {
  includeModel: true
});

// Scores models or already existing LangSmith runs/datasets based on custom criteria. Useful for quality checking and benchmarking.
await hub.pull("deanmachines-ai/model-evaluator", {
  includeModel: true
});

//  {task} 
await hub.pull("deanmachines-ai/prompt-maker", {
  includeModel: true
});

// In order to use a tool, you can use <tool></tool> and <tool_input></tool_input> tags. You will then get back a response in the form <observation></observation>
await hub.pull("hwchase17/xml-agent-convo", );