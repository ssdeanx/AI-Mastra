import { fastembed } from '@mastra/fastembed';
import { createVectorQueryTool } from "@mastra/rag";

export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "mastra",
  indexName: "context",
  model: fastembed
});
