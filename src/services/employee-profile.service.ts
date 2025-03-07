import { Employee } from '@/types/hr.types';
import { EnhancedEmployeeProfile, LearningPreferences, Skill, CareerGoal, CourseCompletion, LearningActivity, InterventionRecord } from '@/types/employee-profile.types';

/**
 * Employee Profile Service
 * 
 * Handles fetching and updating of enhanced employee profiles
 * This mock implementation will be replaced with actual API calls
 */

// Sample data generator for testing
const generateMockProfile = (employee: Employee): EnhancedEmployeeProfile => {
  // Learning preferences
  const learningPreferences: LearningPreferences = {
    learningStyle: 'visual',
    preferredTimes: ['morning', 'evening'],
    preferredDevice: 'laptop',
    preferredContentFormats: ['video', 'interactive'],
    preferredLanguages: ['English'],
    averageSessionDuration: 45,
    prefersDifficulty: 'moderate',
    prefersCollaboration: true,
    prefersDeadlines: true,
  };
  
  // Skills
  const skills: Skill[] = [
    {
      id: 'skill-1',
      name: 'JavaScript Programming',
      category: 'Technical',
      proficiency: 'intermediate',
      isRequired: true,
      lastAssessed: '2024-02-15',
    },
    {
      id: 'skill-2',
      name: 'Project Management',
      category: 'Soft Skills',
      proficiency: 'advanced',
      isRequired: true,
    },
    {
      id: 'skill-3',
      name: 'Data Analysis',
      category: 'Technical',
      proficiency: 'beginner',
      isRequired: false,
      lastAssessed: '2024-01-20',
    },
  ];
  
  // Career goals
  const careerGoals: CareerGoal[] = [
    {
      id: 'goal-1',
      title: 'Become Team Lead',
      description: 'Develop leadership skills and technical expertise to lead a development team',
      targetDate: '2025-12-31',
      status: 'in_progress',
      requiredSkills: ['skill-1', 'skill-2']
    }
  ];
  
  // Completed courses
  const completedCourses: CourseCompletion[] = [
    {
      courseId: 'course-101',
      courseName: 'JavaScript Fundamentals',
      completionDate: '2023-11-15',
      score: 92,
      feedbackProvided: true,
      certificateUrl: 'https://example.com/cert/js-101',
    },
    {
      courseId: 'course-102',
      courseName: 'Intro to React',
      completionDate: '2024-01-10',
      score: 88,
      feedbackProvided: true,
    },
  ];
  
  // Learning activities
  const learningActivities: LearningActivity[] = [
    {
      id: 'activity-1',
      type: 'course_progress',
      timestamp: '2024-02-28T14:30:00Z',
      details: {
        resourceId: 'course-103',
        resourceName: 'Advanced React Patterns',
        duration: 45,
        progress: 65,
      }
    },
    {
      id: 'activity-2',
      type: 'assessment',
      timestamp: '2024-02-25T10:15:00Z',
      details: {
        resourceId: 'quiz-201',
        resourceName: 'TypeScript Basics Quiz',
        duration: 25,
        score: 78,
      }
    },
  ];
  
  // Interventions
  const interventions: InterventionRecord[] = [
    {
      id: 'int-1',
      date: '2024-01-20',
      type: 'remedial_assignment',
      initiatedBy: 'hr-user-1',
      status: 'completed',
      notes: 'Additional JavaScript practice modules assigned due to lower assessment scores',
      outcome: 'Improved proficiency confirmed in follow-up assessment',
      ragStatusBefore: 'amber',
      ragStatusAfter: 'green',
    }
  ];
  
  return {
    ...employee,
    profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&size=256&background=random`,
    phoneNumber: '+1 555-123-4567',
    startDate: '2023-05-15',
    manager: 'Sarah Johnson',
    bio: 'Enthusiastic learner with a background in web development.',
    
    learningPreferences,
    skills,
    careerGoals,
    completedCourses,
    learningActivities,
    interventions,
    
    contentFeedback: {
      preferredTopics: ['React', 'TypeScript', 'UI Design'],
      dislikedTopics: ['Legacy Systems'],
      averageRating: 4.2,
      feedbackHistory: [
        {
          contentId: 'course-101',
          contentType: 'course',
          rating: 4,
          comments: 'Good introduction but could use more practical examples',
          date: '2023-11-16',
        },
        {
          contentId: 'resource-301',
          contentType: 'article',
          rating: 5,
          comments: 'Excellent explanation of concepts',
          date: '2024-02-10',
        },
      ]
    }
  };
};

// Service functions

/**
 * Get an enhanced profile for a specific employee
 */
export const getEmployeeProfile = async (employeeId: string): Promise<EnhancedEmployeeProfile> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Fetch the basic employee data (mock)
  const basicEmployee: Employee = {
    id: employeeId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    department: 'Engineering',
    position: 'Frontend Developer',
    courses: 5,
    coursesCompleted: 2,
    progress: 40,
    lastActivity: '2024-02-28',
    status: 'active',
    ragStatus: 'amber',
  };
  
  // Generate enhanced profile
  return generateMockProfile(basicEmployee);
};

/**
 * Update an employee profile
 */
export const updateEmployeeProfile = async (
  employeeId: string, 
  profileData: Partial<EnhancedEmployeeProfile>
): Promise<EnhancedEmployeeProfile> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get current profile
  const currentProfile = await getEmployeeProfile(employeeId);
  
  // Merge updates (in a real implementation, this would be sent to the server)
  const updatedProfile = {
    ...currentProfile,
    ...profileData,
  };
  
  console.log('Profile updated:', updatedProfile);
  
  // Return the updated profile
  return updatedProfile;
};

/**
 * Get profiles for all employees
 * Note: In a real implementation, this would support pagination
 */
export const getAllEmployeeProfiles = async (): Promise<EnhancedEmployeeProfile[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Sample employee IDs
  const employeeIds = ['emp-1', 'emp-2', 'emp-3'];
  
  // Fetch profiles for all employees
  const profiles = await Promise.all(
    employeeIds.map(async (id) => {
      const basicEmployee: Employee = {
        id,
        name: `Employee ${id.split('-')[1]}`,
        email: `employee${id.split('-')[1]}@example.com`,
        department: ['Engineering', 'Marketing', 'Sales'][Math.floor(Math.random() * 3)],
        position: ['Developer', 'Designer', 'Manager'][Math.floor(Math.random() * 3)],
        courses: 5,
        coursesCompleted: Math.floor(Math.random() * 6),
        progress: Math.floor(Math.random() * 101),
        lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString().split('T')[0],
        status: 'active',
        ragStatus: ['green', 'amber', 'red'][Math.floor(Math.random() * 3)] as any,
      };
      
      return generateMockProfile(basicEmployee);
    })
  );
  
  return profiles;
}; 