import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

// A more specific version of the regenerate-content API but optimized for
// courses generated from chat interactions

// Response types
type ApiResponse = {
  courseId?: string;
  success?: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase server client for auth
    const supabase = createServerSupabaseClient({ req, res });
    
    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if the user is authenticated
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the request body containing course generation parameters
    const {
      title,
      description,
      learningObjectives,
      targetAudience,
      skillsToAddress,
      difficultyLevel = 'intermediate',
      estimatedDuration = '2 weeks',
      modules = [],
      chatHistory = [],
      employeeId = null
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields: title and description are required'
      });
    }

    // Create a course record
    const { data: course, error: courseError } = await supabase
      .from('hr_courses')
      .insert({
        title,
        description,
        target_audience: targetAudience,
        difficulty_level: difficultyLevel,
        estimated_duration: estimatedDuration,
        is_active: true,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        is_ai_generated: true,
        metadata: {
          generatedFrom: 'chat',
          chatHistoryCount: chatHistory.length || 0,
          employeeId: employeeId
        }
      })
      .select('id')
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      return res.status(500).json({ error: `Failed to create course: ${courseError.message}` });
    }

    const courseId = course.id;

    // Add skills to the course
    if (skillsToAddress && skillsToAddress.length > 0) {
      const { error: skillsError } = await supabase
        .from('hr_course_skills')
        .insert(
          skillsToAddress.map((skill: string) => ({
            course_id: courseId,
            skill_name: skill
          }))
        );

      if (skillsError) {
        console.error('Error adding skills to course:', skillsError);
        // Non-fatal, continue
      }
    }

    // Save chat history related to this course generation
    if (chatHistory && chatHistory.length > 0) {
      const { error: chatError } = await supabase
        .from('chat_course_generations')
        .insert({
          course_id: courseId,
          user_id: session.user.id,
          chat_history: chatHistory,
          created_at: new Date().toISOString()
        });

      if (chatError) {
        console.error('Error saving chat history:', chatError);
        // Non-fatal, continue
      }
    }

    // If we have an employee ID, create an enrollment
    if (employeeId) {
      const { error: enrollmentError } = await supabase
        .from('hr_course_enrollments')
        .insert({
          course_id: courseId,
          employee_id: employeeId,
          enrolled_at: new Date().toISOString(),
          enrolled_by: session.user.id,
          status: 'assigned'
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        // Non-fatal, continue
      }
    }

    // Generate course content using the existing regenerate-content API
    const contentData = {
      title,
      description,
      learningObjectives: Array.isArray(learningObjectives) 
        ? learningObjectives.join('\n') 
        : learningObjectives,
      courseId,
      createSections: true,
      modules: modules && modules.length > 0 
        ? modules 
        : generateDefaultModules(title, skillsToAddress)
    };

    // Call the existing content generation API
    try {
      // Determine the protocol and host
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || 'localhost:3000';
      
      const contentRes = await fetch(`${protocol}://${host}/api/ai/regenerate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass through authentication
          'Cookie': req.headers.cookie || ''
        },
        body: JSON.stringify(contentData),
      });

      if (!contentRes.ok) {
        throw new Error(`Content generation failed: ${contentRes.statusText}`);
      }

      await contentRes.json();
    } catch (contentError: any) {
      console.error('Error generating content:', contentError);
      // Update course with error status but don't fail the whole request
      await supabase
        .from('hr_courses')
        .update({
          content_status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      // We'll still return success since the course was created
      return res.status(200).json({ 
        success: true, 
        courseId,
        error: `Course created but content generation failed: ${contentError.message}`
      });
    }

    // Update course with success status
    await supabase
      .from('hr_courses')
      .update({
        content_status: 'generated',
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId);

    // Return the successful response
    return res.status(200).json({ 
      success: true,
      courseId
    });

  } catch (error: any) {
    console.error('Course generation error:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
}

// Helper to generate default modules if none provided
function generateDefaultModules(
  courseTitle: string, 
  skills: string[] = []
): { title: string; description: string }[] {
  // Create default modules based on course title and skills
  const modules = [
    {
      title: `Introduction to ${courseTitle}`,
      description: `Overview of the course content and learning objectives. Introduction to key concepts.`
    },
    {
      title: `Core Concepts and Fundamentals`,
      description: `Detailed exploration of the foundational concepts and principles.`
    }
  ];

  // Add skill-specific modules if skills are provided
  if (skills.length > 0) {
    // Group similar skills 
    const skillGroups = groupSimilarSkills(skills);

    skillGroups.forEach((group) => {
      modules.push({
        title: `${group.title}`,
        description: `Developing proficiency in ${group.skills.join(', ')}.`
      });
    });
  }

  // Add final modules
  modules.push(
    {
      title: `Practical Applications`,
      description: `Real-world applications and case studies to reinforce learning.`
    },
    {
      title: `Assessment and Next Steps`,
      description: `Review of key concepts, final assessment, and recommendations for further learning.`
    }
  );

  return modules;
}

// Helper to group similar skills together for module creation
function groupSimilarSkills(skills: string[]): { title: string; skills: string[] }[] {
  // If few skills, don't group
  if (skills.length <= 3) {
    return [{
      title: `Mastering Key Skills`,
      skills: [...skills]
    }];
  }
  
  // Simple grouping by taking skills in groups of 2-3
  const groups: { title: string; skills: string[] }[] = [];
  
  for (let i = 0; i < skills.length; i += 3) {
    const groupSkills = skills.slice(i, i + 3);
    // Use the first skill as a basis for the module title
    const mainSkill = groupSkills[0];
    
    groups.push({
      title: `${mainSkill} and Related Skills`,
      skills: groupSkills
    });
  }
  
  return groups;
} 