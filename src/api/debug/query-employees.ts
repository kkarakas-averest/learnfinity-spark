import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Environment variables should be set in Vercel dashboard
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug endpoint to diagnose authentication and RLS issues
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production' && !process.env.DEBUG_MODE) {
    return response.status(404).json({
      error: 'This endpoint is not available in production',
      success: false
    });
  }

  // Extract data from request
  const { company_id, limit = 10, email } = request.body || request.query || {};
  
  const diagnosticInfo: any = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    serviceKeyAvailable: !!supabaseServiceKey,
    requestInfo: {
      company_id,
      limit,
      email,
      headers: {
        referer: request.headers.referer,
        origin: request.headers.origin,
        userAgent: request.headers['user-agent']
      }
    },
    tests: {}
  };

  try {
    // 1. Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'invalid-key', {
      auth: { persistSession: false }
    });

    // 2. Check for user with the given email in auth.users
    if (email) {
      const { data: userAuthData, error: userAuthError } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .limit(1);

      diagnosticInfo.tests.authUser = {
        success: !userAuthError,
        found: userAuthData && userAuthData.length > 0,
        error: userAuthError?.message
      };

      // 3. Check for matching user_profile
      if (userAuthData && userAuthData.length > 0) {
        const userId = userAuthData[0].id;
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id, email, company_id, role')
          .eq('id', userId)
          .limit(1);

        diagnosticInfo.tests.userProfile = {
          success: !profileError,
          found: userProfile && userProfile.length > 0,
          data: userProfile && userProfile.length > 0 ? userProfile[0] : null,
          error: profileError?.message
        };
      }
    }

    // 4. Check actual RLS policies on hr_employees table
    const { data: rlsPolicies, error: rlsError } = await supabaseAdmin.rpc(
      'get_policies_for_table',
      { table_name: 'hr_employees' }
    );

    diagnosticInfo.tests.rlsPolicies = {
      success: !rlsError,
      policies: rlsPolicies || [],
      error: rlsError?.message
    };

    // 5. Try to fetch employees with service role
    const { data: employeesWithServiceRole, error: serviceRoleError } = await supabaseAdmin
      .from('hr_employees')
      .select(`*, hr_departments (id, name), hr_positions (id, title)`)
      .limit(limit);

    diagnosticInfo.tests.serviceRoleQuery = {
      success: !serviceRoleError,
      count: employeesWithServiceRole?.length || 0,
      error: serviceRoleError?.message
    };

    // 6. Create a temporary client with specified company_id
    if (company_id) {
      diagnosticInfo.tests.companyFilterQuery = {
        success: true,
        count: 0
      };

      try {
        const { data: filteredEmployees, error: filterError } = await supabaseAdmin
          .from('hr_employees')
          .select(`*, hr_departments (id, name), hr_positions (id, title)`)
          .eq('company_id', company_id)
          .limit(limit);

        diagnosticInfo.tests.companyFilterQuery = {
          success: !filterError,
          count: filteredEmployees?.length || 0,
          error: filterError?.message
        };

        // Return these employees for the UI
        const transformedEmployees = (filteredEmployees || []).map((emp) => ({
          ...emp,
          department: emp.hr_departments?.name || '',
          position: emp.hr_positions?.title || '',
          ragStatus: (emp.rag_status || 'green').toLowerCase(),
          lastActivity: emp.last_activity || 'Never'
        }));

        return response.status(200).json({
          success: true,
          diagnosticInfo,
          employees: transformedEmployees
        });
      } catch (error) {
        diagnosticInfo.tests.companyFilterQuery.error = 
          error instanceof Error ? error.message : 'Unknown error';
        diagnosticInfo.tests.companyFilterQuery.success = false;
      }
    }

    // Return diagnostic info if we didn't return filtered employees
    return response.status(200).json({
      success: true,
      diagnosticInfo,
      employees: []
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      diagnosticInfo
    });
  }
} 