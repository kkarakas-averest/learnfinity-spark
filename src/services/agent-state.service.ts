/**
 * Agent State Service
 * Service for persisting agent state, logging decisions, and tracking performance metrics
 */

import {
  AgentType,
  AgentDecisionType,
  DecisionReasonCategory,
  AgentContext,
  AgentDecisionRecord,
  AgentMemory,
  AgentMetrics,
  AgentStateSnapshot
} from '../types/agent-state.types';

import {
  MessageType,
  MessagePriority,
  MessageStatus,
  AgentMessage,
  TaskDelegation,
  EventNotification
} from '../types/agent-communication.types';

// Mock agent state repository
const mockDecisionRecords: AgentDecisionRecord[] = [
  {
    id: 'decision-001',
    agentType: AgentType.RAG_SYSTEM,
    decisionType: AgentDecisionType.STATUS_CHANGE,
    timestamp: new Date('2025-01-10T08:45:12Z'),
    context: {
      employeeId: 'emp-001',
      timestamp: new Date('2025-01-10T08:45:00Z'),
      ragStatus: 'green',
      primaryData: {
        lastAssessmentScore: 85,
        moduleCompletionRate: 0.68,
        averageTimePerSection: 18 // minutes
      },
      secondaryData: {
        previousStatus: 'green',
        daysInStatus: 14
      }
    },
    decision: {
      action: 'change_status',
      parameters: {
        newStatus: 'amber',
        reason: 'declining_completion_rate',
        confidence: 0.82
      }
    },
    reasoning: {
      mainReason: 'Employee completion rate has dropped from 0.85 to 0.68 in the past week, showing a concerning trend.',
      reasonCategory: DecisionReasonCategory.PERFORMANCE_BASED,
      confidenceScore: 0.82,
      alternativesConsidered: [
        'maintain_green_status',
        'schedule_check_in'
      ]
    },
    outcome: {
      successful: true,
      resultingAction: 'status_updated',
      feedback: 'Status change was accepted by system'
    },
    metadata: {
      processingTime: 450, // milliseconds
      tokensUsed: 580,
      modelVersion: 'mixtral-8x7b-32768'
    }
  },
  {
    id: 'decision-002',
    agentType: AgentType.PERSONALIZATION,
    decisionType: AgentDecisionType.CONTENT_RECOMMENDATION,
    timestamp: new Date('2025-01-10T09:15:30Z'),
    context: {
      employeeId: 'emp-001',
      courseId: 'course-001',
      timestamp: new Date('2025-01-10T09:15:00Z'),
      ragStatus: 'amber',
      primaryData: {
        learningStyle: 'visual',
        strugglingTopics: ['closures', 'async_functions']
      }
    },
    decision: {
      action: 'recommend_content',
      parameters: {
        contentIds: ['resource-001', 'resource-002'],
        priorityOrder: ['resource-001', 'resource-002'],
        presentationStyle: 'visual'
      }
    },
    reasoning: {
      mainReason: 'Employee has visual learning preference and is struggling with specific JavaScript concepts that have strong visual explanations available.',
      reasonCategory: DecisionReasonCategory.PREFERENCE_BASED,
      confidenceScore: 0.91
    },
    metadata: {
      processingTime: 380, // milliseconds
      tokensUsed: 520,
      modelVersion: 'llama3-8b-8192'
    }
  }
];

const mockAgentMemories: Record<AgentType, AgentMemory[]> = {
  [AgentType.MANAGER]: [
    {
      id: 'memory-001',
      agentType: AgentType.MANAGER,
      memoryType: 'long_term',
      key: 'delegation_patterns',
      value: {
        personalization: ['content_recommendation', 'path_adjustment'],
        content_creator: ['content_creation', 'content_adaptation'],
        rag_system: ['status_change', 'intervention_recommendation']
      },
      priority: 8,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-05')
    },
    {
      id: 'memory-002',
      agentType: AgentType.MANAGER,
      memoryType: 'short_term',
      key: 'active_delegations',
      value: {
        'delegation-001': {
          assignee: AgentType.PERSONALIZATION,
          taskType: AgentDecisionType.CONTENT_RECOMMENDATION,
          employeeId: 'emp-001',
          deadline: '2025-01-10T18:00:00Z'
        }
      },
      priority: 9,
      expiresAt: new Date('2025-01-15'),
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10')
    }
  ],
  [AgentType.PERSONALIZATION]: [
    {
      id: 'memory-003',
      agentType: AgentType.PERSONALIZATION,
      employeeId: 'emp-001',
      memoryType: 'long_term',
      key: 'learning_preferences',
      value: {
        style: 'visual',
        timeOfDay: 'morning',
        contentTypes: ['video', 'interactive'],
        difficultyCurve: 'gradual'
      },
      priority: 7,
      createdAt: new Date('2025-01-05'),
      updatedAt: new Date('2025-01-05')
    }
  ],
  [AgentType.CONTENT_CREATOR]: [],
  [AgentType.FEEDBACK_ADAPTATION]: [],
  [AgentType.RAG_SYSTEM]: [
    {
      id: 'memory-004',
      agentType: AgentType.RAG_SYSTEM,
      employeeId: 'emp-001',
      memoryType: 'long_term',
      key: 'status_history',
      value: [
        { status: 'green', startDate: '2024-12-01', endDate: '2025-01-10', reason: 'initial_onboarding' },
        { status: 'amber', startDate: '2025-01-10', reason: 'declining_completion_rate' }
      ],
      priority: 8,
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2025-01-10')
    }
  ],
  [AgentType.REPORTING]: []
};

const mockAgentMetrics: Record<AgentType, AgentMetrics> = {
  [AgentType.RAG_SYSTEM]: {
    agentType: AgentType.RAG_SYSTEM,
    timeRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    },
    invocations: 152,
    averageProcessingTime: 420, // milliseconds
    tokensConsumed: 78500,
    successRate: 0.98,
    decisionDistribution: {
      [AgentDecisionType.STATUS_CHANGE]: 48,
      [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 32,
      [AgentDecisionType.PATH_ADJUSTMENT]: 0,
      [AgentDecisionType.PATH_CREATION]: 0,
      [AgentDecisionType.CONTENT_RECOMMENDATION]: 0,
      [AgentDecisionType.CONTENT_CREATION]: 0,
      [AgentDecisionType.CONTENT_ADAPTATION]: 0,
      [AgentDecisionType.ASSESSMENT_GENERATION]: 0,
      [AgentDecisionType.AGENT_DELEGATION]: 25,
      [AgentDecisionType.METRIC_TRACKING]: 47,
      [AgentDecisionType.ALERT_GENERATION]: 0
    },
    totalCost: 0.58, // USD
    errorRate: 0.02,
    commonErrors: [
      {
        type: 'context_missing',
        count: 2,
        lastOccurred: new Date('2025-01-18')
      },
      {
        type: 'timeout',
        count: 1,
        lastOccurred: new Date('2025-01-05')
      }
    ]
  },
  [AgentType.PERSONALIZATION]: {
    agentType: AgentType.PERSONALIZATION,
    timeRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    },
    invocations: 187,
    averageProcessingTime: 380, // milliseconds
    tokensConsumed: 92600,
    successRate: 0.97,
    decisionDistribution: {
      [AgentDecisionType.PATH_CREATION]: 28,
      [AgentDecisionType.PATH_ADJUSTMENT]: 35,
      [AgentDecisionType.CONTENT_RECOMMENDATION]: 105,
      [AgentDecisionType.STATUS_CHANGE]: 0,
      [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 0,
      [AgentDecisionType.CONTENT_CREATION]: 0,
      [AgentDecisionType.CONTENT_ADAPTATION]: 0,
      [AgentDecisionType.ASSESSMENT_GENERATION]: 0,
      [AgentDecisionType.AGENT_DELEGATION]: 12,
      [AgentDecisionType.METRIC_TRACKING]: 7,
      [AgentDecisionType.ALERT_GENERATION]: 0
    },
    totalCost: 0.67, // USD
    errorRate: 0.03,
    commonErrors: [
      {
        type: 'invalid_learning_path',
        count: 3,
        lastOccurred: new Date('2025-01-22')
      },
      {
        type: 'resource_unavailable',
        count: 2,
        lastOccurred: new Date('2025-01-15')
      }
    ]
  },
  [AgentType.MANAGER]: {
    agentType: AgentType.MANAGER,
    timeRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    },
    invocations: 98,
    averageProcessingTime: 320, // milliseconds
    tokensConsumed: 45200,
    successRate: 0.99,
    decisionDistribution: {
      [AgentDecisionType.AGENT_DELEGATION]: 78,
      [AgentDecisionType.METRIC_TRACKING]: 15,
      [AgentDecisionType.ALERT_GENERATION]: 5,
      [AgentDecisionType.PATH_CREATION]: 0,
      [AgentDecisionType.PATH_ADJUSTMENT]: 0,
      [AgentDecisionType.CONTENT_RECOMMENDATION]: 0,
      [AgentDecisionType.STATUS_CHANGE]: 0,
      [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 0,
      [AgentDecisionType.CONTENT_CREATION]: 0,
      [AgentDecisionType.CONTENT_ADAPTATION]: 0,
      [AgentDecisionType.ASSESSMENT_GENERATION]: 0
    },
    totalCost: 0.32, // USD
    errorRate: 0.01,
    commonErrors: [
      {
        type: 'agent_busy',
        count: 1,
        lastOccurred: new Date('2025-01-12')
      }
    ]
  },
  [AgentType.CONTENT_CREATOR]: {
    agentType: AgentType.CONTENT_CREATOR,
    timeRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    },
    invocations: 53,
    averageProcessingTime: 1250, // milliseconds
    tokensConsumed: 125800,
    successRate: 0.96,
    decisionDistribution: {
      [AgentDecisionType.CONTENT_CREATION]: 32,
      [AgentDecisionType.CONTENT_ADAPTATION]: 18,
      [AgentDecisionType.ASSESSMENT_GENERATION]: 3,
      [AgentDecisionType.PATH_CREATION]: 0,
      [AgentDecisionType.PATH_ADJUSTMENT]: 0,
      [AgentDecisionType.CONTENT_RECOMMENDATION]: 0,
      [AgentDecisionType.STATUS_CHANGE]: 0,
      [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 0,
      [AgentDecisionType.AGENT_DELEGATION]: 0,
      [AgentDecisionType.METRIC_TRACKING]: 0,
      [AgentDecisionType.ALERT_GENERATION]: 0
    },
    totalCost: 1.23, // USD
    errorRate: 0.04,
    commonErrors: [
      {
        type: 'content_too_long',
        count: 1,
        lastOccurred: new Date('2025-01-08')
      },
      {
        type: 'missing_prerequisites',
        count: 1,
        lastOccurred: new Date('2025-01-25')
      }
    ]
  },
  [AgentType.FEEDBACK_ADAPTATION]: {
    agentType: AgentType.FEEDBACK_ADAPTATION,
    timeRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    },
    invocations: 65,
    averageProcessingTime: 520, // milliseconds
    tokensConsumed: 45800,
    successRate: 0.97,
    decisionDistribution: {
      [AgentDecisionType.CONTENT_ADAPTATION]: 42,
      [AgentDecisionType.PATH_ADJUSTMENT]: 15,
      [AgentDecisionType.CONTENT_RECOMMENDATION]: 8,
      [AgentDecisionType.PATH_CREATION]: 0,
      [AgentDecisionType.STATUS_CHANGE]: 0,
      [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 0,
      [AgentDecisionType.CONTENT_CREATION]: 0,
      [AgentDecisionType.ASSESSMENT_GENERATION]: 0,
      [AgentDecisionType.AGENT_DELEGATION]: 0,
      [AgentDecisionType.METRIC_TRACKING]: 0,
      [AgentDecisionType.ALERT_GENERATION]: 0
    },
    totalCost: 0.42, // USD
    errorRate: 0.03,
    commonErrors: [
      {
        type: 'insufficient_feedback',
        count: 2,
        lastOccurred: new Date('2025-01-17')
      }
    ]
  },
  [AgentType.REPORTING]: {
    agentType: AgentType.REPORTING,
    timeRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31')
    },
    invocations: 34,
    averageProcessingTime: 680, // milliseconds
    tokensConsumed: 58200,
    successRate: 1.0,
    decisionDistribution: {
      [AgentDecisionType.METRIC_TRACKING]: 34,
      [AgentDecisionType.PATH_CREATION]: 0,
      [AgentDecisionType.PATH_ADJUSTMENT]: 0,
      [AgentDecisionType.CONTENT_RECOMMENDATION]: 0,
      [AgentDecisionType.STATUS_CHANGE]: 0,
      [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 0,
      [AgentDecisionType.CONTENT_CREATION]: 0,
      [AgentDecisionType.CONTENT_ADAPTATION]: 0,
      [AgentDecisionType.ASSESSMENT_GENERATION]: 0,
      [AgentDecisionType.AGENT_DELEGATION]: 0,
      [AgentDecisionType.ALERT_GENERATION]: 0
    },
    totalCost: 0.48, // USD
    errorRate: 0.0,
    commonErrors: []
  }
};

/**
 * Service for managing agent state and performance metrics
 */
export class AgentStateService {
  /**
   * Log a decision made by an agent
   */
  async logDecision(decision: Omit<AgentDecisionRecord, 'id'>): Promise<AgentDecisionRecord> {
    // In a real implementation, this would insert into the database
    const newDecision: AgentDecisionRecord = {
      ...decision,
      id: `decision-${Date.now()}`
    };
    
    mockDecisionRecords.push(newDecision);
    
    return newDecision;
  }

  /**
   * Get a decision record by ID
   */
  async getDecision(id: string): Promise<AgentDecisionRecord | null> {
    // In a real implementation, this would query the database
    const decision = mockDecisionRecords.find(d => d.id === id);
    return decision ? { ...decision } : null;
  }

  /**
   * Get decision records by agent type
   */
  async getDecisionsByAgentType(
    agentType: AgentType,
    limit: number = 20,
    offset: number = 0
  ): Promise<AgentDecisionRecord[]> {
    // In a real implementation, this would query the database
    return mockDecisionRecords
      .filter(d => d.agentType === agentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get decision records by employee ID
   */
  async getDecisionsByEmployee(
    employeeId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<AgentDecisionRecord[]> {
    // In a real implementation, this would query the database
    return mockDecisionRecords
      .filter(d => d.context.employeeId === employeeId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get decision records by decision type
   */
  async getDecisionsByType(
    decisionType: AgentDecisionType,
    limit: number = 20,
    offset: number = 0
  ): Promise<AgentDecisionRecord[]> {
    // In a real implementation, this would query the database
    return mockDecisionRecords
      .filter(d => d.decisionType === decisionType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Store a memory for an agent
   */
  async storeMemory(memory: Omit<AgentMemory, 'id'>): Promise<AgentMemory> {
    // In a real implementation, this would insert or update in the database
    const agentType = memory.agentType;
    
    // Check if memory with same key exists
    let existingIndex = -1;
    if (mockAgentMemories[agentType]) {
      existingIndex = mockAgentMemories[agentType].findIndex(
        m => m.key === memory.key && 
             (m.employeeId === memory.employeeId || (!m.employeeId && !memory.employeeId))
      );
    } else {
      mockAgentMemories[agentType] = [];
    }
    
    if (existingIndex >= 0) {
      // Update existing memory
      mockAgentMemories[agentType][existingIndex] = {
        ...mockAgentMemories[agentType][existingIndex],
        ...memory,
        updatedAt: new Date()
      };
      
      return mockAgentMemories[agentType][existingIndex];
    } else {
      // Create new memory
      const newMemory: AgentMemory = {
        ...memory,
        id: `memory-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockAgentMemories[agentType].push(newMemory);
      
      return newMemory;
    }
  }

  /**
   * Retrieve a memory by key
   */
  async getMemory(
    agentType: AgentType,
    key: string,
    employeeId?: string
  ): Promise<AgentMemory | null> {
    // In a real implementation, this would query the database
    if (!mockAgentMemories[agentType]) return null;
    
    const memory = mockAgentMemories[agentType].find(
      m => m.key === key && 
           (m.employeeId === employeeId || (!m.employeeId && !employeeId))
    );
    
    // Check if memory is expired for short-term memories
    if (memory && memory.memoryType === 'short_term' && memory.expiresAt) {
      if (new Date() > memory.expiresAt) {
        // Memory is expired
        return null;
      }
    }
    
    return memory ? { ...memory } : null;
  }

  /**
   * Retrieve all memories for an agent
   */
  async getAgentMemories(agentType: AgentType): Promise<AgentMemory[]> {
    // In a real implementation, this would query the database
    if (!mockAgentMemories[agentType]) return [];
    
    // Filter out expired short-term memories
    const now = new Date();
    
    return mockAgentMemories[agentType]
      .filter(m => !(m.memoryType === 'short_term' && m.expiresAt && now > m.expiresAt))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Retrieve all memories for an employee
   */
  async getEmployeeMemories(employeeId: string): Promise<AgentMemory[]> {
    // In a real implementation, this would query the database
    const results: AgentMemory[] = [];
    const now = new Date();
    
    Object.values(mockAgentMemories).forEach(memories => {
      const filtered = memories.filter(
        m => m.employeeId === employeeId && 
             !(m.memoryType === 'short_term' && m.expiresAt && now > m.expiresAt)
      );
      results.push(...filtered);
    });
    
    return results.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Delete a memory
   */
  async deleteMemory(agentType: AgentType, id: string): Promise<boolean> {
    // In a real implementation, this would delete from the database
    if (!mockAgentMemories[agentType]) return false;
    
    const index = mockAgentMemories[agentType].findIndex(m => m.id === id);
    
    if (index >= 0) {
      mockAgentMemories[agentType].splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Record agent metrics
   */
  async recordMetrics(metrics: Partial<AgentMetrics> & { agentType: AgentType }): Promise<AgentMetrics> {
    // In a real implementation, this would insert or update in the database
    const agentType = metrics.agentType;
    
    if (!mockAgentMetrics[agentType]) {
      // Create new metrics object with defaults
      mockAgentMetrics[agentType] = {
        agentType,
        timeRange: metrics.timeRange || {
          start: new Date(),
          end: new Date()
        },
        invocations: metrics.invocations || 0,
        averageProcessingTime: metrics.averageProcessingTime || 0,
        tokensConsumed: metrics.tokensConsumed || 0,
        successRate: metrics.successRate || 1.0,
        decisionDistribution: metrics.decisionDistribution || {
          [AgentDecisionType.PATH_CREATION]: 0,
          [AgentDecisionType.PATH_ADJUSTMENT]: 0,
          [AgentDecisionType.CONTENT_RECOMMENDATION]: 0,
          [AgentDecisionType.STATUS_CHANGE]: 0,
          [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 0,
          [AgentDecisionType.CONTENT_CREATION]: 0,
          [AgentDecisionType.CONTENT_ADAPTATION]: 0,
          [AgentDecisionType.ASSESSMENT_GENERATION]: 0,
          [AgentDecisionType.AGENT_DELEGATION]: 0,
          [AgentDecisionType.METRIC_TRACKING]: 0,
          [AgentDecisionType.ALERT_GENERATION]: 0
        },
        totalCost: metrics.totalCost || 0,
        errorRate: metrics.errorRate || 0,
        commonErrors: metrics.commonErrors || []
      };
    } else {
      // Update existing metrics
      mockAgentMetrics[agentType] = {
        ...mockAgentMetrics[agentType],
        ...metrics
      };
    }
    
    return mockAgentMetrics[agentType];
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(agentType: AgentType): Promise<AgentMetrics | null> {
    // In a real implementation, this would query the database
    return mockAgentMetrics[agentType] ? { ...mockAgentMetrics[agentType] } : null;
  }

  /**
   * Get metrics for all agents
   */
  async getAllAgentMetrics(): Promise<Record<AgentType, AgentMetrics>> {
    // In a real implementation, this would query the database
    const result: Record<AgentType, AgentMetrics> = {} as Record<AgentType, AgentMetrics>;
    
    Object.entries(mockAgentMetrics).forEach(([type, metrics]) => {
      result[type as AgentType] = { ...metrics };
    });
    
    return result;
  }

  /**
   * Get agent state snapshot
   */
  async getAgentStateSnapshot(agentType: AgentType): Promise<AgentStateSnapshot> {
    // In a real implementation, this would aggregate data from multiple sources
    
    // Get active memories
    const memories = await this.getAgentMemories(agentType);
    
    // Get last decision
    const decisions = await this.getDecisionsByAgentType(agentType, 1);
    const lastDecision = decisions.length > 0 ? decisions[0] : undefined;
    
    // Get metrics snapshot
    const metrics = await this.getAgentMetrics(agentType);
    
    // Create snapshot
    const snapshot: AgentStateSnapshot = {
      agentType,
      timestamp: new Date(),
      activeMemories: memories,
      pendingDecisions: 0, // Would be calculated in a real implementation
      activeContexts: [], // Would be populated in a real implementation
      lastDecision,
      healthStatus: 'healthy', // Default, would be calculated in a real implementation
      metricsSnapshot: metrics || {
        agentType,
        invocations: 0,
        successRate: 1.0,
        errorRate: 0.0
      }
    };
    
    return snapshot;
  }

  /**
   * Get aggregated system-wide metrics
   */
  async getSystemMetrics(): Promise<{
    totalInvocations: number;
    totalTokensConsumed: number;
    totalCost: number;
    averageSuccessRate: number;
    decisionTypes: Record<AgentDecisionType, number>;
    invocationsByAgent: Record<AgentType, number>;
  }> {
    // In a real implementation, this would aggregate data from the database
    const metrics = await this.getAllAgentMetrics();
    
    let totalInvocations = 0;
    let totalTokensConsumed = 0;
    let totalCost = 0;
    let successRateSum = 0;
    let agentCount = 0;
    
    const decisionTypes: Record<AgentDecisionType, number> = {
      [AgentDecisionType.PATH_CREATION]: 0,
      [AgentDecisionType.PATH_ADJUSTMENT]: 0,
      [AgentDecisionType.CONTENT_RECOMMENDATION]: 0,
      [AgentDecisionType.STATUS_CHANGE]: 0,
      [AgentDecisionType.INTERVENTION_RECOMMENDATION]: 0,
      [AgentDecisionType.CONTENT_CREATION]: 0,
      [AgentDecisionType.CONTENT_ADAPTATION]: 0,
      [AgentDecisionType.ASSESSMENT_GENERATION]: 0,
      [AgentDecisionType.AGENT_DELEGATION]: 0,
      [AgentDecisionType.METRIC_TRACKING]: 0,
      [AgentDecisionType.ALERT_GENERATION]: 0
    };
    
    const invocationsByAgent: Record<AgentType, number> = {
      [AgentType.MANAGER]: 0,
      [AgentType.PERSONALIZATION]: 0,
      [AgentType.CONTENT_CREATOR]: 0,
      [AgentType.FEEDBACK_ADAPTATION]: 0,
      [AgentType.RAG_SYSTEM]: 0,
      [AgentType.REPORTING]: 0
    };
    
    Object.entries(metrics).forEach(([type, agentMetrics]) => {
      const agentType = type as AgentType;
      
      totalInvocations += agentMetrics.invocations;
      totalTokensConsumed += agentMetrics.tokensConsumed;
      totalCost += agentMetrics.totalCost;
      successRateSum += agentMetrics.successRate;
      agentCount += 1;
      
      invocationsByAgent[agentType] = agentMetrics.invocations;
      
      // Aggregate decision types
      Object.entries(agentMetrics.decisionDistribution).forEach(([decType, count]) => {
        decisionTypes[decType as AgentDecisionType] += count;
      });
    });
    
    const averageSuccessRate = agentCount > 0 ? successRateSum / agentCount : 1.0;
    
    return {
      totalInvocations,
      totalTokensConsumed,
      totalCost,
      averageSuccessRate,
      decisionTypes,
      invocationsByAgent
    };
  }
}

// Export singleton instance
export const agentStateService = new AgentStateService(); 