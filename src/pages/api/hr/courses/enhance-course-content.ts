import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabase } from '@/lib/supabase';
import { enhanceCourseContent } from '@/lib/groq';
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint to enhance an existing course with personalized content for an employee
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      courseId, 
      employeeId, 
      modules = 3, 
      sectionsPerModule = 3, 
      includeQuiz = true
    } = req.body;
    
    if (!courseId || !employeeId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'Both courseId and employeeId are required'
      });
    }
    
    console.log(`Enhancing course ${courseId} for employee ${employeeId}...`);
    
    // Get supabase client
    const supabase = getSupabase();
    
    // 1. Check if employee is enrolled in the course
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', employeeId)
      .single();
      
    if (enrollmentError || !enrollmentData) {
      console.error('Error checking enrollment or employee not enrolled:', enrollmentError);
      return res.status(404).json({ error: 'Employee is not enrolled in this course' });
    }
    
    // 2. Fetch course details
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      console.error('Error fetching course data:', courseError);
      return res.status(404).json({ error: 'Course not found or error retrieving data' });
    }
    
    // 3. Fetch employee profile data
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
      return res.status(404).json({ error: 'Employee not found or error retrieving data' });
    }
    
    // Make sure we have CV extracted data
    if (!employee.cv_extracted_data) {
      console.error('Employee has no CV data extracted');
      return res.status(400).json({ error: 'Employee has no CV data available. Please upload and process a CV first.' });
    }
    
    // Extract department and position names
    const departmentName = employee.hr_departments?.name || 'Unknown Department';
    const positionTitle = employee.hr_positions?.title || 'Unknown Position';
    
    console.log(`Employee details: ${employee.name}, ${positionTitle}, ${departmentName}`);
    
    // 4. Generate personalized course content using Groq
    try {
      const enhancedContent = await enhanceCourseContent(
        courseId,
        courseData.title,
        courseData.description || '',
        employeeId,
        employee.name,
        positionTitle,
        departmentName,
        employee.cv_extracted_data,
        modules,
        sectionsPerModule,
        includeQuiz
      );
      
      // 5. Create a personalized content record
      const aiContentId = uuidv4();
      
      const { error: contentError } = await supabase
        .from('course_ai_content')
        .insert({
          id: aiContentId,
          course_id: courseId,
          title: courseData.title,
          description: enhancedContent.enhancedDescription || courseData.description,
          learning_objectives: enhancedContent.learningObjectives || [],
          created_for: employeeId,
          is_personalized: true,
          model: 'llama-3.1-70b-versatile'
        });
      
      if (contentError) {
        console.error('Error saving course AI content:', contentError);
        return res.status(500).json({ error: 'Failed to save enhanced course content', details: contentError.message });
      }
      
      // 6. Save modules and sections
      for (let i = 0; i < enhancedContent.modules.length; i++) {
        const module = enhancedContent.modules[i];
        
        // Create module record
        const { error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            module_id: `module-${i + 1}-personalized-${employeeId.slice(0, 8)}`,
            title: module.title,
            description: module.description,
            order_index: i,
            is_personalized: true,
            created_for: employeeId
          });
        
        if (moduleError) {
          console.error(`Error saving module ${i}:`, moduleError);
          // Continue with other modules
        }
        
        // Save sections
        for (let j = 0; j < module.sections.length; j++) {
          const section = module.sections[j];
          
          const { error: sectionError } = await supabase
            .from('course_content_sections')
            .insert({
              content_id: aiContentId,
              title: section.title,
              module_id: `module-${i + 1}-personalized-${employeeId.slice(0, 8)}`,
              section_id: `section-${j + 1}`,
              content: section.content,
              order_index: j,
              created_for: employeeId,
              is_personalized: true
            });
          
          if (sectionError) {
            console.error(`Error saving section ${j} for module ${i}:`, sectionError);
            // Continue with other sections
          }
        }
      }
      
      // 7. Save quizzes if present
      if (enhancedContent.quizzes && Array.isArray(enhancedContent.quizzes)) {
        for (let i = 0; i < enhancedContent.quizzes.length; i++) {
          const quiz = enhancedContent.quizzes[i];
          
          const { error: quizError } = await supabase
            .from('course_module_quizzes')
            .insert({
              content_id: aiContentId,
              module_id: `module-${quiz.moduleIndex + 1}-personalized-${employeeId.slice(0, 8)}`,
              quiz_data: quiz,
              is_personalized: true,
              created_for: employeeId
            });
          
          if (quizError) {
            console.error(`Error saving quiz for module ${quiz.moduleIndex}:`, quizError);
            // Continue with other quizzes
          }
        }
      }
      
      // 8. Update the enrollment record to point to the personalized content
      const { error: updateEnrollmentError } = await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_id: aiContentId,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('course_id', courseId);
      
      if (updateEnrollmentError) {
        console.error('Error updating enrollment with personalized content:', updateEnrollmentError);
        // Continue anyway
      }
      
      // 9. Create activity record
      const { error: activityError } = await supabase
        .from('hr_employee_activities')
        .insert({
          employee_id: employeeId,
          activity_type: 'content_personalized',
          description: `Personalized content created for course: ${courseData.title}`,
          course_id: courseId,
          metadata: {
            personalized_content_id: aiContentId,
            modules_count: enhancedContent.modules.length
          },
          created_at: new Date().toISOString()
        });
      
      if (activityError) {
        console.error('Error recording activity:', activityError);
        // Continue anyway
      }
      
      // 10. Return success response
      return res.status(200).json({
        success: true,
        message: 'Course content personalized successfully',
        courseId,
        title: courseData.title,
        contentId: aiContentId,
        modules: enhancedContent.modules.length,
        sections: enhancedContent.modules.reduce((total, module) => total + module.sections.length, 0),
        quizzes: enhancedContent.quizzes?.length || 0
      });
      
    } catch (error: any) {
      console.error('Error in course enhancement process:', error);
      return res.status(500).json({ error: 'Failed to generate enhanced course content', details: error.message });
    }
    
  } catch (error: any) {
    console.error('Unexpected error in API route:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 