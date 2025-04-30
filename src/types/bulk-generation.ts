/**
 * Types for bulk course generation
 */

/**
 * Bulk generation job group type
 */
export type BulkGroupType = 'department' | 'position';

/**
 * Bulk generation job status
 */
export type BulkJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Bulk generation task status
 */
export type BulkTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Bulk generation job record
 */
export interface BulkGenerationJob {
  id: string;
  group_id: string;
  group_type: BulkGroupType;
  base_title: string;
  status: BulkJobStatus;
  total_count: number;
  completed_count: number;
  failed_count: number;
  created_at: string;
  completed_at?: string;
  created_by?: string;
}

/**
 * Bulk generation task record
 */
export interface BulkGenerationTask {
  id: string;
  job_id: string;
  employee_id: string;
  status: BulkTaskStatus;
  content_id?: string;
  course_id?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

/**
 * Request for creating a bulk generation job
 */
export interface BulkGenerationRequest {
  groupType: BulkGroupType;
  groupId: string;
  title: string;
  employeeIds?: string[];
  description?: string;
  difficultyLevel?: string;
  shouldSendNotifications?: boolean;
}

/**
 * Response for bulk generation creation
 */
export interface BulkGenerationResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  totalEmployees?: number;
  estimatedTimeMinutes?: number;
}

/**
 * Request for getting bulk job status
 */
export interface BulkJobStatusRequest {
  jobId: string;
}

/**
 * Response for bulk job status
 */
export interface BulkJobStatusResponse {
  success: boolean;
  job?: BulkGenerationJob;
  tasks?: Array<BulkGenerationTask & {
    employee?: {
      id: string;
      name: string;
      email: string;
    }
  }>;
  error?: string;
  progress?: number;
  estimatedCompletionTime?: string;
} 