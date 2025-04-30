import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { BulkJobStatusRequest, BulkJobStatusResponse } from '../../src/types/bulk-generation';

// Using real values from the codebase
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

// Initialize client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Input validation schema
const requestSchema = z.object({
  jobId: z.string().uuid()
});

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Extract job ID from query parameters
    const validatedData = requestSchema.parse({
      jobId: req.query.jobId
    });
    
    // Extract user information from the authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    // Fetch job details using direct SQL
    const jobQuery = `
      SELECT 
        id, 
        group_id, 
        group_type, 
        base_title, 
        status, 
        total_count, 
        completed_count, 
        failed_count, 
        created_at, 
        completed_at, 
        created_by
      FROM ai_bulk_generation_jobs
      WHERE id = '${validatedData.jobId}'
      AND created_by = '${user.id}';
    `;
    
    const { data: jobData, error: jobError } = await supabase.rpc('exec_sql', {
      query: jobQuery
    });
    
    if (jobError) {
      console.error('Error fetching job details:', jobError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch job details' 
      });
    }
    
    if (!jobData || jobData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found or you do not have permission to view it' 
      });
    }
    
    const job = jobData[0];
    
    // Calculate estimated completion time
    const estimatedTimeMinutes = job.status === 'completed' 
      ? 0 
      : Math.ceil((job.total_count - job.completed_count - job.failed_count) * 2.5);
    
    // Fetch all tasks for this job with employee details
    const { data: tasks, error: tasksError } = await supabase
      .from('bulk_tasks')
      .select(`
        id,
        job_id,
        item_id,
        item_title,
        status,
        message,
        created_at,
        updated_at,
        completed_at,
        assigned_to,
        employees:users!bulk_tasks_assigned_to_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('job_id', validatedData.jobId);

    if (tasksError) {
      return res.status(500).json({
        success: false,
        error: 'Error fetching tasks: ' + tasksError.message
      });
    }

    // Group tasks by status
    const tasksByStatus = tasks.reduce((acc, task) => {
      const taskWithEmployeeInfo = {
        id: task.id,
        job_id: task.job_id,
        item_id: task.item_id,
        item_title: task.item_title,
        status: task.status,
        message: task.message,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
        employee_info: task.assigned_to && task.employees && task.employees.length > 0 ? {
          id: task.employees[0]?.id || '',
          full_name: task.employees[0]?.full_name || '',
          email: task.employees[0]?.email || '',
          avatar_url: task.employees[0]?.avatar_url || ''
        } : undefined
      };

      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(taskWithEmployeeInfo);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Calculate ISO string for estimated completion time
    const estimatedCompletionTime = job.status === 'completed' 
      ? undefined 
      : new Date(Date.now() + estimatedTimeMinutes * 60 * 1000).toISOString();
    
    // Format response
    const response: BulkJobStatusResponse = {
      success: true,
      job: {
        id: job.id,
        group_id: job.group_id,
        group_type: job.group_type,
        base_title: job.base_title,
        status: job.status,
        total_count: job.total_count,
        completed_count: job.completed_count,
        failed_count: job.failed_count,
        created_at: job.created_at,
        completed_at: job.completed_at,
        created_by: job.created_by
      },
      tasks: Object.values(tasksByStatus).flat(),
      progress: (job.completed_count + job.failed_count) / job.total_count * 100,
      estimatedCompletionTime: estimatedCompletionTime
    };
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error fetching bulk job status:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
} 