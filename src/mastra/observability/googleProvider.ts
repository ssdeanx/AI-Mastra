// Generated on 2025-06-01
/**
 * Google Generative AI Provider Setup for Mastra
 *
 * Clean Google provider with proper thinkingConfig support and all Google AI provider options.
 * Compatible with LangSmith tracing and all Gemini models including 2.5+ thinking models.
 *
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
 */
import { google as baseGoogle, GoogleGenerativeAIProviderSettings, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';

/**
 * Export a base Google model with search grounding and dynamic retrieval enabled (default for most agents)
 */
export const baseGoogleModel = (modelId = 'gemini-2.0-flash-exp') => baseGoogle(modelId, {
  useSearchGrounding: true,
  dynamicRetrievalConfig: {
    mode: 'MODE_DYNAMIC',
    dynamicThreshold: 0.8,
  },
});

/**
 * Export createMastraGoogleProvider for advanced/thinking config use (e.g. Gemini 2.5+)
 * Usage: createMastraGoogleProvider('gemini-2.5-flash-preview-05-20', { thinkingConfig: { thinkingBudget: 2048 } })
 */
export function createMastraGoogleProvider(
  modelId = 'gemini-2.5-flash-preview-05-20',
  options: GoogleGenerativeAIProviderOptions = {}
) {
  // Use the base Google model with provided options
  return baseGoogle(modelId, {
    ...options,
    useSearchGrounding: true, // Enable search grounding by default
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC',
      dynamicThreshold: 0.8,
    },
  });
}

export type { GoogleGenerativeAIProviderOptions };


/**
 * Usage examples:
 * 
 * // Basic usage
 * const model = createMastraGoogleProvider('gemini-2.5-flash-preview-05-20');
 * 
 * // With thinking config for thinking models
 * const thinkingModel = createMastraGoogleProvider('gemini-2.5-flash-preview-05-20', {
 *   thinkingConfig: {
 *     thinkingBudget: 2048
 *   }
 * });
 * */
