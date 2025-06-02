import { Metric, type MetricResult } from "@mastra/core/eval";
import { createTracedGoogleModel } from '../observability';
// Initialize traced Google model for LLM-based evaluations
const defaultModel = createTracedGoogleModel('gemini-2.0-flash-exp');
import { ToxicityMetric } from "@mastra/evals/llm";
import { PromptAlignmentMetric } from "@mastra/evals/llm";
import { ContextualRecallMetric } from "@mastra/evals/llm";
import { ContextRelevancyMetric } from "@mastra/evals/llm";
import { ContextPrecisionMetric } from "@mastra/evals/llm";
import { SummarizationMetric, FaithfulnessMetric, HallucinationMetric, AnswerRelevancyMetric, BiasMetric } from '@mastra/evals/llm';
import { ContentSimilarityMetric, ToneConsistencyMetric } from '@mastra/evals/nlp';

// Default evaluation context array
const context1: string[] = ['Default evaluation context based on prior conversation or data.'];
// Instructions for PromptAlignmentMetric
const instructions1: string[] = ['You are a helpful assistant.'];

// Instantiate LLM-based metrics
export const toxicityMetric = new ToxicityMetric(defaultModel);

export const promptAlignmentMetric = new PromptAlignmentMetric(defaultModel, {
  instructions: instructions1,
});

export const contextualRecallMetric = new ContextualRecallMetric(defaultModel, {
  context: context1,
});
 
export const contextRelevancyMetric = new ContextRelevancyMetric(defaultModel, {
  context: context1,
});

export const contextPrecisionMetric = new ContextPrecisionMetric(defaultModel, {
  context: context1,
});

// Additional LLM-based metrics
export const summarizationMetric = new SummarizationMetric(defaultModel);
export const faithfulnessMetric = new FaithfulnessMetric(defaultModel, { context: context1 });
export const hallucinationMetric = new HallucinationMetric(defaultModel, { context: context1 });
export const answerRelevancyMetric = new AnswerRelevancyMetric(defaultModel, {});
export const biasMetric = new BiasMetric(defaultModel, {});

// NLP-based metrics (non-LLM)
export const contentSimilarityMetric = new ContentSimilarityMetric();
export const toneConsistencyMetric = new ToneConsistencyMetric();

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
    return { score: 1, info: { model: this.modelId } };
  }
}

// Instantiate custom metrics
export const wordInclusionMetric = new WordInclusionMetric([]);
export const modelInfoMetric = new ModelInfoMetric('gemini-2.0-flash-exp');

// Export a collective object for easy import in agents
export const evals = {
  toxicityMetric,
  promptAlignmentMetric,
  contextualRecallMetric,
  contextRelevancyMetric,
  contextPrecisionMetric,
  summarizationMetric,
  faithfulnessMetric,
  hallucinationMetric,
  answerRelevancyMetric,
  biasMetric,
  contentSimilarityMetric,
  toneConsistencyMetric,
  wordInclusionMetric,
  modelInfoMetric,
};

// Type for the eval suite
export type Evals = typeof evals;