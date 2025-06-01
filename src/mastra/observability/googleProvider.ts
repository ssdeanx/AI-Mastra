// Generated on 2025-06-01
/**
 * Google Generative AI Provider Setup for Mastra
 *
 * Clean Google provider with proper thinkingConfig support and all Google AI provider options.
 * Compatible with LangSmith tracing and all Gemini models including 2.5+ thinking models.
 *
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
 */
import { google as baseGoogle, GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';

/**
 * Export a base Google model with search grounding and dynamic retrieval enabled (default for most agents)
 */
export const baseGoogleModel = (modelId = 'gemini-2.0-flash-exp') => baseGoogle(modelId, {
  structuredOutputs: true,
  cachedContent: '{cachedContent}',
  useSearchGrounding: true,
  dynamicRetrievalConfig: {
    mode: 'MODE_DYNAMIC',
    dynamicThreshold: 0.8,
  },
});

/**
 * Export createMastraGoogleProvider for advanced configuration with all Google provider options
 * Supports thinking config, safety settings, generation config, and all other Google AI options
 * 
 * @param modelId - Google AI model ID (e.g., 'gemini-2.5-flash-preview-05-20')
 * @param options - All Google AI provider options including thinkingConfig, safetySettings, etc.
 */
export function createMastraGoogleProvider(
  modelId = 'gemini-2.5-flash-preview-05-20',
  options: Partial<GoogleGenerativeAIProviderOptions> = {}
) {
  // Default thinking budget for Gemini 2.5+ models
  const defaultOptions = {
    thinkingConfig: { thinkingBudget: 2048 },
    structuredOutputs: true,
    cachedContent: '{cachedContent}',
    useSearchGrounding: true,
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC' as const,
      dynamicThreshold: 0.8,
    },
  };

  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    // Ensure thinkingConfig is properly merged
    thinkingConfig: options.thinkingConfig || defaultOptions.thinkingConfig
  };

  return baseGoogle(modelId, mergedOptions);
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
