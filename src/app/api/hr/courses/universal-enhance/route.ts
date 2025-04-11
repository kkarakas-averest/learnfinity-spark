
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Universal course content enhancement API
 * 
 * This API generates personalized content for a course based on employee's CV data
 * and other profile information, storing it in the appropriate tables.
 */
export async function POST(req: NextRequest) {
  try {
    const { employeeId, courseId, debug = false } = await req.json();
    
    if (!employeeId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required parameters: employeeId and courseId' },
        { status: 400 }
      );
    }

    console.log(`Starting content enhancement for course ${courseId} and employee ${employeeId}`);
    
    // 1. Check if the employee is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('hr_course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('employee_id', employeeId)
      .single();
    
    if (enrollmentError) {
      console.error('Error checking enrollment:', enrollmentError);
      return NextResponse.json(
        { error: 'Employee is not enrolled in this course' },
        { status: 404 }
      );
    }

    // 2. Get the employee data including CV extracted data
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        id, 
        name, 
        email,
        cv_extracted_data,
        hr_departments(id, name),
        hr_positions(id, title)
      `)
      .eq('id', employeeId)
      .single();
    
    if (employeeError || !employee) {
      console.error('Error fetching employee data:', employeeError);
      return NextResponse.json(
        { error: 'Failed to fetch employee data' },
        { status: 500 }
      );
    }
    
    if (!employee.cv_extracted_data) {
      return NextResponse.json(
        { error: 'Employee does not have CV data available for personalization' },
        { status: 400 }
      );
    }

    // 3. Get the course details
    const { data: course, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return NextResponse.json(
        { error: 'Failed to fetch course data' },
        { status: 500 }
      );
    }

    // 4. Generate personalization context from employee data and course
    const personalizationContext = {
      userProfile: {
        name: employee.name,
        role: employee.hr_positions?.title || 'Employee',
        department: employee.hr_departments?.name || 'Unknown Department',
        skills: employee.cv_extracted_data.skills || [],
        experience: employee.cv_extracted_data.experience || []
      },
      employeeContext: {
        hire_date: employee.cv_extracted_data.hire_date || new Date().toISOString(),
        career_history: employee.cv_extracted_data.employment_history || [],
        education: employee.cv_extracted_data.education || []
      },
      courseContext: {
        id: course.id,
        title: course.title,
        description: course.description,
        topics: course.skills || []
      }
    };

    // 5. Generate content (will be replaced with actual Groq API call in the future)
    // For now, create placeholder content for testing
    const contentId = uuidv4();
    const now = new Date().toISOString();
    
    // First create the main content record
    const { data: contentRecord, error: contentError } = await supabase
      .from('ai_course_content')
      .insert({
        id: contentId,
        course_id: courseId,
        created_for_user_id: employeeId,
        personalization_context: personalizationContext,
        version: '1.0',
        is_active: true,
        created_at: now,
        updated_at: now,
        metadata: {
          source: 'universal-enhance-api',
          timestamp: now
        }
      })
      .select('id')
      .single();
    
    if (contentError) {
      console.error('Error creating content record:', contentError);
      return NextResponse.json(
        { error: 'Failed to create personalized content record' },
        { status: 500 }
      );
    }
    
    // Create 3 sample sections
    const sections = [
      {
        title: `${course.title} - Personalized Introduction for ${employee.name}`,
        content: `<p>Welcome to this personalized version of ${course.title}. This content has been tailored specifically for your role as ${employee.hr_positions?.title || 'an employee'} in the ${employee.hr_departments?.name || 'your'} department.</p>
                  <p>Based on your background in ${employee.cv_extracted_data.skills?.join(', ') || 'your field'}, we've customized the material to be most relevant to your career trajectory.</p>`,
        order_index: 0
      },
      {
        title: "Key Concepts Adapted to Your Experience",
        content: `<p>With your experience in ${employee.cv_extracted_data.employment_history?.[0]?.title || 'your previous roles'}, you'll find these concepts particularly relevant:</p>
                  <ul>
                    <li>Advanced application of core principles</li>
                    <li>Integration with your existing knowledge in ${employee.cv_extracted_data.skills?.[0] || 'your field'}</li>
                    <li>Practical examples tailored to ${employee.hr_departments?.name || 'your department'}</li>
                  </ul>`,
        order_index: 1
      },
      {
        title: "Next Steps in Your Learning Journey",
        content: `<p>To make the most of this course:</p>
                  <ul>
                    <li>Focus on the practical applications in ${employee.hr_departments?.name || 'your department'}</li>
                    <li>Connect these concepts with your expertise in ${employee.cv_extracted_data.skills?.[1] || 'your areas of expertise'}</li>
                    <li>Consider how this knowledge enhances your current role as ${employee.hr_positions?.title || 'an employee'}</li>
                  </ul>`,
        order_index: 2
      }
    ];
    
    // Insert the sections
    const { error: sectionError } = await supabase
      .from('ai_course_content_sections')
      .insert(sections.map(section => ({
        content_id: contentId,
        title: section.title,
        content: section.content,
        order_index: section.order_index,
        module_id: uuidv4(),
        section_id: uuidv4()
      })));
    
    if (sectionError) {
      console.error('Error creating content sections:', sectionError);
      return NextResponse.json(
        { error: 'Failed to create personalized content sections' },
        { status: 500 }
      );
    }
    
    // 6. Update the enrollment record to link it to the personalized content
    const { error: updateError } = await supabase
      .from('hr_course_enrollments')
      .update({
        personalized_content_id: contentId,
        personalized_content_generation_status: 'completed',
      })
      .eq('course_id', courseId)
      .eq('employee_id', employeeId);
    
    if (updateError) {
      console.error('Error updating enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update enrollment with personalized content' },
        { status: 500 }
      );
    }

    // 7. Add an activity record
    await supabase
      .from('hr_employee_activities')
      .insert({
        employee_id: employeeId,
        course_id: courseId,
        activity_type: 'content_personalized',
        description: `Personalized content generated for course: ${course.title}`,
        created_at: now,
        metadata: { content_id: contentId }
      });
    
    // 8. Return success response with content information
    return NextResponse.json({
      success: true,
      message: 'Course content personalized successfully',
      contentId: contentId,
      course: {
        id: course.id,
        title: course.title
      },
      debug: debug ? { personalizationContext } : undefined
    });
    
  } catch (error) {
    console.error('Error in universal-enhance API:', error);
    return NextResponse.json(
      { 
        error: 'Server error processing personalization request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
