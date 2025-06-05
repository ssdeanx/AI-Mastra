import { google } from "@ai-sdk/google";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { createGraphRAGTool } from "@mastra/rag";

export const graphTool = createGraphRAGTool({
  vectorStoreName: "libsql",
  indexName: "context",
  model: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
  graphOptions: {
    dimension: 1536,
    threshold: 0.7,
    randomWalkSteps: 100,
    restartProb: 0.15,
  },
  description:
    "Analyze context relationships to find complex patterns and connections in the data",
});

export const runtimeContext = new RuntimeContext<{
  vectorStoreName: string;
  indexName: string;
  topK: number;
  filter: any;
  model: string;
  description: string;
  graphOptions: {
    dimension: number;
    threshold: number;
    randomWalkSteps: number;
    restartProb: number;
  };
}>();
runtimeContext.set("vectorStoreName", "libsql");
runtimeContext.set("indexName", "context");
runtimeContext.set("topK", 5);
runtimeContext.set("filter", { category: "context" });
runtimeContext.set("model", "gemini-embedding-exp-03-07");
runtimeContext.set("description", "Analyze context relationships to find complex patterns and connections in the data");
runtimeContext.set("graphOptions", {
  dimension: 1536,
  threshold: 0.7,
  randomWalkSteps: 100,
  restartProb: 0.15,
});
