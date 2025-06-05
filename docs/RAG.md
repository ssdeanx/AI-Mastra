# Reference: createGraphRAGTool() | RAG | Mastra Tools Docs

The `createGraphRAGTool()` creates a tool that enhances RAG by building a graph of semantic relationships between documents. It uses the `GraphRAG` system under the hood to provide graph-based retrieval, finding relevant content through both direct similarity and connected relationships.

Usage Example[](#usage-example)
-------------------------------

```ts
import { openai } from "@ai-sdk/openai";
import { createGraphRAGTool } from "@mastra/rag";
 
const graphTool = createGraphRAGTool({
  vectorStoreName: "pinecone",
  indexName: "docs",
  model: openai.embedding("text-embedding-3-small"),
  graphOptions: {
    dimension: 1536,
    threshold: 0.7,
    randomWalkSteps: 100,
    restartProb: 0.15,
  },
});
```

Parameters[](#parameters)
-------------------------

💡

**Parameter Requirements:** Most fields can be set at creation as defaults. Some fields can be overridden at runtime via the runtime context or input. If a required field is missing from both creation and runtime, an error will be thrown. Note that `model`, `id`, and `description` can only be set at creation time.

Custom ID for the tool. By default: 'GraphRAG {vectorStoreName} {indexName} Tool'. (Set at creation only.)

Custom description for the tool. By default: 'Access and analyze relationships between information in the knowledge base to answer complex questions about connections and patterns.' (Set at creation only.)

Name of the vector store to query. (Can be set at creation or overridden at runtime.)

Name of the index within the vector store. (Can be set at creation or overridden at runtime.)

Embedding model to use for vector search. (Set at creation only.)

Enable filtering of results based on metadata. (Set at creation only, but will be automatically enabled if a filter is provided in the runtime context.)

Include the full retrieval objects in the results. (Can be set at creation or overridden at runtime.)

### graphOptions?

GraphOptions

Configuration for the graph-based retrieval

### GraphOptions[](#graphoptions)

Dimension of the embedding vectors

Similarity threshold for creating edges between nodes (0-1)

Number of steps in random walk for graph traversal. (Can be set at creation or overridden at runtime.)

Probability of restarting random walk from query node. (Can be set at creation or overridden at runtime.)

Returns[](#returns)
-------------------

The tool returns an object with:

Combined text from the most relevant document chunks, retrieved using graph-based ranking

Array of full retrieval result objects. Each object contains all information needed to reference the original document, chunk, and similarity score.

### QueryResult object structure[](#queryresult-object-structure)

```json
{
  id: string;         // Unique chunk/document identifier
  metadata: any;      // All metadata fields (document ID, etc.)
  vector: number[];   // Embedding vector (if available)
  score: number;      // Similarity score for this retrieval
  document: string;   // Full chunk/document text (if available)
}
```

Default Tool Description[](#default-tool-description)
-----------------------------------------------------

The default description focuses on:

* Analyzing relationships between documents
* Finding patterns and connections
* Answering complex queries

Advanced Example[](#advanced-example)
-------------------------------------

```ts
const graphTool = createGraphRAGTool({
  vectorStoreName: "pinecone",
  indexName: "docs",
  model: openai.embedding("text-embedding-3-small"),
  graphOptions: {
    dimension: 1536,
    threshold: 0.8, // Higher similarity threshold
    randomWalkSteps: 200, // More exploration steps
    restartProb: 0.2, // Higher restart probability
  },
});
```

Example with Custom Description[](#example-with-custom-description)
-------------------------------------------------------------------

```ts
const graphTool = createGraphRAGTool({
  vectorStoreName: "pinecone",
  indexName: "docs",
  model: openai.embedding("text-embedding-3-small"),
  description:
    "Analyze document relationships to find complex patterns and connections in our company's historical data",
});
```

This example shows how to customize the tool description for a specific use case while maintaining its core purpose of relationship analysis.

Example: Using Runtime Context[](#example-using-runtime-context)
----------------------------------------------------------------

```ts
const graphTool = createGraphRAGTool({
  vectorStoreName: "pinecone",
  indexName: "docs",
  model: openai.embedding("text-embedding-3-small"),
});
```

When using runtime context, provide required parameters at execution time via the runtime context:

```ts
const runtimeContext = new RuntimeContext<{
  vectorStoreName: string;
  indexName: string;
  topK: number;
  filter: any;
}>();
runtimeContext.set("vectorStoreName", "my-store");
runtimeContext.set("indexName", "my-index");
runtimeContext.set("topK", 5);
runtimeContext.set("filter", { category: "docs" });
runtimeContext.set("randomWalkSteps", 100);
runtimeContext.set("restartProb", 0.15);
 
const response = await agent.generate(
  "Find documentation from the knowledge base.",
  {
    runtimeContext,
  },
);
```

For more information on runtime context, please see:

* Runtime Variables
* Dynamic Context

Related[](#related)
-------------------

* createVectorQueryTool
* GraphRAG

# Reference: .chunk() | Document Processing | RAG | Mastra Docs

The `.chunk()` function splits documents into smaller segments using various strategies and options.

Example[](#example)
-------------------

```ts
import { MDocument } from "@mastra/rag";
 
const doc = MDocument.fromMarkdown(`
# Introduction
This is a sample document that we want to split into chunks.
 
## Section 1
Here is the first section with some content.
 
## Section 2 
Here is another section with different content.
`);
 
// Basic chunking with defaults
const chunks = await doc.chunk();
 
// Markdown-specific chunking with header extraction
const chunksWithMetadata = await doc.chunk({
  strategy: "markdown",
  headers: [
    ["#", "title"],
    ["##", "section"],
  ],
  extract: {
    summary: true, // Extract summaries with default settings
    keywords: true, // Extract keywords with default settings
  },
});
```

Parameters[](#parameters)
-------------------------

### strategy?

'recursive' | 'character' | 'token' | 'markdown' | 'html' | 'json' | 'latex'

The chunking strategy to use. If not specified, defaults based on document type. Depending on the chunking strategy, there are additional optionals. Defaults: .md files → 'markdown', .html/.htm → 'html', .json → 'json', .tex → 'latex', others → 'recursive'

Maximum size of each chunk

Number of characters/tokens that overlap between chunks.

Character(s) to split on. Defaults to double newline for text content.

### isSeparatorRegex?

boolean

Whether the separator is a regex pattern

### keepSeparator?

'start' | 'end'

Whether to keep the separator at the start or end of chunks

Metadata extraction configuration. See \ExtractParams reference\ for details.

Strategy-Specific Options[](#strategy-specific-options)
-------------------------------------------------------

Strategy-specific options are passed as top-level parameters alongside the strategy parameter. For example:

```ts
// HTML strategy example
const chunks = await doc.chunk({
  strategy: "html",
  headers: [
    ["h1", "title"],
    ["h2", "subtitle"],
  ], // HTML-specific option
  sections: [["div.content", "main"]], // HTML-specific option
  size: 500, // general option
});
 
// Markdown strategy example
const chunks = await doc.chunk({
  strategy: "markdown",
  headers: [
    ["#", "title"],
    ["##", "section"],
  ], // Markdown-specific option
  stripHeaders: true, // Markdown-specific option
  overlap: 50, // general option
});
 
// Token strategy example
const chunks = await doc.chunk({
  strategy: "token",
  encodingName: "gpt2", // Token-specific option
  modelName: "gpt-3.5-turbo", // Token-specific option
  size: 1000, // general option
});
```

The options documented below are passed directly at the top level of the configuration object, not nested within a separate options object.

### HTML[](#html)

### headers

Array<\[string, string\]>

Array of \[selector, metadata key\] pairs for header-based splitting

### sections

Array<\[string, string\]>

Array of \[selector, metadata key\] pairs for section-based splitting

Whether to return each line as a separate chunk

### Markdown[](#markdown)

### headers

Array<\[string, string\]>

Array of \[header level, metadata key\] pairs

Whether to remove headers from the output

Whether to return each line as a separate chunk

### Token[](#token)

Name of the token encoding to use

Name of the model for tokenization

### JSON[](#json)

Maximum size of each chunk

Minimum size of each chunk

Whether to ensure ASCII encoding

Whether to convert lists in the JSON

Return Value[](#return-value)
-----------------------------

Returns a `MDocument` instance containing the chunked documents. Each chunk includes:

```ts
interface DocumentNode {
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}
```

DynamoDB Storage
.embed()")

# Reference: .embed() | Document Processing | RAG | Mastra Docs

The `.embed()` function generates embeddings for a document.

Example[](#example)
-------------------

# Dynamic Tool Context | Tools & MCP | Mastra Docs

Mastra provides `RuntimeContext`, a system based on dependency injection, that allows you to pass dynamic, request-specific configuration to your tools during execution. This is useful when a tool’s behavior needs to change based on user identity, request headers, or other runtime factors, without altering the tool’s core code.

💡

**Note:** `RuntimeContext` is primarily used for passing data _into_ tool executions. It’s distinct from agent memory, which handles conversation history and state persistence across multiple calls.

Basic Usage[](#basic-usage)
---------------------------

To use `RuntimeContext`, first define a type structure for your dynamic configuration. Then, create an instance of `RuntimeContext` typed with your definition and set the desired values. Finally, include the `runtimeContext` instance in the options object when calling `agent.generate()` or `agent.stream()`.

```ts
import { RuntimeContext } from "@mastra/core/di";
// Assume 'agent' is an already defined Mastra Agent instance
 
// Define the context type
type WeatherRuntimeContext = {
  "temperature-scale": "celsius" | "fahrenheit";
};
 
// Instantiate RuntimeContext and set values
const runtimeContext = new RuntimeContext<WeatherRuntimeContext>();
runtimeContext.set("temperature-scale", "celsius");
 
// Pass to agent call
const response = await agent.generate("What's the weather like today?", {
  runtimeContext, // Pass the context here
});
 
console.log(response.text);
```

Accessing Context in Tools[](#accessing-context-in-tools)
---------------------------------------------------------

Tools receive the `runtimeContext` as part of the second argument to their `execute` function. You can then use the `.get()` method to retrieve values.

src/mastra/tools/weather-tool.ts

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
// Assume WeatherRuntimeContext is defined as above and accessible here
 
// Dummy fetch function
async function fetchWeather(
  location: string,
  options: { temperatureUnit: "celsius" | "fahrenheit" },
): Promise<any> {
  console.log(`Fetching weather for ${location} in ${options.temperatureUnit}`);
  // Replace with actual API call
  return { temperature: options.temperatureUnit === "celsius" ? 20 : 68 };
}
 
export const weatherTool = createTool({
  id: "getWeather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get weather for"),
  }),
  // The tool's execute function receives runtimeContext
  execute: async ({ context, runtimeContext }) => {
    // Type-safe access to runtimeContext variables
    const temperatureUnit = runtimeContext.get("temperature-scale");
 
    // Use the context value in the tool logic
    const weather = await fetchWeather(context.location, {
      temperatureUnit,
    });
 
    return {
      result: `The temperature is ${weather.temperature}°${temperatureUnit === "celsius" ? "C" : "F"}`,
    };
  },
});
```

When the agent uses `weatherTool`, the `temperature-scale` value set in the `runtimeContext` during the `agent.generate()` call will be available inside the tool’s `execute` function.

Using with Server Middleware[](#using-with-server-middleware)
-------------------------------------------------------------

In server environments (like Express or Next.js), you can use middleware to automatically populate `RuntimeContext` based on incoming request data, such as headers or user sessions.

Here’s an example using Mastra’s built-in server middleware support (which uses Hono internally) to set the temperature scale based on the Cloudflare `CF-IPCountry` header:

```ts
import { Mastra } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { weatherAgent } from "./agents/weather"; // Assume agent is defined elsewhere
 
// Define RuntimeContext type
type WeatherRuntimeContext = {
  "temperature-scale": "celsius" | "fahrenheit";
};
 
export const mastra = new Mastra({
  agents: {
    weather: weatherAgent,
  },
  server: {
    middleware: [
      async (c, next) => {
        // Get the RuntimeContext instance
        const runtimeContext =
          c.get<RuntimeContext<WeatherRuntimeContext>>("runtimeContext");
 
        // Get country code from request header
        const country = c.req.header("CF-IPCountry");
 
        // Set temperature scale based on country
        runtimeContext.set(
          "temperature-scale",
          country === "US" ? "fahrenheit" : "celsius",
        );
 
        // Continue request processing
        await next();
      },
    ],
  },
});
```

With this middleware in place, any agent call handled by this Mastra server instance will automatically have the `temperature-scale` set in its `RuntimeContext` based on the user’s inferred country, and tools like `weatherTool` will use it accordingly.

# Dynamic Agents

Dynamic agents use runtime context, like user IDs and other important parameters, to adjust their settings in real-time.

This means they can change the model they use, update their instructions, and select different tools as needed.

By using this context, agents can better respond to each user’s needs. They can also call any API to gather more information, which helps improve what the agents can do.

### Example Configuration[](#example-configuration)

Here’s an example of a dynamic support agent that adjusts its behavior based on the user’s subscription tier and language preferences:

```ts
const supportAgent = new Agent({
  name: "Dynamic Support Agent",
 
  instructions: async ({ runtimeContext }) => {
    const userTier = runtimeContext.get("user-tier");
    const language = runtimeContext.get("language");
 
    return `You are a customer support agent for our SaaS platform.
    The current user is on the ${userTier} tier and prefers ${language} language.
    
    For ${userTier} tier users:
    ${userTier === "free" ? "- Provide basic support and documentation links" : ""}
    ${userTier === "pro" ? "- Offer detailed technical support and best practices" : ""}
    ${userTier === "enterprise" ? "- Provide priority support with custom solutions" : ""}
    
    Always respond in ${language} language.`;
  },
 
  model: ({ runtimeContext }) => {
    const userTier = runtimeContext.get("user-tier");
    return userTier === "enterprise"
      ? openai("gpt-4")
      : openai("gpt-3.5-turbo");
  },
 
  tools: ({ runtimeContext }) => {
    const userTier = runtimeContext.get("user-tier");
    const baseTools = [knowledgeBase, ticketSystem];
 
    if (userTier === "pro" || userTier === "enterprise") {
      baseTools.push(advancedAnalytics);
    }
 
    if (userTier === "enterprise") {
      baseTools.push(customIntegration);
    }
 
    return baseTools;
  },
});
```

In this example, the agent:

* Adjusts its instructions based on the user’s subscription tier (free, pro, or enterprise)
* Uses a more powerful model (GPT-4) for enterprise users
* Provides different sets of tools based on the user’s tier
* Responds in the user’s preferred language

This demonstrates how a single agent can handle different types of users and scenarios by leveraging runtime context, making it more flexible and maintainable than creating separate agents for each use case.

For a complete implementation example including API routes, middleware setup, and runtime context handling, see our Dynamic Agents Example.

Runtime Context
Overview

# Runtime context | Agents | Mastra Docs

Mastra provides runtime context, which is a system based on dependency injection that enables you to configure your agents and tools with runtime variables. If you find yourself creating several different agents that do very similar things, runtime context allows you to combine them into one agent.

Overview[](#overview)
---------------------

The dependency injection system allows you to:

1. Pass runtime configuration variables to agents through a type-safe runtimeContext
2. Access these variables within tool execution contexts
3. Modify agent behavior without changing the underlying code
4. Share configuration across multiple tools within the same agent

Basic Usage[](#basic-usage)
---------------------------

```ts
const agent = mastra.getAgent("weatherAgent");
 
// Define your runtimeContext's type structure
type WeatherRuntimeContext = {
  "temperature-scale": "celsius" | "fahrenheit"; // Fixed typo in "fahrenheit"
};
 
const runtimeContext = new RuntimeContext<WeatherRuntimeContext>();
runtimeContext.set("temperature-scale", "celsius");
 
const response = await agent.generate("What's the weather like today?", {
  runtimeContext,
});
 
console.log(response.text);
```

Using with REST API[](#using-with-rest-api)
-------------------------------------------

Here’s how to dynamically set temperature units based on a user’s location using the Cloudflare `CF-IPCountry` header:

```ts
import { Mastra } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { agent as weatherAgent } from "./agents/weather";
 
// Define RuntimeContext type with clear, descriptive types
type WeatherRuntimeContext = {
  "temperature-scale": "celsius" | "fahrenheit";
};
 
export const mastra = new Mastra({
  agents: {
    weather: weatherAgent,
  },
  server: {
    middleware: [
      async (c, next) => {
        const country = c.req.header("CF-IPCountry");
        const runtimeContext = c.get<WeatherRuntimeContext>("runtimeContext");
 
        // Set temperature scale based on country
        runtimeContext.set(
          "temperature-scale",
          country === "US" ? "fahrenheit" : "celsius",
        );
 
        await next(); // Don't forget to call next()
      },
    ],
  },
});
```

Creating Tools with Variables[](#creating-tools-with-variables)
---------------------------------------------------------------

Tools can access runtimeContext variables and must conform to the agent’s runtimeContext type:

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
 
export const weatherTool = createTool({
  id: "getWeather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get weather for"),
  }),
  execute: async ({ context, runtimeContext }) => {
    // Type-safe access to runtimeContext variables
    const temperatureUnit = runtimeContext.get("temperature-scale");
 
    const weather = await fetchWeather(context.location, {
      temperatureUnit,
    });
 
    return { result: weather };
  },
});
 
async function fetchWeather(
  location: string,
  { temperatureUnit }: { temperatureUnit: "celsius" | "fahrenheit" },
): Promise<WeatherResponse> {
  // Implementation of weather API call
  const response = await weatherApi.fetch(location, temperatureUnit);
 
  return {
    location,
    temperature: "72°F",
    conditions: "Sunny",
    unit: temperatureUnit,
  };
}
```

Adding Voice
Dynamic Agents

# Using Workflows with Agents and Tools | Workflows | Mastra Docs

Agent as a step[](#agent-as-a-step)
-----------------------------------

Workflows can use Mastra agents directly as steps using `createStep(agent)`:

```ts
import { Mastra } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
 
const myAgent = new Agent({
  name: "myAgent",
  instructions: "You are a helpful assistant that answers questions concisely.",
  model: openai("gpt-4o"),
});
 
// Input preparation step
const preparationStep = createStep({
  id: "preparation",
  inputSchema: z.object({
    question: z.string(),
  }),
  outputSchema: z.object({
    formattedPrompt: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      formattedPrompt: `Answer this question briefly: ${inputData.question}`,
    };
  },
});
 
const agentStep = createStep(myAgent);
 
// Create a simple workflow
const myWorkflow = createWorkflow({
  id: "simple-qa-workflow",
  inputSchema: z.object({
    question: z.string(),
  }),
  outputSchema: z.string(),
  steps: [preparationStep, agentStep],
});
 
// Define workflow sequence
myWorkflow
  .then(preparationStep)
  .map({
    prompt: {
      step: preparationStep,
      path: "formattedPrompt",
    },
  })
  .then(agentStep)
  .commit();
 
// Create Mastra instance
const mastra = new Mastra({
  agents: {
    myAgent,
  },
  workflows: {
    myWorkflow,
  },
});
 
const workflow = mastra.getWorkflow("myWorkflow");
const run = workflow.createRun();
 
// Run the workflow with a question
const res = await run.start({
  inputData: {
    question: "What is machine learning?",
  },
});
 
if (res.status === "success") {
  console.log("Answer:", res.result);
} else if (res.status === "failed") {
  console.error("Workflow failed:", res.error);
}
```

> **NOTE:** The step created from agent (`createStep(agent)`) takes `prompt` as an input and returns `text` as an output. You will need to map the output of the previous step to the input of the agent step, as done in the example above

Tools as a step[](#tools-as-a-step)
-----------------------------------

Workflows can use Mastra tools directly as steps using `createStep(tool)`:

```ts
import { createTool, Mastra } from "@mastra/core";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
 
// Create a weather tool
const weatherTool = createTool({
  id: "weather-tool",
  description: "Get weather information for a location",
  inputSchema: z.object({
    location: z.string().describe("The city name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  execute: async ({ context: { location } }) => {
    return {
      temperature: 22,
      conditions: "Sunny",
    };
  },
});
 
// Create a step that formats the input
const locationStep = createStep({
  id: "location-formatter",
  inputSchema: z.object({
    city: z.string(),
  }),
  outputSchema: z.object({
    location: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      location: inputData.city,
    };
  },
});
 
// Create a step that formats the output
const formatResultStep = createStep({
  id: "format-result",
  inputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  outputSchema: z.object({
    weatherReport: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      weatherReport: `Current weather: ${inputData.temperature}°C and ${inputData.conditions}`,
    };
  },
});
 
const weatherToolStep = createStep(weatherTool);
 
// Create the workflow
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string(),
  }),
  outputSchema: z.object({
    weatherReport: z.string(),
  }),
  steps: [locationStep, weatherToolStep, formatResultStep],
});
 
// Define workflow sequence
weatherWorkflow
  .then(locationStep)
  .then(weatherToolStep)
  .then(formatResultStep)
  .commit();
 
// Create Mastra instance
const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
  },
});
 
const workflow = mastra.getWorkflow("weatherWorkflow");
const run = workflow.createRun();
 
// Run the workflow
const result = await run.start({
  inputData: {
    city: "Tokyo",
  },
});
 
if (result.status === "success") {
  console.log(result.result.weatherReport);
} else if (result.status === "failed") {
  console.error("Workflow failed:", result.error);
}
```

Workflow as a tool in an agent[](#workflow-as-a-tool-in-an-agent)
-----------------------------------------------------------------

```ts
import { openai } from "@ai-sdk/openai";
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
 
// Define the weather fetching step
const fetchWeather = createStep({
  id: "fetch-weather",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    city: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      temperature: 25,
      conditions: "Sunny",
      city: inputData.city,
    };
  },
});
 
// Define the activity planning step
const planActivities = createStep({
  id: "plan-activities",
  inputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    city: z.string(),
  }),
  outputSchema: z.object({
    activities: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    mastra
      .getLogger()
      ?.debug(`Planning activities for ${inputData.city} based on weather`);
    const activities = [];
 
    if (inputData.temperature > 20 && inputData.conditions === "Sunny") {
      activities.push("Visit the park", "Go hiking", "Have a picnic");
    } else if (inputData.temperature < 10) {
      activities.push("Visit a museum", "Go to a cafe", "Indoor shopping");
    } else {
      activities.push(
        "Sightseeing tour",
        "Visit local attractions",
        "Try local cuisine",
      );
    }
    return {
      activities,
    };
  },
});
 
// Create the weather workflow
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
  outputSchema: z.object({
    activities: z.array(z.string()),
  }),
  steps: [fetchWeather, planActivities],
})
  .then(fetchWeather)
  .then(planActivities)
  .commit();
 
// Create a tool that uses the workflow
const activityPlannerTool = createTool({
  id: "get-weather-specific-activities",
  description:
    "Get weather-specific activities for a city based on current weather conditions",
  inputSchema: z.object({
    city: z.string().describe("The city to get activities for"),
  }),
  outputSchema: z.object({
    activities: z.array(z.string()),
  }),
  execute: async ({ context: { city }, mastra }) => {
    mastra.getLogger()?.debug(`Tool executing for city: ${city}`);
 
    const workflow = mastra?.getWorkflow("weatherWorkflow");
    if (!workflow) {
      throw new Error("Weather workflow not found");
    }
 
    const run = workflow.createRun();
    const result = await run.start({
      inputData: {
        city: city,
      },
    });
 
    if (result.status === "success") {
      return {
        activities: result.result.activities,
      };
    }
 
    throw new Error(`Workflow execution failed: ${result.status}`);
  },
});
 
// Create an agent that uses the tool
const activityPlannerAgent = new Agent({
  name: "activityPlannerAgent",
  model: openai("gpt-4o"),
  instructions: `
  You are an activity planner. You suggest fun activities based on the weather in a city.
  Use the weather-specific activities tool to get activity recommendations.
  Format your response in a friendly, conversational way.
  `,
  tools: { activityPlannerTool },
});
 
// Create the Mastra instance
const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
  },
  agents: {
    activityPlannerAgent,
  },
});
 
const response = await activityPlannerAgent.generate(
  "What activities do you recommend for a visit to Tokyo?",
);
 
console.log("\nAgent response:");
console.log(response.text);
```

Exposing Workflows as Tools via MCPServer[](#exposing-workflows-as-tools-via-mcpserver)
---------------------------------------------------------------------------------------

Beyond using workflows within agents, your Mastra `Workflow` instances can themselves be exposed as tools to any MCP-compatible client using Mastra’s `MCPServer`. This allows other AI models or MCP clients to initiate and run your Mastra Workflows as if they were standard tools.

When a `Workflow` instance is provided to an `MCPServer` configuration:

* It is automatically converted into a callable tool.
* The tool is named `run_<workflowKey>`, where `<workflowKey>` is the identifier you used when adding the workflow to the `MCPServer`’s `workflows` configuration (e.g., `workflows: { myWorkflow: myWorkflowInstance }` would create a tool `run_myWorkflow`).
* The workflow’s `description` property **must be a non-empty string** and is used to generate the tool’s description. If the description is missing or empty, `MCPServer` will throw an error during initialization.
* The `workflow.inputSchema` is used as the input schema for the generated tool.
* Executing the tool triggers `workflow.createRun().start({ inputData: <tool_input> })`, passing the tool’s input as `inputData` to the workflow run.

**Example `MCPServer` Configuration with a Workflow:**

src/mastra/mcp-server-with-workflow.ts

```ts
import { MCPServer } from "@mastra/mcp";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { weatherWorkflow } from "./workflows";
 
const server = new MCPServer({
  name: "MyServerWithWorkflowTool",
  version: "1.0.0",
  tools: {
    // You can still have other defined tools
  },
  workflows: {
    weatherWorkflow, // Exposes 'run_weatherWorkflow' tool
  },
});
 
// To start the server (example using stdio):
server.startStdio().catch(console.error);
 
// An MCP client could now connect and see a tool named 'run_weatherWorkflow'.
// Calling it with { "city": "Paris" } would run the workflow.
```

This mechanism provides a powerful way to make complex, multi-step processes (encapsulated as Workflows) available as simple, callable tools in the broader MCP ecosystem.

For more general details on `MCPServer` and its capabilities, including exposing Agents, refer to the MCPServer reference documentation. For more general details on connecting to your `MCPServer` using the `MCPClient`, refer to the MCPClient reference documentation.

# Input Data Mapping with Workflow | Mastra Docs

Input data mapping allows explicit mapping of values for the inputs of the next step. These values can come from a number of sources:

* The outputs of a previous step
* The runtime context
* A constant value
* The initial input of the workflow

```ts
myWorkflow
  .then(step1)
  .map({
    transformedValue: {
      step: step1,
      path: "nestedValue",
    },
    runtimeContextValue: {
      runtimeContextPath: "runtimeContextValue",
      schema: z.number(),
    },
    constantValue: {
      value: 42,
      schema: z.number(),
    },
    initDataValue: {
      initData: myWorkflow,
      path: "startValue",
    },
  })
  .then(step2)
  .commit();
```

There are many cases where `.map()` can be useful in matching inputs to outputs, whether it’s renaming outputs to match inputs or mapping complex data structures or other previous step outputs.

Renaming outputs[](#renaming-outputs)
-------------------------------------

One use case for input mappings is renaming outputs to match inputs:

```ts
import { Mastra } from "@mastra/core";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
 
const step1 = createStep({
  id: "step1",
  inputSchema: z.object({
    inputValue: z.string(),
  }),
  outputSchema: z.object({
    outputValue: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    mastra.getLogger()?.debug(`Step 1 received: ${inputData.inputValue}`);
    return { outputValue: `${inputData.inputValue}` };
  },
});
 
const step2 = createStep({
  id: "step2",
  inputSchema: z.object({
    unexpectedName: z.string(),
  }),
  outputSchema: z.string(),
  execute: async ({ inputData, mastra }) => {
    mastra.getLogger()?.debug(`Step 2 received: ${inputData.unexpectedName}`);
    return `${inputData.unexpectedName}`;
  },
});
 
const myWorkflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({
    inputValue: z.string(),
  }),
  outputSchema: z.string(),
  steps: [step1, step2],
})
  .then(step1)
  // mapping output from step1 "outputValue"
  // to input for step2 "unexpectedName"
  .map({
    unexpectedName: {
      step: step1,
      path: "outputValue",
    },
  })
  .then(step2)
  .commit();
 
const mastra = new Mastra({
  workflows: {
    myWorkflow,
  },
});
 
const run = mastra.getWorkflow("myWorkflow").createRun();
const res = await run.start({
  inputData: { inputValue: "Hello world" },
});
if (res.status === "success") {
  console.log(res.result);
}
```

Using workflow inputs as later step inputs[](#using-workflow-inputs-as-later-step-inputs)
-----------------------------------------------------------------------------------------

```ts
import { Mastra } from "@mastra/core";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
 
const step1 = createStep({
  id: "step1",
  inputSchema: z.object({
    inputValue: z.string(),
  }),
  outputSchema: z.object({
    outputValue: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    mastra.getLogger()?.debug(`Step 1 received: ${inputData.inputValue}`);
    return { outputValue: `Processed: ${inputData.inputValue}` };
  },
});
 
const step2 = createStep({
  id: "step2",
  inputSchema: z.object({
    outputValue: z.string(),
    initialValue: z.string(),
  }),
  outputSchema: z.object({
    result: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    mastra
      .getLogger()
      ?.debug(
        `Step 2 received: ${inputData.outputValue} and original: ${inputData.initialValue}`,
      );
    return {
      result: `Combined: ${inputData.outputValue} (original: ${inputData.initialValue})`,
    };
  },
});
 
const myWorkflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({
    inputValue: z.string(),
  }),
  outputSchema: z.object({
    result: z.string(),
  }),
  steps: [step1, step2],
});
 
myWorkflow
  .then(step1)
  .map({
    outputValue: {
      step: step1,
      path: "outputValue",
    },
    initialValue: {
      initData: myWorkflow,
      path: "inputValue",
    },
  })
  .then(step2)
  .commit();
 
// Create Mastra instance with all workflows
const mastra = new Mastra({
  workflows: {
    myWorkflow,
  },
});
 
const run = mastra.getWorkflow("myWorkflow").createRun();
const res = await run.start({
  inputData: { inputValue: "Original input" },
});
if (res.status === "success") {
  console.log("Result:", res.result);
}
```

Using multiple outputs of previous steps[](#using-multiple-outputs-of-previous-steps)
-------------------------------------------------------------------------------------

```ts
import { Mastra } from "@mastra/core";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
 
const step1 = createStep({
  id: "step1",
  inputSchema: z.object({
    inputValue: z.string(),
  }),
  outputSchema: z.object({
    intermediateValue: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    mastra.getLogger()?.debug(`Step 1 received: ${inputData.inputValue}`);
    return { intermediateValue: `Step 1: ${inputData.inputValue}` };
  },
});
 
const step2 = createStep({
  id: "step2",
  inputSchema: z.object({
    intermediateValue: z.string(),
  }),
  outputSchema: z.object({
    currentResult: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    mastra
      .getLogger()
      ?.debug(`Step 2 received: ${inputData.intermediateValue}`);
    return { currentResult: `Step 2: ${inputData.intermediateValue}` };
  },
});
 
const step3 = createStep({
  id: "step3",
  inputSchema: z.object({
    currentResult: z.string(), // From step2
    intermediateValue: z.string(), // From step1
    initialValue: z.string(), // From workflow input
  }),
  outputSchema: z.object({
    result: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    mastra.getLogger()?.debug(`Step 3 combining all previous data`);
    return {
      result: `Combined result:
      - Initial input: ${inputData.initialValue}
      - Step 1 output: ${inputData.intermediateValue}
      - Step 2 output: ${inputData.currentResult}`,
    };
  },
});
 
const myWorkflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({
    inputValue: z.string(),
  }),
  outputSchema: z.object({
    result: z.string(),
  }),
  steps: [step1, step2, step3],
});
 
myWorkflow
  .then(step1)
  .then(step2)
  .map({
    // Map values from different sources to step3's inputs
    initialValue: {
      initData: myWorkflow,
      path: "inputValue",
    },
    currentResult: {
      step: step2,
      path: "currentResult",
    },
    intermediateValue: {
      step: step1,
      path: "intermediateValue",
    },
  })
  .then(step3)
  .commit();
 
// Create Mastra instance with all workflows
const mastra = new Mastra({
  workflows: {
    myWorkflow,
  },
});
 
const run = mastra.getWorkflow("myWorkflow").createRun();
const res = await run.start({
  inputData: { inputValue: "Starting data" },
});
if (res.status === "success") {
  console.log("Result:", res.result);
}
```

# Advanced Tool Usage | Tools & MCP | Mastra Docs

This page covers more advanced techniques and features related to using tools in Mastra.

Abort Signals[](#abort-signals)
-------------------------------

When you initiate an agent interaction using `generate()` or `stream()`, you can provide an `AbortSignal`. Mastra automatically forwards this signal to any tool executions that occur during that interaction.

This allows you to cancel long-running operations within your tools, such as network requests or intensive computations, if the parent agent call is aborted.

You access the `abortSignal` in the second parameter of the tool’s `execute` function.

```ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
 
export const longRunningTool = createTool({
  id: "long-computation",
  description: "Performs a potentially long computation",
  inputSchema: z.object({ /* ... */ }),
  execute: async ({ context }, { abortSignal }) => {
    // Example: Forwarding signal to fetch
    const response = await fetch("https://api.example.com/data", {
      signal: abortSignal, // Pass the signal here
    });
 
    if (abortSignal?.aborted) {
      console.log("Tool execution aborted.");
      throw new Error("Aborted");
    }
 
    // Example: Checking signal during a loop
    for (let i = 0; i < 1000000; i++) {
      if (abortSignal?.aborted) {
        console.log("Tool execution aborted during loop.");
        throw new Error("Aborted");
      }
      // ... perform computation step ...
    }
 
    const data = await response.json();
    return { result: data };
  },\n});
```

To use this, provide an `AbortController`’s signal when calling the agent:

```ts
import { Agent } from "@mastra/core/agent";
// Assume 'agent' is an Agent instance with longRunningTool configured
 
const controller = new AbortController();
 
// Start the agent call
const promise = agent.generate("Perform the long computation.", {
  abortSignal: controller.signal,
});
 
// Sometime later, if needed:
// controller.abort();
 
try {
  const result = await promise;
  console.log(result.text);
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Agent generation was aborted.");
  } else {
    console.error("An error occurred:", error);
  }
}
```

AI SDK Tool Format[](#ai-sdk-tool-format)
-----------------------------------------

Mastra maintains compatibility with the tool format used by the Vercel AI SDK (`ai` package). You can define tools using the `tool` function from the `ai` package and use them directly within your Mastra agents alongside tools created with Mastra’s `createTool`.

First, ensure you have the `ai` package installed:

Here’s an example of a tool defined using the Vercel AI SDK format:

src/mastra/tools/vercelWeatherTool.ts

```ts
import { tool } from "ai";
import { z } from "zod";
 
export const vercelWeatherTool = tool({
  description: "Fetches current weather using Vercel AI SDK format",
  parameters: z.object({
    city: z.string().describe("The city to get weather for"),
  }),
  execute: async ({ city }) => {
    console.log(`Fetching weather for ${city} (Vercel format tool)`);
    // Replace with actual API call
    const data = await fetch(`https://api.example.com/weather?city=${city}`);
    return data.json();
  },
});
```

You can then add this tool to your Mastra agent just like any other tool:

src/mastra/agents/mixedToolsAgent.ts

```ts
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { vercelWeatherTool } from "../tools/vercelWeatherTool"; // Vercel AI SDK tool
import { mastraTool } from "../tools/mastraTool"; // Mastra createTool tool
 
export const mixedToolsAgent = new Agent({
  name: "Mixed Tools Agent",
  instructions: "You can use tools defined in different formats.",
  model: openai("gpt-4o-mini"),
  tools: {
    weatherVercel: vercelWeatherTool,
    someMastraTool: mastraTool,
  },
});
```

Mastra supports both tool formats, allowing you to mix and match as needed.

# Reference: MCPServer | Exposing Mastra Tools via MCP | Mastra Docs

The `MCPServer` class provides the functionality to expose your existing Mastra tools and Agents as a Model Context Protocol (MCP) server. This allows any MCP client (like Cursor, Windsurf, or Claude Desktop) to connect to these capabilities and make them available to an agent.

Note that if you only need to use your tools or agents directly within your Mastra application, you don’t necessarily need to create an MCP server. This API is specifically for exposing your Mastra tools and agents to _external_ MCP clients.

It supports both stdio (subprocess) and SSE (HTTP) MCP transports .

### `Constructor`[](#constructor)

To create a new `MCPServer`, you need to provide some basic information about your server, the tools it will offer, and optionally, any agents you want to expose as tools.

```ts
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { MCPServer } from "@mastra/mcp";
import { z } from "zod";
import { dataProcessingWorkflow } from "../workflows/dataProcessingWorkflow";
 
const myAgent = new Agent({
  name: "MyExampleAgent",
  description: "A generalist to help with basic questions."
  instructions: "You are a helpful assistant.",
  model: openai("gpt-4o-mini"),
});
 
const weatherTool = createTool({
  id: "getWeather",
  description: "Gets the current weather for a location.",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ context }) => `Weather in ${context.location} is sunny.`,
});
 
const server = new MCPServer({
  name: "My Custom Server",
  version: "1.0.0",
  tools: { weatherTool },
  agents: { myAgent }, // this agent will become tool "ask_myAgent"
  workflows: {
    dataProcessingWorkflow, // this workflow will become tool "run_dataProcessingWorkflow"
  }
});
```

### Configuration Properties[](#configuration-properties)

The constructor accepts an `MCPServerConfig` object with the following properties:

A descriptive name for your server (e.g., 'My Weather and Agent Server').

The semantic version of your server (e.g., '1.0.0').

### agents?

```ts
Record<string, Agent>
```

An object where keys are agent identifiers and values are Mastra Agent instances. Each agent will be automatically converted into a tool named \`ask\_<agentIdentifier>\`. The agent \*\*must\*\* have a non-empty \`description\` string property defined in its constructor configuration. This description will be used in the tool's description. If an agent's description is missing or empty, an error will be thrown during MCPServer initialization.

### workflows?

```ts
Record<string, Workflow>
```

An object where keys are workflow identifiers and values are Mastra Workflow instances. Each workflow is converted into a tool named \`run\_<workflowKey>\`. The workflow's \`inputSchema\` becomes the tool's input schema. The workflow \*\*must\*\* have a non-empty \`description\` string property, which is used for the tool's description. If a workflow's description is missing or empty, an error will be thrown. The tool executes the workflow by calling \`workflow.createRun().start({ inputData: <tool\_input> })\`. If a tool name derived from an agent or workflow (e.g., \`ask\_myAgent\` or \`run\_myWorkflow\`) collides with an explicitly defined tool name or another derived name, the explicitly defined tool takes precedence, and a warning is logged. Agents/workflows leading to subsequent collisions are skipped.

Optional unique identifier for the server. If not provided, a UUID will be generated. This ID is considered final and cannot be changed by Mastra if provided.

Optional description of what the MCP server does.

Optional repository information for the server's source code.

Optional release date of this server version (ISO 8601 string). Defaults to the time of instantiation if not provided.

Optional flag indicating if this is the latest version. Defaults to true if not provided.

### packageCanonical?

'npm' | 'docker' | 'pypi' | 'crates' | string

Optional canonical packaging format if the server is distributed as a package (e.g., 'npm', 'docker').

Optional list of installable packages for this server.

Optional list of remote access points for this server.

### resources?

MCPServerResources

An object defining how the server should handle MCP resources. See Resource Handling section for details.

### Exposing Agents as Tools[](#exposing-agents-as-tools)

A powerful feature of `MCPServer` is its ability to automatically expose your Mastra Agents as callable tools. When you provide agents in the `agents` property of the configuration:

* **Tool Naming**: Each agent is converted into a tool named `ask_<agentKey>`, where `<agentKey>` is the key you used for that agent in the `agents` object. For instance, if you configure `agents: { myAgentKey: myAgentInstance }`, a tool named `ask_myAgentKey` will be created.

* **Tool Functionality**:

  * **Description**: The generated tool’s description will be in the format: “Ask agent `<AgentName>` a question. Original agent instructions: `<agent description>`”.
  * **Input**: The tool expects a single object argument with a `message` property (string): `{ message: "Your question for the agent" }`.
  * **Execution**: When this tool is called, it invokes the `generate()` method of the corresponding agent, passing the provided `query`.
  * **Output**: The direct result from the agent’s `generate()` method is returned as the output of the tool.
* **Name Collisions**: If an explicit tool defined in the `tools` configuration has the same name as an agent-derived tool (e.g., you have a tool named `ask_myAgentKey` and also an agent with the key `myAgentKey`), the _explicitly defined tool will take precedence_. The agent will not be converted into a tool in this conflicting case, and a warning will be logged.

This makes it straightforward to allow MCP clients to interact with your agents using natural language queries, just like any other tool.

### Agent-to-Tool Conversion[](#agent-to-tool-conversion)

When you provide agents in the `agents` configuration property, `MCPServer` will automatically create a corresponding tool for each agent. The tool will be named `ask_<agentIdentifier>`, where `<agentIdentifier>` is the key you used in the `agents` object.

The description for this generated tool will be: “Ask agent `<agent.name>` a question. Agent description: `<agent.description>`”.

**Important**: For an agent to be converted into a tool, it **must** have a non-empty `description` string property set in its configuration when it was instantiated (e.g., `new Agent({ name: 'myAgent', description: 'This agent does X.', ... })`). If an agent is passed to `MCPServer` with a missing or empty `description`, an error will be thrown when the `MCPServer` is instantiated, and server setup will fail.

This allows you to quickly expose the generative capabilities of your agents through the MCP, enabling clients to “ask” your agents questions directly.

### `Methods`[](#methods)

These are the functions you can call on an `MCPServer` instance to control its behavior and get information.

### `startStdio()`[](#startstdio)

Use this method to start the server so it communicates using standard input and output (stdio). This is typical when running the server as a command-line program.

```ts
async startStdio(): Promise<void>
```

Here’s how you would start the server using stdio:

```ts
const server = new MCPServer({
  // example configuration above
});
await server.startStdio();
```

### `startSSE()`[](#startsse)

This method helps you integrate the MCP server with an existing web server to use Server-Sent Events (SSE) for communication. You’ll call this from your web server’s code when it receives a request for the SSE or message paths.

```ts
async startSSE({
  url,
  ssePath,
  messagePath,
  req,
  res,
}: {
  url: URL;
  ssePath: string;
  messagePath: string;
  req: any;
  res: any;
}): Promise<void>
```

Here’s an example of how you might use `startSSE` within an HTTP server request handler. In this example an MCP client could connect to your MCP server at `http://localhost:1234/sse`:

```ts
import http from "http";
 
const httpServer = http.createServer(async (req, res) => {
  await server.startSSE({
    url: new URL(req.url || "", `http://localhost:1234`),
    ssePath: "/sse",
    messagePath: "/message",
    req,
    res,
  });
});
 
httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
```

Here are the details for the values needed by the `startSSE` method:

The web address the user is requesting.

The specific part of the URL where clients will connect for SSE (e.g., '/sse').

The specific part of the URL where clients will send messages (e.g., '/message').

The incoming request object from your web server.

The response object from your web server, used to send data back.

### `startHonoSSE()`[](#starthonosse)

This method helps you integrate the MCP server with an existing web server to use Server-Sent Events (SSE) for communication. You’ll call this from your web server’s code when it receives a request for the SSE or message paths.

```ts
async startHonoSSE({
  url,
  ssePath,
  messagePath,
  req,
  res,
}: {
  url: URL;
  ssePath: string;
  messagePath: string;
  req: any;
  res: any;
}): Promise<void>
```

Here’s an example of how you might use `startHonoSSE` within an HTTP server request handler. In this example an MCP client could connect to your MCP server at `http://localhost:1234/hono-sse`:

```ts
import http from "http";
 
const httpServer = http.createServer(async (req, res) => {
  await server.startHonoSSE({
    url: new URL(req.url || "", `http://localhost:1234`),
    ssePath: "/hono-sse",
    messagePath: "/message",
    req,
    res,
  });
});
 
httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
```

Here are the details for the values needed by the `startHonoSSE` method:

The web address the user is requesting.

The specific part of the URL where clients will connect for SSE (e.g., '/hono-sse').

The specific part of the URL where clients will send messages (e.g., '/message').

The incoming request object from your web server.

The response object from your web server, used to send data back.

### `startHTTP()`[](#starthttp)

This method helps you integrate the MCP server with an existing web server to use Server-Sent Events (SSE) for communication. You’ll call this from your web server’s code when it receives a request for the SSE or message paths.

```ts
async startHTTP({
  url,
  ssePath,
  messagePath,
  req,
  res,
}: {
  url: URL;
  ssePath: string;
  messagePath: string;
  req: any;
  res: any;
}): Promise<void>
```

Here’s an example of how you might use `startHTTP` within an HTTP server request handler. In this example an MCP client could connect to your MCP server at `http://localhost:1234/http`:

```ts
import http from "http";
 
const httpServer = http.createServer(async (req, res) => {
  await server.startHTTP({
    url: new URL(req.url || "", `http://localhost:1234`),
    ssePath: "/http",
    messagePath: "/message",
    req,
    res,
  });
});
 
httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
```

Here are the details for the values needed by the `startHTTP` method:

The web address the user is requesting.

The specific part of the URL where clients will connect for SSE (e.g., '/http').

The specific part of the URL where clients will send messages (e.g., '/message').

The incoming request object from your web server.

The response object from your web server, used to send data back.

### `close()`[](#close)

This method closes the server and releases all resources.

```ts
async close(): Promise<void>
```

### `getServerInfo()`[](#getserverinfo)

This method gives you a look at the server’s basic information.

```ts
getServerInfo(): ServerInfo
```

### `getServerDetail()`[](#getserverdetail)

This method gives you a detailed look at the server’s information.

```ts
getServerDetail(): ServerDetail
```

### `getToolListInfo()`[](#gettoollistinfo)

This method gives you a look at the tools that were set up when you created the server. It’s a read-only list, useful for debugging purposes.

```ts
getToolListInfo(): ToolListInfo
```

### `getToolInfo()`[](#gettoolinfo)

This method gives you detailed information about a specific tool.

```ts
getToolInfo(toolName: string): ToolInfo
```

### `executeTool()`[](#executetool)

This method executes a specific tool and returns the result.

```ts
executeTool(toolName: string, input: any): Promise<any>
```

### `getStdioTransport()`[](#getstdiotransport)

If you started the server with `startStdio()`, you can use this to get the object that manages the stdio communication. This is mostly for checking things internally or for testing.

```ts
getStdioTransport(): StdioServerTransport | undefined
```

### `getSseTransport()`[](#getssetransport)

If you started the server with `startSSE()`, you can use this to get the object that manages the SSE communication. Like `getStdioTransport`, this is mainly for internal checks or testing.

```ts
getSseTransport(): SSEServerTransport | undefined
```

### `getSseHonoTransport()`[](#getssehonotransport)

If you started the server with `startHonoSSE()`, you can use this to get the object that manages the SSE communication. Like `getSseTransport`, this is mainly for internal checks or testing.

```ts
getSseHonoTransport(): SSETransport | undefined
```

### `getStreamableHTTPTransport()`[](#getstreamablehttptransport)

If you started the server with `startHTTP()`, you can use this to get the object that manages the HTTP communication. Like `getSseTransport`, this is mainly for internal checks or testing.

```ts
getStreamableHTTPTransport(): StreamableHTTPServerTransport | undefined
```

### tools()[](#tools)

Executes a specific tool provided by this MCP server.

```ts
async executeTool(
  toolId: string,
  args: any,
  executionContext?: { messages?: any[]; toolCallId?: string },
): Promise<any>
```

The arguments to pass to the tool's execute function.

Optional context for the tool execution, like messages or a toolCallId.

#### Resource Handling[](#resource-handling)

---------------------------------------

#### What are MCP Resources?[](#what-are-mcp-resources)

Resources are a core primitive in the Model Context Protocol (MCP) that allow servers to expose data and content that can be read by clients and used as context for LLM interactions. They represent any kind of data that an MCP server wants to make available, such as:

* File contents
* Database records
* API responses
* Live system data
* Screenshots and images
* Log files

Resources are identified by unique URIs (e.g., `file:///home/user/documents/report.pdf`, `postgres://database/customers/schema`) and can contain either text (UTF-8 encoded) or binary data (base64 encoded).

Clients can discover resources through:

1. **Direct resources**: Servers expose a list of concrete resources via a `resources/list` endpoint.
2. **Resource templates**: For dynamic resources, servers can expose URI templates (RFC 6570) that clients use to construct resource URIs.

To read a resource, clients make a `resources/read` request with the URI. Servers can also notify clients about changes to the resource list (`notifications/resources/list_changed`) or updates to specific resource content (`notifications/resources/updated`) if a client has subscribed to that resource.

For more detailed information, refer to the official MCP documentation on Resources .

### `MCPServerResources` Type[](#mcpserverresources-type)

The `resources` option takes an object of type `MCPServerResources`. This type defines the callbacks your server will use to handle resource requests:

```ts
export type MCPServerResources = {
  // Callback to list available resources
  listResources: () => Promise<Resource[]>;
 
  // Callback to get the content of a specific resource
  getResourceContent: ({
    uri,
  }: {
    uri: string;
  }) => Promise<MCPServerResourceContent | MCPServerResourceContent[]>;
 
  // Optional callback to list available resource templates
  resourceTemplates?: () => Promise<ResourceTemplate[]>;
};
 
export type MCPServerResourceContent = { text?: string } | { blob?: string };
```

Example:

```ts
import { MCPServer } from "@mastra/mcp";
import type {
  MCPServerResourceContent,
  Resource,
  ResourceTemplate,
} from "@mastra/mcp";
 
// Resources/resource templates will generally be dynamically fetched.
const myResources: Resource[] = [
  { uri: "file://data/123.txt", name: "Data File", mimeType: "text/plain" },
];
 
const myResourceContents: Record<string, MCPServerResourceContent> = {
  "file://data.txt/123": { text: "This is the content of the data file." },
};
 
const myResourceTemplates: ResourceTemplate[] = [
  {
    uriTemplate: "file://data/{id}",
    name: "Data File",
    description: "A file containing data.",
    mimeType: "text/plain",
  },
];
 
const myResourceHandlers: MCPServerResources = {
  listResources: async () => myResources,
  getResourceContent: async ({ uri }) => {
    if (myResourceContents[uri]) {
      return myResourceContents[uri];
    }
    throw new Error(`Resource content not found for ${uri}`);
  },
  resourceTemplates: async () => myResourceTemplates,
};
 
const serverWithResources = new MCPServer({
  name: "Resourceful Server",
  version: "1.0.0",
  tools: {
    /* ... your tools ... */
  },
  resources: myResourceHandlers,
});
```

### Notifying Clients of Resource Changes[](#notifying-clients-of-resource-changes)

If the available resources or their content change, your server can notify connected clients that are subscribed to the specific resource.

#### `server.resources.notifyUpdated({ uri: string })`[](#serverresourcesnotifyupdated-uri-string-)

Call this method when the content of a specific resource (identified by its `uri`) has been updated. If any clients are subscribed to this URI, they will receive a `notifications/resources/updated` message.

```ts
async server.resources.notifyUpdated({ uri: string }): Promise<void>
```

Example:

```ts
// After updating the content of 'file://data.txt'
await serverWithResources.resources.notifyUpdated({ uri: "file://data.txt" });
```

#### `server.resources.notifyListChanged()`[](#serverresourcesnotifylistchanged)

Call this method when the overall list of available resources has changed (e.g., a resource was added or removed). This will send a `notifications/resources/list_changed` message to clients, prompting them to re-fetch the list of resources.

```ts
async server.resources.notifyListChanged(): Promise<void>
```

Example:

```ts
// After adding a new resource to the list managed by 'myResourceHandlers.listResources'
await serverWithResources.resources.notifyListChanged();
```

Examples[](#examples)
---------------------

For practical examples of setting up and deploying an MCPServer, see the Deploying an MCPServer Example.

The example at the beginning of this page also demonstrates how to instantiate `MCPServer` with both tools and agents.

Related Information[](#related-information)
-------------------------------------------

* For connecting to MCP servers in Mastra, see the MCPClient documentation.
* For more about the Model Context Protocol, see the @modelcontextprotocol/sdk documentation .
