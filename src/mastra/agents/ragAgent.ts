import { Agent } from '@mastra/core';
import { createTracedGoogleModel, traceRAGOperation } from '../observability';
import { agentMemory } from '../agentMemory';
import { vectorQueryTool } from '../tools/vectorQueryTool';
import { graphTool } from '../tools/graphRAG';
import { langSmithHub, LangSmithHubUtils } from '../observability/langHub';
import { promptManager } from '../observability/promptManager';
import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({ name: 'rag-agent', level: 'info' });

/**
 * RAG Agent for Semantic Search and Knowledge Retrieval
 * 
 * Specialized agent that combines vector search, graph-based retrieval,
 * and document analysis for comprehensive knowledge discovery.
 * 
 * @remarks
 * - Uses vector similarity search for semantic matching
 * - Supports graph-based RAG for relationship discovery
 * - Provides document analysis and summarization
 * - Integrates with agent memory for context retention
 * - Traces all operations for observability
 * 
 * @example
 * // Basic knowledge search
 * const result = await ragAgent.generate('Find information about climate change impacts', {
 *   resourceId: 'research-123',
 *   threadId: 'env-study'
 * });
 * 
 * // Advanced search with specific parameters
 * const result = await ragAgent.callTool('vectorQueryTool', {
 *   queryText: 'renewable energy technologies',
 *   topK: 15,
 *   filter: ''
 * });
 */
export const ragAgent: Agent = new Agent({
  name: 'RAG Agent',
  instructions: `
    You are a specialized Knowledge Retrieval and Analysis agent with expertise in semantic search,
    document analysis, and information synthesis.

    Your primary capabilities:
    
    🔍 **Knowledge Search**:
    - Perform vector-based semantic similarity search using vectorQueryTool
    - Execute graph-based relationship discovery using graphRAGTool (when configured)
    - Use hybrid search strategies for comprehensive results
    - Filter and rank results by relevance and confidence
    
    📊 **Document Analysis**:
    - Analyze and summarize retrieved documents
    - Extract key insights and main points
    - Identify relevant topics and themes
    - Provide confidence assessments for findings
    
    🧠 **Research Strategy**:
    - Break down complex research queries into focused searches
    - Combine multiple search approaches for thorough coverage
    - Synthesize information from diverse sources
    - Maintain context across multi-turn conversations
    
    **Tools Available**:
    - vectorQueryTool: Vector similarity search with customizable parameters
      - queryText: The search query
      - topK: Number of results to return
      - filter: Optional filter criteria
    - graphRAGTool: Graph-based relationship mining (when configured with documents)
      - documentChunks: Array of document chunks
      - embeddings: Corresponding embeddings
      - queryEmbedding: Query embedding for search
    
    **Best Practices**:
    - Always specify search parameters based on query complexity
    - Use vectorQueryTool for most semantic search tasks
    - Use graphRAGTool when you have pre-processed documents and embeddings
    - Provide clear confidence levels and source attribution
    - Explain your search strategy and reasoning
    - Save important findings to memory for future reference
    
    **Search Strategy Guidelines**:
    1. For general knowledge queries: Use vectorQueryTool with topK=10-20
    2. For specific information: Use vectorQueryTool with topK=5-10 and specific filter
    3. For relationship discovery: Use graphRAGTool when documents are available
    4. For comprehensive research: Combine multiple searches with different parameters
    
    When users ask for research or information retrieval:
    1. Analyze the query to determine optimal search strategy
    2. Execute appropriate tool with relevant parameters
    3. Analyze and synthesize results
    4. Present findings with confidence levels and sources
    5. Suggest follow-up searches if needed
    
    Example usage patterns:
    - "Search for information about renewable energy" → vectorQueryTool with queryText="renewable energy", topK=15
    - "Find specific data on solar panel efficiency" → vectorQueryTool with queryText="solar panel efficiency data", topK=10
    - "Analyze relationships between climate policies" → graphRAGTool (if documents available)
  `,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', {
    name: 'rag-agent-model',
    tags: ['agent', 'rag', 'search', 'analysis']
  }),
  tools: {
    vectorQueryTool,
    graphTool
  },
  memory: agentMemory,
});

// Generated on 2025-06-01 - RAG Agent with comprehensive knowledge retrieval capabilities

/**
 * Enhanced RAG Agent factory with dynamic prompt integration
 * 
 * @param context - Optional context for dynamic prompt generation
 * @returns Enhanced RAG Agent with LangSmith Hub integration
 */
export const createEnhancedRAGAgent = traceRAGOperation(
  async (context?: { query?: string; documents?: string; context?: string }) => {
    // Generate dynamic instructions using prompt manager and LangSmith Hub
    const generateInstructions = async (): Promise<string> => {
      try {
        // Use built-in prompt manager for strategy guidance
        const strategyPrompt = promptManager.renderPrompt('rag-search-strategy', {
          query: context?.query || 'general knowledge search',
          availableTools: 'vectorQueryTool, graphRAGTool',
          context: context?.context || 'research and analysis'
        });

        // Get RAG prompt from LangSmith Hub if available
        let ragPrompt = '';
        try {
          ragPrompt = await LangSmithHubUtils.getRagPrompt({
            context: context?.documents || 'Available vector database with indexed documents',
            question: context?.query || 'User research query'
          });
        } catch (error) {
          logger.warn('Failed to load LangSmith Hub RAG prompt, using built-in', { error });
          ragPrompt = promptManager.renderPrompt('knowledge-synthesis', {
            question: context?.query || 'User research query',
            sources: 'Vector database and graph relationships',
            context: context?.context || 'research and analysis'
          });
        }

        return `
          ${strategyPrompt}

          ## Enhanced RAG Instructions
          ${ragPrompt}

          ## Core Capabilities
          You are a specialized Knowledge Retrieval and Analysis agent with expertise in semantic search,
          document analysis, and information synthesis.

          **Tools Available**:
          - vectorQueryTool: Vector similarity search with customizable parameters
          - graphRAGTool: Graph-based relationship mining (when configured with documents)

          **Dynamic Strategy Selection**:
          - Analyze query complexity and choose optimal search approach
          - Use LangSmith Hub prompts for standardized RAG patterns
          - Provide confidence assessments and source attribution
          - Maintain context across conversations using agent memory
        `;
      } catch (error) {
        logger.error('Failed to generate dynamic instructions, using fallback', { error });
        return ragAgent.instructions as string; // Fallback to original
      }
    };

    const instructions = await generateInstructions();

    return new Agent({
      name: 'Enhanced RAG Agent',
      instructions,
      model: createTracedGoogleModel('gemini-2.0-flash-exp', {
        name: 'enhanced-rag-agent-model',
        tags: ['agent', 'rag', 'enhanced', 'langsmith'],
        metadata: {
          promptSource: 'dynamic',
          hubIntegration: true,
          context: context?.context
        }
      }),
      tools: {
        vectorQueryTool,
        graphTool
      },
      memory: agentMemory,
    });
  },
  'analysis'
);

/**
 * Utility functions for RAG Agent operations
 */
export const RAGAgentUtils = {
  /**
   * Create a RAG agent optimized for specific use cases
   */
  async createSpecializedRAGAgent(specialization: 'research' | 'analysis' | 'synthesis' | 'general') {
    const contexts = {
      research: {
        query: 'comprehensive research query',
        context: 'academic and scientific research',
        documents: 'research papers and academic sources'
      },
      analysis: {
        query: 'analytical investigation',
        context: 'data analysis and insights extraction',
        documents: 'structured data and reports'
      },
      synthesis: {
        query: 'information synthesis task',
        context: 'knowledge combination and integration',
        documents: 'multiple diverse sources'
      },
      general: {
        query: 'general knowledge search',
        context: 'broad information retrieval',
        documents: 'general knowledge base'
      }
    };

    return await createEnhancedRAGAgent(contexts[specialization]);
  },

  /**
   * Get workflow prompts for RAG operations
   */
  getWorkflowPrompts() {
    return LangSmithHubUtils.createWorkflowPrompts();
  }
};