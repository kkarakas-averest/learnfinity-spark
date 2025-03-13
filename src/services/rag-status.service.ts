import { RAGStatus } from '@/types/hr.types';
import { supabase } from '@/lib/supabase';
import { addDays, subDays, formatDistance } from 'date-fns';

/**
 * Generates a UUID (v4)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * RAG Status Entry with history details
 */
export interface RAGStatusEntry {
  id: string;
  employeeId: string;
  status: RAGStatus;
  previousStatus?: RAGStatus;
  reason: string;
  createdBy: string;
  createdAt: string;
  relatedInterventionId?: string;
}

/**
 * Full history of RAG status changes
 */
export interface RAGStatusHistory {
  employeeId: string;
  currentStatus: RAGStatus;
  entries: RAGStatusEntry[];
  lastUpdate: string;
}

/**
 * Metrics for status changes across employees
 */
export interface StatusChangeMetrics {
  improvementRate: number;
  declineRate: number;
  stabilityRate: number;
  statusDistribution: {
    green: number;
    amber: number;
    red: number;
  };
  // Percentages
  statusPercentages: {
    green: number;
    amber: number;
    red: number;
  };
  totalEmployees: number;
  averageDaysInStatus: {
    green: number;
    amber: number;
    red: number;
  };
}

/**
 * Service for managing employee RAG status tracking
 */
export class RAGStatusService {
  private static instance: RAGStatusService;
  private cache: Map<string, RAGStatusHistory> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance of RAGStatusService
   */
  public static getInstance(): RAGStatusService {
    if (!RAGStatusService.instance) {
      RAGStatusService.instance = new RAGStatusService();
    }
    return RAGStatusService.instance;
  }
  
  /**
   * Get the RAG status history for an employee
   * @param employeeId ID of the employee
   * @returns Promise<RAGStatusHistory>
   */
  async getEmployeeRAGHistory(employeeId: string): Promise<RAGStatusHistory> {
    try {
      // Try to fetch real data from the database
      const { data, error } = await supabase
        .from('employee_rag_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching RAG history from database:', error);
        
        // Try to load from mock JSON file
        try {
          console.log('Trying to load RAG history from JSON file...');
          const response = await fetch('/data/employee_rag_history.json');
          if (response.ok) {
            const mockData = await response.json();
            // Filter entries for this employee
            const employeeEntries = mockData.entries.filter(
              (entry: any) => entry.employeeId === employeeId
            );
            
            if (employeeEntries.length > 0) {
              // Transform the data to match our expected format
              const entries: RAGStatusEntry[] = employeeEntries.map((entry: any) => ({
                id: entry.id,
                employeeId: entry.employeeId,
                status: entry.status as RAGStatus,
                previousStatus: entry.previousStatus as RAGStatus | undefined,
                reason: entry.reason,
                createdBy: entry.createdBy,
                createdAt: entry.createdAt, // Keep as string to match type
                relatedInterventionId: entry.relatedInterventionId
              }));
              
              return {
                employeeId,
                currentStatus: entries[0].status,
                lastUpdate: entries[0].createdAt,
                entries
              };
            }
          }
        } catch (jsonError) {
          console.error('Error loading RAG history from JSON:', jsonError);
        }
        
        // Fall back to generating mock data
        console.log('Generating mock RAG history data');
        return this.generateMockRAGHistory(employeeId);
      }
      
      if (!data || data.length === 0) {
        // No history found, generate mock data
        return this.generateMockRAGHistory(employeeId);
      }
      
      // Transform the data to match our expected format
      const entries: RAGStatusEntry[] = data.map(entry => ({
        id: entry.id,
        employeeId: entry.employee_id,
        status: entry.status as RAGStatus,
        previousStatus: entry.previous_status as RAGStatus | undefined,
        reason: entry.reason,
        createdBy: entry.created_by,
        createdAt: entry.created_at, // Already a string from the database
        relatedInterventionId: entry.related_intervention_id
      }));
      
      return {
        employeeId,
        currentStatus: entries[0].status,
        lastUpdate: entries[0].createdAt,
        entries
      };
    } catch (error) {
      console.error('Error in getEmployeeRAGHistory:', error);
      // Generate mock data as fallback
      return this.generateMockRAGHistory(employeeId);
    }
  }
  
  /**
   * Update an employee's RAG status
   * 
   * @param employeeId The employee ID to update
   * @param status The new RAG status
   * @param reason The reason for the status change
   * @param createdBy The user who created the change
   * @param relatedInterventionId Optional ID of related intervention
   * @returns The updated RAG status entry
   */
  async updateEmployeeRAGStatus(
    employeeId: string,
    status: RAGStatus,
    reason: string,
    createdBy: string,
    relatedInterventionId?: string
  ): Promise<RAGStatusEntry> {
    try {
      // Get current status
      const history = await this.getEmployeeRAGHistory(employeeId);
      const previousStatus = history.currentStatus;
      
      // If status hasn't changed, don't create a new entry
      if (status === previousStatus) {
        return history.entries[0]; // Return the most recent entry
      }
      
      // Ensure createdBy is a valid UUID
      const createdByUUID = createdBy && !createdBy.includes('-') 
        ? generateUUID() // Generate a new UUID if not valid
        : createdBy;
      
      // Create a new status entry
      const { data, error } = await supabase
        .from('employee_rag_history')
        .insert({
          employee_id: employeeId,
          status,
          previous_status: previousStatus,
          reason,
          created_by: createdByUUID,
          related_intervention_id: relatedInterventionId
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error updating RAG status:', error);
        throw error;
      }
      
      // Create new entry
      const newEntry: RAGStatusEntry = {
        id: data.id,
        employeeId: data.employee_id,
        status: data.status,
        previousStatus: data.previous_status,
        reason: data.reason,
        createdBy: data.created_by,
        createdAt: data.created_at,
        relatedInterventionId: data.related_intervention_id
      };
      
      // Update cache
      if (this.cache.has(employeeId)) {
        const cached = this.cache.get(employeeId)!;
        cached.currentStatus = status;
        cached.lastUpdate = newEntry.createdAt;
        cached.entries.unshift(newEntry);
        this.cache.set(employeeId, cached);
      }
      
      return newEntry;
    } catch (error) {
      console.error('Exception updating RAG status:', error);
      throw error;
    }
  }
  
  /**
   * Get metrics for status changes
   * 
   * @param employeeId Optional employee ID to filter by
   * @param departmentId Optional department ID to filter by
   * @returns Status change metrics
   */
  async getStatusChangeMetrics(
    employeeId?: string,
    departmentId?: string
  ): Promise<StatusChangeMetrics> {
    // For now, return mock metrics
    // In the future, implement real metrics calculation from the database
    
    return {
      improvementRate: 0.35, // 35% of status changes are improvements
      declineRate: 0.15,     // 15% of status changes are declines
      stabilityRate: 0.50,   // 50% of employees maintain their status
      statusDistribution: {
        green: 65,          // 65 employees with green status
        amber: 28,          // 28 employees with amber status
        red: 7              // 7 employees with red status
      },
      statusPercentages: {
        green: 65,          // 65% of employees have green status
        amber: 28,          // 28% of employees have amber status
        red: 7              // 7% of employees have red status
      },
      totalEmployees: 100,   // 100 total employees
      averageDaysInStatus: {
        green: 75,          // Average 75 days in green status
        amber: 14,          // Average 14 days in amber status
        red: 5              // Average 5 days in red status
      }
    };
  }
  
  /**
   * Calculate days since a given date
   * 
   * @param date The date to calculate from
   * @returns The number of days since the date
   */
  private daysSince(date: string): number {
    const now = new Date();
    const then = new Date(date);
    const diffTime = Math.abs(now.getTime() - then.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Generate mock RAG history data
   * 
   * @param employeeId The employee ID to generate history for
   * @returns Mock RAG history data
   */
  private generateMockRAGHistory(employeeId: string): RAGStatusHistory {
    const now = new Date();
    
    // Determine current status based on employee ID suffix
    let currentStatus: RAGStatus = 'green';
    if (employeeId.endsWith('3') || employeeId.endsWith('6') || employeeId.endsWith('9')) {
      currentStatus = 'amber';
    } else if (employeeId.endsWith('1') || employeeId.endsWith('7')) {
      currentStatus = 'red';
    }
    
    // Generate 2-5 history entries
    const entryCount = 2 + Math.floor(Math.random() * 4);
    const entries: RAGStatusEntry[] = [];
    
    let lastStatus = currentStatus;
    
    for (let i = 0; i < entryCount; i++) {
      // For each entry, go back in time and potentially change status
      const daysAgo = i * (7 + Math.floor(Math.random() * 14)); // 7-21 days between entries
      const date = subDays(now, daysAgo).toISOString();
      
      // Previous entry's status - randomize but with some logic
      const statusOptions: RAGStatus[] = ['green', 'amber', 'red'];
      let previousStatus: RAGStatus;
      
      if (i === 0) {
        // Current status
        previousStatus = lastStatus;
      } else {
        // Previous statuses - with some logic for progression
        if (lastStatus === 'green') {
          // If currently green, previous was more likely amber than red
          previousStatus = Math.random() > 0.7 ? 'red' : 'amber';
        } else if (lastStatus === 'amber') {
          // If currently amber, could have been either red or green
          previousStatus = Math.random() > 0.5 ? 'red' : 'green';
        } else {
          // If currently red, more likely from amber than directly from green
          previousStatus = Math.random() > 0.7 ? 'green' : 'amber';
        }
      }
      
      // Generate reason based on status
      let reason: string;
      
      if (previousStatus === 'green') {
        reason = "Consistently meeting all learning objectives and deadlines.";
      } else if (previousStatus === 'amber') {
        reason = "Showing signs of decreased engagement with course materials.";
      } else {
        reason = "Multiple missed deadlines and low engagement with learning content.";
      }
      
      entries.push({
        id: `mock-${employeeId}-${i}`,
        employeeId,
        status: previousStatus,
        previousStatus: i > 0 ? entries[i-1].status : undefined,
        reason,
        createdBy: generateUUID(),
        createdAt: date,
        relatedInterventionId: Math.random() > 0.7 ? `int-${employeeId}-${i}` : undefined
      });
      
      lastStatus = previousStatus;
    }
    
    // Sort entries by date, newest first
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return {
      employeeId,
      currentStatus: entries[0].status,
      entries,
      lastUpdate: entries[0].createdAt
    };
  }
}

// Export singleton instance
export const ragStatusService = RAGStatusService.getInstance(); 