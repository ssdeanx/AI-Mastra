# Changelog

All notable changes to this project are documented in this file.

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
