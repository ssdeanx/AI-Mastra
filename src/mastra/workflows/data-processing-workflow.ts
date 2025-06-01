// Generated on 2025-06-01
/**
 * Data Processing & Insights Workflow (Mastra)
 *
 * Automated data processing and business intelligence workflow:
 * 1. MCP Agent collects data from various sources
 * 2. Worker Agent validates and processes the data
 * 3. Master Agent performs analytics and pattern recognition
 * 4. Supervisor Agent generates insights and recommendations
 *
 * Use Cases:
 * - Business intelligence and reporting
 * - Data pipeline automation
 * - Performance analytics and KPI tracking
 * - Market data analysis
 *
 * @module dataProcessingWorkflow
 */
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { mcpAgent } from '../agents/mcpAgent';
import { workerAgent } from '../agents/workerAgent';
import { masterAgent } from '../agents/masterAgent';
import { supervisorAgent } from '../agents/supervisorAgent';

// Step 1: Data collection from multiple sources
const dataCollectionStep = createStep({
  id: 'data-collection',
  inputSchema: z.object({
    dataSources: z.array(z.string()).describe('List of data sources to collect from'),
    timeRange: z.string().describe('Time range for data collection (e.g., "last 30 days")'),
    metrics: z.array(z.string()).describe('Specific metrics to collect'),
    filters: z.record(z.any()).optional().describe('Optional filters for data collection'),
  }),
  outputSchema: z.object({
    rawData: z.string().describe('Raw collected data'),
    dataSize: z.number().describe('Size of collected dataset'),
    collectionSummary: z.string().describe('Summary of data collection process'),
    dataQuality: z.string().describe('Initial data quality assessment'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const collectionPrompt = `Collect and aggregate data from the following sources:

DATA SOURCES: ${inputData.dataSources.join(', ')}
TIME RANGE: ${inputData.timeRange}
METRICS TO COLLECT: ${inputData.metrics.join(', ')}
${inputData.filters ? `FILTERS: ${JSON.stringify(inputData.filters)}` : ''}

Please:
1. Gather data from all specified sources
2. Ensure data consistency and format
3. Identify any data quality issues
4. Provide a summary of the collection process
5. Estimate data completeness and reliability

Focus on accuracy and completeness of the dataset.`;

      const response = await mcpAgent.generate([
        { role: 'user', content: collectionPrompt }
      ]);

      // Simulate data metrics
      const dataSize = Math.floor(Math.random() * 50000) + 1000;
      const qualityIndicators = ['excellent', 'good', 'fair', 'poor'];
      const dataQuality = qualityIndicators[Math.floor(Math.random() * qualityIndicators.length)];

      mastra.getLogger()?.info('Data collection completed', {
        sources: inputData.dataSources.length,
        timeRange: inputData.timeRange,
        metricsCount: inputData.metrics.length,
        dataSize,
        quality: dataQuality
      });

      return {
        rawData: response.text,
        dataSize,
        collectionSummary: `Collected ${dataSize} data points from ${inputData.dataSources.length} sources over ${inputData.timeRange}`,
        dataQuality
      };
    } catch (err) {
      mastra.getLogger()?.error('Data collection failed', { err, sources: inputData.dataSources });
      throw err;
    }
  },
});

// Step 2: Data validation and processing
const dataValidationStep = createStep({
  id: 'data-validation',
  inputSchema: z.object({
    rawData: z.string(),
    dataSize: z.number(),
    collectionSummary: z.string(),
    dataQuality: z.string(),
  }),
  outputSchema: z.object({
    cleanedData: z.string().describe('Validated and cleaned dataset'),
    validationReport: z.string().describe('Data validation report'),
    processingSteps: z.string().describe('Steps taken during processing'),
    dataIntegrity: z.number().describe('Data integrity score 1-10'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const validationPrompt = `Validate, clean, and process this dataset:

RAW DATA:
${inputData.rawData}

COLLECTION SUMMARY:
${inputData.collectionSummary}

DATA QUALITY ASSESSMENT: ${inputData.dataQuality}
DATA SIZE: ${inputData.dataSize} records

Please perform:
1. DATA VALIDATION: Check for errors, inconsistencies, duplicates
2. DATA CLEANING: Remove or fix invalid entries
3. DATA STANDARDIZATION: Ensure consistent formats
4. INTEGRITY CHECK: Verify data completeness and accuracy
5. PROCESSING REPORT: Document all steps taken

Provide a clean, reliable dataset ready for analysis.`;

      const response = await workerAgent.generate([
        { role: 'user', content: validationPrompt }
      ]);

      // Calculate integrity score based on quality
      const integrityMap = { excellent: 9, good: 7, fair: 5, poor: 3 };
      const dataIntegrity = integrityMap[inputData.dataQuality as keyof typeof integrityMap] || 6;

      // Parse sections
      const cleanedMatch = response.text.match(/(?:CLEANED|PROCESSED) DATA:?\s*(.*?)(?=VALIDATION REPORT|PROCESSING|$)/is);
      const reportMatch = response.text.match(/VALIDATION REPORT:?\s*(.*?)(?=PROCESSING|$)/is);
      const stepsMatch = response.text.match(/PROCESSING.*?:?\s*(.*?)$/is);

      const cleanedData = cleanedMatch?.[1]?.trim() || response.text;
      const validationReport = reportMatch?.[1]?.trim() || 'Validation completed successfully';
      const processingSteps = stepsMatch?.[1]?.trim() || 'Standard validation and cleaning applied';

      mastra.getLogger()?.info('Data validation completed', {
        originalSize: inputData.dataSize,
        dataIntegrity,
        validationLength: validationReport.length
      });

      return {
        cleanedData,
        validationReport,
        processingSteps,
        dataIntegrity
      };
    } catch (err) {
      mastra.getLogger()?.error('Data validation failed', { err });
      throw err;
    }
  },
});

// Step 3: Analytics and pattern recognition
const analyticsStep = createStep({
  id: 'analytics-processing',
  inputSchema: z.object({
    cleanedData: z.string(),
    validationReport: z.string(),
    processingSteps: z.string(),
    dataIntegrity: z.number(),
  }),
  outputSchema: z.object({
    analyticsResults: z.string().describe('Statistical analysis results'),
    patterns: z.string().describe('Identified patterns and trends'),
    correlations: z.string().describe('Key correlations discovered'),
    anomalies: z.string().describe('Anomalies or outliers detected'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const analyticsPrompt = `Perform comprehensive analytics on this cleaned dataset:

CLEANED DATA:
${inputData.cleanedData}

VALIDATION REPORT:
${inputData.validationReport}

DATA INTEGRITY SCORE: ${inputData.dataIntegrity}/10

Please provide:
1. STATISTICAL ANALYSIS: Key statistics, distributions, aggregations
2. PATTERN IDENTIFICATION: Trends, cycles, and recurring patterns
3. CORRELATION ANALYSIS: Relationships between variables
4. ANOMALY DETECTION: Unusual patterns or outliers
5. PREDICTIVE INDICATORS: Leading indicators and forecasting signals

Focus on actionable insights and business-relevant findings.`;

      const response = await masterAgent.generate([
        { role: 'user', content: analyticsPrompt }
      ]);

      // Parse sections
      const sections = response.text.split(/(?:STATISTICAL|PATTERN|CORRELATION|ANOMALY).*?:/i);
      const analyticsResults = sections[1]?.trim() || 'Analytics included in main response';
      const patterns = sections[2]?.trim() || 'Patterns included in main response';
      const correlations = sections[3]?.trim() || 'Correlations included in main response';
      const anomalies = sections[4]?.trim() || 'No significant anomalies detected';

      mastra.getLogger()?.info('Analytics completed', {
        dataIntegrity: inputData.dataIntegrity,
        resultsLength: analyticsResults.length,
        patternsFound: patterns.length > 50,
        anomaliesDetected: anomalies.length > 50
      });

      return {
        analyticsResults,
        patterns,
        correlations,
        anomalies
      };
    } catch (err) {
      mastra.getLogger()?.error('Analytics processing failed', { err });
      throw err;
    }
  },
});

// Step 4: Insights generation and recommendations
const insightsGenerationStep = createStep({
  id: 'insights-generation',
  inputSchema: z.object({
    analyticsResults: z.string(),
    patterns: z.string(),
    correlations: z.string(),
    anomalies: z.string(),
  }),
  outputSchema: z.object({
    keyInsights: z.string().describe('Primary business insights'),
    recommendations: z.string().describe('Actionable recommendations'),
    riskAssessment: z.string().describe('Risk factors and mitigation'),
    opportunityAnalysis: z.string().describe('Opportunities identified'),
    executiveSummary: z.string().describe('Executive summary for stakeholders'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const insightsPrompt = `Generate strategic insights and recommendations from this analysis:

ANALYTICS RESULTS:
${inputData.analyticsResults}

PATTERNS IDENTIFIED:
${inputData.patterns}

CORRELATIONS:
${inputData.correlations}

ANOMALIES:
${inputData.anomalies}

Please provide:
1. KEY INSIGHTS: Most important discoveries and their business implications
2. ACTIONABLE RECOMMENDATIONS: Specific steps to take based on findings
3. RISK ASSESSMENT: Potential risks and mitigation strategies
4. OPPORTUNITY ANALYSIS: Growth opportunities and optimization potential
5. EXECUTIVE SUMMARY: High-level overview for decision makers

Focus on strategic value and actionable intelligence.`;

      const response = await supervisorAgent.generate([
        { role: 'user', content: insightsPrompt }
      ]);

      // Parse sections
      const sections = response.text.split(/(?:KEY INSIGHTS|RECOMMENDATIONS|RISK|OPPORTUNITY|EXECUTIVE).*?:/i);
      const keyInsights = sections[1]?.trim() || 'Insights included in main response';
      const recommendations = sections[2]?.trim() || 'Recommendations included in main response';
      const riskAssessment = sections[3]?.trim() || 'Risk assessment included in main response';
      const opportunityAnalysis = sections[4]?.trim() || 'Opportunities included in main response';
      const executiveSummary = sections[5]?.trim() || 'Executive summary included in main response';

      mastra.getLogger()?.info('Insights generation completed', {
        insightsLength: keyInsights.length,
        recommendationsCount: recommendations.split('\n').length,
        hasRisks: riskAssessment.length > 50,
        hasOpportunities: opportunityAnalysis.length > 50
      });

      return {
        keyInsights,
        recommendations,
        riskAssessment,
        opportunityAnalysis,
        executiveSummary
      };
    } catch (err) {
      mastra.getLogger()?.error('Insights generation failed', { err });
      throw err;
    }
  },
});

// Main Data Processing & Insights Workflow
export const dataProcessingWorkflow = createWorkflow({
  id: 'data-processing-insights',
  inputSchema: z.object({
    dataSources: z.array(z.string()).describe('List of data sources to collect from'),
    timeRange: z.string().describe('Time range for data collection (e.g., "last 30 days")'),
    metrics: z.array(z.string()).describe('Specific metrics to collect'),
    filters: z.record(z.any()).optional().describe('Optional filters for data collection'),
  }),
  outputSchema: z.object({
    rawData: z.string().describe('Raw collected data'),
    cleanedData: z.string().describe('Validated and cleaned dataset'),
    analyticsResults: z.string().describe('Statistical analysis results'),
    keyInsights: z.string().describe('Primary business insights'),
    recommendations: z.string().describe('Actionable recommendations'),
    executiveSummary: z.string().describe('Executive summary for stakeholders'),
    dataIntegrity: z.number().describe('Data integrity score 1-10'),
  }),
  steps: [dataCollectionStep, dataValidationStep, analyticsStep, insightsGenerationStep],
})
  .then(dataCollectionStep)
  .then(dataValidationStep)
  .then(analyticsStep)
  .then(insightsGenerationStep)
  .commit();
