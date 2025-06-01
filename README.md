# Mastra Agents

Mastra is a framework for building AI agents. It provides a set of pre-defined agents that can be used for various tasks. Each agent is designed to handle a specific type of request and can be customized to fit your needs.

## Available Agents

1. **Worker Agent**: Handles file management and data retrieval tasks.
2. **Weather Agent**: Provides weather information for specific locations.
3. **Stock Agent**: Fetches stock information for specific companies.
4. **MCP Agent**: Interacts with the Model Context Protocol (MCP) for advanced tasks.
5. **Supervisor Agent**: Manages user interactions and delegates tasks to other agents.

## Usage

To use an agent, simply import it and call its `handle` method with the user's request. The agent will process the request and return a response.

```typescript
import { weatherAgent } from './agents/weather-agent';

const response = await weatherAgent.handle({
  location: 'New York, NY'
});
```

```mermaid
graph TD

    2164["User<br>External Actor"]
    subgraph 2151["External Systems"]
        2161["AI/LLM APIs<br>Google AI, etc."]
        2162["Observability Platforms<br>LangSmith, etc."]
        2163["Third-Party Services<br>MCP/Smithery, etc."]
    end
    subgraph 2152["AI Mastra Application<br>Node.js / TypeScript"]
        2153["Mastra Core Orchestrator<br>TypeScript"]
        2154["Business Workflows<br>TypeScript"]
        2155["AI Agent Services<br>TypeScript"]
        2156["Agent State &amp; Memory<br>TypeScript / LibSQL"]
        2157["Specialized Tools<br>TypeScript"]
        2158["Telemetry &amp; Tracing<br>TypeScript"]
        2159["Background Job Functions<br>TypeScript / Inngest"]
        2160["AI Evaluation Framework<br>TypeScript"]
        %% Edges at this level (grouped by source)
        2153["Mastra Core Orchestrator<br>TypeScript"] -->|orchestrates| 2154["Business Workflows<br>TypeScript"]
        2153["Mastra Core Orchestrator<br>TypeScript"] -->|initializes| 2156["Agent State &amp; Memory<br>TypeScript / LibSQL"]
        2153["Mastra Core Orchestrator<br>TypeScript"] -->|configures| 2158["Telemetry &amp; Tracing<br>TypeScript"]
        2154["Business Workflows<br>TypeScript"] -->|delegates tasks to| 2155["AI Agent Services<br>TypeScript"]
        2154["Business Workflows<br>TypeScript"] -->|uses| 2158["Telemetry &amp; Tracing<br>TypeScript"]
        2154["Business Workflows<br>TypeScript"] -->|schedules via| 2159["Background Job Functions<br>TypeScript / Inngest"]
        2159["Background Job Functions<br>TypeScript / Inngest"] -->|executes tasks with| 2155["AI Agent Services<br>TypeScript"]
        2160["AI Evaluation Framework<br>TypeScript"] -->|evaluates| 2155["AI Agent Services<br>TypeScript"]
        2155["AI Agent Services<br>TypeScript"] -->|persist state to| 2156["Agent State &amp; Memory<br>TypeScript / LibSQL"]
        2155["AI Agent Services<br>TypeScript"] -->|employs| 2157["Specialized Tools<br>TypeScript"]
        2155["AI Agent Services<br>TypeScript"] -->|uses| 2158["Telemetry &amp; Tracing<br>TypeScript"]
    end
    %% Edges at this level (grouped by source)
    2164["User<br>External Actor"] -->|initiates tasks via| 2153["Mastra Core Orchestrator<br>TypeScript"]
    2164["User<br>External Actor"] -->|runs evaluations via| 2160["AI Evaluation Framework<br>TypeScript"]
    2159["Background Job Functions<br>TypeScript / Inngest"] -->|calls| 2161["AI/LLM APIs<br>Google AI, etc."]
    2160["AI Evaluation Framework<br>TypeScript"] -->|tests models on| 2161["AI/LLM APIs<br>Google AI, etc."]
    2155["AI Agent Services<br>TypeScript"] -->|calls| 2161["AI/LLM APIs<br>Google AI, etc."]
    2156["Agent State &amp; Memory<br>TypeScript / LibSQL"] -->|uses for embeddings| 2161["AI/LLM APIs<br>Google AI, etc."]
    2157["Specialized Tools<br>TypeScript"] -->|invoke| 2161["AI/LLM APIs<br>Google AI, etc."]
    2157["Specialized Tools<br>TypeScript"] -->|invoke| 2163["Third-Party Services<br>MCP/Smithery, etc."]
    2158["Telemetry &amp; Tracing<br>TypeScript"] -->|sends telemetry to| 2162["Observability Platforms<br>LangSmith, etc."]
```