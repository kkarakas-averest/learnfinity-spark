import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service role endpoint to get employee-user mapping without RLS restrictions
 * GET /api/user/get-employee-mapping
 */
export async function GET(req: NextRequest) {
  const requestId = uuidv4().slice(0, 8);
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  
  console.log(`[${requestId}] 🔍 get-employee-mapping: Request for userId ${userId}`);
  
  if (!userId) {
    console.log(`[${requestId}] ❌ get-employee-mapping: Missing userId parameter`);
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  
  // Verify authentication
  const authHeader = req.headers.get('authorization') || '';
  let isAuthenticated = false;
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (data?.user && !error) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.error(`[${requestId}] ❌ get-employee-mapping: Auth error`, error);
    }
  }
  
  if (!isAuthenticated) {
    console.log(`[${requestId}] ❌ get-employee-mapping: Unauthorized request`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ 
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
      return NextResponse.json({ 
        employeeId: employeeData.id,
        source: 'employees_table' 
      });
    }
    
    // Third approach: Try matching by email address
    const { data: userData, error: userError } = await client
      .auth.admin.getUserById(userId);
      
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
        
        return NextResponse.json({
          employeeId: emailEmployee.id,
          source: 'email_match'
        });
      }
    }
    
    // No mapping found
    console.log(`[${requestId}] ℹ️ get-employee-mapping: No mapping found for userId ${userId}`);
    return NextResponse.json({
      employeeId: userId, // Default to using the userId as employeeId
      source: 'fallback_userid'
    });
    
  } catch (error) {
    console.error(`[${requestId}] 💥 get-employee-mapping: Unexpected error`, error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 