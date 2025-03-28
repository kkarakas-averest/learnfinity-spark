import { SupabaseClient } from '@supabase/supabase-js';

// Required dashboard data types
export interface DashboardCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  skills: string[];
  rag_status: string;
  learning_path_id?: string;
  learning_path_name?: string;
  progress: number;
  completed_sections: number;
  total_sections: number;
  duration: string;
  course_type: string;
  hr_training_id?: string;
  hr_training_title?: string;
}

export interface DashboardLearningPath {
  id: string;
  title: string;
  description: string;
  progress: number;
  ragStatus: string;
  courseCount: number;
  completedCourses: number;
  thumbnail_url?: string;
  estimatedCompletionDate?: string | null;
  enrollmentDate?: string | null;
}

export interface DashboardProfile {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  hire_date?: string;
  learning_preferences?: {
    preferred_learning_style: string;
    preferred_content_types: string[];
    learning_goals: string[];
  };
}

export interface DashboardStats {
  coursesCompleted: number;
  learningPathsCompleted: number;
  assignedCourses: number;
  skillsAcquired: number;
}

// Placeholder image URLs for courses with missing thumbnails
const placeholderImages = [
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
  'https://images.unsplash.com/photo-1584277261846-c6a1672ed979?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80'
];

// Default skill categories
const defaultSkills: string[][] = [
  ['Technology', 'Coding', 'Software Development'],
  ['Communication', 'Teamwork', 'Leadership'],
  ['Project Management', 'Organization', 'Time Management'],
  ['Critical Thinking', 'Problem Solving', 'Decision Making']
];

/**
 * Gets a random placeholder image URL
 */
function getRandomPlaceholderImage(): string {
  return placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
}

/**
 * Gets random skills for a course
 */
function getRandomSkills(): string[] {
  const index = Math.floor(Math.random() * defaultSkills.length);
  return defaultSkills[index];
}

// Type for department response from Supabase
interface Department {
  name: string;
}

// Type for position response from Supabase
interface Position {
  title: string;
}

/**
 * Fetches real HR employee data and enhances with required fields
 */
export async function getHybridProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardProfile | null> {
  try {
    // First check if employee exists for this user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    // Try to get HR employee data
    const { data: hrEmployeeData, error: hrError } = await supabase
      .from('hr_employees')
      .select(`
        id, 
        name, 
        email, 
        phone,
        department_id, 
        position_id,
        department:hr_departments(name),
        position:hr_positions(title),
        hire_date,
        status,
        manager_id
      `)
      .eq('email', userData.email)
      .single();
      
    if (hrError && hrError.code !== 'PGRST116') {
      console.error('Error fetching HR employee data:', hrError);
    }

    // Check if we have dashboard preferences
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('learner_dashboard_preferences')
      .select('*')
      .eq('employee_id', hrEmployeeData?.id)
      .single();
      
    if (preferencesError && preferencesError.code !== 'PGRST116') {
      console.error('Error fetching learner preferences:', preferencesError);
    }

    // Create hybrid profile with real data + mock data for missing fields
    return {
      id: hrEmployeeData?.id || userId,
      name: hrEmployeeData?.name || userData?.name || 'Unnamed User',
      email: hrEmployeeData?.email || userData?.email || '',
      department: hrEmployeeData?.department && typeof hrEmployeeData.department === 'object' ? 
        (hrEmployeeData.department as unknown as Department).name : 'General',
      position: hrEmployeeData?.position && typeof hrEmployeeData.position === 'object' ? 
        (hrEmployeeData.position as unknown as Position).title : 'Employee',
      hire_date: hrEmployeeData?.hire_date || null,
      learning_preferences: preferencesData?.preferences || {
        preferred_learning_style: 'visual',
        preferred_content_types: ['video', 'interactive'],
        learning_goals: ['Improve technical skills', 'Develop leadership abilities']
      }
    };
  } catch (error) {
    console.error('Error in getHybridProfile:', error);
    return null;
  }
}

/**
 * Fetches real course enrollments and enhances with required fields
 */
export async function getHybridCourses(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  items: DashboardCourse[];
  total: number;
  featured: DashboardCourse | null;
  inProgress: number;
  completed: number;
  notStarted: number;
  hrAssigned: number;
}> {
  try {
    // First get the HR employee ID if available
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (!userData?.email) {
      throw new Error('User email not found');
    }
    
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select('id')
      .eq('email', userData.email)
      .single();
      
    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('Error fetching HR employee:', employeeError);
    }
    
    const employeeId = employeeData?.id;
    
    // If we have an employee ID, fetch real course enrollments
    const realCourses: DashboardCourse[] = [];
    
    if (employeeId) {
      // Get course enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('hr_course_enrollments')
        .select(`
          id,
          employee_id,
          course_id,
          progress,
          status,
          enrollment_date,
          completion_date,
          course:hr_courses(
            id,
            title,
            description,
            department_id,
            duration,
            skill_level
          )
        `)
        .eq('employee_id', employeeId);
        
      if (enrollmentsError) {
        console.error('Error fetching course enrollments:', enrollmentsError);
      } else if (enrollmentsData) {
        // Transform real course data into required format
        realCourses.push(...enrollmentsData.map(enrollment => {
          const courseData = enrollment.course as any;
          return {
            id: courseData.id,
            title: courseData.title,
            description: courseData.description || 'No description available',
            thumbnail_url: courseData.thumbnail_url || getRandomPlaceholderImage(),
            category: courseData.skill_level || 'General',
            skills: courseData.skills || getRandomSkills(),
            rag_status: enrollment.status === 'completed' ? 'completed' : 
              (enrollment.progress > 0 ? 'in_progress' : 'not_started'),
            learning_path_id: null,
            learning_path_name: null,
            progress: enrollment.progress || 0,
            completed_sections: Math.floor((enrollment.progress || 0) / 20), // Estimate 5 sections
            total_sections: 5, // Default
            duration: courseData.duration ? `${courseData.duration} minutes` : '2 hours',
            course_type: 'hr_assigned',
            hr_training_id: courseData.id,
            hr_training_title: courseData.title
          };
        }));
      }
    }
    
    // Get user activities to create a more accurate history
    const activities: any[] = [];
    if (employeeId) {
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('hr_employee_activities')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!activitiesError && activitiesData) {
        activities.push(...activitiesData);
      }
    }
    
    // Calculate stats from real data
    const inProgress = realCourses.filter(c => c.rag_status === 'in_progress').length;
    const completed = realCourses.filter(c => c.rag_status === 'completed').length;
    const notStarted = realCourses.filter(c => c.rag_status === 'not_started').length;
    
    // Get featured course - most recently active or first available
    const featuredCourse = realCourses.length > 0 
      ? realCourses.find(c => c.rag_status === 'in_progress') || realCourses[0]
      : null;
      
    return {
      items: realCourses,
      total: realCourses.length,
      featured: featuredCourse,
      inProgress,
      completed,
      notStarted,
      hrAssigned: realCourses.length
    };
  } catch (error) {
    console.error('Error in getHybridCourses:', error);
    return {
      items: [],
      total: 0,
      featured: null,
      inProgress: 0,
      completed: 0,
      notStarted: 0,
      hrAssigned: 0
    };
  }
}

/**
 * Fetches real learning paths and enhances with required fields
 */
export async function getHybridLearningPaths(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardLearningPath[]> {
  try {
    // First get the HR employee ID if available
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (!userData?.email) {
      throw new Error('User email not found');
    }
    
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select('id')
      .eq('email', userData.email)
      .single();
      
    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('Error fetching HR employee:', employeeError);
    }
    
    const employeeId = employeeData?.id;
    
    // If we have an employee ID, fetch real learning path enrollments
    const realLearningPaths: DashboardLearningPath[] = [];
    
    if (employeeId) {
      // Check if learning path enrollments exist
      const { data: pathsData, error: pathsError } = await supabase
        .from('hr_learning_path_enrollments')
        .select(`
          id,
          employee_id,
          learning_path_id,
          progress,
          status,
          completed_courses,
          enrollment_date,
          completion_date,
          estimated_completion_date,
          learning_path:hr_learning_paths(
            id,
            title,
            description,
            skill_level
          )
        `)
        .eq('employee_id', employeeId);
        
      if (pathsError) {
        // Check if the error is related to the estimated_completion_date column
        if (pathsError.message.includes('estimated_completion_date')) {
          console.log('Column estimated_completion_date not found, trying without it...');
          
          // Try again without the estimated_completion_date field
          const { data: pathsDataNoEst, error: pathsErrorNoEst } = await supabase
            .from('hr_learning_path_enrollments')
            .select(`
              id,
              employee_id,
              learning_path_id,
              progress,
              status,
              completed_courses,
              enrollment_date,
              completion_date,
              learning_path:hr_learning_paths(
                id,
                title,
                description,
                skill_level
              )
            `)
            .eq('employee_id', employeeId);
            
          if (pathsErrorNoEst) {
            console.error('Error fetching learning path enrollments (no est date):', pathsErrorNoEst);
          } else if (pathsDataNoEst && pathsDataNoEst.length > 0) {
            // Transform real learning path data
            realLearningPaths.push(...pathsDataNoEst.map(enrollment => {
              const pathData = enrollment.learning_path as any;
              return {
                id: pathData.id,
                title: pathData.title,
                description: pathData.description || 'No description available',
                progress: enrollment.progress || 0,
                ragStatus: enrollment.status === 'completed' ? 'green' : 
                  (enrollment.progress > 0 ? 'amber' : 'red'),
                courseCount: 3, // Default, we would need to count from hr_learning_path_courses
                completedCourses: enrollment.completed_courses || 0,
                thumbnail_url: getRandomPlaceholderImage(),
                estimatedCompletionDate: null, // Field is missing in DB
                enrollmentDate: enrollment.enrollment_date
              };
            }));
          }
        } else {
          console.error('Error fetching learning path enrollments:', pathsError);
        }
      } else if (pathsData && pathsData.length > 0) {
        // Transform real learning path data
        realLearningPaths.push(...pathsData.map(enrollment => {
          const pathData = enrollment.learning_path as any;
          return {
            id: pathData.id,
            title: pathData.title,
            description: pathData.description || 'No description available',
            progress: enrollment.progress || 0,
            ragStatus: enrollment.status === 'completed' ? 'green' : 
              (enrollment.progress > 0 ? 'amber' : 'red'),
            courseCount: 3, // Default, we would need to count from hr_learning_path_courses
            completedCourses: enrollment.completed_courses || 0,
            thumbnail_url: getRandomPlaceholderImage(),
            estimatedCompletionDate: enrollment.estimated_completion_date,
            enrollmentDate: enrollment.enrollment_date
          };
        }));
      }
    }
    
    // Use real learning paths if available, otherwise provide an empty array
    // Note: We're not generating mock learning paths if none exist
    return realLearningPaths;
  } catch (error) {
    console.error('Error in getHybridLearningPaths:', error);
    return [];
  }
}

/**
 * Computes dashboard stats based on real data with fallbacks
 */
export async function getHybridStats(
  supabase: SupabaseClient,
  userId: string,
  courses: { completed: number, total: number },
  learningPaths: DashboardLearningPath[]
): Promise<DashboardStats> {
  try {
    // First get the HR employee ID if available
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (!userData?.email) {
      throw new Error('User email not found');
    }
    
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select('id')
      .eq('email', userData.email)
      .single();
      
    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('Error fetching HR employee:', employeeError);
    }
    
    const employeeId = employeeData?.id;
    
    // If we have an employee ID, try to get learner statistics
    let realStats: Partial<DashboardStats> = {};
    
    if (employeeId) {
      // Check if we have learner statistics
      const { data: statsData, error: statsError } = await supabase
        .from('learner_statistics')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
        
      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching learner statistics:', statsError);
      } else if (statsData) {
        realStats = {
          coursesCompleted: statsData.courses_completed,
          learningPathsCompleted: statsData.learning_paths_completed,
          assignedCourses: statsData.assigned_courses,
          skillsAcquired: statsData.skills_acquired
        };
      }
      
      // Check learner achievements for skills acquired
      const { data: skillsData, error: skillsError } = await supabase
        .from('learner_achievements')
        .select('skill')
        .eq('employee_id', employeeId)
        .eq('achievement_type', 'skill_acquired');
        
      if (!skillsError && skillsData) {
        realStats.skillsAcquired = skillsData.length;
      }
    }
    
    // Compute stats from real data with fallbacks to calculations from the courses/paths we have
    return {
      coursesCompleted: realStats.coursesCompleted ?? courses.completed,
      learningPathsCompleted: realStats.learningPathsCompleted ?? 
        learningPaths.filter(p => p.progress === 100).length,
      assignedCourses: realStats.assignedCourses ?? courses.total,
      skillsAcquired: realStats.skillsAcquired ?? Math.max(2, courses.completed * 2)
    };
  } catch (error) {
    console.error('Error in getHybridStats:', error);
    // Default stats if we can't calculate real ones
    return {
      coursesCompleted: courses.completed,
      learningPathsCompleted: 0,
      assignedCourses: courses.total,
      skillsAcquired: Math.max(2, courses.completed * 2)
    };
  }
} 