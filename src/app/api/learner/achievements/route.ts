import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define validation schema for request
const requestSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid userId format' }),
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().min(0).optional().default(0)
});

// Define interfaces for type safety
interface Course {
  title: string;
}

interface Skill {
  name: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  badge_type: string;
  image_url: string | null;
  awarded_at: string;
  course_id: string | null;
  skill_id: string | null;
  courses: { title: string } | null;
  skills: { name: string } | null;
}

interface Certificate {
  id: string;
  name: string;
  description: string | null;
  certification_name: string | null;
  completion_date: string | null;
  created_at: string;
}

/**
 * GET handler for fetching a learner's achievements
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and validate query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate request parameters
    const validatedData = requestSchema.safeParse({
      userId,
      limit,
      offset
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { userId: validUserId, limit: validLimit, offset: validOffset } = validatedData.data;

    // Fetch certificates (completed learning paths)
    const { data: certificatesData, error: certificatesError } = await supabase
      .from('learning_paths')
      .select(`
        id,
        name,
        description,
        certification_name,
        completion_date,
        created_at
      `)
      .eq('user_id', validUserId)
      .eq('completed', true)
      .order('completion_date', { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (certificatesError) {
      console.error('Error fetching certificates:', certificatesError);
      return NextResponse.json(
        { error: 'Failed to fetch certificates', details: certificatesError.message },
        { status: 500 }
      );
    }

    // Fetch badges (from course completion and skills mastery)
    const { data: badgesData, error: badgesError } = await supabase
      .from('learner_badges')
      .select(`
        id,
        name,
        description,
        badge_type,
        image_url,
        awarded_at,
        course_id,
        skill_id,
        courses (title),
        skills (name)
      `)
      .eq('user_id', validUserId)
      .order('awarded_at', { ascending: false });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return NextResponse.json(
        { error: 'Failed to fetch badges', details: badgesError.message },
        { status: 500 }
      );
    }

    // Transform the certificates data
    const certificates = (certificatesData as Certificate[]).map(cert => ({
      id: cert.id,
      title: cert.certification_name || `${cert.name} Certificate`,
      description: cert.description || `Certification for completing the ${cert.name} learning path`,
      awardedAt: cert.completion_date || cert.created_at,
      type: 'certificate',
      imageUrl: '/images/certificate-default.png' // Default image path
    }));

    // Transform the badges data
    const badges = (badgesData as any[]).map(badge => {
      // Handle nested objects safely
      const courseTitle = badge.courses?.title || undefined;
      const skillName = badge.skills?.name || undefined;
      
      return {
        id: badge.id,
        title: badge.name,
        description: badge.description,
        awardedAt: badge.awarded_at,
        type: badge.badge_type,
        imageUrl: badge.image_url || '/images/badge-default.png',
        courseTitle,
        skillName
      };
    });

    // Calculate summary counts
    const summary = {
      totalCertificates: certificates.length,
      totalBadges: badges.length,
      recentAchievements: [...certificates, ...badges]
        .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
        .slice(0, 5)
    };

    return NextResponse.json({
      certificates,
      badges,
      summary
    });
  } catch (error) {
    console.error('Unexpected error in achievements API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 