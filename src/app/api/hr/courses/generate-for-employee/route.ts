import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generatePersonalizedCourse } from '@/lib/groq';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Request schema validation
const requestSchema = z.object({
  employeeId: z.string().uuid(),
  modules: z.number().int().min(1).max(10).optional(),
  sectionsPerModule: z.number().int().min(1).max(10).optional(),
  includeQuiz: z.boolean().optional()
});

/**
 * API endpoint to generate a personalized course for an employee based on their profile data
 * 
 * Required query parameters:
 * - employeeId: The UUID of the employee to generate the course for
 * 
 * Optional query parameters:
 * - modules: Number of modules to generate (1-10, default: 3)
 * - sectionsPerModule: Number of sections per module (1-10, default: 3)
 * - includeQuiz: Whether to include quiz questions (default: true)
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate the request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      employeeId, 
      modules = 3, 
      sectionsPerModule = 3, 
      includeQuiz = true
    } = validationResult.data;
    
    console.log(`Generating personalized course for employee ${employeeId}...`);
    
    // Get supabase client
    const supabase = getSupabase();
    
    // 1. Fetch employee profile data
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        *,
        hr_departments(id, name),
        hr_positions(id, title)
      `)
      .eq('id', employeeId)
      .single();
      
    if (employeeError || !employee) {
      console.error('Error fetching employee data:', employeeError);
      return NextResponse.json(
        { error: 'Employee not found or error retrieving data' },
        { status: 404 }
      );
    }
    
    // Make sure we have CV extracted data
    if (!employee.cv_extracted_data) {
      console.error('Employee has no CV data extracted');
      return NextResponse.json(
        { error: 'Employee has no CV data available. Please upload and process a CV first.' },
        { status: 400 }
      );
    }
    
    // Extract department and position names
    const departmentName = employee.hr_departments?.name || 'Unknown Department';
    const positionTitle = employee.hr_positions?.title || 'Unknown Position';
    
    console.log(`Employee details: ${employee.name}, ${positionTitle}, ${departmentName}`);
    
    // 2. Generate personalized course using Groq
    try {
      const courseData = await generatePersonalizedCourse(
        employeeId,
        employee.name,
        positionTitle,
        departmentName,
        employee.cv_extracted_data,
        modules,
        sectionsPerModule,
        includeQuiz
      );
      
      // 3. Create the course in the database
      const courseId = `personal-${employeeId.slice(0, 8)}-${Date.now().toString(36)}`;
      
      // Create the course record
      const { data: courseRecord, error: courseError } = await supabase
        .from('hr_courses')
        .insert({
          id: courseId,
          title: courseData.title,
          description: courseData.description,
          department_id: employee.department_id,
          skill_level: 'intermediate',
          duration: modules * sectionsPerModule * 20, // Estimate 20 minutes per section
          status: 'active',
          generated_for_employee: employeeId,
          is_personalized: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (courseError) {
        console.error('Error creating course record:', courseError);
        return NextResponse.json(
          { error: 'Failed to create course record', details: courseError.message },
          { status: 500 }
        );
      }
      
      // 4. Create course content record
      const aiContentId = uuidv4();
      
      const { error: contentError } = await supabase
        .from('course_ai_content')
        .insert({
          id: aiContentId,
          course_id: courseId,
          title: courseData.title,
          description: courseData.description,
          learning_objectives: courseData.learningObjectives || [],
          created_for: employeeId,
          model: 'llama-3.1-70b-versatile'
        });
      
      if (contentError) {
        console.error('Error saving course AI content:', contentError);
        // Continue anyway to save other data
      }
      
      // 5. Create course modules and sections
      for (let i = 0; i < courseData.modules.length; i++) {
        const module = courseData.modules[i];
        
        // Create module record
        const { error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            module_id: `module-${i + 1}`,
            title: module.title,
            description: module.description,
            order_index: i
          });
        
        if (moduleError) {
          console.error(`Error saving module ${i}:`, moduleError);
          // Continue with other modules
        }
        
        // Save sections in course_content_sections
        for (let j = 0; j < module.sections.length; j++) {
          const section = module.sections[j];
          
          const { error: sectionError } = await supabase
            .from('course_content_sections')
            .insert({
              content_id: aiContentId,
              title: section.title,
              module_id: `module-${i + 1}`,
              section_id: `section-${j + 1}`,
              content: section.content,
              order_index: j
            });
          
          if (sectionError) {
            console.error(`Error saving section ${j} for module ${i}:`, sectionError);
            // Continue with other sections
          }
        }
      }
      
      // 6. Save quizzes if present
      if (courseData.quizzes && Array.isArray(courseData.quizzes)) {
        for (let i = 0; i < courseData.quizzes.length; i++) {
          const quiz = courseData.quizzes[i];
          
          const { error: quizError } = await supabase
            .from('course_module_quizzes')
            .insert({
              content_id: aiContentId,
              module_id: `module-${quiz.moduleIndex + 1}`,
              quiz_data: quiz
            });
          
          if (quizError) {
            console.error(`Error saving quiz for module ${quiz.moduleIndex}:`, quizError);
            // Continue with other quizzes
          }
        }
      }
      
      // 7. Enroll the employee in the course
      const { error: enrollError } = await supabase
        .from('hr_course_enrollments')
        .insert({
          employee_id: employeeId,
          course_id: courseId,
          enrollment_date: new Date().toISOString(),
          status: 'enrolled',
          progress: 0
        });
      
      if (enrollError) {
        console.error('Error enrolling employee in course:', enrollError);
        // Continue anyway to return course data
      }
      
      // 8. Return response with course information
      return NextResponse.json({
        success: true,
        message: 'Personalized course generated and employee enrolled successfully',
        courseId,
        title: courseData.title,
        description: courseData.description,
        modules: courseData.modules.length,
        sections: courseData.modules.reduce((total: number, module: any) => total + module.sections.length, 0),
        quizzes: courseData.quizzes?.length || 0
      });
      
    } catch (error: any) {
      console.error('Error in course generation process:', error);
      return NextResponse.json(
        { error: 'Failed to generate course content', details: error.message },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Unexpected error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 