/**
 * Monitor Agent
 * 
 * Responsible for continuously tracking employee progress,
 * detecting significant status changes, and triggering notifications.
 */

import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { AgentConfig } from '../types';
import { RAGStatus, EmployeeProgress } from '@/types/hr.types';

export interface ProgressAlert {
  employeeId: string;
  employeeName: string;
  alertType: 'status_change' | 'missed_deadline' | 'inactivity' | 'completion';
  severity: 'low' | 'medium' | 'high';
  oldStatus?: RAGStatus;
  newStatus?: RAGStatus;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class MonitorAgent extends BaseAgent {
  private employeeProgressCache: Record<string, EmployeeProgress> = {};
  private alertHistory: ProgressAlert[] = [];
  private alertThreshold: number = 7; // Days since last activity to trigger alert
  private checkInterval: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "Monitor Agent",
      role: "Progress Tracker",
      goal: "Ensure timely detection of learning progress issues",
      backstory: "You monitor employee learning progress and detect patterns that may require intervention.",
      ...config
    });
  }
  
  /**
   * Process incoming messages from other agents
   */
  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.ensureInitialized();
    
    if (message.content.includes('check_employee')) {
      const empId = this.extractEmployeeId(message.content);
      if (empId) {
        const status = await this.checkEmployeeStatus(empId);
        return {
          id: message.id + "_response",
          from: this.id,
          to: message.from,
          content: `Employee ${empId} current status: ${status?.currentStatus || 'unknown'}`,
          timestamp: new Date()
        };
      }
    }
    
    // Default response
    return {
      id: message.id + "_response",
      from: this.id,
      to: message.from,
      content: `Acknowledged. I'll keep monitoring employee progress.`,
      timestamp: new Date()
    };
  }
  
  /**
   * Process tasks for the monitor agent
   */
  async processTask(task: any): Promise<any> {
    this.ensureInitialized();
    
    const taskType = task.type || 'unknown';
    
    switch (taskType) {
      case 'check_employee_status':
        return this.checkEmployeeStatus(task.data.employeeId);
        
      case 'batch_check':
        return this.batchCheckEmployees(task.data.employeeIds);
        
      case 'get_alerts':
        return this.getAlerts(
          task.data.filters, 
          task.data.limit || 10, 
          task.data.offset || 0
        );
        
      case 'acknowledge_alert':
        return this.acknowledgeAlert(task.data.alertId);
        
      case 'update_check_interval':
        return this.updateCheckInterval(task.data.intervalHours);
        
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Initialize the agent and start monitoring
   */
  async initialize(): Promise<{ success: boolean; message?: string }> {
    try {
      await super.initialize();
      
      // Start periodic monitoring
      this.startMonitoring();
      
      return { 
        success: true, 
        message: `${this.config.name} initialized and monitoring started` 
      };
    } catch (error) {
      console.error(`Error initializing ${this.config.name}:`, error);
      return { 
        success: false, 
        message: error instanceof Error 
          ? error.message 
          : `Unknown error initializing ${this.config.name}`
      };
    }
  }
  
  /**
   * Start periodic progress monitoring
   */
  startMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(async () => {
      try {
        await this.runFullCheck();
      } catch (error) {
        console.error('Error during progress monitoring:', error);
      }
    }, this.checkInterval);
    
    console.log(`Monitoring started with interval of ${this.checkInterval / (60 * 60 * 1000)} hours`);
  }
  
  /**
   * Stop periodic progress monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Monitoring stopped');
    }
  }
  
  /**
   * Update the monitoring check interval
   */
  updateCheckInterval(hours: number): { success: boolean; message: string } {
    if (hours < 1) {
      return { 
        success: false, 
        message: 'Check interval must be at least 1 hour' 
      };
    }
    
    this.checkInterval = hours * 60 * 60 * 1000;
    
    // Restart monitoring with new interval
    this.startMonitoring();
    
    return { 
      success: true, 
      message: `Check interval updated to ${hours} hours` 
    };
  }
  
  /**
   * Check status of a specific employee
   */
  async checkEmployeeStatus(employeeId: string): Promise<EmployeeProgress | null> {
    try {
      // In a real implementation, this would fetch from the database
      // For now, simulate with mock data
      const mockProgress = this.getMockEmployeeProgress(employeeId);
      
      // Store in cache
      this.employeeProgressCache[employeeId] = mockProgress;
      
      // Check for status changes and generate alerts if needed
      await this.detectStatusChanges(employeeId, mockProgress);
      
      return mockProgress;
    } catch (error) {
      console.error(`Error checking status for employee ${employeeId}:`, error);
      return null;
    }
  }
  
  /**
   * Batch check multiple employees
   */
  async batchCheckEmployees(employeeIds: string[]): Promise<Record<string, EmployeeProgress | null>> {
    const results: Record<string, EmployeeProgress | null> = {};
    
    await Promise.all(
      employeeIds.map(async (empId) => {
        results[empId] = await this.checkEmployeeStatus(empId);
      })
    );
    
    return results;
  }
  
  /**
   * Run a full check of all employees in the system
   */
  async runFullCheck(): Promise<{ checkedCount: number; alertsGenerated: number }> {
    // In a real implementation, this would fetch all employees from the database
    // For now, use mock employee IDs
    const mockEmployeeIds = ["emp001", "emp002", "emp003", "emp004", "emp005"];
    
    let alertsGenerated = 0;
    const initialAlertCount = this.alertHistory.length;
    
    await this.batchCheckEmployees(mockEmployeeIds);
    
    alertsGenerated = this.alertHistory.length - initialAlertCount;
    
    return {
      checkedCount: mockEmployeeIds.length,
      alertsGenerated
    };
  }
  
  /**
   * Detect significant changes in employee status that require alerts
   */
  async detectStatusChanges(
    employeeId: string, 
    currentProgress: EmployeeProgress
  ): Promise<ProgressAlert[]> {
    const alerts: ProgressAlert[] = [];
    
    // Get previous status if available
    const previousProgress = this.employeeProgressCache[employeeId];
    
    // Check for status degradation (green → amber, amber → red)
    if (previousProgress && this.isStatusDegraded(previousProgress.currentStatus, currentProgress.currentStatus)) {
      alerts.push({
        employeeId,
        employeeName: currentProgress.employeeName,
        alertType: 'status_change',
        severity: currentProgress.currentStatus === 'red' ? 'high' : 'medium',
        oldStatus: previousProgress.currentStatus,
        newStatus: currentProgress.currentStatus,
        message: `${currentProgress.employeeName}'s status has changed from ${previousProgress.currentStatus} to ${currentProgress.currentStatus}`,
        timestamp: new Date(),
        metadata: {
          department: currentProgress.department,
          program: currentProgress.programName
        }
      });
    }
    
    // Check for missed deadlines
    if (currentProgress.upcomingDeadlines && currentProgress.upcomingDeadlines.length > 0) {
      const now = new Date();
      const missedDeadlines = currentProgress.upcomingDeadlines.filter(deadline => {
        const deadlineDate = new Date(deadline.date);
        return deadlineDate < now && !deadline.completed;
      });
      
      if (missedDeadlines.length > 0) {
        alerts.push({
          employeeId,
          employeeName: currentProgress.employeeName,
          alertType: 'missed_deadline',
          severity: 'medium',
          newStatus: currentProgress.currentStatus,
          message: `${currentProgress.employeeName} has missed ${missedDeadlines.length} deadline(s)`,
          timestamp: new Date(),
          metadata: {
            missedDeadlines,
            department: currentProgress.department
          }
        });
      }
    }
    
    // Check for inactivity
    if (currentProgress.lastActivityDate) {
      const lastActivity = new Date(currentProgress.lastActivityDate);
      const now = new Date();
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysSinceActivity >= this.alertThreshold) {
        alerts.push({
          employeeId,
          employeeName: currentProgress.employeeName,
          alertType: 'inactivity',
          severity: 'high',
          newStatus: currentProgress.currentStatus,
          message: `${currentProgress.employeeName} has been inactive for ${daysSinceActivity} days`,
          timestamp: new Date(),
          metadata: {
            daysSinceActivity,
            department: currentProgress.department
          }
        });
      }
    }
    
    // Check for program completion
    if (currentProgress.progress === 100 && (!previousProgress || previousProgress.progress < 100)) {
      alerts.push({
        employeeId,
        employeeName: currentProgress.employeeName,
        alertType: 'completion',
        severity: 'low',
        newStatus: currentProgress.currentStatus,
        message: `${currentProgress.employeeName} has completed the ${currentProgress.programName} program`,
        timestamp: new Date(),
        metadata: {
          department: currentProgress.department,
          program: currentProgress.programName,
          completedAt: new Date()
        }
      });
    }
    
    // Add new alerts to history
    this.alertHistory.push(...alerts);
    
    return alerts;
  }
  
  /**
   * Get filtered alerts
   */
  getAlerts(
    filters?: { 
      employeeId?: string;
      alertType?: string;
      severity?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    limit: number = 10,
    offset: number = 0
  ): { alerts: ProgressAlert[]; total: number } {
    let filteredAlerts = [...this.alertHistory];
    
    // Apply filters
    if (filters) {
      if (filters.employeeId) {
        filteredAlerts = filteredAlerts.filter(a => a.employeeId === filters.employeeId);
      }
      
      if (filters.alertType) {
        filteredAlerts = filteredAlerts.filter(a => a.alertType === filters.alertType);
      }
      
      if (filters.severity) {
        filteredAlerts = filteredAlerts.filter(a => a.severity === filters.severity);
      }
      
      if (filters.fromDate) {
        filteredAlerts = filteredAlerts.filter(a => a.timestamp >= filters.fromDate);
      }
      
      if (filters.toDate) {
        filteredAlerts = filteredAlerts.filter(a => a.timestamp <= filters.toDate);
      }
    }
    
    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return {
      alerts: filteredAlerts.slice(offset, offset + limit),
      total: filteredAlerts.length
    };
  }
  
  /**
   * Acknowledge an alert (in a real implementation, this would update database)
   */
  acknowledgeAlert(alertId: string): { success: boolean; message: string } {
    // In a real implementation, this would mark the alert as acknowledged in the database
    return {
      success: true,
      message: `Alert ${alertId} acknowledged`
    };
  }
  
  // Helper methods
  
  /**
   * Extract employee ID from message content
   */
  private extractEmployeeId(content: string): string | null {
    // Simple regex to extract IDs like "emp001" from the message
    const match = content.match(/\b(emp\d+)\b/i);
    return match ? match[1] : null;
  }
  
  /**
   * Check if status has degraded
   */
  private isStatusDegraded(oldStatus: RAGStatus, newStatus: RAGStatus): boolean {
    const statusValues: Record<RAGStatus, number> = {
      'green': 3,
      'amber': 2,
      'red': 1
    };
    
    return statusValues[newStatus] < statusValues[oldStatus];
  }
  
  /**
   * Get mock employee progress data
   */
  private getMockEmployeeProgress(employeeId: string): EmployeeProgress {
    // Randomize status for testing
    const statuses: RAGStatus[] = ['red', 'amber', 'green'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate a recent date within past 10 days
    const randomDaysAgo = Math.floor(Math.random() * 10);
    const lastActivityDate = new Date();
    lastActivityDate.setDate(lastActivityDate.getDate() - randomDaysAgo);
    
    // Random progress percentage
    const progress = Math.floor(Math.random() * 101);
    
    return {
      employeeId,
      employeeName: `Test Employee ${employeeId.slice(-3)}`,
      department: 'Engineering',
      role: 'Software Developer',
      programName: 'JavaScript Mastery',
      currentStatus: randomStatus,
      progress,
      lastActivityDate: lastActivityDate.toISOString(),
      upcomingDeadlines: [
        {
          title: 'Complete React Module',
          date: new Date(Date.now() + (Math.random() < 0.3 ? -1 : 1) * 3 * 24 * 60 * 60 * 1000).toISOString(), // +/- 3 days
          completed: Math.random() > 0.4
        },
        {
          title: 'Submit Final Project',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ahead
          completed: false
        }
      ],
      notes: `Mock data for testing monitor agent with employee ${employeeId}`
    };
  }
} 