/**
 * RAG System Agent Implementation
 * 
 * The RAG System Agent tracks learner progress and determines
 * their Red/Amber/Green status based on engagement and performance metrics.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { AgentConfig } from '../types';
import { LearnerProfile } from '@/types/ai-content.types';
import { RAGStatus, RAGStatusEnum, RAGStatusDetails } from '@/types/hr.types';
import { 
  RAGSystemAgent as IRAGSystemAgent,
  ProgressMetrics,
  RAGStatusReport
} from '../interfaces/RAGSystemAgent';
import { LLMService } from '@/lib/llm/llm-service';

/**
 * RAG Status determination thresholds
 */
interface RAGThresholds {
  red: {
    completionRate: number;
    inactivityDays: number;
    failedAssessments: number;
    missedDeadlines: number;
  };
  amber: {
    completionRate: number;
    inactivityDays: number;
    mixedAssessmentThreshold: number;
    missedDeadlines: number;
  };
}

/**
 * RAG System Agent Implementation
 */
export class RAGSystemAgent extends BaseAgent implements IRAGSystemAgent {
  private llmService: LLMService;
  private useLLM: boolean;
  private statusHistory: Map<string, RAGStatusDetails[]> = new Map();
  private thresholds: RAGThresholds;
  
  /**
   * Initialize the RAG System Agent with default config
   */
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "RAG System Agent",
      role: "Progress Tracking Specialist",
      goal: "Track learner progress and determine RAG status",
      backstory: "You specialize in monitoring learning progress and identifying when intervention is needed.",
      ...config
    });
    
    // Initialize LLM service for generating explanations
    this.llmService = LLMService.getInstance({
      debugMode: process.env.NODE_ENV === 'development'
    });
    
    // Check if we have a configured LLM
    this.useLLM = this.llmService.isConfigured();
    if (!this.useLLM && process.env.NODE_ENV === 'development') {
      this.logError('LLM not configured, using rule-based approach only');
    }
    
    // Set default thresholds
    this.thresholds = {
      red: {
        completionRate: 0.3, // Below 30%
        inactivityDays: 30, // No activity for 30+ days
        failedAssessments: 2, // Failed 2+ assessments
        missedDeadlines: 3 // Missed 3+ deadlines
      },
      amber: {
        completionRate: 0.7, // Below 70%
        inactivityDays: 14, // No activity for 14+ days
        mixedAssessmentThreshold: 0.6, // Below 60% average assessment score
        missedDeadlines: 1 // Missed at least 1 deadline
      }
    };
  }
  
  /**
   * Process messages from other agents
   */
  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.ensureInitialized();
    
    // Process different message types
    if (message.metadata?.type === 'status_request') {
      const learnerId = message.metadata.learnerId;
      const learnerProfile = message.metadata.learnerProfile as LearnerProfile;
      const progressMetrics = message.metadata.progressMetrics as ProgressMetrics;
      
      if (!learnerId || !learnerProfile || !progressMetrics) {
        return this.createResponseMessage(
          message,
          "Missing required data for status determination",
          { type: 'error', error: 'Missing required data' }
        );
      }
      
      // Determine RAG status
      const status = await this.determineRAGStatus(learnerProfile, progressMetrics);
      
      // Track status history
      await this.trackStatusHistory(learnerId, status);
      
      return this.createResponseMessage(
        message,
        `RAG status determined for learner ${learnerId}`,
        { type: 'status_response', learnerId, status }
      );
    }
    
    // Default response for unrecognized messages
    return this.createResponseMessage(
      message,
      `Received message: ${message.content.substring(0, 50)}...`,
      { type: 'acknowledgment' }
    );
  }
  
  /**
   * Process tasks assigned to the RAG agent
   */
  async processTask(task: any): Promise<any> {
    this.ensureInitialized();
    
    const taskType = task.type || 'unknown';
    
    switch (taskType) {
      case 'determine_rag_status':
        return this.determineRAGStatus(
          task.data.learnerProfile, 
          task.data.progressMetrics
        );
        
      case 'determine_rag_status_batch':
        return this.determineRAGStatusBatch(task.data.learnersData);
        
      case 'explain_status':
        return this.explainStatus(
          task.data.learnerId, 
          task.data.status
        );
        
      case 'generate_status_report':
        return this.generateStatusReport(
          task.data.learnerProfile,
          task.data.statusDetails,
          task.data.context
        );
        
      case 'identify_at_risk_learners':
        return this.identifyAtRiskLearners(
          task.data.statuses,
          task.data.threshold
        );
        
      case 'generate_recommendations':
        return this.generateRecommendations(
          task.data.learnerProfile,
          task.data.statusDetails
        );
        
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Determine the RAG status for a single learner
   */
  async determineRAGStatus(
    learnerProfile: LearnerProfile,
    progressMetrics: ProgressMetrics
  ): Promise<RAGStatusDetails> {
    this.ensureInitialized();
    
    // Try LLM-based status determination if enabled
    if (this.useLLM) {
      const llmResult = await this.determineLLMBasedStatus(learnerProfile, progressMetrics);
      if (llmResult) {
        return llmResult;
      }
    }
    
    // Fall back to rule-based approach
    let status: RAGStatus = RAGStatusEnum.GREEN; // Default to green
    const confidence = 0.9; // High confidence for rule-based assessment
    const reasons: string[] = [];
    
    // Check completion rate
    if (progressMetrics.completionRate < this.thresholds.red.completionRate) {
      reasons.push(`Very low completion rate (${progressMetrics.completionRate * 100}%)`);
      status = RAGStatusEnum.RED;
    } else if (progressMetrics.completionRate < this.thresholds.amber.completionRate) {
      reasons.push(`Below target completion rate (${progressMetrics.completionRate * 100}%)`);
      status = RAGStatusEnum.AMBER;
    } else {
      reasons.push(`Good completion rate (${progressMetrics.completionRate * 100}%)`);
    }
    
    // Check last activity
    if (progressMetrics.lastActivityDate) {
      const daysSinceActivity = this.getDaysSince(progressMetrics.lastActivityDate);
      
      if (daysSinceActivity > this.thresholds.red.inactivityDays) {
        reasons.push(`No activity for ${daysSinceActivity} days`);
        status = this.worsenStatus(status, RAGStatusEnum.RED);
      } else if (daysSinceActivity > this.thresholds.amber.inactivityDays) {
        reasons.push(`Limited recent activity (${daysSinceActivity} days since last activity)`);
        status = this.worsenStatus(status, RAGStatusEnum.AMBER);
      } else {
        reasons.push(`Active within the last ${daysSinceActivity} days`);
      }
    }
    
    // Check assessment scores
    if (progressMetrics.assessmentScores && Object.keys(progressMetrics.assessmentScores).length > 0) {
      const scores = Object.values(progressMetrics.assessmentScores);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const failedAssessments = scores.filter(score => score < 60).length;
      
      if (failedAssessments >= this.thresholds.red.failedAssessments) {
        reasons.push(`Failed ${failedAssessments} assessments`);
        status = this.worsenStatus(status, RAGStatusEnum.RED);
      } else if (averageScore < this.thresholds.amber.mixedAssessmentThreshold * 100) {
        reasons.push(`Below target assessment performance (avg: ${averageScore.toFixed(1)}%)`);
        status = this.worsenStatus(status, RAGStatusEnum.AMBER);
      } else {
        reasons.push(`Good assessment performance (avg: ${averageScore.toFixed(1)}%)`);
      }
    }
    
    // Check deadlines
    if (progressMetrics.deadlinesMissed !== undefined) {
      if (progressMetrics.deadlinesMissed >= this.thresholds.red.missedDeadlines) {
        reasons.push(`Missed ${progressMetrics.deadlinesMissed} deadlines`);
        status = this.worsenStatus(status, RAGStatusEnum.RED);
      } else if (progressMetrics.deadlinesMissed >= this.thresholds.amber.missedDeadlines) {
        reasons.push(`Missed ${progressMetrics.deadlinesMissed} deadlines`);
        status = this.worsenStatus(status, RAGStatusEnum.AMBER);
      } else if (progressMetrics.deadlinesMet && progressMetrics.deadlinesMet > 0) {
        reasons.push(`Met ${progressMetrics.deadlinesMet} deadlines`);
      }
    }
    
    // Check engagement metrics if available
    if (progressMetrics.engagementMetrics) {
      if (progressMetrics.engagementMetrics.sessionsPerWeek !== undefined && 
          progressMetrics.engagementMetrics.sessionsPerWeek < 1) {
        reasons.push(`Low engagement (${progressMetrics.engagementMetrics.sessionsPerWeek} sessions/week)`);
        status = this.worsenStatus(status, RAGStatusEnum.AMBER);
      }
      
      if (progressMetrics.engagementMetrics.contentCompletionSpeed !== undefined && 
          progressMetrics.engagementMetrics.contentCompletionSpeed < 0.5) {
        reasons.push('Very slow progress through content');
        status = this.worsenStatus(status, RAGStatusEnum.AMBER);
      }
    }
    
    // Create status details
    const statusDetails: RAGStatusDetails = {
      learnerId: learnerProfile.id,
      status,
      confidence,
      timestamp: new Date(),
      reasons,
      metrics: progressMetrics,
      justification: reasons.join('. '),
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    };
    
    // Track status in history
    await this.trackStatusHistory(learnerProfile.id, statusDetails);
    
    return statusDetails;
  }
  
  /**
   * Determine RAG status for multiple learners in batch
   */
  async determineRAGStatusBatch(
    learnersData: Array<{
      profile: LearnerProfile;
      metrics: ProgressMetrics;
    }>
  ): Promise<Map<string, RAGStatusDetails>> {
    this.ensureInitialized();
    
    const results = new Map<string, RAGStatusDetails>();
    
    // Process each learner
    for (const { profile, metrics } of learnersData) {
      try {
        const status = await this.determineRAGStatus(profile, metrics);
        results.set(profile.id, status);
      } catch (error) {
        this.logError(`Error determining status for learner ${profile.id}:`, error);
        // Skip failed learners
      }
    }
    
    return results;
  }
  
  /**
   * Generate an explanation of a learner's RAG status
   */
  async explainStatus(
    learnerId: string, 
    status: RAGStatus
  ): Promise<string> {
    this.ensureInitialized();
    
    // Get status history for the learner
    const history = this.statusHistory.get(learnerId) || [];
    
    // Get most recent status details if available
    const latestStatus = history.length > 0 ? history[history.length - 1] : null;
    
    // If no history or latest status doesn't match requested status, generate generic explanation
    if (!latestStatus || latestStatus.status !== status) {
      return this.generateGenericStatusExplanation(status);
    }
    
    // If we have LLM, use it for a more personalized explanation
    if (this.useLLM) {
      try {
        const explanation = await this.llmService.complete(
          this.generateStatusExplanationPrompt(latestStatus),
          {
            temperature: 0.7,
            maxTokens: 300
          }
        );
        
        return explanation;
      } catch (error) {
        this.logError('Error generating status explanation with LLM:', error);
        // Fall back to rule-based explanation
      }
    }
    
    // Rule-based explanation based on the reasons
    return this.generateRuleBasedExplanation(latestStatus);
  }
  
  /**
   * Generate a detailed report with recommendations
   */
  async generateStatusReport(
    learnerProfile: LearnerProfile,
    statusDetails: RAGStatusDetails,
    context?: any
  ): Promise<RAGStatusReport> {
    this.ensureInitialized();
    
    // Generate recommendations based on status
    const recommendations = await this.generateRecommendationsObject(learnerProfile, statusDetails);
    
    // Determine follow-up date based on status severity
    let followUpDate: Date | undefined;
    const now = new Date();
    
    if (statusDetails.status === RAGStatusEnum.RED) {
      // For RED status, follow up within 2 days
      followUpDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    } else if (statusDetails.status === RAGStatusEnum.AMBER) {
      // For AMBER status, follow up within 1 week
      followUpDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      // For GREEN status, follow up in 2 weeks
      followUpDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    
    // Create the full report
    const report: RAGStatusReport = {
      ...statusDetails,
      recommendations,
      followUpDate
    };
    
    return report;
  }
  
  /**
   * Identify learners that need immediate attention
   */
  async identifyAtRiskLearners(
    statuses: Map<string, RAGStatusDetails>,
    threshold: 'red' | 'amber' | 'all' = 'red'
  ): Promise<string[]> {
    this.ensureInitialized();
    
    const atRiskLearners: string[] = [];
    
    for (const [learnerId, status] of statuses.entries()) {
      if (threshold === 'all') {
        atRiskLearners.push(learnerId);
      } else if (threshold === 'amber' && 
                (status.status === RAGStatusEnum.AMBER || status.status === RAGStatusEnum.RED)) {
        atRiskLearners.push(learnerId);
      } else if (threshold === 'red' && status.status === RAGStatusEnum.RED) {
        atRiskLearners.push(learnerId);
      }
    }
    
    return atRiskLearners;
  }
  
  /**
   * Track changes in learner RAG status over time
   */
  async trackStatusHistory(
    learnerId: string,
    newStatus: RAGStatusDetails
  ): Promise<RAGStatusDetails[]> {
    this.ensureInitialized();
    
    // Get existing history or create new
    const history = this.statusHistory.get(learnerId) || [];
    
    // Add new status to history
    history.push(newStatus);
    
    // Keep only the most recent statuses (limit to 10)
    const trimmedHistory = history.slice(-10);
    
    // Update the history
    this.statusHistory.set(learnerId, trimmedHistory);
    
    return trimmedHistory;
  }
  
  /**
   * Generate recommendations based on RAG status
   */
  async generateRecommendations(
    learnerProfile: LearnerProfile,
    statusDetails: RAGStatusDetails
  ): Promise<string[]> {
    this.ensureInitialized();
    
    // If we have LLM, use it for personalized recommendations
    if (this.useLLM) {
      try {
        const recommendationsText = await this.llmService.complete(
          this.generateRecommendationsPrompt(learnerProfile, statusDetails),
          {
            temperature: 0.7,
            maxTokens: 400
          }
        );
        
        // Parse the recommendations from the text
        return this.parseRecommendationsList(recommendationsText);
      } catch (error) {
        this.logError('Error generating recommendations with LLM:', error);
        // Fall back to rule-based recommendations
      }
    }
    
    // Rule-based recommendations
    return this.generateRuleBasedRecommendations(statusDetails.status, statusDetails.reasons);
  }
  
  /**
   * Use LLM to determine RAG status
   */
  private async determineLLMBasedStatus(
    learnerProfile: LearnerProfile,
    progressMetrics: ProgressMetrics
  ): Promise<RAGStatusDetails | null> {
    try {
      const prompt = this.generateRAGStatusPrompt(learnerProfile, progressMetrics);
      
      const response = await this.llmService.complete(prompt, {
        temperature: 0.3,
        maxTokens: 800,
        system: "You are an AI assistant specialized in educational analytics. Your job is to analyze learner data and determine their RED/AMBER/GREEN status based on their progress metrics."
      });
      
      // Parse the status from the response
      const status = this.parseRAGStatusFromLLM(response);
      
      if (status) {
        return {
          learnerId: learnerProfile.id,
          status: status.status,
          confidence: status.confidence,
          timestamp: new Date(),
          reasons: status.reasons,
          justification: status.reasons.join('. '),
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        };
      }
      
      return null;
    } catch (error) {
      this.logError('Error determining RAG status with LLM:', error);
      return null;
    }
  }
  
  /**
   * Parse RAG status from LLM response
   */
  private parseRAGStatusFromLLM(response: string): { 
    status: RAGStatus; 
    confidence: number;
    reasons: string[];
  } | null {
    // Look for status indicator in the response
    const redMatch = response.match(/STATUS:\s*RED/i) || 
                     response.match(/RAG STATUS:\s*RED/i);
    const amberMatch = response.match(/STATUS:\s*AMBER/i) || 
                       response.match(/RAG STATUS:\s*AMBER/i) ||
                       response.match(/STATUS:\s*YELLOW/i) ||
                       response.match(/RAG STATUS:\s*YELLOW/i);
    const greenMatch = response.match(/STATUS:\s*GREEN/i) || 
                       response.match(/RAG STATUS:\s*GREEN/i);
    
    let status: RAGStatus;
    let confidence = 0.8; // Default confidence
    
    if (redMatch) {
      status = RAGStatusEnum.RED;
    } else if (amberMatch) {
      status = RAGStatusEnum.AMBER;
    } else if (greenMatch) {
      status = RAGStatusEnum.GREEN;
    } else {
      // Could not determine status clearly
      return null;
    }
    
    // Extract reasons
    let reasons: string[] = [];
    
    // Look for a reasons or justification section
    const reasonsMatch = response.match(/(?:REASONS|JUSTIFICATION|RATIONALE):([\s\S]*?)(?:##|\n\n|$)/i);
    if (reasonsMatch && reasonsMatch[1]) {
      // Split by bullet points or line breaks
      const reasonsText = reasonsMatch[1].trim();
      reasons = reasonsText.split(/\n+|\*+|•|-/)
        .map(reason => reason.trim())
        .filter(reason => reason.length > 0);
    }
    
    // If no reasons found, extract some text around the status declaration
    if (reasons.length === 0) {
      const statusIndex = response.indexOf(status);
      if (statusIndex >= 0) {
        const context = response.substring(statusIndex - 100, statusIndex + 100);
        const sentences = context.split(/[.!?]+/);
        reasons = sentences.filter(s => s.trim().length > 10).map(s => s.trim());
      }
    }
    
    // If still no reasons, use a generic one
    if (reasons.length === 0) {
      reasons = [`Learner is ${status.toLowerCase()} based on overall assessment`];
    }
    
    // Look for confidence indicator
    const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+(?:\.\d+)?)/);
    if (confidenceMatch && confidenceMatch[1]) {
      const parsedConfidence = parseFloat(confidenceMatch[1]);
      if (!isNaN(parsedConfidence)) {
        // Normalize to 0-1 range if it seems to be in 0-100
        confidence = parsedConfidence > 1 ? parsedConfidence / 100 : parsedConfidence;
      }
    }
    
    return { status, confidence, reasons };
  }
  
  /**
   * Parse recommendations list from LLM response
   */
  private parseRecommendationsList(text: string): string[] {
    // Split by common list item markers
    const recommendations = text
      .split(/\n+|\*+|•|-|\d+\.|[A-Z]\)/)
      .map(item => item.trim())
      .filter(item => item.length > 10); // Filter out empty or very short items
    
    if (recommendations.length === 0) {
      // Simple line-by-line split if no list markers found
      return text
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 10);
    }
    
    return recommendations;
  }
  
  /**
   * Generate a prompt for RAG status determination
   */
  private generateRAGStatusPrompt(
    learnerProfile: LearnerProfile,
    progressMetrics: ProgressMetrics
  ): string {
    return `
      I need to determine the RAG (Red, Amber, Green) status for a learner based on their profile and progress metrics.
      
      LEARNER PROFILE:
      ----------------
      ID: ${learnerProfile.id}
      Name: ${learnerProfile.name}
      Role: ${learnerProfile.role}
      Department: ${learnerProfile.department}
      Experience Level: ${learnerProfile.experienceLevel}
      Learning Style: ${learnerProfile.learningStyle}
      Skills: ${learnerProfile.skills.join(', ')}
      Interests: ${learnerProfile.interests.join(', ')}
      
      PROGRESS METRICS:
      ----------------
      Completion Rate: ${progressMetrics.completionRate * 100}%
      Last Activity Date: ${progressMetrics.lastActivityDate?.toISOString() || 'Not available'}
      ${progressMetrics.deadlinesMet !== undefined ? `Deadlines Met: ${progressMetrics.deadlinesMet}` : ''}
      ${progressMetrics.deadlinesMissed !== undefined ? `Deadlines Missed: ${progressMetrics.deadlinesMissed}` : ''}
      
      ${progressMetrics.assessmentScores ? 
        `Assessment Scores: ${Object.entries(progressMetrics.assessmentScores)
          .map(([moduleId, score]) => `Module ${moduleId}: ${score}%`)
          .join(', ')}` : 
        'Assessment Scores: Not available'}
      
      ${progressMetrics.engagementMetrics ? 
        `Engagement Metrics:
         - Average Session Duration: ${progressMetrics.engagementMetrics.averageSessionDuration || 'N/A'} minutes
         - Sessions Per Week: ${progressMetrics.engagementMetrics.sessionsPerWeek || 'N/A'}
         - Content Completion Speed: ${progressMetrics.engagementMetrics.contentCompletionSpeed || 'N/A'} (relative to average)
         - Interaction Frequency: ${progressMetrics.engagementMetrics.interactionFrequency || 'N/A'} actions/session` :
        'Engagement Metrics: Not available'}
      
      GUIDELINES FOR STATUS DETERMINATION:
      -----------------------------------
      - RED status indicators:
        * Completion rate below 30%
        * No activity for more than 30 days
        * Failed assessments or consistently low scores
        * Multiple missed deadlines
        * Significant decline in engagement metrics
      
      - AMBER status indicators:
        * Completion rate between 30-70%
        * Activity gaps of 14-30 days
        * Mixed assessment performance
        * Occasional missed deadlines
        * Inconsistent engagement patterns
      
      - GREEN status indicators:
        * Completion rate above 70%
        * Active within the last 14 days
        * Satisfactory assessment performance
        * Meeting deadlines consistently
        * Steady or improving engagement metrics
      
      Please provide a clear RAG status determination with the following format:
      
      RAG STATUS: [RED/AMBER/GREEN]
      CONFIDENCE: [0-1 value representing confidence level]
      REASONS:
      1. [First reason for this status]
      2. [Second reason for this status]
      3. [Additional reasons as needed]
    `;
  }
  
  /**
   * Generate a prompt for status explanation
   */
  private generateStatusExplanationPrompt(status: RAGStatusDetails): string {
    return `
      I need to explain the following RAG (Red, Amber, Green) status to an HR manager:
      
      RAG STATUS: ${status.status}
      REASONS:
      ${status.reasons.map((reason, i) => `${i + 1}. ${reason}`).join('\n')}
      
      METRICS:
      Completion Rate: ${status.metrics.completionRate * 100}%
      Last Activity: ${status.metrics.lastActivityDate?.toISOString() || 'Not available'}
      ${status.metrics.deadlinesMet !== undefined ? `Deadlines Met: ${status.metrics.deadlinesMet}` : ''}
      ${status.metrics.deadlinesMissed !== undefined ? `Deadlines Missed: ${status.metrics.deadlinesMissed}` : ''}
      
      Please generate a clear, concise explanation of this status that:
      1. Summarizes the key issues/strengths
      2. Puts them in context
      3. Explains what the status means for the learner's progress
      4. Uses a professional tone appropriate for HR
      
      The explanation should be 2-3 paragraphs and focus on the most important factors.
    `;
  }
  
  /**
   * Generate a prompt for recommendations
   */
  private generateRecommendationsPrompt(
    learnerProfile: LearnerProfile,
    statusDetails: RAGStatusDetails
  ): string {
    return `
      I need to generate recommendations for a learner based on their RAG status:
      
      LEARNER PROFILE:
      ID: ${learnerProfile.id}
      Name: ${learnerProfile.name}
      Role: ${learnerProfile.role}
      Department: ${learnerProfile.department}
      Experience Level: ${learnerProfile.experienceLevel}
      Learning Style: ${learnerProfile.learningStyle}
      
      RAG STATUS: ${statusDetails.status}
      REASONS:
      ${statusDetails.reasons.map((reason, i) => `${i + 1}. ${reason}`).join('\n')}
      
      METRICS:
      Completion Rate: ${statusDetails.metrics.completionRate * 100}%
      Last Activity: ${statusDetails.metrics.lastActivityDate?.toISOString() || 'Not available'}
      
      Please provide 3-5 specific, actionable recommendations that:
      1. Address the key issues identified in the status
      2. Consider the learner's profile and learning style
      3. Are concrete and specific enough to implement
      4. Are prioritized by importance
      
      Format each recommendation as a clear action item.
    `;
  }
  
  /**
   * Generate rule-based recommendations based on status
   */
  private generateRuleBasedRecommendations(
    status: RAGStatus,
    reasons: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Generic recommendations based on status
    if (status === RAGStatusEnum.RED) {
      recommendations.push('Schedule an immediate check-in with the learner to discuss progress barriers');
      recommendations.push('Review and potentially adjust the learning path difficulty');
      recommendations.push('Consider assigning a mentor for additional support');
    } else if (status === RAGStatusEnum.AMBER) {
      recommendations.push('Schedule a follow-up discussion with the learner within the next week');
      recommendations.push('Provide additional practice materials or alternative learning resources');
      recommendations.push('Send an encouraging reminder about upcoming deadlines');
    } else {
      recommendations.push('Maintain current learning path and check in regularly');
      recommendations.push('Consider suggesting advanced topics for further growth');
      recommendations.push('Recognize the learner\'s good progress in your next communication');
    }
    
    // Specific recommendations based on reasons
    for (const reason of reasons) {
      // Low completion rate
      if (reason.toLowerCase().includes('completion rate') && reason.toLowerCase().includes('low')) {
        recommendations.push('Break down remaining content into smaller, more manageable sections');
      }
      
      // Inactivity
      if (reason.toLowerCase().includes('activity') && 
         (reason.toLowerCase().includes('no') || reason.toLowerCase().includes('limited'))) {
        recommendations.push('Send a re-engagement email with a summary of where they left off');
      }
      
      // Failed assessments
      if (reason.toLowerCase().includes('assessment') && 
         (reason.toLowerCase().includes('fail') || reason.toLowerCase().includes('below'))) {
        recommendations.push('Provide targeted review materials focusing on weak areas identified in assessments');
      }
      
      // Missed deadlines
      if (reason.toLowerCase().includes('deadline') && reason.toLowerCase().includes('miss')) {
        recommendations.push('Adjust deadline schedule or provide a more structured timeline');
      }
    }
    
    // Deduplicate recommendations
    return [...new Set(recommendations)];
  }
  
  /**
   * Generate generic status explanation
   */
  private generateGenericStatusExplanation(status: RAGStatus): string {
    switch (status) {
      case RAGStatusEnum.RED:
        return 'This learner is flagged as RED status, indicating significant concerns with their learning progress. Immediate intervention is recommended to address engagement issues, missed deadlines, or poor assessment performance. The learner may need a revised learning path, additional support, or direct outreach from HR or a manager to overcome current obstacles.';
        
      case RAGStatusEnum.AMBER:
        return 'This learner is currently at AMBER status, indicating moderate concerns with their learning progress. While not critical, there are signs of potential disengagement or difficulty that should be addressed soon. The learner might benefit from additional support, clarification of expectations, or slight adjustments to their learning path to prevent further decline.';
        
      case RAGStatusEnum.GREEN:
        return 'This learner is at GREEN status, indicating satisfactory progress in their learning journey. They are maintaining good engagement, meeting deadlines, and performing adequately on assessments. Continue with the current approach while monitoring for any changes in performance patterns.';
        
      default:
        return 'Status information is not available for this learner.';
    }
  }
  
  /**
   * Generate rule-based explanation based on status details
   */
  private generateRuleBasedExplanation(status: RAGStatusDetails): string {
    const reasonsText = status.reasons.length > 0 
      ? 'The key factors include: ' + status.reasons.join(', ').toLowerCase() + '.'
      : '';
    
    switch (status.status) {
      case RAGStatusEnum.RED:
        return `This learner requires immediate attention as they are flagged with RED status. ${reasonsText} It's important to reach out directly to understand and address the underlying issues preventing progress. Consider adjusting their learning path and providing additional support resources.`;
        
      case RAGStatusEnum.AMBER:
        return `This learner shows moderate concerns with AMBER status. ${reasonsText} While not critical yet, these issues should be addressed soon to prevent further decline. Consider a check-in meeting and potential adjustments to their learning approach based on the identified areas of concern.`;
        
      case RAGStatusEnum.GREEN:
        return `This learner is progressing well with GREEN status. ${reasonsText} They appear to be engaged and meeting expectations successfully. Continue with the current learning approach while monitoring for any changes in their performance.`;
        
      default:
        return 'Status information is not available for this learner.';
    }
  }
  
  /**
   * Generate recommendations object with priority and timeframe
   */
  private async generateRecommendationsObject(
    learnerProfile: LearnerProfile,
    statusDetails: RAGStatusDetails
  ): Promise<RAGStatusReport['recommendations']> {
    // Get recommendation actions
    const actions = await this.generateRecommendations(learnerProfile, statusDetails);
    
    // Determine priority based on status
    const priority: 'low' | 'medium' | 'high' = 
      statusDetails.status === RAGStatusEnum.RED ? 'high' :
      statusDetails.status === RAGStatusEnum.AMBER ? 'medium' : 'low';
    
    // Determine timeframe based on status
    const timeframe: 'immediate' | 'short-term' | 'long-term' = 
      statusDetails.status === RAGStatusEnum.RED ? 'immediate' :
      statusDetails.status === RAGStatusEnum.AMBER ? 'short-term' : 'long-term';
    
    // For red status, assign to HR
    const assignedTo = statusDetails.status === RAGStatusEnum.RED ? 'HR Manager' : undefined;
    
    return {
      priority,
      actions,
      timeframe,
      assignedTo
    };
  }
  
  /**
   * Calculate days since a given date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Update status to the worse of two options
   */
  private worsenStatus(current: RAGStatus, potential: RAGStatus): RAGStatus {
    const severity = {
      [RAGStatusEnum.GREEN]: 1,
      [RAGStatusEnum.AMBER]: 2,
      [RAGStatusEnum.RED]: 3
    };
    
    return (severity as any)[current] >= (severity as any)[potential] ? current : potential;
  }
} 