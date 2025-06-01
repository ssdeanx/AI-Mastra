import { Metric, type MetricResult } from "@mastra/core/eval";
import { google } from '@ai-sdk/google';
import { ToxicityMetric } from "@mastra/evals/llm";
import { PromptAlignmentMetric } from "@mastra/evals/llm";
import { ContextualRecallMetric } from "@mastra/evals/llm";
import { ContextRelevancyMetric } from "@mastra/evals/llm";
import { ContextPrecisionMetric } from "@mastra/evals/llm";

// Default evaluation context array
const context1: string[] = ['Default evaluation context based on prior conversation or data.'];
// Instructions for PromptAlignmentMetric
const instructions1: string[] = ['You are a helpful assistant.'];

// Instantiate metrics
export const toxicityMetric = new ToxicityMetric(google('gemini-2.0-flash-exp'));

export const promptAlignmentMetric = new PromptAlignmentMetric(google('gemini-2.0-flash-exp'), {
  instructions: instructions1,
});

export const contextualRecallMetric = new ContextualRecallMetric(google('gemini-2.0-flash-exp'), {
  context: context1,
});
 
export const contextRelevancyMetric = new ContextRelevancyMetric(google('gemini-2.0-flash-exp'), {
  context: context1,
});

export const contextPrecisionMetric = new ContextPrecisionMetric(google('gemini-2.0-flash-exp'), {
  context: context1,
});

// Word inclusion metric to check if specific words are present in the output
interface WordInclusionResult extends MetricResult {
  score: number;
  info: {
    totalWords: number;
    matchedWords: number;
  };
}
 
export class WordInclusionMetric extends Metric {
  private referenceWords: Set<string>;
 
  constructor(words: string[]) {
    super();
    this.referenceWords = new Set(words);
  }
 
  async measure(input: string, output: string): Promise<WordInclusionResult> {
    const matchedWords = [...this.referenceWords].filter((k) =>
      output.includes(k),
    );
    const totalWords = this.referenceWords.size;
    const coverage = totalWords > 0 ? matchedWords.length / totalWords : 0;
 
    return {
      score: coverage,
      info: {
        totalWords: this.referenceWords.size,
        matchedWords: matchedWords.length,
      },
    };
  }
}

// Model info metric to return the model identifier
interface ModelInfoResult extends MetricResult {
  info: { model: string };
}

export class ModelInfoMetric extends Metric {
  private modelId: string;
  constructor(modelId: string) {
    super();
    this.modelId = modelId;
  }
  async measure(_input: string, _output: string): Promise<ModelInfoResult> {
    // Always returns score 1 and the configured model identifier
    return {
      score: 1,
      info: { model: this.modelId },
    };
  }
}

// Export default model info metric
export const modelInfoMetric = new ModelInfoMetric('gemini-2.0-flash-exp');