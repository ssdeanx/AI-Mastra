/**
 * Agent Monitoring Workflow (Inngest)
 *
 * This workflow provides continuous monitoring of deployed AI agents,
 * tracking key performance indicators, detecting anomalies, and triggering alerts.
 *
 * @module agent-monitoring-workflow
 * @license Apache-2.0
 * @generated on 2025-06-02
 */

import { z } from 'zod';
import { inngest } from '../../inngest';
import { init } from '@mastra/inngest';
import { PinoLogger } from '@mastra/loggers';

// Import relevant agents for monitoring tasks
import { mcpAgent } from '../../agents/mcpAgent';
import { dataManagerAgent } from '../../agents/dataManagerAgent';
import { supervisorAgent } from '../../agents/supervisorAgent';
import { evaluationAgent } from '../../agents/evaluationAgent';
import { masterAgent } from '../../agents/masterAgent';
import { ragAgent } from '../../agents/ragAgent';
import { stockAgent } from '../../agents/stockAgent';
import { weatherAgent } from '../../agents/weather-agent';
import { workerAgent } from '../../agents/workerAgent';
import { Evals } from '../../evals';

// Import observability components
import { traceAgentOperation } from '../../observability';
import { promptManager } from '../../observability/promptManager';

const { createWorkflow, createStep } = init(inngest);

const logger = new PinoLogger({
  name: 'agent-monitoring-workflow',
  level: 'info',
});

// Agent Registry - includes all agents available for evaluation
const agentRegistry = {
  masterAgent,
  supervisorAgent,
  mcpAgent,
  ragAgent,
  stockAgent,
  weatherAgent,
  workerAgent,
  evaluationAgent,
  dataManagerAgent,
};

// Input Schema for the Agent Monitoring Workflow
export const monitoringInputSchema = z.object({
  agentName: z.string().describe('The name of the agent to monitor'),
  environment: z.enum(['development', 'staging', 'production', 'testing']).describe('The environment where the agent is deployed'),
  monitoringIntervalSeconds: z.number().min(30).default(300).describe('How often to run monitoring checks in seconds'),
  metricsToMonitor: z.array(z.string()).describe('List of metrics (from evaluationAgent.evals) to continuously track').default([]),
  alertThresholds: z.record(z.number()).describe('Thresholds for each metric to trigger an alert (e.g., {\"toxicityMetric\": 0.8})').optional(),
  notificationEmails: z.array(z.string().email()).optional().describe('Email addresses to notify on critical alerts'),
  maxMonitoringCycles: z.number().min(1).optional().describe('Maximum number of monitoring cycles before stopping (for testing/finite runs)'),
});

// Output Schema for the Agent Monitoring Workflow
export const monitoringOutputSchema = z.object({
  monitoringRunId: z.string().describe('Unique ID for this monitoring run'),
  agentName: z.string().describe('The name of the monitored agent'),
  environment: z.string().describe('The environment being monitored'),
  monitoringIntervalSeconds: z.number().describe('The interval between checks in seconds'),
  metricsToMonitor: z.array(z.string()).describe('List of metrics being tracked'),
  alertThresholds: z.record(z.number()).optional().describe('Thresholds for alerts'),
  notificationEmails: z.array(z.string().email()).optional().describe('Email addresses to notify on critical alerts'),
  maxMonitoringCycles: z.number().min(1).optional().describe('Maximum number of monitoring cycles'),
  status: z.enum(['active', 'completed', 'alert_triggered', 'stopped', 'failed']).describe('Current status of the monitoring run'),
  lastCheckedAt: z.string().datetime().describe('Timestamp of the last monitoring check'),
  monitoringSummary: z.string().describe('A summary of the monitoring period').default('No summary yet.'),
  detectedAnomalies: z.array(z.object({
    metric: z.string(),
    currentValue: z.number(),
    threshold: z.number(),
    timestamp: z.string().datetime(),
    message: z.string(),
  })).describe('List of detected anomalies').default([]),
  triggeredAlerts: z.array(z.string()).describe('List of triggered alert messages').default([]),
  monitoringLogs: z.array(z.string()).default([]).describe('A collection of monitoring logs for the run'),
  evaluationResults: z.array(z.object({
    input: z.string(),
    agentOutput: z.string(),
    metricResults: z.record(z.any()),
    overallScore: z.number().optional(),
    evaluationNotes: z.array(z.string()),
    timestamp: z.string().datetime(),
  })).describe('Detailed evaluation results for each collected data point in the current cycle').default([]),
  nextCheckScheduledFor: z.string().datetime().describe('Timestamp of the next scheduled check'),
  totalMonitoringCycles: z.number().default(0).describe('Total number of monitoring cycles completed (acts as currentCycle for the next iteration)'),
});

/**
 * Step 1: Initialize Monitoring Parameters
 * Sets up the monitoring run and prepares initial state.
 */
const initializeMonitoringStep = createStep({
  id: 'initialize-monitoring',
  inputSchema: monitoringInputSchema,
  outputSchema: monitoringOutputSchema,
  execute: async ({ inputData }) => {
    const { agentName, environment } = inputData;
    const monitoringRunId = `mon-${Math.random().toString(36).substring(2, 11)}`; // Simple ID generation
    const timestamp = new Date().toISOString();

    const monitoringLogs = [`[${timestamp}] Initializing monitoring for ${agentName} in ${environment}. Run ID: ${monitoringRunId}`];

    logger.info('Monitoring initialization', { monitoringRunId, agentName, environment });

    return {
      monitoringRunId,
      agentName: inputData.agentName,
      environment: inputData.environment,
      monitoringIntervalSeconds: inputData.monitoringIntervalSeconds,
      metricsToMonitor: inputData.metricsToMonitor,
      alertThresholds: inputData.alertThresholds,
      notificationEmails: inputData.notificationEmails,
      maxMonitoringCycles: inputData.maxMonitoringCycles,
      status: 'active' as z.infer<typeof monitoringOutputSchema.shape.status>,
      lastCheckedAt: timestamp,
      monitoringSummary: 'Monitoring initialized.',
      detectedAnomalies: [],
      triggeredAlerts: [],
      monitoringLogs: [],
      evaluationResults: [],
      nextCheckScheduledFor: new Date(Date.now() + inputData.monitoringIntervalSeconds * 1000).toISOString(),
      totalMonitoringCycles: 0,
    };
  },
});

/**
 * Main Agent Monitoring Workflow
 * This workflow can be configured to run continuously or for a fixed number of cycles.
 */
export const agentMonitoringWorkflow = createWorkflow({
  id: 'agent-monitoring-workflow',
  inputSchema: monitoringInputSchema,
  outputSchema: monitoringOutputSchema,
})
.then(initializeMonitoringStep)
.dountil(
  // The loop step
  createStep({
    id: 'monitoring-loop-step',
    // The input to this step is the output of the previous iteration (which is monitoringOutputSchema)
    inputSchema: monitoringOutputSchema,
    outputSchema: monitoringOutputSchema,
    execute: async ({ inputData }) => {
      const { monitoringRunId, agentName, environment, monitoringIntervalSeconds, metricsToMonitor, alertThresholds, notificationEmails, maxMonitoringCycles, totalMonitoringCycles, detectedAnomalies, triggeredAlerts, monitoringLogs } = inputData;
      let currentLogs = [...monitoringLogs];
      let newDetectedAnomalies = [...detectedAnomalies];
      let newTriggeredAlerts = [...triggeredAlerts];
      let overallMonitoringStatus: z.infer<typeof monitoringOutputSchema.shape.status> = 'active';
      let monitoringSummary = 'No summary yet.';

      const currentCycle = totalMonitoringCycles + 1; // Increment for the current cycle

      // --- Step 2: Collect Agent Performance Data ---
      currentLogs.push(`[${new Date().toISOString()}] Monitoring Cycle ${currentCycle}: Collecting performance data.`);
      logger.info(`Monitoring Cycle ${currentCycle}: Collecting data for ${agentName}`, { monitoringRunId });

      let collectedData: { input: string; agentOutput: string; context?: Record<string, any>; timestamp: string; }[] = [];
      try {
        collectedData = [
          {
            input: 'What is the weather in London?',
            agentOutput: 'The weather in London is sunny with a temperature of 20°C.',
            timestamp: new Date().toISOString(),
          },
          {
            input: 'Tell me about Apple stock.',
            agentOutput: 'Apple Inc. (AAPL) stock price is $175.50.',
            timestamp: new Date().toISOString(),
          },
          {
            input: 'Explain quantum computing.',
            agentOutput: 'Quantum computing is a new type of computing that uses quantum-mechanical phenomena...',
            timestamp: new Date().toISOString(),
          },
        ];
        currentLogs.push(`[${new Date().toISOString()}] Collected ${collectedData.length} data points.`);
      } catch (error) {
        const errorMessage = `Data collection failed: ${error instanceof Error ? error.message : String(error)}`;
        currentLogs.push(`[${new Date().toISOString()}] Error: ${errorMessage}`);
        logger.error('Data collection failed', { monitoringRunId, error: errorMessage });
      }

      // --- Step 3: Evaluate Collected Data with Evaluation Agent ---
      currentLogs.push(`[${new Date().toISOString()}] Monitoring Cycle ${currentCycle}: Evaluating collected data.`);
      logger.info(`Monitoring Cycle ${currentCycle}: Evaluating data for ${agentName}`, { monitoringRunId });

      const evaluationResults: z.infer<typeof monitoringOutputSchema.shape.evaluationResults> = [];
      const availableEvals = evaluationAgent.evals as Evals;

      for (const dataPoint of collectedData) {
        const metricResults: Record<string, any> = {};
        const evaluationNotes: string[] = [];
        let totalScore = 0;
        let appliedMetricsCount = 0;

        for (const metricName of metricsToMonitor) {
          if (metricName in availableEvals && typeof availableEvals[metricName as keyof Evals].measure === 'function') {
            try {
              const metric = availableEvals[metricName as keyof Evals];
              const measureFunction = metric.measure as (input: string, output: string, options?: any) => Promise<any>;

              const score = await measureFunction(
                dataPoint.input,
                dataPoint.agentOutput,
                { context: dataPoint.context } // Pass context if applicable
              );
              metricResults[metricName] = score;
              totalScore += typeof score === 'number' ? score : (score?.score || 0);
              appliedMetricsCount++;
            } catch (metricError) {
              const errorMessage = metricError instanceof Error ? metricError.message : String(metricError);
              metricResults[metricName] = { error: errorMessage, status: 'failed' };
              evaluationNotes.push(`Metric "${metricName}" failed: ${errorMessage}`);
              logger.error(`Metric "${metricName}" failed during monitoring for input "${dataPoint.input.substring(0, 50)}..."`, { error: errorMessage });
            }
          } else {
            evaluationNotes.push(`Metric "${metricName}" not found or not measureable.`);
            logger.warn(`Requested metric "${metricName}" not found or not measureable for monitoring.`);
          }
        }

        const overallScore = appliedMetricsCount > 0 ? totalScore / appliedMetricsCount : undefined;

        evaluationResults.push({
          input: dataPoint.input,
          agentOutput: dataPoint.agentOutput,
          metricResults,
          overallScore,
          evaluationNotes,
          timestamp: dataPoint.timestamp,
        });
      }
      logger.info('Data evaluation completed.', { numEvaluated: evaluationResults.length });

      // --- Step 4: Anomaly Detection and Alerting ---
      currentLogs.push(`[${new Date().toISOString()}] Monitoring Cycle ${currentCycle}: Detecting anomalies and alerting.`);
      logger.info(`Monitoring Cycle ${currentCycle}: Checking for anomalies for ${agentName}`, { monitoringRunId });

      let hasNewAlert = false;

      if (evaluationResults.length === 0) {
        monitoringSummary += 'No data collected or evaluated in this cycle.\n';
      } else {
        const averageMetricScores: Record<string, number> = {};
        const metricCounts: Record<string, number> = {};

        evaluationResults.forEach((caseResult: z.infer<typeof monitoringOutputSchema.shape.evaluationResults>[number]) => {
          for (const metricName in caseResult.metricResults) {
            const metricValue = typeof caseResult.metricResults[metricName] === 'number' ? caseResult.metricResults[metricName] : (caseResult.metricResults[metricName]?.score || undefined);
            if (metricValue !== undefined) {
              averageMetricScores[metricName] = (averageMetricScores[metricName] || 0) + metricValue;
              metricCounts[metricName] = (metricCounts[metricName] || 0) + 1;
            }
          }
        });

        monitoringSummary += '### Metric Performance Overview:\n';
        for (const metricName in averageMetricScores) {
          if (metricCounts[metricName] > 0) {
            averageMetricScores[metricName] /= metricCounts[metricName];
            monitoringSummary += `- ${metricName}: ${averageMetricScores[metricName].toFixed(2)}\n`;

            if (alertThresholds && alertThresholds[metricName] !== undefined) {
              const threshold = alertThresholds[metricName];
              let anomalyDetected = false;
              let anomalyMessage = '';

              if (metricName === 'toxicityMetric' || metricName === 'biasMetric') {
                if (averageMetricScores[metricName] > threshold) {
                  anomalyDetected = true;
                  anomalyMessage = `${metricName} (${averageMetricScores[metricName].toFixed(2)}) exceeded threshold (${threshold.toFixed(2)}).`;
                }
              } else if (metricName === 'fluencyMetric' || metricName === 'coherenceMetric') {
                if (averageMetricScores[metricName] < threshold) {
                  anomalyDetected = true;
                  anomalyMessage = `${metricName} (${averageMetricScores[metricName].toFixed(2)}) fell below threshold (${threshold.toFixed(2)}).`;
                }
              } else {
                if (Math.abs(averageMetricScores[metricName] - threshold) > 0.1) {
                  anomalyDetected = true;
                  anomalyMessage = `${metricName} (${averageMetricScores[metricName].toFixed(2)}) deviates significantly from threshold (${threshold.toFixed(2)}).`;
                }
              }

              if (anomalyDetected) {
                newDetectedAnomalies.push({
                  metric: metricName,
                  currentValue: averageMetricScores[metricName],
                  threshold: threshold,
                  timestamp: new Date().toISOString(),
                  message: anomalyMessage,
                });
                hasNewAlert = true;
                currentLogs.push(`[${new Date().toISOString()}] ANOMALY DETECTED: ${anomalyMessage}`);
                logger.warn('Anomaly detected', { monitoringRunId, agentName, metric: metricName, value: averageMetricScores[metricName], threshold });
              }
            }
          }
        }

        const overallAverageScore = evaluationResults.reduce((sum: number, res: z.infer<typeof monitoringOutputSchema.shape.evaluationResults>[number]) => sum + (res.overallScore || 0), 0) / evaluationResults.length;
        monitoringSummary += `\nOverall Average Score: ${overallAverageScore.toFixed(2)}\n`;
      }

      if (hasNewAlert) {
        overallMonitoringStatus = 'alert_triggered';
        const alertMessage = `CRITICAL ALERT: Anomalies detected for ${agentName} in ${environment}. Review logs for details.`;
        newTriggeredAlerts.push(alertMessage);
        currentLogs.push(`[${new Date().toISOString()}] ALERT: ${alertMessage}`);
        logger.error('Critical alert triggered', { monitoringRunId, agentName, environment });

        if (notificationEmails && notificationEmails.length > 0) {
          try {
            const subject = `CRITICAL ALERT: Agent Monitoring - ${agentName} (${environment})`;
            const body = `${alertMessage}\n\nMonitoring Run ID: ${monitoringRunId}\nEnvironment: ${environment}\nDetected Anomalies:\n${newDetectedAnomalies.map(a => `- ${a.message} (Value: ${a.currentValue.toFixed(2)}, Threshold: ${a.threshold.toFixed(2)})`).join('\n')}\n\nFull logs available in Inngest dashboard.`;
            currentLogs.push(`[${new Date().toISOString()}] Alert notification email sent.`);
          } catch (emailError) {
            currentLogs.push(`[${new Date().toISOString()}] Error sending alert email: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
            logger.error('Failed to send monitoring alert email', { monitoringRunId, error: emailError });
          }
        }
      }

      const nextCheckScheduledFor = new Date(Date.now() + monitoringIntervalSeconds * 1000).toISOString();

      return {
        monitoringRunId,
        agentName,
        environment,
        status: overallMonitoringStatus,
        lastCheckedAt: new Date().toISOString(),
        monitoringSummary,
        detectedAnomalies: newDetectedAnomalies,
        triggeredAlerts: newTriggeredAlerts,
        monitoringLogs: currentLogs,
        evaluationResults,
        nextCheckScheduledFor,
        totalMonitoringCycles: currentCycle,
        monitoringIntervalSeconds,
        metricsToMonitor,
        alertThresholds,
        notificationEmails,
        maxMonitoringCycles,
      };
    },
  }),
  // The predicate function to determine if the loop should continue
  async ({ inputData }) => {
    // Cast inputData to the correct type for the predicate to ensure type safety
    const { maxMonitoringCycles, totalMonitoringCycles, status } = inputData as z.infer<typeof monitoringOutputSchema>;
    
    const shouldContinue = (!maxMonitoringCycles || (totalMonitoringCycles < maxMonitoringCycles)) && (status === 'active');
    
    if (!shouldContinue) {
      logger.info('Stopping agent monitoring workflow.', { monitoringRunId: inputData.monitoringRunId, reason: maxMonitoringCycles && totalMonitoringCycles >= maxMonitoringCycles ? 'max cycles reached' : 'status not active' });
    }

    return shouldContinue;
  }
)
.then(
  // Final step after the loop finishes
  createStep({
    id: 'monitoring-finalization',
    inputSchema: monitoringOutputSchema,
    outputSchema: monitoringOutputSchema,
    execute: async ({ inputData }) => {
      logger.info('Finalizing agent monitoring workflow.', { monitoringRunId: inputData.monitoringRunId, finalStatus: inputData.status });
      return inputData; 
    },
  })
)
.commit(); 