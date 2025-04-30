import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { BulkGenerationRequest, BulkGenerationResponse } from '../../src/types/bulk-generation';

// Using real values from the codebase
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const GROQ_API_KEY = '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';

// Initialize client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Input validation schema
const requestSchema = z.object({
  groupType: z.enum(['department', 'position']),
  groupId: z.string(),
  title: z.string().min(5),
  description: z.string().optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
  employeeIds: z.array(z.string().uuid()).optional(),
  shouldSendNotifications: z.boolean().optional().default(false),
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const validatedData = requestSchema.parse(req.body);
    
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
    
    // Directly execute SQL to fetch employees
    let employeeQuery = `
      SELECT id, name, email 
      FROM hr_employees 
      WHERE status = 'active'
    `;
    
    if (validatedData.employeeIds && validatedData.employeeIds.length > 0) {
      // If specific employee IDs are provided, use those
      const employeeIds = validatedData.employeeIds.map(id => `'${id}'`).join(',');
      employeeQuery += ` AND id IN (${employeeIds})`;
    } else {
      // Otherwise filter by group
      if (validatedData.groupType === 'department') {
        employeeQuery += ` AND department_id = '${validatedData.groupId}'`;
      } else if (validatedData.groupType === 'position') {
        employeeQuery += ` AND position_id = '${validatedData.groupId}'`;
      }
    }
    
    // Execute SQL directly
    const { data: employees, error: employeeError } = await supabase.rpc('exec_sql', {
      query: employeeQuery
    });
    
    if (employeeError) {
      console.error('Error fetching employees:', employeeError);
      return res.status(500).json({ success: false, error: 'Failed to fetch employees' });
    }
    
    const employeeResults = employees || [];
    
    if (employeeResults.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No employees found for the specified group' 
      });
    }
    
    // Generate a job ID
    const jobId = crypto.randomUUID();
    
    // Create a new bulk generation job with direct SQL
    const insertJobQuery = `
      INSERT INTO ai_bulk_generation_jobs (
        id, 
        group_id, 
        group_type, 
        base_title, 
        status, 
        total_count, 
        completed_count, 
        failed_count, 
        created_by
      ) VALUES (
        '${jobId}',
        '${validatedData.groupId}',
        '${validatedData.groupType}',
        '${validatedData.title.replace(/'/g, "''")}',
        'pending',
        ${employeeResults.length},
        0,
        0,
        '${user.id}'
      ) RETURNING *;
    `;
    
    const { data: jobData, error: jobError } = await supabase.rpc('exec_sql', {
      query: insertJobQuery
    });
    
    if (jobError || !jobData || jobData.length === 0) {
      console.error('Error creating bulk generation job:', jobError);
      return res.status(500).json({ success: false, error: 'Failed to create generation job' });
    }
    
    // Create tasks for each employee using direct SQL
    const taskInsertQueries = employeeResults.map(employee => `
      INSERT INTO ai_bulk_generation_tasks (
        id,
        job_id, 
        employee_id, 
        status
      ) VALUES (
        '${crypto.randomUUID()}',
        '${jobId}',
        '${employee.id}',
        'pending'
      );
    `).join('\n');
    
    const { error: tasksError } = await supabase.rpc('exec_sql', {
      query: taskInsertQueries
    });
    
    if (tasksError) {
      console.error('Error creating bulk generation tasks:', tasksError);
      // Attempt to delete the job if task creation fails
      await supabase.rpc('exec_sql', {
        query: `DELETE FROM ai_bulk_generation_jobs WHERE id = '${jobId}';`
      });
      return res.status(500).json({ success: false, error: 'Failed to create generation tasks' });
    }
    
    // Start processing the job (in a background process)
    // This would typically be handled by a separate worker/function
    // For simplicity, we'll trigger it here but return the response immediately
    
    setTimeout(async () => {
      try {
        await processBulkJob(jobId, validatedData.title, validatedData.description, validatedData.difficultyLevel);
      } catch (error) {
        console.error('Error in background job processing:', error);
      }
    }, 100);
    
    // Return success with job ID
    const response: BulkGenerationResponse = {
      success: true,
      jobId: jobId,
      totalEmployees: employeeResults.length,
      estimatedTimeMinutes: Math.ceil(employeeResults.length * 2.5), // Rough estimate
    };
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error in bulk generation:', error);
    
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

// Background process function to handle bulk generation
async function processBulkJob(jobId: string, baseTitle: string, description?: string, difficultyLevel: string = 'intermediate') {
  try {
    // Update job status to processing using direct SQL
    await supabase.rpc('exec_sql', {
      query: `UPDATE ai_bulk_generation_jobs SET status = 'processing' WHERE id = '${jobId}';`
    });
    
    // Get all tasks for this job using direct SQL
    const { data: tasksData, error: tasksError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT id, employee_id 
        FROM ai_bulk_generation_tasks 
        WHERE job_id = '${jobId}' AND status = 'pending';
      `
    });
    
    if (tasksError || !tasksData) {
      throw new Error(`Failed to fetch tasks: ${tasksError?.message || 'Unknown error'}`);
    }
    
    const tasks = tasksData || [];
    
    // Process each task sequentially to avoid overloading the AI service
    let completedCount = 0;
    let failedCount = 0;
    
    for (const task of tasks) {
      try {
        // Update task status using direct SQL
        await supabase.rpc('exec_sql', {
          query: `UPDATE ai_bulk_generation_tasks SET status = 'processing' WHERE id = '${task.id}';`
        });
        
        // Get employee data for personalization using direct SQL
        const { data: employeeData, error: employeeError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT id, name, email, department_id, position_id 
            FROM hr_employees 
            WHERE id = '${task.employee_id}';
          `
        });
        
        if (employeeError || !employeeData || employeeData.length === 0) {
          throw new Error(`Failed to fetch employee data: ${employeeError?.message || 'Employee not found'}`);
        }
        
        const employee = employeeData[0];
        
        // Get skills data if available using direct SQL
        const { data: skillsData } = await supabase.rpc('exec_sql', {
          query: `
            SELECT skill_name, proficiency_level 
            FROM hr_employee_skills 
            WHERE employee_id = '${employee.id}';
          `
        });
        
        const skills = skillsData || [];
        
        // Create personalized title
        const personalizedTitle = `${baseTitle} for ${employee.name}`;
        const personalizedDesc = description || `Personalized course on ${baseTitle} for ${employee.name}`;
        
        // Call the course generation API with hardcoded real API
        const response = await fetch(`${SUPABASE_URL}/api/courses/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            employeeId: employee.id,
            title: personalizedTitle,
            description: personalizedDesc,
            difficultyLevel,
            skillsToAddress: skills.map(s => s.skill_name) || [],
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Course generation failed: ${response.statusText}`);
        }
        
        const generationResult = await response.json();
        
        if (!generationResult.success) {
          throw new Error(generationResult.error || 'Unknown generation error');
        }
        
        // Create course record for this content using direct SQL
        const courseId = crypto.randomUUID();
        const { data: courseData, error: courseError } = await supabase.rpc('exec_sql', {
          query: `
            INSERT INTO hr_courses (
              id,
              title, 
              description, 
              difficulty_level, 
              status
            ) VALUES (
              '${courseId}',
              '${personalizedTitle.replace(/'/g, "''")}',
              '${personalizedDesc.replace(/'/g, "''")}',
              '${difficultyLevel}',
              'active'
            ) RETURNING *;
          `
        });
        
        if (courseError || !courseData || courseData.length === 0) {
          throw new Error(`Failed to create course: ${courseError?.message || 'Unknown error'}`);
        }
        
        // Create enrollment for the employee using direct SQL
        await supabase.rpc('exec_sql', {
          query: `
            INSERT INTO hr_course_enrollments (
              id,
              employee_id, 
              course_id, 
              status, 
              progress, 
              personalized_content_id
            ) VALUES (
              '${crypto.randomUUID()}',
              '${employee.id}',
              '${courseId}',
              'assigned',
              0,
              '${generationResult.contentId}'
            );
          `
        });
        
        // Update task with success using direct SQL
        await supabase.rpc('exec_sql', {
          query: `
            UPDATE ai_bulk_generation_tasks 
            SET 
              status = 'completed',
              content_id = '${generationResult.contentId}',
              course_id = '${courseId}',
              completed_at = NOW()
            WHERE id = '${task.id}';
          `
        });
        
        completedCount++;
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        
        // Update task with failure using direct SQL
        const errorMessage = error.message ? error.message.replace(/'/g, "''") : 'Unknown error';
        await supabase.rpc('exec_sql', {
          query: `
            UPDATE ai_bulk_generation_tasks 
            SET 
              status = 'failed',
              error_message = '${errorMessage}',
              completed_at = NOW()
            WHERE id = '${task.id}';
          `
        });
        
        failedCount++;
      }
      
      // Update job progress using direct SQL
      await supabase.rpc('exec_sql', {
        query: `
          UPDATE ai_bulk_generation_jobs 
          SET 
            completed_count = ${completedCount},
            failed_count = ${failedCount}
          WHERE id = '${jobId}';
        `
      });
    }
    
    // Finalize job using direct SQL
    await supabase.rpc('exec_sql', {
      query: `
        UPDATE ai_bulk_generation_jobs 
        SET 
          status = 'completed',
          completed_at = NOW()
        WHERE id = '${jobId}';
      `
    });
    
  } catch (error) {
    console.error('Bulk job processing error:', error);
    
    // Update job as failed using direct SQL
    await supabase.rpc('exec_sql', {
      query: `
        UPDATE ai_bulk_generation_jobs 
        SET 
          status = 'failed',
          completed_at = NOW()
        WHERE id = '${jobId}';
      `
    });
  }
} 