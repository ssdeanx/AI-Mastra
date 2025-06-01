// Generated on 2025-06-01
/**
 * Content Creation Pipeline Workflow (Mastra)
 *
 * End-to-end content creation workflow for high-quality content:
 * 1. Master Agent creates content strategy and outline
 * 2. Worker Agent writes the initial content draft
 * 3. Supervisor Agent edits and refines the content
 * 4. MCP Agent optimizes for SEO and distribution
 *
 * Use Cases:
 * - Blog posts and articles
 * - Technical documentation
 * - Marketing content and copy
 * - Social media content series
 *
 * @module contentCreationWorkflow
 */
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { masterAgent } from '../agents/masterAgent';
import { workerAgent } from '../agents/workerAgent';
import { supervisorAgent } from '../agents/supervisorAgent';
import { mcpAgent } from '../agents/mcpAgent';

// Step 1: Content planning and strategy
const contentPlanningStep = createStep({
  id: 'content-planning',
  inputSchema: z.object({
    topic: z.string().describe('Content topic or subject'),
    contentType: z.enum(['blog-post', 'article', 'documentation', 'marketing-copy', 'social-media']).describe('Type of content to create'),
    targetAudience: z.string().describe('Target audience description'),
    tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative']).default('professional').describe('Content tone'),
    wordCount: z.number().default(1000).describe('Target word count'),
    keywords: z.array(z.string()).optional().describe('SEO keywords to include'),
  }),
  outputSchema: z.object({
    contentStrategy: z.string().describe('Overall content strategy'),
    outline: z.string().describe('Detailed content outline'),
    keyMessages: z.string().describe('Key messages to convey'),
    seoGuidelines: z.string().describe('SEO optimization guidelines'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const planningPrompt = `Create a comprehensive content strategy and outline:

TOPIC: ${inputData.topic}
CONTENT TYPE: ${inputData.contentType}
TARGET AUDIENCE: ${inputData.targetAudience}
TONE: ${inputData.tone}
WORD COUNT: ${inputData.wordCount}
${inputData.keywords ? `KEYWORDS: ${inputData.keywords.join(', ')}` : ''}

Please provide:
1. CONTENT STRATEGY: High-level approach and goals
2. DETAILED OUTLINE: Section headings and key points
3. KEY MESSAGES: Main messages to communicate
4. SEO GUIDELINES: How to optimize for search and engagement

Make this strategic and actionable for content creation.`;

      const response = await masterAgent.generate([
        { role: 'user', content: planningPrompt }
      ]);

      // Parse sections
      const sections = response.text.split(/(?:CONTENT STRATEGY|DETAILED OUTLINE|KEY MESSAGES|SEO GUIDELINES):/i);
      const contentStrategy = sections[1]?.trim() || 'Strategy included in main response';
      const outline = sections[2]?.trim() || 'Outline included in main response';
      const keyMessages = sections[3]?.trim() || 'Key messages included in main response';
      const seoGuidelines = sections[4]?.trim() || 'SEO guidelines included in main response';

      mastra.getLogger()?.info('Content planning completed', {
        topic: inputData.topic,
        contentType: inputData.contentType,
        outlineLength: outline.length,
        hasKeywords: !!inputData.keywords?.length
      });

      return {
        contentStrategy,
        outline,
        keyMessages,
        seoGuidelines
      };
    } catch (err) {
      mastra.getLogger()?.error('Content planning failed', { err, topic: inputData.topic });
      throw err;
    }
  },
});

// Step 2: Content writing by Worker Agent
const contentWritingStep = createStep({
  id: 'content-writing',
  inputSchema: z.object({
    contentStrategy: z.string(),
    outline: z.string(),
    keyMessages: z.string(),
    seoGuidelines: z.string(),
  }),
  outputSchema: z.object({
    draftContent: z.string().describe('Initial content draft'),
    wordCount: z.number().describe('Actual word count'),
    sectionsCompleted: z.number().describe('Number of sections completed'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const writingPrompt = `Write high-quality content based on this plan:

CONTENT STRATEGY:
${inputData.contentStrategy}

OUTLINE TO FOLLOW:
${inputData.outline}

KEY MESSAGES:
${inputData.keyMessages}

SEO GUIDELINES:
${inputData.seoGuidelines}

Please write:
- Engaging introduction that hooks the reader
- Well-structured body following the outline
- Clear, compelling conclusion with call-to-action
- Natural keyword integration per SEO guidelines
- Professional, polished writing throughout

Focus on value, clarity, and reader engagement.`;

      const response = await workerAgent.generate([
        { role: 'user', content: writingPrompt }
      ]);

      const wordCount = response.text.split(/\s+/).length;
      const sectionsCompleted = (response.text.match(/#{1,6}|##|###|\n\n/g) || []).length;

      mastra.getLogger()?.info('Content writing completed', {
        wordCount,
        sectionsCompleted,
        contentLength: response.text.length
      });

      return {
        draftContent: response.text,
        wordCount,
        sectionsCompleted
      };
    } catch (err) {
      mastra.getLogger()?.error('Content writing failed', { err });
      throw err;
    }
  },
});

// Step 3: Content editing and refinement
const contentEditingStep = createStep({
  id: 'content-editing',
  inputSchema: z.object({
    draftContent: z.string(),
    wordCount: z.number(),
    sectionsCompleted: z.number(),
  }),
  outputSchema: z.object({
    editedContent: z.string().describe('Edited and refined content'),
    editingNotes: z.string().describe('Notes on changes made'),
    qualityScore: z.number().describe('Content quality score 1-10'),
    improvementsSuggested: z.string().describe('Additional improvement suggestions'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const editingPrompt = `Edit and refine this content for quality, clarity, and impact:

DRAFT CONTENT:
${inputData.draftContent}

CURRENT STATS:
- Word count: ${inputData.wordCount}
- Sections: ${inputData.sectionsCompleted}

Please provide:
1. EDITED CONTENT: Improved version with better flow, clarity, and engagement
2. EDITING NOTES: Summary of changes made and reasoning
3. QUALITY SCORE: Rate the content quality 1-10
4. IMPROVEMENT SUGGESTIONS: Additional recommendations

Focus on:
- Grammar, style, and readability
- Logical flow and structure
- Compelling language and engagement
- Clear value proposition
- Strong conclusions and CTAs`;

      const response = await supervisorAgent.generate([
        { role: 'user', content: editingPrompt }
      ]);

      // Extract quality score
      const scoreMatch = response.text.match(/quality.*?score.*?(\d+)/i);
      const qualityScore = scoreMatch ? parseInt(scoreMatch[1]) : 8;

      // Parse sections
      const contentMatch = response.text.match(/EDITED CONTENT:?\s*(.*?)(?=EDITING NOTES|$)/is);
      const notesMatch = response.text.match(/EDITING NOTES:?\s*(.*?)(?=QUALITY SCORE|IMPROVEMENT|$)/is);
      const improvementsMatch = response.text.match(/IMPROVEMENT.*?:?\s*(.*?)$/is);

      const editedContent = contentMatch?.[1]?.trim() || inputData.draftContent;
      const editingNotes = notesMatch?.[1]?.trim() || 'Editing notes included in response';
      const improvementsSuggested = improvementsMatch?.[1]?.trim() || 'No additional improvements suggested';

      mastra.getLogger()?.info('Content editing completed', {
        qualityScore,
        originalLength: inputData.draftContent.length,
        editedLength: editedContent.length
      });

      return {
        editedContent,
        editingNotes,
        qualityScore,
        improvementsSuggested
      };
    } catch (err) {
      mastra.getLogger()?.error('Content editing failed', { err });
      throw err;
    }
  },
});

// Step 4: SEO optimization and finalization
const seoOptimizationStep = createStep({
  id: 'seo-optimization',
  inputSchema: z.object({
    editedContent: z.string(),
    editingNotes: z.string(),
    qualityScore: z.number(),
    improvementsSuggested: z.string(),
  }),
  outputSchema: z.object({
    finalContent: z.string().describe('SEO-optimized final content'),
    seoScore: z.number().describe('SEO optimization score 1-10'),
    metaDescription: z.string().describe('Meta description for SEO'),
    suggestedTags: z.array(z.string()).describe('Suggested tags/categories'),
    distributionPlan: z.string().describe('Content distribution recommendations'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const seoPrompt = `Optimize this content for SEO and create distribution plan:

EDITED CONTENT:
${inputData.editedContent}

EDITING NOTES:
${inputData.editingNotes}

QUALITY SCORE: ${inputData.qualityScore}/10

Please provide:
1. FINAL CONTENT: SEO-optimized version with proper headings, meta tags, etc.
2. SEO SCORE: Rate SEO optimization 1-10
3. META DESCRIPTION: Compelling 150-160 character meta description
4. SUGGESTED TAGS: Relevant tags/categories for organization
5. DISTRIBUTION PLAN: Strategy for content promotion and distribution

Optimize for:
- Search engine visibility
- User engagement
- Social media sharing
- Content discoverability`;

      const response = await mcpAgent.generate([
        { role: 'user', content: seoPrompt }
      ]);

      // Extract sections
      const contentMatch = response.text.match(/FINAL CONTENT:?\s*(.*?)(?=SEO SCORE|$)/is);
      const scoreMatch = response.text.match(/seo.*?score.*?(\d+)/i);
      const metaMatch = response.text.match(/META DESCRIPTION:?\s*(.*?)(?=SUGGESTED TAGS|$)/is);
      const tagsMatch = response.text.match(/SUGGESTED TAGS:?\s*(.*?)(?=DISTRIBUTION|$)/is);
      const distributionMatch = response.text.match(/DISTRIBUTION.*?:?\s*(.*?)$/is);

      const finalContent = contentMatch?.[1]?.trim() || inputData.editedContent;
      const seoScore = scoreMatch ? parseInt(scoreMatch[1]) : 7;
      const metaDescription = metaMatch?.[1]?.trim() || 'Meta description to be created';
      const tagsText = tagsMatch?.[1]?.trim() || 'content, article';
      const suggestedTags = tagsText.split(/[,\n]/).map(tag => tag.trim()).filter(Boolean);
      const distributionPlan = distributionMatch?.[1]?.trim() || 'Distribution plan included in response';

      mastra.getLogger()?.info('SEO optimization completed', {
        seoScore,
        finalContentLength: finalContent.length,
        metaLength: metaDescription.length,
        tagsCount: suggestedTags.length
      });

      return {
        finalContent,
        seoScore,
        metaDescription,
        suggestedTags,
        distributionPlan
      };
    } catch (err) {
      mastra.getLogger()?.error('SEO optimization failed', { err });
      throw err;
    }
  },
});

// Main Content Creation Workflow
export const contentCreationWorkflow = createWorkflow({
  id: 'content-creation',
  inputSchema: z.object({
    topic: z.string().describe('Content topic or subject'),
    contentType: z.enum(['blog-post', 'article', 'documentation', 'marketing-copy', 'social-media']).describe('Type of content to create'),
    targetAudience: z.string().describe('Target audience description'),
    tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative']).default('professional').describe('Content tone'),
    wordCount: z.number().default(1000).describe('Target word count'),
    keywords: z.array(z.string()).optional().describe('SEO keywords to include'),
  }),
  outputSchema: z.object({
    contentStrategy: z.string().describe('Overall content strategy'),
    outline: z.string().describe('Detailed content outline'),
    finalContent: z.string().describe('SEO-optimized final content'),
    qualityScore: z.number().describe('Content quality score 1-10'),
    seoScore: z.number().describe('SEO optimization score 1-10'),
    metaDescription: z.string().describe('Meta description for SEO'),
    distributionPlan: z.string().describe('Content distribution recommendations'),
  }),
  steps: [contentPlanningStep, contentWritingStep, contentEditingStep, seoOptimizationStep],
})
  .then(contentPlanningStep)
  .then(contentWritingStep)
  .then(contentEditingStep)
  .then(seoOptimizationStep)
  .commit();
