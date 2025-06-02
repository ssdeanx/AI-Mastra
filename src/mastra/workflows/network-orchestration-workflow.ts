// Generated on 2025-06-02
/**
 * Intelligent Agent Network Workflow
 * 
 * Demonstrates advanced patterns:
 * - .foreach() for iterating over agent networks
 * - .parallel() for concurrent agent execution
 * - .dountil() for iterative improvement
 * - Agent-workflow integration
 * - Dynamic network selection
 * 
 * @see https://mastra.ai/en/docs/workflows/using-with-agents-and-tools
 */

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { generateId } from 'ai';

// Input/Output schemas for network orchestration
const networkOrchestrationInputSchema = z.object({
  task: z.string().describe('The main task to distribute across networks'),
  networkPreferences: z.array(z.enum([
    'researchNetwork', 
    'dataProcessingNetwork', 
    'contentCreationNetwork', 
    'technicalOpsNetwork', 
    'comprehensiveNetwork'
  ])).optional().describe('Preferred networks to use'),
  executionMode: z.enum(['sequential', 'parallel', 'adaptive']).default('adaptive'),
  qualityTarget: z.number().min(0).max(1).default(0.85),
  iterativeImprovement: z.boolean().default(true),
  timeout: z.number().default(300), // seconds
  context: z.record(z.any()).optional()
});

const networkOrchestrationOutputSchema = z.object({
  orchestrationId: z.string(),
  networksUsed: z.array(z.string()),
  executionPath: z.string(),
  results: z.array(z.object({
    networkName: z.string(),
    agentsInvolved: z.array(z.string()),
    output: z.any(),
    executionTime: z.number(),
    qualityScore: z.number(),
    success: z.boolean(),
    iteration: z.number().optional()
  })),
  finalResult: z.object({
    synthesizedOutput: z.any(),
    overallQuality: z.number(),
    totalExecutionTime: z.number(),
    improvementIterations: z.number()
  }),
  recommendations: z.array(z.string())
});

// Step 1: Network Selection and Planning
const networkPlanningStep = createStep({
  id: 'network-planning',
  inputSchema: networkOrchestrationInputSchema,
  outputSchema: z.object({
    selectedNetworks: z.array(z.object({
      name: z.string(),
      agents: z.array(z.string()),
      suitabilityScore: z.number(),
      estimatedTime: z.number(),
      specialization: z.string()
    })),
    executionStrategy: z.object({
      mode: z.string(),
      order: z.array(z.string()),
      parallelGroups: z.array(z.array(z.string())).optional()
    }),
    taskDecomposition: z.array(z.object({
      subtask: z.string(),
      assignedNetwork: z.string(),
      priority: z.number()
    }))
  }),
  execute: async ({ inputData }) => {
    const { task, networkPreferences, executionMode } = inputData;
    
    // Define available networks and their capabilities
    const availableNetworks = [
      {
        name: 'researchNetwork',
        agents: ['ragAgent', 'mcpAgent', 'supervisorAgent'],
        specialization: 'Research and analysis tasks',
        keywords: ['research', 'analyze', 'study', 'investigate', 'data']
      },
      {
        name: 'dataProcessingNetwork',
        agents: ['workerAgent', 'supervisorAgent'],
        specialization: 'Data transformation and processing',
        keywords: ['process', 'transform', 'clean', 'format', 'etl']
      },
      {
        name: 'contentCreationNetwork',
        agents: ['masterAgent', 'workerAgent'],
        specialization: 'Content generation and creation',
        keywords: ['create', 'generate', 'write', 'content', 'document']
      },
      {
        name: 'technicalOpsNetwork',
        agents: ['supervisorAgent', 'mcpAgent', 'workerAgent'],
        specialization: 'Technical operations and system tasks',
        keywords: ['technical', 'system', 'deploy', 'configure', 'manage']
      },
      {
        name: 'comprehensiveNetwork',
        agents: ['masterAgent', 'supervisorAgent', 'ragAgent', 'workerAgent'],
        specialization: 'Complex multi-domain tasks',
        keywords: ['complex', 'comprehensive', 'multi', 'integrated']
      }
    ];
    
    // Calculate suitability scores for each network
    const taskLower = task.toLowerCase();
    const selectedNetworks = [];
    
    for (const network of availableNetworks) {
      // Skip if not in preferences (if specified)
      if (networkPreferences && !networkPreferences.includes(network.name as any)) {
        continue;
      }
      
      // Calculate suitability based on keyword matching
      let suitabilityScore = 0.1; // Base score
      
      for (const keyword of network.keywords) {
        if (taskLower.includes(keyword)) {
          suitabilityScore += 0.2;
        }
      }
      
      // Bonus for comprehensive network on complex tasks
      if (network.name === 'comprehensiveNetwork' && task.length > 200) {
        suitabilityScore += 0.1;
      }
      
      selectedNetworks.push({
        name: network.name,
        agents: network.agents,
        suitabilityScore: Math.min(suitabilityScore, 1.0),
        estimatedTime: Math.ceil(network.agents.length * 30), // 30 seconds per agent
        specialization: network.specialization
      });
    }
    
    // Sort by suitability score
    selectedNetworks.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    
    // Take top 3 networks or all if less than 3
    const topNetworks = selectedNetworks.slice(0, Math.min(3, selectedNetworks.length));
    
    // Determine execution strategy
    let executionStrategy;
    
    switch (executionMode) {
      case 'sequential':
        executionStrategy = {
          mode: 'sequential',
          order: topNetworks.map(n => n.name)
        };
        break;
      case 'parallel':
        executionStrategy = {
          mode: 'parallel',
          order: topNetworks.map(n => n.name),
          parallelGroups: [topNetworks.map(n => n.name)]
        };
        break;
      case 'adaptive':
        // High suitability networks run in parallel, others sequential
        const highSuitability = topNetworks.filter(n => n.suitabilityScore > 0.7);
        const mediumSuitability = topNetworks.filter(n => n.suitabilityScore <= 0.7);
        
        executionStrategy = {
          mode: 'adaptive',
          order: [...highSuitability.map(n => n.name), ...mediumSuitability.map(n => n.name)],
          parallelGroups: highSuitability.length > 1 ? [highSuitability.map(n => n.name)] : undefined
        };
        break;
      default:
        executionStrategy = {
          mode: 'sequential',
          order: topNetworks.map(n => n.name)
        };
    }
    
    // Decompose task based on network specializations
    const taskDecomposition = topNetworks.map((network, index) => ({
      subtask: `${network.specialization}: ${task}`,
      assignedNetwork: network.name,
      priority: topNetworks.length - index // Higher index = lower priority
    }));
    
    return {
      selectedNetworks: topNetworks,
      executionStrategy,
      taskDecomposition
    };
  }
});

// Step 2: Execute Networks (foreach pattern)
const executeNetworksStep = createStep({
  id: 'execute-networks',
  inputSchema: z.object({
    selectedNetworks: z.array(z.object({
      name: z.string(),
      agents: z.array(z.string()),
      suitabilityScore: z.number(),
      estimatedTime: z.number(),
      specialization: z.string()
    })),
    executionStrategy: z.object({
      mode: z.string(),
      order: z.array(z.string()),
      parallelGroups: z.array(z.array(z.string())).optional()
    }),
    taskDecomposition: z.array(z.object({
      subtask: z.string(),
      assignedNetwork: z.string(),
      priority: z.number()
    })),
    task: z.string(),
    context: z.record(z.any()).optional()
  }),
  outputSchema: z.object({
    networkResults: z.array(z.object({
      networkName: z.string(),
      agentsInvolved: z.array(z.string()),
      output: z.any(),
      executionTime: z.number(),
      qualityScore: z.number(),
      success: z.boolean(),
      error: z.string().optional()
    })),
    executionStats: z.object({
      totalNetworks: z.number(),
      successfulNetworks: z.number(),
      failedNetworks: z.number(),
      totalExecutionTime: z.number(),
      averageQualityScore: z.number()
    })
  }),
  execute: async ({ inputData }) => {
    const { selectedNetworks, executionStrategy, taskDecomposition, task, context } = inputData;
    const networkResults = [];
    let totalExecutionTime = 0;
    
    // Create network execution function
    const executeNetwork = async (networkName: string) => {
      const network = selectedNetworks.find(n => n.name === networkName);
      if (!network) {
        return {
          networkName,
          agentsInvolved: [],
          output: null,
          executionTime: 0,
          qualityScore: 0,
          success: false,
          error: 'Network not found'
        };
      }
      
      const subtask = taskDecomposition.find(t => t.assignedNetwork === networkName);
      const executionStartTime = Date.now();
      
      try {
        // Simulate network execution with agents
        // In production, this would call your actual agent networks
        
        const networkOutput = {
          networkType: network.specialization,
          taskProcessed: subtask?.subtask || task,
          agentResponses: network.agents.map(agent => ({
            agent,
            response: `${agent} processed: ${task.substring(0, 50)}...`,
            confidence: Math.random() * 0.4 + 0.6 // 0.6-1.0
          })),
          synthesis: `Network ${networkName} completed task analysis`,
          metadata: {
            networkSuitability: network.suitabilityScore,
            agentCount: network.agents.length,
            context: context || {}
          }
        };
        
        // Calculate quality score based on network suitability and random factors
        const baseQuality = network.suitabilityScore;
        const randomFactor = Math.random() * 0.3 - 0.15; // -0.15 to +0.15
        const qualityScore = Math.max(0.1, Math.min(1.0, baseQuality + randomFactor));
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, network.estimatedTime * 10));
        
        const executionTime = Date.now() - executionStartTime;
        
        return {
          networkName,
          agentsInvolved: network.agents,
          output: networkOutput,
          executionTime,
          qualityScore,
          success: true
        };
        
      } catch (error) {
        return {
          networkName,
          agentsInvolved: network.agents,
          output: null,
          executionTime: Date.now() - executionStartTime,
          qualityScore: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Network execution failed'
        };
      }
    };
    
    // Execute based on strategy
    if (executionStrategy.mode === 'parallel' || 
        (executionStrategy.mode === 'adaptive' && executionStrategy.parallelGroups)) {
      
      // Parallel execution
      const parallelGroups = executionStrategy.parallelGroups || [executionStrategy.order];
      
      for (const group of parallelGroups) {
        const groupStartTime = Date.now();
        const groupPromises = group.map(executeNetwork);
        const groupResults = await Promise.all(groupPromises);
        
        networkResults.push(...groupResults);
        totalExecutionTime += Date.now() - groupStartTime;
      }
      
    } else {
      // Sequential execution (foreach pattern)
      for (const networkName of executionStrategy.order) {
        const result = await executeNetwork(networkName);
        networkResults.push(result);
        totalExecutionTime += result.executionTime;
      }
    }
    
    // Calculate execution statistics
    const successfulNetworks = networkResults.filter(r => r.success).length;
    const failedNetworks = networkResults.length - successfulNetworks;
    const averageQualityScore = networkResults.reduce((sum, r) => sum + r.qualityScore, 0) / networkResults.length;
    
    return {
      networkResults,
      executionStats: {
        totalNetworks: networkResults.length,
        successfulNetworks,
        failedNetworks,
        totalExecutionTime,
        averageQualityScore
      }
    };
  }
});

// Step 3: Iterative Improvement (dountil pattern)
const iterativeImprovementStep = createStep({
  id: 'iterative-improvement',
  inputSchema: z.object({
    networkResults: z.array(z.object({
      networkName: z.string(),
      agentsInvolved: z.array(z.string()),
      output: z.any(),
      executionTime: z.number(),
      qualityScore: z.number(),
      success: z.boolean(),
      error: z.string().optional()
    })),
    executionStats: z.object({
      totalNetworks: z.number(),
      successfulNetworks: z.number(),
      failedNetworks: z.number(),
      totalExecutionTime: z.number(),
      averageQualityScore: z.number()
    }),
    qualityTarget: z.number(),
    iterativeImprovement: z.boolean(),
    task: z.string()
  }),
  outputSchema: z.object({
    improvementResults: z.array(z.object({
      iteration: z.number(),
      networkResults: z.array(z.any()),
      overallQuality: z.number(),
      improvements: z.array(z.string())
    })),
    finalQuality: z.number(),
    totalIterations: z.number(),
    improvementAchieved: z.boolean()
  }),
  execute: async ({ inputData }) => {
    const { networkResults, executionStats, qualityTarget, iterativeImprovement, task } = inputData;
    
    if (!iterativeImprovement) {
      // No iterative improvement requested
      const overallQuality = networkResults.reduce((sum, r) => sum + r.qualityScore, 0) / networkResults.length;
      return {
        improvementResults: [{
          iteration: 1,
          networkResults,
          overallQuality,
          improvements: ['No iterative improvement requested']
        }],
        finalQuality: overallQuality,
        totalIterations: 1,
        improvementAchieved: overallQuality >= qualityTarget
      };
    }
    
    let currentResults = networkResults;
    let currentQuality = networkResults.reduce((sum, r) => sum + r.qualityScore, 0) / networkResults.length;
    let iteration = 0;
    const maxIterations = 3;
    const improvementResults = [];
    
    // dountil pattern: improve until quality target met or max iterations reached
    do {
      iteration++;
      
      // Identify networks that need improvement
      const lowQualityNetworks = currentResults.filter(r => r.qualityScore < qualityTarget);
      
      if (lowQualityNetworks.length === 0) {
        // All networks meet quality target
        break;
      }
      
      // Simulate improvement attempts
      const improvements = [];
      const improvedResults = [...currentResults];
      
      for (const lowQualityNetwork of lowQualityNetworks) {
        const networkIndex = improvedResults.findIndex(r => r.networkName === lowQualityNetwork.networkName);
        
        if (networkIndex >= 0) {
          // Simulate improvement strategies
          let improvementBoost = 0;
          const improvementStrategies = [];
          
          // Strategy 1: Add more agents
          if (lowQualityNetwork.agentsInvolved.length < 3) {
            improvementBoost += 0.1;
            improvementStrategies.push('Added additional agents');
          }
          
          // Strategy 2: Refined processing
          if (lowQualityNetwork.qualityScore < 0.5) {
            improvementBoost += 0.15;
            improvementStrategies.push('Applied refined processing techniques');
          }
          
          // Strategy 3: Enhanced context
          improvementBoost += 0.05;
          improvementStrategies.push('Enhanced contextual understanding');
          
          // Apply improvements
          const newQualityScore = Math.min(1.0, lowQualityNetwork.qualityScore + improvementBoost);
          
          improvedResults[networkIndex] = {
            ...lowQualityNetwork,
            qualityScore: newQualityScore,
            output: {
              ...lowQualityNetwork.output,
              improved: true,
              improvementStrategies,
              iteration
            }
          };
          
          improvements.push(`${lowQualityNetwork.networkName}: ${improvementStrategies.join(', ')}`);
        }
      }
      
      // Calculate new overall quality
      currentQuality = improvedResults.reduce((sum, r) => sum + r.qualityScore, 0) / improvedResults.length;
      currentResults = improvedResults;
      
      improvementResults.push({
        iteration,
        networkResults: currentResults,
        overallQuality: currentQuality,
        improvements
      });
      
      // Add small delay to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } while (currentQuality < qualityTarget && iteration < maxIterations);
    
    return {
      improvementResults,
      finalQuality: currentQuality,
      totalIterations: iteration,
      improvementAchieved: currentQuality >= qualityTarget
    };
  }
});

// Step 4: Results Synthesis
const resultsSynthesisStep = createStep({
  id: 'results-synthesis',
  inputSchema: z.object({
    improvementResults: z.array(z.any()),
    finalQuality: z.number(),
    totalIterations: z.number(),
    executionStats: z.any(),
    task: z.string()
  }),
  outputSchema: z.object({
    synthesizedOutput: z.any(),
    overallQuality: z.number(),
    totalExecutionTime: z.number(),
    improvementIterations: z.number(),
    recommendations: z.array(z.string())
  }),
  execute: async ({ inputData }) => {
    const { improvementResults, finalQuality, totalIterations, executionStats, task } = inputData;
    
    // Get the final iteration results
    const finalResults = improvementResults[improvementResults.length - 1];
    const allNetworkOutputs = finalResults.networkResults;
    
    // Synthesize outputs from all networks
    const synthesizedOutput = {
      task,
      networkContributions: allNetworkOutputs.map((result: { networkName: any; output: { networkType: any; synthesis: any; }; qualityScore: any; agentsInvolved: any; }) => ({
        network: result.networkName,
        specialization: result.output?.networkType || 'Unknown',
        quality: result.qualityScore,
        contribution: result.output?.synthesis || 'No synthesis available',
        agents: result.agentsInvolved
      })),
      combinedInsights: allNetworkOutputs
        .filter((r: { success: any; output: { agentResponses: any; }; }) => r.success && r.output?.agentResponses)
        .flatMap((r: { output: { agentResponses: any[]; }; }) => r.output.agentResponses.map((resp: any) => resp.response)),
      qualityProgression: improvementResults.map(iter => ({
        iteration: iter.iteration,
        quality: iter.overallQuality,
        improvements: iter.improvements
      })),
      metadata: {
        networksUsed: allNetworkOutputs.length,
        successfulNetworks: allNetworkOutputs.filter((r: { success: any; }) => r.success).length,
        totalIterations,
        finalQuality
      }
    };
    
    // Generate recommendations
    const recommendations = [];
    
    if (finalQuality >= 0.9) {
      recommendations.push('Excellent quality achieved - workflow optimized');
    } else if (finalQuality >= 0.7) {
      recommendations.push('Good quality achieved - minor optimizations possible');
    } else {
      recommendations.push('Quality below optimal - consider additional improvement strategies');
    }
    
    if (totalIterations > 1) {
      recommendations.push(`Iterative improvement applied ${totalIterations - 1} times`);
    }
    
    if (executionStats.failedNetworks > 0) {
      recommendations.push(`${executionStats.failedNetworks} networks failed - review network selection`);
    }
    
    const avgExecutionTime = executionStats.totalExecutionTime / executionStats.totalNetworks;
    if (avgExecutionTime > 30000) { // 30 seconds
      recommendations.push('High execution time - consider parallel processing optimization');
    }
    
    return {
      synthesizedOutput,
      overallQuality: finalQuality,
      totalExecutionTime: executionStats.totalExecutionTime,
      improvementIterations: totalIterations,
      recommendations
    };
  }
});

// Main Network Orchestration Workflow
export const networkOrchestrationWorkflow = createWorkflow({
  id: 'Network Orchestration Workflow',
  inputSchema: networkOrchestrationInputSchema,
  outputSchema: networkOrchestrationOutputSchema,
})
// Sequential planning phase
.then(networkPlanningStep)
// Execute networks step
.then(executeNetworksStep)
// Iterative improvement using doUntil pattern
.then(
  createStep({
    id: 'prepare-iterative-improvement-input',
    inputSchema: z.object({
      // Accepts all previous context, but expects nothing specific
    }),
    outputSchema: z.object({
      networkResults: z.array(z.object({
        networkName: z.string(),
        agentsInvolved: z.array(z.string()),
        output: z.any(),
        executionTime: z.number(),
        qualityScore: z.number(),
        success: z.boolean(),
        error: z.string().optional()
      })),
      executionStats: z.object({
        totalNetworks: z.number(),
        successfulNetworks: z.number(),
        failedNetworks: z.number(),
        totalExecutionTime: z.number(),
        averageQualityScore: z.number()
      }),
      qualityTarget: z.number(),
      iterativeImprovement: z.boolean(),
      task: z.string()
    }),
    /**
     * Prepares input for the iterative improvement step by extracting results from context.
     * @param param0 - The workflow context object.
     * @returns The input for the iterative improvement step.
     */
    async execute({ context }: { context: any }) {
      const executionResult = context.getStepResult('execute-networks');
      const workflowInput = context.getInput();
      return {
        networkResults: executionResult.networkResults,
        executionStats: executionResult.executionStats,
        qualityTarget: workflowInput.qualityTarget,
        iterativeImprovement: workflowInput.iterativeImprovement,
        task: workflowInput.task
      };
    }
  })
)
.dountil(iterativeImprovementStep, (result) => {
  // Defensive: result may be improvementResults array or object depending on workflow engine
  const last = Array.isArray(result.improvementResults)
    ? result.improvementResults[result.improvementResults.length - 1]
    : result.improvementResults;
  return last && last.overallQuality >= 0.9 || result.totalIterations >= 5;
})
// Final synthesis
.then(resultsSynthesisStep)
// Map final results to output schema
.map(async ({ context }) => {
  const planningResult = context.getStepResult('network-planning');
  const executionResult = context.getStepResult('execute-networks');
  const synthesisResult = context.getStepResult('results-synthesis');

  return {
    orchestrationId: generateId(),
    networksUsed: planningResult.selectedNetworks.map((n: any) => n.name),
    executionPath: planningResult.executionStrategy.mode,
    results: executionResult.networkResults.map((result: any) => ({
      networkName: result.networkName,
      agentsInvolved: result.agentsInvolved,
      output: result.output,
      executionTime: result.executionTime,
      qualityScore: result.qualityScore,
      success: result.success,
      iteration: result.output?.iteration
    })),
    finalResult: {
      synthesizedOutput: synthesisResult.synthesizedOutput,
      overallQuality: synthesisResult.overallQuality,
      totalExecutionTime: synthesisResult.totalExecutionTime,
      improvementIterations: synthesisResult.improvementIterations
    },
    recommendations: synthesisResult.recommendations
  };
});
