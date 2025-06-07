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
});

/**
 * Create Google provider for Gemini 2.5+ models with thinking capabilities
 */
export function createGemini25Provider(
  modelId: string = 'gemini-2.5-flash-preview-05-20',
  options: Partial<GoogleGenerativeAIProviderOptions> = {}
) {
  // 2.5+ models require a different approach - pass options directly without merging with base settings
  const defaultOptions: GoogleGenerativeAIProviderOptions = {
  };

  const mergedOptions: GoogleGenerativeAIProviderOptions = {
    ...defaultOptions,
    ...options,
    thinkingConfig: {
      ...defaultOptions.thinkingConfig,
      includeThoughts: true,
      ...(options.thinkingConfig || {})
    }
  };
  
  // Use baseGoogle without any additional settings for 2.5+ models
  return baseGoogle(modelId);
}

/**
 * Main function - auto-detects model version and uses appropriate provider
 */
export function createMastraGoogleProvider(
  modelId: string = 'gemini-2.0-flash-exp',
  options: any = {}
) {
  if (modelId.startsWith('gemini-2.5')) {
    return createGemini25Provider(modelId, options);
  } else {
    return baseGoogleModel(modelId);
  }
}

export type { GoogleGenerativeAIProviderOptions, GoogleGenerativeAIProviderSettings };
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
