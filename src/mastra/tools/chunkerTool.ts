import { createDocumentChunkerTool, MDocument } from "@mastra/rag";
 
const document = new MDocument({
  text: "Your document content here...",
  metadata: { source: "user-manual" },
});
 
const chunker = createDocumentChunkerTool({
  doc: document,
  params: {
    strategy: "recursive",
    size: 512,
    overlap: 50,
    separator: "\n",
  },
});
 
const { chunks } = await chunker.execute();