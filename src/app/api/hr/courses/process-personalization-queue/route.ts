import { NextRequest, NextResponse } from 'next/server';
import { ContentPersonalizationQueueService } from '@/services/content-personalization-queue.service';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to process pending personalization requests in the queue
 * This can be called by a scheduler or manually triggered
 */
export async function POST(req: NextRequest) {
  console.log('Process personalization queue API called');
  
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request parameters
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 5; // Process up to 5 items by default
    
    // Initialize queue processor
    const queueService = ContentPersonalizationQueueService.getInstance();
    
    // Process the queue
    const result = await queueService.processPendingQueue(limit);
    
    // Return results
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error processing personalization queue:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * GET method to check queue status
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Count pending personalization requests
    const { count, error } = await supabase
      .from('hr_course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('personalized_content_generation_status', 'pending');
      
    if (error) {
      throw error;
    }
    
    // Also count generating items
    const { count: generatingCount, error: generatingError } = await supabase
      .from('hr_course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('personalized_content_generation_status', 'generating');
      
    if (generatingError) {
      throw generatingError;
    }
    
    return NextResponse.json({
      success: true,
      pendingCount: count || 0,
      generatingCount: generatingCount || 0
    });
  } catch (error) {
    console.error('Error checking queue status:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 