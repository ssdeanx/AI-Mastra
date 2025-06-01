// Generated on 2025-06-01
/**
 * Task Orchestration Multi-Agent Workflow (Mastra)
 *
 * Real-world workflow demonstrating hierarchical task delegation:
 * 1. User submits a complex task/request
 * 2. MCP Agent gathers external context and resources
 * 3. Master Agent breaks down the task into actionable steps
 * 4. Supervisor Agent reviews and validates the plan
 * 5. Worker Agent executes the tasks step by step
 * 6. Optional human approval step for critical decisions
 *
 * Use Cases:
 * - Project planning and execution
 * - Research and analysis workflows
 * - Content creation pipelines
 * - Business process automation
 *
 * @module taskOrchestrationWorkflow
 */
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { mcpAgent } from '../agents/mcpAgent';
import { supervisorAgent } from '../agents/supervisorAgent';
import { masterAgent } from '../agents/masterAgent';
import { workerAgent } from '../agents/workerAgent';

// Step 1: MCP Agent - Gather external context and resources
const contextGatheringStep = createStep({
  id: 'context-gathering',
  inputSchema: z.object({ 
    userRequest: z.string().describe('The user\'s task/request'),
  }),
  outputSchema: z.object({ 
    context: z.string().describe('External context and resources'),
    enrichedRequest: z.string().describe('Request enriched with context'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const response = await mcpAgent.generate([
        { 
          role: 'user', 
          content: `Gather relevant context and external resources for this request: "${inputData.userRequest}". Provide any additional information that would help understand the scope and requirements.`
        },
      ]);
      
      mastra.getLogger()?.info('MCP Agent gathered context', { 
        originalRequest: inputData.userRequest,
        contextLength: response.text.length 
      });
      
      return { 
        context: response.text,
        enrichedRequest: `${inputData.userRequest}\n\nContext: ${response.text}`
      };
    } catch (err) {
      mastra.getLogger()?.error('Context gathering failed', { err, request: inputData.userRequest });
      throw err;
    }
  },
});

// Step 2: Master Agent - Strategic planning and task breakdown
const planningStep = createStep({
  id: 'strategic-planning',
  inputSchema: z.object({ 
    enrichedRequest: z.string(),
    context: z.string(),
  }),
  outputSchema: z.object({ 
    executionPlan: z.string().describe('Detailed execution plan'),
    taskBreakdown: z.string().describe('Tasks broken into actionable steps'),
    riskAssessment: z.string().describe('Potential risks and mitigation strategies'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const response = await masterAgent.generate([
        { 
          role: 'user', 
          content: `As a strategic planner, analyze this request and create a comprehensive execution plan:

Request: ${inputData.enrichedRequest}

Please provide:
1. A detailed execution plan
2. Task breakdown into actionable steps
3. Risk assessment with mitigation strategies
4. Success criteria and milestones

Be thorough and consider dependencies, resources needed, and potential challenges.`
        },
      ]);
      
      mastra.getLogger()?.info('Master Agent created execution plan', { 
        planLength: response.text.length,
        hasRiskAssessment: response.text.includes('risk'),
      });
      
      // Parse the response to extract different sections
      const sections = response.text.split('\n\n');
      const executionPlan = sections.find(s => s.includes('execution') || s.includes('plan')) || response.text;
      const taskBreakdown = sections.find(s => s.includes('task') || s.includes('step')) || 'Tasks included in main plan';
      const riskAssessment = sections.find(s => s.includes('risk') || s.includes('challenge')) || 'Risks assessed in main plan';
      
      return { 
        executionPlan,
        taskBreakdown,
        riskAssessment,
      };
    } catch (err) {
      mastra.getLogger()?.error('Strategic planning failed', { err });
      throw err;
    }
  },
});

// Step 3: Supervisor Agent - Review and validation
const reviewStep = createStep({
  id: 'plan-review',
  inputSchema: z.object({ 
    executionPlan: z.string(),
    taskBreakdown: z.string(),
    riskAssessment: z.string(),
  }),
  outputSchema: z.object({ 
    reviewNotes: z.string().describe('Supervisor review and recommendations'),
    approvalStatus: z.string().describe('Approval status: approved, needs-revision, or rejected'),
    validatedPlan: z.string().describe('Plan validated by supervisor'),
  }),
  async execute({ inputData, mastra }) {
    try {
      const response = await supervisorAgent.generate([
        { 
          role: 'user', 
          content: `As a supervisor, please review this execution plan and provide feedback:

EXECUTION PLAN:
${inputData.executionPlan}

TASK BREAKDOWN:
${inputData.taskBreakdown}

RISK ASSESSMENT:
${inputData.riskAssessment}

Please provide:
1. Review notes with specific feedback
2. Approval status (approved/needs-revision/rejected)
3. Any recommendations for improvement
4. Validation of the approach

Be critical but constructive in your review.`
        },
      ]);
      
      const reviewText = response.text;
      const approvalStatus = reviewText.toLowerCase().includes('approved') ? 'approved' : 
                           reviewText.toLowerCase().includes('rejected') ? 'rejected' : 'needs-revision';
      
      mastra.getLogger()?.info('Supervisor completed review', { 
        approvalStatus,
        reviewLength: reviewText.length,
      });
      
      return { 
        reviewNotes: reviewText,
        approvalStatus,
        validatedPlan: approvalStatus === 'approved' ? inputData.executionPlan : `REVISED: ${inputData.executionPlan}`,
      };
    } catch (err) {
      mastra.getLogger()?.error('Plan review failed', { err });
      throw err;
    }
  },
});

// Step 4: Human approval for critical decisions (suspend/resume)
const humanApprovalStep = createStep({
  id: 'human-approval',
  inputSchema: z.object({ 
    validatedPlan: z.string(),
    reviewNotes: z.string(),
    approvalStatus: z.string(),
  }),
  outputSchema: z.object({ 
    humanDecision: z.string().describe('Human decision: proceed, revise, or cancel'),
    approvedPlan: z.string().describe('Final approved plan for execution'),
  }),
  resumeSchema: z.object({ 
    humanDecision: z.string(),
    feedback: z.string().optional(),
  }),
  suspendSchema: z.object({ 
    planSummary: z.string(),
    supervisorNotes: z.string(),
    recommendedAction: z.string(),
  }),
  async execute({ inputData, suspend, resumeData, mastra }) {
    if (!resumeData) {
      // Suspend for human approval
      const suspendData = {
        planSummary: inputData.validatedPlan.substring(0, 500) + '...',
        supervisorNotes: inputData.reviewNotes,
        recommendedAction: inputData.approvalStatus === 'approved' ? 'Proceed with execution' : 'Review required before proceeding',
      };
      
      mastra.getLogger()?.info('Suspending for human approval', { approvalStatus: inputData.approvalStatus });
      await suspend(suspendData);
      
      // This should never be reached, but TypeScript requires a return
      return { 
        humanDecision: 'suspended',
        approvedPlan: inputData.validatedPlan,
      };
    }
    
    // Resume with human decision
    const humanDecision = resumeData.humanDecision;
    const feedback = resumeData.feedback || '';
    
    let approvedPlan = inputData.validatedPlan;
    if (humanDecision === 'revise' && feedback) {
      approvedPlan = `${inputData.validatedPlan}\n\nHUMAN FEEDBACK: ${feedback}`;
    }
    
    mastra.getLogger()?.info('Human approval received', { 
      decision: humanDecision,
      hasFeedback: !!feedback,
    });
    
    return { 
      humanDecision,
      approvedPlan,
    };
  },
});

// Step 5: Worker Agent - Execute the approved plan
const executionStep = createStep({
  id: 'task-execution',
  inputSchema: z.object({ 
    approvedPlan: z.string(),
    humanDecision: z.string(),
  }),
  outputSchema: z.object({ 
    executionResult: z.string().describe('Results of task execution'),
    completionStatus: z.string().describe('Completion status: completed, partial, or failed'),
    deliverables: z.string().describe('Any deliverables produced'),
  }),
  async execute({ inputData, mastra }) {
    try {
      if (inputData.humanDecision === 'cancel') {
        return {
          executionResult: 'Task execution cancelled by human decision.',
          completionStatus: 'cancelled',
          deliverables: 'None - task was cancelled.',
        };
      }
      
      const response = await workerAgent.generate([
        { 
          role: 'user', 
          content: `Execute this approved plan step by step:

${inputData.approvedPlan}

Please:
1. Work through each task systematically
2. Provide detailed results for each step
3. Note any issues or blockers encountered
4. Summarize what was accomplished
5. Identify any deliverables created

Be thorough and document your progress clearly.`
        },
      ]);
      
      const executionText = response.text;
      const completionStatus = executionText.toLowerCase().includes('completed') || executionText.toLowerCase().includes('finished') ? 'completed' :
                              executionText.toLowerCase().includes('partial') || executionText.toLowerCase().includes('some') ? 'partial' : 'in-progress';
      
      // Extract deliverables section if present
      const deliverables = executionText.includes('deliverable') ? 
        executionText.split('deliverable')[1]?.substring(0, 200) || 'See execution results' : 
        'Results documented in execution summary';
      
      mastra.getLogger()?.info('Worker Agent completed execution', { 
        completionStatus,
        resultLength: executionText.length,
        hasDeliverables: deliverables !== 'Results documented in execution summary',
      });
      
      return { 
        executionResult: executionText,
        completionStatus,
        deliverables,
      };
    } catch (err) {
      mastra.getLogger()?.error('Task execution failed', { err });
      throw err;
    }
  },
});

/**
 * Task Orchestration Multi-Agent Workflow
 */
export const taskOrchestrationWorkflow = createWorkflow({
  id: 'task-orchestration',
  inputSchema: z.object({
    userRequest: z.string().describe('The user\'s task or request to be executed'),
  }),
  outputSchema: z.object({
    context: z.string().describe('Context gathered by MCP agent'),
    executionPlan: z.string().describe('Strategic plan created by master agent'),
    reviewNotes: z.string().describe('Supervisor review and validation'),
    humanDecision: z.string().describe('Human approval decision'),
    executionResult: z.string().describe('Final execution results from worker agent'),
    completionStatus: z.string().describe('Overall completion status'),
  }),
  steps: [contextGatheringStep, planningStep, reviewStep, humanApprovalStep, executionStep],
})
  .then(contextGatheringStep)
  .then(planningStep)
  .then(reviewStep)
  .then(humanApprovalStep)
  .then(executionStep)
  .commit();

// TSDoc: Exported for registration in Mastra instance
