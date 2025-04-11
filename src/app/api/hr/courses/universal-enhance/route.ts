
import { NextResponse, NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Debug flag for verbose logging
const DEBUG = true;

/**
 * API endpoint for universal course content enhancement
 * 
 * This endpoint can handle generating personalized content from scratch
 * or updating existing content for a specific employee.
 */
export async function POST(req: NextRequest) {
  const debugLog = (...args: any[]) => {
    if (DEBUG) console.log('[universal-enhance]', ...args);
  };
  
  try {
    // Get request body
    const body = await req.json();
    const { employeeId, courseId, debug = false } = body;
    
    if (debug) {
      debugLog('Request body:', body);
    }
    
    if (!employeeId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required parameters', details: 'Both employeeId and courseId are required' },
        { status: 400 }
      );
    }
    
    debugLog(`Processing enhancement for course ${courseId} and employee ${employeeId}`);
    
    // Get supabase client
    const supabase = getSupabase();
    
    // 1. Check if employee exists and has CV data
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        id,
        name,
        email,
        cv_extracted_data,
        user_id,
        department_id,
        position_id,
        hr_departments(id, name),
        hr_positions(id, title)
      `)
      .eq('id', employeeId)
      .single();
      
    if (employeeError || !employeeData) {
      debugLog('Error fetching employee data:', employeeError);
      return NextResponse.json(
        { error: 'Employee not found', details: employeeError?.message },
        { status: 404 }
      );
    }
    
    // Check for CV data
    if (!employeeData.cv_extracted_data) {
      debugLog('No CV data found for employee');
      return NextResponse.json(
        { error: 'No CV data available', details: 'Employee does not have extracted CV data' },
        { status: 400 }
      );
    }
    
    debugLog('Found employee with CV data:', { 
      name: employeeData.name,
      department: employeeData.hr_departments?.name,
      position: employeeData.hr_positions?.title
    });
    
    // 2. Get the course data
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError) {
      debugLog('Error fetching course from hr_courses, trying courses table');
      // Try regular courses table
      const { data: regularCourseData, error: regularCourseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
      if (regularCourseError || !regularCourseData) {
        debugLog('Error fetching course from both tables:', regularCourseError);
        return NextResponse.json(
          { error: 'Course not found', details: regularCourseError?.message },
          { status: 404 }
        );
      }
      
      // Use regular course data
      debugLog('Found course in courses table:', regularCourseData.title);
    } else {
      debugLog('Found course in hr_courses table:', courseData.title);
    }
    
    // 3. Check enrollment
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('hr_course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('employee_id', employeeId)
      .single();
      
    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      debugLog('Error checking enrollment:', enrollmentError);
      // Non-critical error, continue anyway
    }
    
    // 4. Extract CV data
    const cvData = employeeData.cv_extracted_data;
    let cvSummary = '';
    
    if (typeof cvData === 'object') {
      if (cvData.summary) {
        cvSummary = cvData.summary;
      } else if (cvData.skills || cvData.experience) {
        // Construct summary from available fields
        const parts = [];
        if (cvData.skills) parts.push(`Skills: ${Array.isArray(cvData.skills) ? cvData.skills.join(', ') : cvData.skills}`);
        if (cvData.experience) parts.push(`Experience: ${cvData.experience}`);
        if (cvData.education) parts.push(`Education: ${cvData.education}`);
        cvSummary = parts.join('\n\n');
      }
    } else {
      cvSummary = String(cvData);
    }
    
    if (!cvSummary) {
      debugLog('CV data exists but no useful summary could be extracted');
      return NextResponse.json(
        { error: 'Invalid CV data', details: 'Could not extract useful information from CV' },
        { status: 400 }
      );
    }
    
    debugLog('Extracted CV summary, length:', cvSummary.length);
    
    // 5. Create personalization context
    const personalizationContext = {
      userProfile: {
        role: employeeData.hr_positions?.title || 'Employee',
        department: employeeData.hr_departments?.name,
        skills: cvData.skills || [],
      },
      courseContext: {
        title: courseData.title,
        level: courseData.difficulty_level || courseData.skill_level || 'intermediate',
        learningObjectives: courseData.learning_objectives || [],
      },
      employeeContext: {
        hire_date: employeeData.hire_date,
        department: employeeData.hr_departments?.name,
        position: employeeData.hr_positions?.title,
        cvSummary: cvSummary.substring(0, 1000) // Limit length
      },
    };
    
    debugLog('Created personalization context');
    
    // 6. Create or update the AI course content record
    const contentId = uuidv4();
    
    // Mark old content as inactive if any exists
    if (employeeData.user_id) {
      debugLog('Deactivating any existing content before creating new');
      await supabase
        .from('ai_course_content')
        .update({ is_active: false })
        .eq('course_id', courseId)
        .eq('created_for_user_id', employeeData.user_id);
    }
    
    // Create new content record
    const { data: aiContentData, error: aiContentError } = await supabase
      .from('ai_course_content')
      .insert({
        id: contentId,
        course_id: courseId,
        version: 'v1',
        created_for_user_id: employeeData.user_id,
        metadata: {
          employeeId,
          generatedAt: new Date().toISOString()
        },
        personalization_context: personalizationContext,
        is_active: true
      })
      .select()
      .single();
      
    if (aiContentError) {
      debugLog('Error creating AI content record:', aiContentError);
      return NextResponse.json(
        { error: 'Failed to create content record', details: aiContentError.message },
        { status: 500 }
      );
    }
    
    debugLog('Created AI course content record:', contentId);
    
    // 7. Create example content sections based on CV
    // In a production app, you would use the Groq API here to generate real personalized content
    // For this demo, we'll create some placeholder content
    const sections = [
      {
        title: "Introduction",
        content: `
          <h2>Personalized Introduction</h2>
          <p>Welcome to this personalized course content! This material has been specifically tailored for someone in your role as ${employeeData.hr_positions?.title || 'an employee'} in the ${employeeData.hr_departments?.name || 'organization'}.</p>
          
          <h3>Your Background</h3>
          <p>Based on your CV, we can see you have experience in the following areas:</p>
          <div class="bg-gray-50 p-4 rounded-md my-4">
            <pre>${cvSummary.substring(0, 500)}...</pre>
          </div>
          
          <p>The following sections will build upon this foundation.</p>
        `,
        order_index: 0
      },
      {
        title: "Key Concepts Tailored to Your Role",
        content: `
          <h2>Role-Specific Content</h2>
          <p>This section addresses how ${courseData.title} applies specifically to your role as ${employeeData.hr_positions?.title || 'an employee'}.</p>
          
          <h3>Application in Your Department</h3>
          <p>Working in ${employeeData.hr_departments?.name || 'your department'} gives you a unique perspective on these concepts. Here's how you can apply them:</p>
          <ul>
            <li>Integrate these principles with your existing knowledge in ${cvData.skills ? (Array.isArray(cvData.skills) ? cvData.skills[0] : cvData.skills) : 'your field'}</li>
            <li>Use your background to enhance implementation</li>
            <li>Connect these concepts to your previous work experience</li>
          </ul>
        `,
        order_index: 1
      },
      {
        title: "Practical Applications",
        content: `
          <h2>Practical Applications</h2>
          <p>Let's explore how you can apply these concepts in your day-to-day work:</p>
          
          <div class="bg-blue-50 p-4 rounded-md my-4">
            <h4 class="text-blue-800">Case Study: Application in ${employeeData.hr_departments?.name || 'Your Department'}</h4>
            <p>Consider how these principles would apply to a typical project in your role. With your background in 
            ${cvData.skills ? (Array.isArray(cvData.skills) ? cvData.skills.slice(0, 3).join(', ') : cvData.skills) : 'your areas of expertise'}, 
            you're uniquely positioned to implement these concepts effectively.</p>
          </div>
          
          <h3>Next Steps</h3>
          <p>To further develop these skills:</p>
          <ol>
            <li>Apply the concepts to your current projects</li>
            <li>Share insights with colleagues</li>
            <li>Track implementation results</li>
          </ol>
        `,
        order_index: 2
      }
    ];
    
    // 8. Insert content sections
    for (const section of sections) {
      const { error: sectionError } = await supabase
        .from('ai_course_content_sections')
        .insert({
          content_id: contentId,
          title: section.title,
          content: section.content,
          order_index: section.order_index,
          module_id: `module-${section.order_index + 1}`,
          section_id: uuidv4()
        });
        
      if (sectionError) {
        debugLog(`Error creating section "${section.title}":`, sectionError);
        // Continue with other sections
      }
    }
    
    debugLog(`Created ${sections.length} content sections`);
    
    // 9. Update enrollment record if it exists
    if (enrollmentData) {
      const { error: updateEnrollmentError } = await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_id: contentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentData.id);
        
      if (updateEnrollmentError) {
        debugLog('Error updating enrollment:', updateEnrollmentError);
        // Non-critical error, continue
      } else {
        debugLog('Updated enrollment record with content ID');
      }
    }
    
    // 10. Create activity record
    const { error: activityError } = await supabase
      .from('hr_employee_activities')
      .insert({
        employee_id: employeeId,
        activity_type: 'content_personalized',
        description: `Personalized content created for course: ${courseData.title}`,
        course_id: courseId,
        metadata: {
          personalized_content_id: contentId
        },
        created_at: new Date().toISOString()
      });
    
    if (activityError) {
      debugLog('Error recording activity:', activityError);
      // Non-critical error, continue
    }
    
    // 11. Return success response
    return NextResponse.json({
      success: true,
      message: 'Course content personalized successfully',
      contentId,
      course: {
        id: courseId,
        title: courseData.title,
      },
      sections: sections.length
    });
    
  } catch (error: any) {
    console.error('Error in universal-enhance API:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
