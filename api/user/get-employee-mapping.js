const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create admin client with service role key
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

/**
 * Service role endpoint to get employee-user mapping without RLS restrictions
 * GET /api/user/get-employee-mapping
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const requestId = uuidv4().slice(0, 8);
  const userId = req.query.userId;
  
  console.log(`[${requestId}] 🔍 get-employee-mapping: Request for userId ${userId}`);
  
  if (!userId) {
    console.log(`[${requestId}] ❌ get-employee-mapping: Missing userId parameter`);
    return res.status(400).json({ error: 'userId is required' });
  }
  
  // Verify authentication
  const authHeader = req.headers.authorization || '';
  let isAuthenticated = false;
  
  // Check Bearer token in Authorization header
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (data?.user && !error) {
        isAuthenticated = true;
        console.log(`[${requestId}] ✅ get-employee-mapping: Authenticated via Bearer token`);
      }
    } catch (error) {
      console.error(`[${requestId}] ❌ get-employee-mapping: Auth error`, error);
    }
  }
  
  // Try URL access token as fallback
  if (!isAuthenticated) {
    const accessToken = req.query.access_token;
    if (accessToken) {
      try {
        const { data, error } = await supabase.auth.getUser(accessToken);
        if (data?.user && !error) {
          isAuthenticated = true;
          console.log(`[${requestId}] ✅ get-employee-mapping: Authenticated via URL token`);
        }
      } catch (error) {
        console.error(`[${requestId}] ❌ get-employee-mapping: URL token auth error`, error);
      }
    }
  }
  
  // If auth check is enabled but auth failed
  if (!isAuthenticated) {
    console.log(`[${requestId}] ❌ get-employee-mapping: Unauthorized request`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
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
      console.log(`[${requestId}] ✅ get-employee-mapping: Found mapping via employee_user_mapping: ${mappingData.employee_id}`);
      return res.status(200).json({ 
        employeeId: mappingData.employee_id,
        source: 'employee_user_mapping'
      });
    }
    
    // Second approach: Try finding employee with matching user_id
    const { data: employeeData, error: employeeError } = await client
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!employeeError && employeeData?.id) {
      console.log(`[${requestId}] ✅ get-employee-mapping: Found via employees table: ${employeeData.id}`);
      return res.status(200).json({ 
        employeeId: employeeData.id,
        source: 'employees_table' 
      });
    }
    
    // Third approach: Try matching by email address
    if (supabaseAdmin) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
      if (!userError && userData?.user?.email) {
        const userEmail = userData.user.email;
        
        const { data: emailEmployee, error: emailError } = await client
          .from('employees')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (!emailError && emailEmployee?.id) {
          console.log(`[${requestId}] ✅ get-employee-mapping: Found via email match: ${emailEmployee.id}`);
          
          // Also try to save this mapping for future use
          try {
            await client
              .from('employee_user_mapping')
              .upsert({
                user_id: userId,
                employee_id: emailEmployee.id,
                created_at: new Date().toISOString()
              });
            console.log(`[${requestId}] ✅ get-employee-mapping: Created new mapping record`);
          } catch (saveError) {
            console.error(`[${requestId}] ⚠️ get-employee-mapping: Could not save mapping`, saveError);
          }
          
          return res.status(200).json({
            employeeId: emailEmployee.id,
            source: 'email_match'
          });
        }
      }
    }
    
    // No mapping found
    console.log(`[${requestId}] ℹ️ get-employee-mapping: No mapping found for userId ${userId}`);
    return res.status(200).json({
      employeeId: userId, // Default to using the userId as employeeId
      source: 'fallback_userid'
    });
    
  } catch (error) {
    console.error(`[${requestId}] 💥 get-employee-mapping: Unexpected error`, error);
    return res.status(500).json({
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 