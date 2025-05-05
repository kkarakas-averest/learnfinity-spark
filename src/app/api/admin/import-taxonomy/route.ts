import { NextRequest, NextResponse } from 'next/server';
import { handleTaxonomyImport } from '@/lib/skills/taxonomy-import';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    // Verify admin role
    const supabase = createAdminClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
      
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin role required' }, { status: 403 });
    }
    
    // Parse request body
    const requestData = await req.json();
    
    if (!requestData.taxonomyData) {
      return NextResponse.json({ error: 'Missing taxonomy data' }, { status: 400 });
    }
    
    // Import taxonomy
    const result = await handleTaxonomyImport(requestData.taxonomyData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in taxonomy import route:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 