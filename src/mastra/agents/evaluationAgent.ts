import { Agent } from '@mastra/core/agent';
import { agentMemory } from '../agentMemory';
import { PinoLogger } from '@mastra/loggers';
import { createTracedGoogleModel } from '../observability';
import { evals } from '../evals';

const logger = new PinoLogger({
    name: 'EvaluationAgent',
    level: 'info',
});

logger.info('EvaluationAgent initialized');

/**
 * @file Defines the Evaluation Agent responsible for assessing outputs using various metrics.
 * @license Apache-2.0
 */

/**
 * Represents the type for evaluation results, which can vary based on the metric.
 */
type EvaluationResult = any; // Consider defining a more specific type or union of metric result types

/**
 * Evaluation Agent instance for assessing data using defined metrics.
 *
 * @remarks
 * This agent uses metrics from the `src/mastra/evals/index.ts` module.
 * It exposes all metrics via the `evals` property for programmatic use.
 */
export const evaluationAgent: Agent = new Agent({
  name: 'Evaluation Agent',
  instructions: `
    You are the Evaluation Agent.
    Use the attached evals to assess outputs.
    To run an evaluation, call agent.evals.<metricName>.measure(input, output, options).
    For example: agent.evals.toxicityMetric.measure(input, output).
    Prismatically combine results as needed.
  `,
  model: createTracedGoogleModel('gemini-2.0-flash-exp', { // Using a cost-effective model for internal tasks
    name: 'evaluation-agent-model',
    tags: ['agent', 'evaluation', 'metrics'],
    temperature: 0.3, // Lower temperature for more deterministic evaluation guidance
  }),
  evals,
  memory: agentMemory,
});

// No example code needed; evaluation usage is handled programmatically via attached evals. 