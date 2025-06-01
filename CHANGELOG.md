# Changelog

All notable changes to this project are documented in this file.

## [v0.0.4] - 2025-06-01

### Added

- **RAG Agent Implementation** (`src/mastra/agents/ragAgent.ts`)
  - Created specialized Knowledge Retrieval and Analysis agent with comprehensive search capabilities
  - Integrated `vectorQueryTool` for semantic similarity search with customizable parameters
  - Added `graphRAGTool` support for relationship-based document analysis
  - Implemented intelligent search strategy guidelines (vector, graph, hybrid approaches)
  - Connected to `agentMemory` for context retention across conversations
  - Added comprehensive TSDoc documentation with usage examples

- **Agent Network Architecture** (`src/mastra/networks/agentNetwork.ts`)
  - Implemented five specialized networks for different use cases:
    - `researchNetwork`: Coordinates research tasks with RAG, stock, weather, and MCP agents
    - `dataProcessingNetwork`: Specializes in data analysis with RAG for document processing
    - `contentCreationNetwork`: Uses RAG for research-backed content generation
    - `technicalOpsNetwork`: Handles technical tasks with RAG for documentation analysis
    - `comprehensiveNetwork`: Full multi-agent coordination for complex tasks
  - Added `NetworkAnalytics` class for performance tracking and usage statistics
  - Implemented `executeNetworkTask` with timing, error tracking, and observability
  - Added `checkNetworkHealth` for network status monitoring and diagnostics

- **Enhanced Observability System** (`src/mastra/observability/index.ts`)
  - Implemented comprehensive LangSmith integration with AI SDK wrapper support
  - Fixed duplicate `createTracedGoogleModel` functions and enhanced compatibility with all Google provider options
  - Created enhanced tracing utilities: `traceAgentOperation`, `traceNetworkOperation`, `traceRAGOperation`
  - Added `MemoryTracker` and `ErrorTracker` classes for detailed analytics and performance monitoring
  - Implemented `ObservabilityUtils` for agent and network instrumentation
  - Added performance measurement utilities with detailed logging and error tracking

- **LangSmith Hub Integration** (`src/mastra/observability/langHub.ts`)
  - Created `LangSmithHubManager` for prompt management and hub operations
  - Implemented pull/push operations for LangSmith Hub prompts with AI SDK adapter integration
  - Added prompt validation, versioning, and metadata management
  - Integrated with AI SDK for seamless prompt-to-model workflows
  - Added comprehensive error handling and logging for hub operations

- **Advanced Prompt Management** (`src/mastra/observability/promptManager.ts`)
  - Implemented `PromptManager` class with template rendering and variable substitution
  - Added prompt categorization by tags and metadata
  - Created validation system for prompt templates and variables
  - Integrated performance tracking for prompt operations
  - Added export/import functionality for prompt libraries

- **Google Provider Enhancements** (`src/mastra/observability/googleProvider.ts`)
  - Enhanced `createMastraGoogleProvider` to accept all Google AI provider options
  - Added support for comprehensive configuration including thinking config, safety settings, generation config
  - Improved compatibility with LangSmith tracing and AI SDK integration
  - Added proper option merging and default configuration handling

### Enhanced

- **MCP Dual-Client Architecture**
  - Implemented separate MCP clients for improved reliability and SSE support:
    - `mcpStdio`: Primary client for stdio-based servers (filesystem, jsSandbox, docker)
    - `mcpSmithery`: Secondary client for SSE-based Smithery servers (winterm, duckduckgo)
  - Added comprehensive MCP operation tracing with `MCPTracker` class for detailed analytics
  - Implemented graceful shutdown handlers for all MCP clients (SIGTERM, SIGINT, beforeExit)
  - Added resource caching with TTL support for enhanced performance
  - Introduced health check functionality for all MCP servers

- **MCP Observability & Tracing**
  - Added `traceMCPOperation` wrapper for comprehensive operation tracking
  - Implemented performance metrics collection (duration, success rates, error tracking)
  - Added server-specific analytics and operation history
  - Integrated with existing observability system (LangSmith, error tracking)

- **Knowledge Retrieval Capabilities**
  - Enhanced RAG Agent with vector similarity search using existing vector store ("mastra", "context")
  - Added graph-based relationship discovery for complex document analysis
  - Implemented intelligent routing in agent networks for research and analysis tasks
  - Integrated comprehensive search strategies with agent memory for context preservation

### Fixed

- **Google Provider Configuration**
  - Fixed duplicate `createTracedGoogleModel` functions in observability index
  - Resolved TypeScript compilation errors by removing duplicate function declarations
  - Enhanced `createMastraGoogleProvider` in `googleProvider.ts` to accept all Google AI provider options
  - Improved compatibility between LangSmith tracing and Google provider configurations
  - Fixed parameter passing between traced models and underlying Google provider

- **Agent-MCP Integration**
  - Fixed `mcp.getTools()` to return proper object format expected by Agent initialization
  - Maintained backward compatibility while adding dual-client support
  - Resolved SSE connection issues for Smithery-based servers with proper `eventSourceInit` configuration
  - Added robust error handling for server unavailability and connection failures

### Changed

- **MCP Tool Interface**
  - Enhanced main `mcp` export to intelligently route operations to appropriate client
  - Added `getToolsArray()` method for internal processing while maintaining `getTools()` object format
  - Improved error logging and fallback behavior when individual servers fail
  - Environment variable validation with graceful degradation when SMITHERY_API is not configured

## [v0.0.3] - 2025-06-01

### Fixed

- **Google Provider Configuration**
  - Fixed `createMastraGoogleProvider` in `src/mastra/observability/googleProvider.ts` to properly support all Google AI provider options including `thinkingConfig` for Gemini 2.5+ models.
  - Resolved ZodNull compatibility issues with advanced Gemini models by using clean `baseGoogle(modelId, options)` pattern.
  - Removed unnecessary grounding configuration bloat that was causing model initialization errors.

- **Agent Model Configuration**
  - Fixed `masterAgent` and `supervisorAgent` to use proper model providers with thinking budget configuration.
  - Ensured `createMastraGoogleProvider` supports `thinkingConfig: { thinkingBudget: 2048 }` for advanced reasoning models.

### Changed

- **Observability Tracing**
  - Updated agents to use `createTracedGoogleModel` for proper LangSmith tracing integration.
  - Maintained clean separation between Google provider creation and tracing wrapper functionality.

## [v0.0.2] - 2025-06-01

### Added

- **Agent Memory Enhancements**
  - Integrated Zod schemas for input validation on memory helper functions (createThread, getThreadMessages, getThreadById, getThreadsByResourceId, searchMessages, getUIThreadMessages, generateMemorySummary).
  - Added `PinoLogger` for structured error logging in all memory helpers.
  - Implemented semantic search (`searchMessages`) and UI retrieval (`getUIThreadMessages`) helpers.
  - Introduced `maskWorkingMemoryStream` to filter `<working_memory>` tags from streaming responses.
  - Added `generateMemorySummary` leveraging Google Gemini (`@ai-sdk/google`) to summarize recent thread history.
  - Configured `TokenLimiter` processor to enforce token limits in memory buffer (limit: 1,000,000 tokens).
  - Added `SummarizeMemoryProcessor` to condense overflow messages into a system summary placeholder, with a TODO for LLM-driven summaries.

- **MCP Tool Configuration**
  - Refactored `src/mastra/tools/mcp.ts` to parse `SMITHERY_API` from environment using Zod.
  - Updated `MCPClient` servers configuration to use `process.env.SMITHERY_API` instead of hardcoded keys.

- **Evaluation Framework** (`src/mastra/evals/index.ts`)
  - Instantiated and exported core LLM-based metrics using Google Gemini model:
    - `toxicityMetric`, `promptAlignmentMetric`, `contextualRecallMetric`, `contextRelevancyMetric`, `contextPrecisionMetric`.
  - Added custom metrics:
    - `WordInclusionMetric` to verify presence of specific words.
    - `ModelInfoMetric` to annotate which model was used during evaluation.

- **Mastra Instance Configuration** (`src/mastra/index.ts`)
  - Configured global `Mastra` instance with workflows (`weatherWorkflow`), agents, and LibSQL storage using environment variables (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`).
  - Added structured logging via `PinoLogger` for the Mastra core.

- **MCP Agent** (`src/mastra/agents/mcpAgent.ts`)
  - Improved `mcpAgent` to use agentMemory and structured instructions for Model Context Protocol interactions.

### Changed

- **Memory Default Settings**
  - Increased `lastMessages` context window to 50 and tuned `semanticRecall` to retrieve more context (`before:5`, `after:2`).
  - Updated storage backend URL parsing to support `process.env.DATABASE_URL`.

- **Code Hygiene**
  - Standardized use of `async/await` and robust `try/catch` blocks on all asynchronous operations.
  - Ensured all new code follows project-specific naming conventions and TSDoc standards.

### Fixed

- Resolved missing imports and type errors in evaluation metrics by adding required Zod schemas and correcting method calls (`doGenerate` instead of `generate`).

---

## [v0.0.1] - 2025-05-31

### Setup

- **Initial Project Setup**
  - Created initial project structure with TypeScript, Node.js, and essential dependencies.
  - Configured TypeScript compiler options and ESLint rules.
  - Set up basic folder structure for agents, tools, workflows, and evaluations.
- Initial commit with basic project structure.
- Initial project setup with TypeScript, Node.js, and essential dependencies.
- Set up a basic folder structure for the project.
- Created initial agents, tools, and workflows.
-

*This changelog adheres to the [Keep a Changelog](https://keepachangelog.com/) convention and semantic versioning.*
