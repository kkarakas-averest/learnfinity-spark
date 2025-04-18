const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

/**
 * Alternate API endpoint for regenerating course content
 * This serves as a fallback for the main regenerate-content endpoint
 * Accepts both GET and POST requests
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept both GET and POST requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const requestId = uuidv4().slice(0, 8);
  console.log(`[${requestId}] ⚠️ [ALTERNATE-ENDPOINT] Using fallback course regeneration endpoint via ${req.method}`);
  
  try {
    // Get authentication token
    let userId;
    const authHeader = req.headers.authorization || '';
    
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
        console.log(`[${requestId}] ✅ Auth successful for user: ${userId}`);
      } else {
        console.log(`[${requestId}] ❌ Auth header present but invalid`);
      }
    }
    
    // Check query parameters for access token
    if (!userId) {
      const accessToken = req.query.access_token;
      if (accessToken) {
        const { data, error } = await supabase.auth.getUser(accessToken);
        if (!error && data.user) {
          userId = data.user.id;
          console.log(`[${requestId}] ✅ URL token auth successful for user: ${userId}`);
        }
      }
    }
    
    // Check body for access token (last resort) - only for POST
    if (!userId && req.method === 'POST' && req.body) {
      const bodyToken = req.body.access_token;
      if (bodyToken) {
        const { data, error } = await supabase.auth.getUser(bodyToken);
        if (!error && data.user) {
          userId = data.user.id;
          console.log(`[${requestId}] ✅ Body token auth successful for user: ${userId}`);
        }
      }
    }
    
    if (!userId) {
      console.log(`[${requestId}] ❌ Authentication failed`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get parameters from either query (GET) or body (POST)
    let courseId, forceRegenerate = true;
    
    if (req.method === 'GET') {
      courseId = req.query.courseId;
      forceRegenerate = req.query.forceRegenerate !== 'false';
    } else {
      // POST method
      if (req.body) {
        courseId = req.body.courseId;
        forceRegenerate = req.body.forceRegenerate !== false;
      }
    }
    
    if (!courseId) {
      console.log(`[${requestId}] ❌ Missing courseId in request`);
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    console.log(`[${requestId}] 🚀 Starting alternate content regeneration for course: ${courseId}`);
    
    // Get employee ID
    let employeeId = userId; // Default fallback
    let mappingMethod = 'user_id_fallback';
    
    try {
      // Using admin client to bypass RLS
      const client = supabaseAdmin || supabase;
      
      // First approach: Try employee_user_mapping table
      const { data: mappingData, error: mappingError } = await client
        .from('employee_user_mapping')
        .select('employee_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!mappingError && mappingData?.employee_id) {
        employeeId = mappingData.employee_id;
        mappingMethod = 'mapping_table';
        console.log(`[${requestId}] ✅ Found mapping: ${employeeId}`);
      } else {
        // Second approach: Try employees table
        const { data: employeeData, error: employeeError } = await client
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!employeeError && employeeData?.id) {
          employeeId = employeeData.id;
          mappingMethod = 'employees_table';
          console.log(`[${requestId}] ✅ Found employee via direct lookup: ${employeeId}`);
        } else {
          console.log(`[${requestId}] ℹ️ No mapping found, using user ID as fallback: ${userId}`);
        }
      }
    } catch (mappingError) {
      console.error(`[${requestId}] ❌ Error getting employee mapping:`, mappingError);
      // Continue with user ID as fallback
    }
    
    // Create a job record
    const jobId = uuidv4();
    console.log(`[${requestId}] 📝 Creating job with ID: ${jobId} (mapping method: ${mappingMethod})`);
    
    try {
      // Using admin client to bypass RLS
      const client = supabaseAdmin || supabase;
      
      // Insert job record
      const { error: jobError } = await client
        .from('content_generation_jobs')
        .insert({
          id: jobId,
          course_id: courseId,
          employee_id: employeeId,
          status: 'in_progress',
          total_steps: 10,
          current_step: 1,
          progress: 0,
          step_description: 'Initializing content generation process',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            requested_by: userId,
            alternate_endpoint: true,
            request_method: req.method
          }
        });
        
      if (jobError) {
        console.error(`[${requestId}] ❌ Error creating job:`, jobError);
        return res.status(500).json(
          { error: 'Failed to create job', details: jobError.message }
        );
      }
      
      console.log(`[${requestId}] ✅ Successfully created job`);
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Content regeneration job created successfully',
        job_id: jobId,
        employee_id: employeeId
      });
      
    } catch (error) {
      console.error(`[${requestId}] 💥 Unexpected error:`, error);
      return res.status(500).json(
        { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] 💥 Critical error:`, error);
    return res.status(500).json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}; 