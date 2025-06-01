import * as hub from "langchain/hub/node";
import { PinoLogger } from '@mastra/loggers';
import { z } from 'zod';

const logger = new PinoLogger({ name: 'prompt-manager', level: 'info' });

/**
 * Prompt Template Schema for validation
 */
export const PromptTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  template: z.string().min(1),
  variables: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  category: z.enum(['rag', 'evaluation', 'agent', 'workflow', 'system']).default('system'),
  version: z.string().default('1.0.0'),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString())
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * LangSmith Hub Prompt Configuration
 */
export interface LangSmithPromptConfig {
  hubId: string;
  localId: string;
  category: PromptTemplate['category'];
  variables?: string[];
  tags?: string[];
  description?: string;
}

/**
 * Built-in RAG and Agent Prompts
 */
export const BUILTIN_PROMPTS: Record<string, PromptTemplate> = {
  'rag-search-strategy': {
    id: 'rag-search-strategy',
    name: 'RAG Search Strategy',
    description: 'Guides RAG agents in choosing optimal search strategies',
    version: '1.0.0',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    template: `
You are analyzing a user query to determine the optimal RAG search strategy.

Query: {query}
Available Tools: {availableTools}
Context: {context}

Analyze the query and recommend:
1. **Search Strategy**: Choose from vector, graph, or hybrid
2. **Parameters**: Suggest topK, filters, and thresholds
3. **Reasoning**: Explain your strategy choice

Guidelines:
- Use vector search for semantic similarity and general knowledge
- Use graph search for relationship discovery and complex analysis
- Use hybrid for comprehensive research requiring both approaches
- Consider query complexity, specificity, and context

Output your recommendation in this format:
Strategy: [vector|graph|hybrid]
TopK: [5-50]
Filter: [specific filter criteria or empty]
Threshold: [0.0-1.0]
Reasoning: [detailed explanation]
    `.trim(),
    variables: ['query', 'availableTools', 'context'],
    tags: ['rag', 'search', 'strategy'],
    category: 'rag'
  },
  'document-analysis': {
    id: 'document-analysis',
    name: 'Document Analysis',
    description: 'Structured document analysis and insight extraction',
    version: '1.0.0',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    template: `
Analyze the following documents and extract key insights:

Documents: {documents}
Analysis Focus: {focusArea}
Analysis Type: {analysisType}

Provide a comprehensive analysis including:

## Summary
[Brief overview of the document collection]

## Key Points
[3-5 most important points from the documents]

## Insights
[Notable patterns, trends, or discoveries]

## Relevant Topics
[Main themes and subject areas covered]

## Confidence Assessment
Rate your confidence in this analysis (0.0-1.0) and explain factors affecting confidence.

Focus on accuracy, relevance, and actionable insights.
    `.trim(),
    variables: ['documents', 'focusArea', 'analysisType'],
    tags: ['rag', 'analysis', 'documents'],
    category: 'rag'
  },
  'knowledge-synthesis': {
    id: 'knowledge-synthesis',
    name: 'Knowledge Synthesis',
    description: 'Combines information from multiple sources into coherent insights',
    version: '1.0.0',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    template: `
Synthesize information from multiple sources to answer the user's question.

Question: {question}
Sources: {sources}
Context: {context}

Create a comprehensive response that:

1. **Direct Answer**: Address the question clearly and directly
2. **Supporting Evidence**: Reference specific sources and key information
3. **Multiple Perspectives**: Present different viewpoints if applicable
4. **Confidence Level**: Rate confidence and identify any gaps
5. **Follow-up Suggestions**: Recommend additional research areas

Format your response with clear sections and source attribution.
Maintain objectivity and acknowledge limitations in available information.
    `.trim(),
    variables: ['question', 'sources', 'context'],
    tags: ['rag', 'synthesis', 'research'],
    category: 'rag'
  },
  'agent-coordination': {
    id: 'agent-coordination',
    name: 'Agent Network Coordination',
    description: 'Guides agent networks in task routing and coordination',
    version: '1.0.0',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    template: `
You are coordinating a network of specialized agents to handle this task.

Task: {task}
Available Agents: {agents}
Agent Capabilities: {capabilities}
Context: {context}

Determine the optimal routing strategy:

## Task Analysis
[Break down the task into components]

## Agent Assignment
[Which agent(s) should handle which parts]

## Execution Strategy
[Sequential vs parallel, dependencies, coordination points]

## Success Criteria
[How to measure successful completion]

## Risk Mitigation
[Potential issues and fallback strategies]

Route efficiently while ensuring comprehensive task completion.
    `.trim(),
    variables: ['task', 'agents', 'capabilities', 'context'],
    tags: ['agent', 'coordination', 'network'],
    category: 'agent'
  },

  'evaluation': {
    id: 'evaluation',
    name: 'Evaluation Criteria',
    description: 'Defines comprehensive evaluation criteria for AI outputs',
    version: '1.0.0',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    template: `
Evaluate the AI system output against these criteria:

Output: {output}
Expected Result: {expected}
Context: {context}
Evaluation Focus: {focus}

Assess the following dimensions:

## Accuracy (0-10)
[Factual correctness and reliability]

## Relevance (0-10)
[Alignment with user intent and context]

## Completeness (0-10)
[Thoroughness of the response]

## Clarity (0-10)
[Understandability and structure]

## Usefulness (0-10)
[Practical value and actionability]

## Overall Score
[Weighted average with reasoning]

## Improvement Suggestions
[Specific recommendations for enhancement]

Provide detailed justification for each score.
    `.trim(),
    variables: ['output', 'expected', 'context', 'focus'],
    tags: ['evaluation', 'assessment', 'quality'],
    category: 'evaluation'
  }
};

/**
 * LangSmith Hub Integration
 */
export class LangSmithPromptManager {
  private cache: Map<string, any> = new Map();
  private hubPrompts: LangSmithPromptConfig[] = [
    {
      hubId: "deanmachines-ai/rag-prompt",
      localId: "rag-prompt-advanced",
      category: "rag",
      variables: ["context", "question"],
      tags: ["rag", "retrieval"],
      description: "Advanced RAG prompt from LangSmith Hub"
    },
    {
      hubId: "deanmachines-ai/chain-of-density",
      localId: "chain-of-density",
      category: "rag",
      variables: ["content"],
      tags: ["summarization", "density"],
      description: "Chain of Density summarization prompt"
    },
    {
      hubId: "deanmachines-ai/synthetic-training-data",
      localId: "synthetic-data-gen",
      category: "evaluation",
      variables: ["topic", "examples"],
      tags: ["training", "synthetic"],
      description: "Synthetic training data generation"
    },
    {
      hubId: "deanmachines-ai/react",
      localId: "react-agent",
      category: "agent",
      variables: ["tools", "input"],
      tags: ["react", "reasoning"],
      description: "ReAct reasoning pattern for agents"
    },
    {
      hubId: "deanmachines-ai/superb_system_instruction_prompt",
      localId: "system-instructions",
      category: "system",
      variables: ["role", "context"],
      tags: ["system", "instructions"],
      description: "Enhanced system instruction generation"
    },
    {
      hubId: "deanmachines-ai/model-evaluator",
      localId: "model-evaluation",
      category: "evaluation",
      variables: ["criteria", "output"],
      tags: ["evaluation", "scoring"],
      description: "Model evaluation and scoring"
    },
    {
      hubId: "deanmachines-ai/prompt-maker",
      localId: "prompt-generation",
      category: "system",
      variables: ["task"],
      tags: ["meta", "generation"],
      description: "Automated prompt generation"
    },
    {
      hubId: "hwchase17/xml-agent-convo",
      localId: "xml-agent-format",
      category: "agent",
      variables: ["tools", "conversation"],
      tags: ["xml", "format", "tools"],
      description: "XML-formatted agent conversations"
    }
  ];

  /**
   * Pulls a prompt from LangSmith Hub with caching
   */
  async pullFromHub(hubId: string, includeModel: boolean = true): Promise<Record<string, any>> {
    try {
      const cacheKey = `${hubId}-${includeModel}`;
      
      if (this.cache.has(cacheKey)) {
        logger.debug(`Returning cached prompt: ${hubId}`);
        const cachedPrompt = this.cache.get(cacheKey);
        if (!cachedPrompt) throw new Error('Cached prompt is undefined');
        return cachedPrompt as Record<string, any>;
      }

      logger.info(`Pulling prompt from LangSmith Hub: ${hubId}`);
      const prompt = await hub.pull(hubId, { includeModel });
      if (!prompt || typeof prompt !== 'object') {
        throw new Error('Invalid prompt format received from hub');
      }
      
      this.cache.set(cacheKey, prompt);
      logger.info(`Successfully cached prompt: ${hubId}`);
      
      return prompt as Record<string, any>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to pull prompt ${hubId}:`, { error: errorMessage });
      throw new Error(`LangSmith Hub pull failed for ${hubId}: ${errorMessage}`);
    }
  }  /**   * Gets all available hub prompts with metadata
   */  getHubPrompts(): LangSmithPromptConfig[] {
    return this.hubPrompts;
  }

  /**
   * Finds hub prompt by local ID
   */
  getHubPromptById(localId: string): LangSmithPromptConfig | undefined {
    return this.hubPrompts.find(p => p.localId === localId);
  }

  /**
   * Finds hub prompts by category
   */
  getHubPromptsByCategory(category: PromptTemplate['category']): LangSmithPromptConfig[] {
    return this.hubPrompts.filter(p => p.category === category);
  }

  /**
   * Clears the prompt cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Prompt cache cleared');
  }
}

/**
 * Enhanced Prompt Manager with LangSmith integration
 */
export class PromptManager {
  private prompts: Map<string, PromptTemplate> = new Map();
  private langsmithManager: LangSmithPromptManager;

  constructor() {
    this.langsmithManager = new LangSmithPromptManager();
    this.loadBuiltinPrompts();
  }

  /**
   * Loads built-in prompts into the manager
   */
  private loadBuiltinPrompts(): void {
    Object.values(BUILTIN_PROMPTS).forEach(prompt => {
      this.prompts.set(prompt.id, prompt);
    });
    logger.info(`Loaded ${this.prompts.size} built-in prompts`);
  }

  /**
   * Adds a new prompt template
   */
  addPrompt(prompt: Omit<PromptTemplate, 'createdAt' | 'updatedAt'>): void {
    const validatedPrompt = PromptTemplateSchema.parse({
      ...prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.prompts.set(validatedPrompt.id, validatedPrompt);
    logger.info(`Added prompt: ${validatedPrompt.id}`);
  }

  /**
   * Gets a prompt by ID
   */
  getPrompt(id: string): PromptTemplate | undefined {
    return this.prompts.get(id);
  }

  /**
   * Gets prompts by category
   */
  getPromptsByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.prompts.values()).filter(p => p.category === category);
  }

  /**
   * Gets prompts by tag
   */
  getPromptsByTag(tag: string): PromptTemplate[] {
    return Array.from(this.prompts.values()).filter(p => p.tags.includes(tag));
  }

  /**
   * Renders a prompt with variables
   */
  renderPrompt(id: string, variables: Record<string, string>): string {
    const prompt = this.getPrompt(id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    let rendered = prompt.template;
    
    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    // Check for unreplaced variables
    const unreplacedVars = rendered.match(/\{[^}]+\}/g);
    if (unreplacedVars) {
      logger.warn(`Unreplaced variables in prompt ${id}:`, unreplacedVars);
    }

    return rendered;
  }

  /**
   * Updates an existing prompt
   */
  updatePrompt(id: string, updates: Partial<PromptTemplate>): void {
    const existing = this.prompts.get(id);
    if (!existing) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const updated = PromptTemplateSchema.parse({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    });

    this.prompts.set(id, updated);
    logger.info(`Updated prompt: ${id}`);
  }

  /**
   * Deletes a prompt
   */
  deletePrompt(id: string): boolean {
    const deleted = this.prompts.delete(id);
    if (deleted) {
      logger.info(`Deleted prompt: ${id}`);
    }
    return deleted;
  }

  /**
   * Lists all available prompts
   */
  listPrompts(): PromptTemplate[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Gets the LangSmith manager
   */
  getLangSmithManager(): LangSmithPromptManager {
    return this.langsmithManager;
  }

  /**
   * Pulls and caches a prompt from LangSmith Hub
   */
  async pullFromHub(localId: string): Promise<any> {
    const config = this.langsmithManager.getHubPromptById(localId);
    if (!config) {
      throw new Error(`Hub prompt configuration not found: ${localId}`);
    }

    return await this.langsmithManager.pullFromHub(config.hubId);
  }

  /**
   * Gets prompt statistics
   */
  getStats(): {
    totalPrompts: number;
    byCategory: Record<string, number>;
    byTag: Record<string, number>;
    hubPrompts: number;
  } {
    const prompts = this.listPrompts();
    
    const byCategory = prompts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byTag = prompts.reduce((acc, p) => {
      p.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPrompts: prompts.length,
      byCategory,
      byTag,
      hubPrompts: this.langsmithManager.getHubPrompts().length
    };
  }
}

/**
 * Global prompt manager instance
 */
export const promptManager = new PromptManager();

/**
 * Utility functions for common prompt operations
 */
export const PromptUtils = {
  /**
   * Validates prompt template variables
   */
  validateVariables(template: string, variables: Record<string, string>): string[] {
    const templateVars = template.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || [];
    const missing = templateVars.filter(v => !variables.hasOwnProperty(v));
    return missing;
  },

  /**
   * Extracts variables from a template
   */
  extractVariables(template: string): string[] {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(v => v.slice(1, -1)) : [];
  },

  /**
   * Formats a prompt for RAG operations
   */
  formatRAGPrompt(query: string, context: string[], metadata?: Record<string, any>): string {
    const contextString = context.join('\n\n');
    const metaString = metadata ? JSON.stringify(metadata, null, 2) : '';
    
    return promptManager.renderPrompt('knowledge-synthesis', {
      question: query,
      sources: contextString,
      context: metaString
    });
  },

  /**
   * Formats a prompt for document analysis
   */
  formatAnalysisPrompt(documents: string[], focusArea: string = '', analysisType: string = 'comprehensive'): string {
    return promptManager.renderPrompt('document-analysis', {
      documents: documents.join('\n---\n'),
      focusArea,
      analysisType
    });
  }
};

// Generated on 2025-06-01 - Comprehensive Prompt Management System with LangSmith Integration