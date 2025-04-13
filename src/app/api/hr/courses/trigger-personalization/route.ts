import { NextRequest, NextResponse } from 'next/server';
import { ContentPersonalizationQueueService } from '@/services/content-personalization-queue.service';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to manually trigger personalization for a specific enrollment
 */
export async function POST(req: NextRequest) {
  console.log('Trigger personalization API called');
  
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse enrollment ID from request
    const body = await req.json();
    const { enrollmentId } = body;
    
    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }
    
    // Initialize queue processor
    const queueService = ContentPersonalizationQueueService.getInstance();
    
    // Trigger personalization
    const result = await queueService.triggerPersonalization(enrollmentId);
    
    // Return result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error triggering personalization:', error);
    return NextResponse.json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 