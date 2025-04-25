import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Environment variables should be set in Vercel dashboard
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Serverless function to fetch employees, bypassing RLS with service role
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Basic security check to ensure this is only called from our app
  const referer = request.headers.referer || '';
  if (!referer.includes('learnfinity-spark.vercel.app') && 
      !referer.includes('localhost') && 
      process.env.NODE_ENV !== 'development') {
    return response.status(403).json({ 
      error: 'Unauthorized access',
      success: false 
    });
  }

  try {
    // Verify service key exists
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
      return response.status(500).json({
        error: 'Server configuration error',
        success: false
      });
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Get company_id from request body or query if available
    const { company_id = null, limit = 20 } = 
      request.body || request.query || {};

    // Build query - optionally filter by company_id if provided
    let query = supabaseAdmin.from('hr_employees').select(`
      *,
      hr_departments (id, name),
      hr_positions (id, title)
    `).limit(limit);

    // Apply company filter if provided
    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    // Execute query
    const { data: employees, error } = await query;

    // Handle query error
    if (error) {
      console.error('Error fetching employees:', error);
      return response.status(500).json({
        error: error.message,
        success: false
      });
    }

    // Transform employee data to match expected format
    const transformedEmployees = employees.map((emp) => ({
      ...emp,
      department: emp.hr_departments?.name || '',
      position: emp.hr_positions?.title || '',
      ragStatus: (emp.rag_status || 'green').toLowerCase(),
      lastActivity: emp.last_activity || 'Never'
    }));

    // Return success response
    return response.status(200).json({
      success: true,
      employees: transformedEmployees
    });
  } catch (error) {
    console.error('Unexpected error in employees API:', error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown server error',
      success: false
    });
  }
} 