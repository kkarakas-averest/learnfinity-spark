import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seeds the HR database with initial data for testing and development
 */
export async function seedHRDatabase() {
  try {
    console.log('Checking if HR database needs seeding...');
    
    // Check if we already have departments
    const { data: existingDepartments } = await supabase
      .from('hr_departments')
      .select('id')
      .limit(1);
      
    if (existingDepartments && existingDepartments.length > 0) {
      console.log('Database already has data, skipping seed');
      return { success: true, seeded: false };
    }
    
    console.log('Seeding HR database with sample data...');
    
    // Seed departments
    const departments = [
      { name: 'Engineering', description: 'Software development and infrastructure' },
      { name: 'Marketing', description: 'Brand management and growth' },
      { name: 'Sales', description: 'Revenue generation and client relationships' },
      { name: 'Human Resources', description: 'Employee management and culture' },
      { name: 'Product', description: 'Product management and design' }
    ];
    
    const { data: deptData, error: deptError } = await supabase
      .from('hr_departments')
      .insert(departments)
      .select();
      
    if (deptError) throw deptError;
    
    // Map departments by name for easier reference
    const deptMap = {};
    deptData.forEach(dept => {
      deptMap[dept.name] = dept.id;
    });
    
    // Seed positions
    const positions = [
      { title: 'Software Engineer', department_id: deptMap['Engineering'] },
      { title: 'Senior Software Engineer', department_id: deptMap['Engineering'] },
      { title: 'Product Manager', department_id: deptMap['Product'] },
      { title: 'Marketing Specialist', department_id: deptMap['Marketing'] },
      { title: 'HR Manager', department_id: deptMap['Human Resources'] },
      { title: 'Sales Representative', department_id: deptMap['Sales'] }
    ];
    
    const { data: posData, error: posError } = await supabase
      .from('hr_positions')
      .insert(positions)
      .select();
      
    if (posError) throw posError;
    
    // Map positions by title for easier reference
    const posMap = {};
    posData.forEach(pos => {
      posMap[pos.title] = pos.id;
    });
    
    // Seed employees
    const employees = [
      {
        name: 'Alex Johnson',
        email: 'alex.j@example.com',
        department_id: deptMap['Engineering'],
        position_id: posMap['Software Engineer'],
        status: 'active',
        hire_date: new Date(2022, 3, 15).toISOString(),
        last_active_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        name: 'Sarah Miller',
        email: 'sarah.m@example.com',
        department_id: deptMap['Product'],
        position_id: posMap['Product Manager'],
        status: 'active',
        hire_date: new Date(2021, 1, 10).toISOString(),
        last_active_at: new Date().toISOString() // Today
      },
      {
        name: 'James Wilson',
        email: 'james.w@example.com',
        department_id: deptMap['Marketing'],
        position_id: posMap['Marketing Specialist'],
        status: 'active',
        hire_date: new Date(2022, 6, 1).toISOString(),
        last_active_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
      },
      {
        name: 'Emma Davis',
        email: 'emma.d@example.com',
        department_id: deptMap['Human Resources'],
        position_id: posMap['HR Manager'],
        status: 'active',
        hire_date: new Date(2020, 9, 5).toISOString(),
        last_active_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        name: 'Michael Brown',
        email: 'michael.b@example.com',
        department_id: deptMap['Engineering'],
        position_id: posMap['Senior Software Engineer'],
        status: 'inactive',
        hire_date: new Date(2021, 5, 20).toISOString(),
        last_active_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks ago
      }
    ];
    
    const { data: empData, error: empError } = await supabase
      .from('hr_employees')
      .insert(employees)
      .select();
      
    if (empError) throw empError;
    
    // Map employees by name for easier reference
    const empMap = {};
    empData.forEach(emp => {
      empMap[emp.name] = emp.id;
    });
    
    // Seed courses
    const courses = [
      {
        title: 'Introduction to Data Science',
        description: 'Learn the fundamentals of data science and analytics',
        department_id: deptMap['Engineering'],
        skill_level: 'beginner',
        duration: 240, // 4 hours
        status: 'active'
      },
      {
        title: 'Leadership Fundamentals',
        description: 'Core leadership skills for new managers',
        department_id: deptMap['Human Resources'],
        skill_level: 'intermediate',
        duration: 180, // 3 hours
        status: 'active'
      },
      {
        title: 'Project Management',
        description: 'Best practices for managing complex projects',
        department_id: deptMap['Product'],
        skill_level: 'intermediate',
        duration: 300, // 5 hours
        status: 'active'
      },
      {
        title: 'Advanced React Development',
        description: 'Deep dive into React and modern frontend patterns',
        department_id: deptMap['Engineering'],
        skill_level: 'advanced',
        duration: 360, // 6 hours
        status: 'active'
      },
      {
        title: 'Digital Marketing Strategy',
        description: 'Comprehensive overview of digital marketing channels',
        department_id: deptMap['Marketing'],
        skill_level: 'intermediate',
        duration: 240, // 4 hours
        status: 'active'
      }
    ];
    
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .insert(courses)
      .select();
      
    if (courseError) throw courseError;
    
    // Map courses by title for easier reference
    const courseMap = {};
    courseData.forEach(course => {
      courseMap[course.title] = course.id;
    });
    
    // Seed course enrollments
    const enrollments = [
      {
        employee_id: empMap['Alex Johnson'],
        course_id: courseMap['Introduction to Data Science'],
        status: 'completed',
        progress: 100,
        enrollment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        completion_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        employee_id: empMap['Alex Johnson'],
        course_id: courseMap['Advanced React Development'],
        status: 'in_progress',
        progress: 60,
        enrollment_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
      },
      {
        employee_id: empMap['Sarah Miller'],
        course_id: courseMap['Project Management'],
        status: 'completed',
        progress: 100,
        enrollment_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        completion_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        employee_id: empMap['James Wilson'],
        course_id: courseMap['Digital Marketing Strategy'],
        status: 'completed',
        progress: 100,
        enrollment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        completion_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        employee_id: empMap['Emma Davis'],
        course_id: courseMap['Leadership Fundamentals'],
        status: 'in_progress',
        progress: 30,
        enrollment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      }
    ];
    
    const { error: enrollError } = await supabase
      .from('hr_course_enrollments')
      .insert(enrollments);
      
    if (enrollError) throw enrollError;
    
    // Seed employee activities
    const activities = [
      {
        employee_id: empMap['Alex Johnson'],
        activity_type: 'enrollment',
        description: 'Enrolled in Introduction to Data Science',
        course_id: courseMap['Introduction to Data Science'],
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
      },
      {
        employee_id: empMap['Alex Johnson'],
        activity_type: 'completion',
        description: 'Completed Introduction to Data Science',
        course_id: courseMap['Introduction to Data Science'],
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        employee_id: empMap['Sarah Miller'],
        activity_type: 'completion',
        description: 'Completed Project Management',
        course_id: courseMap['Project Management'],
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        employee_id: empMap['James Wilson'],
        activity_type: 'feedback',
        description: 'The real-world examples were very helpful.',
        course_id: courseMap['Digital Marketing Strategy'],
        rating: 4.5,
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
      },
      {
        employee_id: empMap['Emma Davis'],
        activity_type: 'enrollment',
        description: 'Enrolled in Leadership Fundamentals',
        course_id: courseMap['Leadership Fundamentals'],
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      },
      {
        employee_id: empMap['Michael Brown'],
        activity_type: 'alert',
        description: 'No activity for 14 days',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      }
    ];
    
    const { error: activityError } = await supabase
      .from('hr_employee_activities')
      .insert(activities);
      
    if (activityError) throw activityError;
    
    console.log('Successfully seeded HR database with sample data');
    return { success: true, seeded: true };
  } catch (error) {
    console.error('Error seeding HR database:', error);
    return { success: false, error };
  }
} 