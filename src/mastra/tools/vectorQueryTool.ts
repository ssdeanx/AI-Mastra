import { google } from '@ai-sdk/google';
import { createVectorQueryTool } from "@mastra/rag";

export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "mastra",
  indexName: "context",
  model: google.textEmbeddingModel("gemini-embedding-exp-03-07"),
});
