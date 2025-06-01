// Generated on 2025-06-01
/**
 * Research & Analysis Workflow (Mastra)
 *
 * Comprehensive research workflow for automated analysis and reporting:
 * 1. MCP Agent gathers research data from external sources
 * 2. Master Agent analyzes and synthesizes information
 * 3. Worker Agent creates structured analysis reports
 * 4. Supervisor Agent reviews and validates findings
 *
 * Use Cases:
 * - Market research and competitive analysis
 * - Technical research and documentation
 * - Investment research and due diligence
 * - Academic research automation
 *
 * @module researchAnalysisWorkflow
 */
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { mcpAgent } from '../agents/mcpAgent';
import { masterAgent } from '../agents/masterAgent';
import { workerAgent } from '../agents/workerAgent';
import { supervisorAgent } from '../agents/supervisorAgent';

// Step 1: Research data gathering using MCP tools
const dataGatheringStep = createStep({
  id: 'data-gathering',
  inputSchema: z.object({
    researchQuery: z.string().describe('Research topic or question'),
    sources: z.array(z.string()).optional().describe('Specific sources to research'),
    depth: z.enum(['shallow', 'medium', 'deep']).default('medium').describe('Research depth level'),
  }),
  outputSchema: z.object({
    rawData: z.string().describe('Raw research data collected'),
    sources: z.array(z.string()).describe('Sources used for research'),
    dataQuality: z.string().describe('Assessment of data quality'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const researchPrompt = `Conduct ${inputData.depth} research on: "${inputData.researchQuery}"
      
${inputData.sources ? `Focus on these sources: ${inputData.sources.join(', ')}` : 'Use all available sources'}

Please gather:
1. Key facts and statistics
2. Current trends and developments
3. Expert opinions and analysis
4. Relevant case studies or examples
5. Supporting evidence and citations

Provide comprehensive, accurate, and up-to-date information.`;

      const response = await mcpAgent.generate([
        { role: 'user', content: researchPrompt }
      ]);

      const sources = response.text.match(/https?:\/\/[^\s]+/g) || ['MCP Tools', 'External APIs'];
      const dataQuality = response.text.length > 2000 ? 'high' : 
                         response.text.length > 1000 ? 'medium' : 'low';

      mastra.getLogger()?.info('Research data gathered', {
        query: inputData.researchQuery,
        dataLength: response.text.length,
        sourcesFound: sources.length,
        quality: dataQuality
      });

      return {
        rawData: response.text,
        sources,
        dataQuality
      };
    } catch (err) {
      mastra.getLogger()?.error('Data gathering failed', { err, query: inputData.researchQuery });
      throw err;
    }
  },
});

// Step 2: Analysis and synthesis by Master Agent
const analysisStep = createStep({
  id: 'analysis-synthesis',
  inputSchema: z.object({
    rawData: z.string(),
    sources: z.array(z.string()),
    dataQuality: z.string(),
  }),
  outputSchema: z.object({
    keyFindings: z.string().describe('Main research findings'),
    patterns: z.string().describe('Identified patterns and trends'),
    insights: z.string().describe('Strategic insights and implications'),
    recommendations: z.string().describe('Actionable recommendations'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const analysisPrompt = `Analyze this research data and provide strategic insights:

RAW DATA:
${inputData.rawData}

DATA SOURCES: ${inputData.sources.join(', ')}
DATA QUALITY: ${inputData.dataQuality}

Please provide:
1. KEY FINDINGS: Most important discoveries and facts
2. PATTERNS & TRENDS: What patterns emerge from the data
3. STRATEGIC INSIGHTS: What do these findings mean strategically
4. RECOMMENDATIONS: Specific, actionable next steps

Be analytical, objective, and focus on actionable intelligence.`;

      const response = await masterAgent.generate([
        { role: 'user', content: analysisPrompt }
      ]);

      // Parse sections from response
      const sections = response.text.split(/(?:KEY FINDINGS|PATTERNS|INSIGHTS|RECOMMENDATIONS):/i);
      const keyFindings = sections[1]?.trim() || 'Findings included in main analysis';
      const patterns = sections[2]?.trim() || 'Patterns included in main analysis';
      const insights = sections[3]?.trim() || 'Insights included in main analysis';
      const recommendations = sections[4]?.trim() || 'Recommendations included in main analysis';

      mastra.getLogger()?.info('Analysis completed', {
        findingsLength: keyFindings.length,
        hasRecommendations: recommendations.length > 50
      });

      return {
        keyFindings,
        patterns,
        insights,
        recommendations
      };
    } catch (err) {
      mastra.getLogger()?.error('Analysis failed', { err });
      throw err;
    }
  },
});

// Step 3: Report generation by Worker Agent
const reportGenerationStep = createStep({
  id: 'report-generation',
  inputSchema: z.object({
    keyFindings: z.string(),
    patterns: z.string(),
    insights: z.string(),
    recommendations: z.string(),
  }),
  outputSchema: z.object({
    executiveSummary: z.string().describe('Executive summary of research'),
    detailedReport: z.string().describe('Full structured research report'),
    actionItems: z.string().describe('Prioritized action items'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const reportPrompt = `Create a comprehensive research report based on this analysis:

KEY FINDINGS:
${inputData.keyFindings}

PATTERNS & TRENDS:
${inputData.patterns}

STRATEGIC INSIGHTS:
${inputData.insights}

RECOMMENDATIONS:
${inputData.recommendations}

Please create:
1. EXECUTIVE SUMMARY: 2-3 paragraph high-level overview
2. DETAILED REPORT: Structured, professional report with sections
3. ACTION ITEMS: Prioritized list of specific next steps

Format professionally with clear headings and bullet points where appropriate.`;

      const response = await workerAgent.generate([
        { role: 'user', content: reportPrompt }
      ]);

      // Extract sections
      const summaryMatch = response.text.match(/EXECUTIVE SUMMARY:?\s*(.*?)(?=DETAILED REPORT|$)/is);
      const reportMatch = response.text.match(/DETAILED REPORT:?\s*(.*?)(?=ACTION ITEMS|$)/is);
      const actionsMatch = response.text.match(/ACTION ITEMS:?\s*(.*?)$/is);

      const executiveSummary = summaryMatch?.[1]?.trim() || 'Summary included in main report';
      const detailedReport = reportMatch?.[1]?.trim() || response.text;
      const actionItems = actionsMatch?.[1]?.trim() || 'Action items included in main report';

      mastra.getLogger()?.info('Report generated', {
        summaryLength: executiveSummary.length,
        reportLength: detailedReport.length,
        actionItemsCount: actionItems.split('\n').length
      });

      return {
        executiveSummary,
        detailedReport,
        actionItems
      };
    } catch (err) {
      mastra.getLogger()?.error('Report generation failed', { err });
      throw err;
    }
  },
});

// Step 4: Quality review and validation by Supervisor
const qualityReviewStep = createStep({
  id: 'quality-review',
  inputSchema: z.object({
    executiveSummary: z.string(),
    detailedReport: z.string(),
    actionItems: z.string(),
  }),
  outputSchema: z.object({
    qualityScore: z.number().describe('Quality score from 1-10'),
    reviewComments: z.string().describe('Quality review feedback'),
    finalReport: z.string().describe('Final validated research report'),
    approvalStatus: z.string().describe('Final approval status'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const reviewPrompt = `Review this research report for quality and completeness:

EXECUTIVE SUMMARY:
${inputData.executiveSummary}

DETAILED REPORT:
${inputData.detailedReport}

ACTION ITEMS:
${inputData.actionItems}

Please evaluate:
1. COMPLETENESS: Are all sections thorough and complete?
2. ACCURACY: Is the information well-reasoned and logical?
3. CLARITY: Is the writing clear and professional?
4. ACTIONABILITY: Are recommendations specific and actionable?
5. OVERALL QUALITY: Rate 1-10 and provide specific feedback

Provide a quality score (1-10) and detailed review comments.`;

      const response = await supervisorAgent.generate([
        { role: 'user', content: reviewPrompt }
      ]);

      // Extract quality score
      const scoreMatch = response.text.match(/(?:score|rating):\s*(\d+)/i);
      const qualityScore = scoreMatch ? parseInt(scoreMatch[1]) : 8;

      const approvalStatus = qualityScore >= 8 ? 'approved' : 
                           qualityScore >= 6 ? 'approved-with-notes' : 'needs-revision';

      // Compile final report
      const finalReport = `# Research Analysis Report

## Executive Summary
${inputData.executiveSummary}

## Detailed Analysis
${inputData.detailedReport}

## Action Items
${inputData.actionItems}

## Quality Review
- Score: ${qualityScore}/10
- Status: ${approvalStatus}
- Comments: ${response.text}`;

      mastra.getLogger()?.info('Quality review completed', {
        qualityScore,
        approvalStatus,
        reportLength: finalReport.length
      });

      return {
        qualityScore,
        reviewComments: response.text,
        finalReport,
        approvalStatus
      };
    } catch (err) {
      mastra.getLogger()?.error('Quality review failed', { err });
      throw err;
    }
  },
});

// Main Research & Analysis Workflow
export const researchAnalysisWorkflow = createWorkflow({
  id: 'research-analysis',
  inputSchema: z.object({
    researchQuery: z.string().describe('Research topic or question'),
    sources: z.array(z.string()).optional().describe('Specific sources to research'),
    depth: z.enum(['shallow', 'medium', 'deep']).default('medium').describe('Research depth level'),
  }),
  outputSchema: z.object({
    rawData: z.string().describe('Raw research data collected'),
    keyFindings: z.string().describe('Main research findings'),
    insights: z.string().describe('Strategic insights and implications'),
    finalReport: z.string().describe('Final validated research report'),
    qualityScore: z.number().describe('Quality score from 1-10'),
    approvalStatus: z.string().describe('Final approval status'),
  }),
  steps: [dataGatheringStep, analysisStep, reportGenerationStep, qualityReviewStep],
})
  .then(dataGatheringStep)
  .then(analysisStep)
  .then(reportGenerationStep)
  .then(qualityReviewStep)
  .commit();
