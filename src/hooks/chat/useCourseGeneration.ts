import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

type CourseGenerationParams = {
  title: string;
  description: string;
  learningObjectives: string[];
  targetAudience: string;
  skillsToAddress: string[];
  modules?: {
    title: string;
    description: string;
  }[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: string;
};

type UseCourseGenerationReturn = {
  generateCourse: (params: CourseGenerationParams) => Promise<{ success: boolean; courseId?: string; error?: string }>;
  isGenerating: boolean;
  generatedCourseId: string | null;
  resetState: () => void;
};

export function useCourseGeneration(): UseCourseGenerationReturn {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedCourseId, setGeneratedCourseId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const resetState = () => {
    setGeneratedCourseId(null);
  };

  const generateCourse = async (params: CourseGenerationParams) => {
    setIsGenerating(true);

    try {
      // First create a course record in the database
      const { data: courseData, error: courseError } = await supabase
        .from('hr_courses')
        .insert({
          title: params.title,
          description: params.description,
          target_audience: params.targetAudience,
          difficulty_level: params.difficultyLevel || 'intermediate',
          estimated_duration: params.estimatedDuration || '2 weeks',
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString(),
          is_ai_generated: true
        })
        .select('id')
        .single();

      if (courseError) {
        throw new Error(`Failed to create course: ${courseError.message}`);
      }

      const courseId = courseData.id;

      // Add skills to the course
      if (params.skillsToAddress && params.skillsToAddress.length > 0) {
        const { error: skillsError } = await supabase
          .from('hr_course_skills')
          .insert(
            params.skillsToAddress.map(skill => ({
              course_id: courseId,
              skill_name: skill
            }))
          );

        if (skillsError) {
          console.error('Error adding skills to course:', skillsError);
        }
      }

      // Generate content using our existing API
      const contentResponse = await fetch('/api/ai/regenerate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          learningObjectives: params.learningObjectives.join('\n'),
          courseId: courseId,
          createSections: true,
          modules: params.modules || generateDefaultModules(params.title, params.skillsToAddress)
        }),
      });

      if (!contentResponse.ok) {
        throw new Error(`Content generation failed: ${contentResponse.statusText}`);
      }

      const contentResult = await contentResponse.json();
      
      // Update course with content status
      await supabase
        .from('hr_courses')
        .update({
          content_status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      // Save the generated course ID
      setGeneratedCourseId(courseId);
      
      toast({
        title: "Course generated successfully!",
        description: `"${params.title}" is now ready to be assigned to employees.`,
      });

      return {
        success: true,
        courseId: courseId
      };

    } catch (error: any) {
      console.error('Course generation error:', error);
      
      toast({
        title: "Course generation failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateCourse,
    isGenerating,
    generatedCourseId,
    resetState
  };
}

// Helper to generate default modules if none provided
function generateDefaultModules(courseTitle: string, skills: string[] = []): { title: string; description: string }[] {
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

    skillGroups.forEach((group, index) => {
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
  // For demo, we'll use a simple approach. In production, this could use
  // more sophisticated clustering or categorization.
  
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