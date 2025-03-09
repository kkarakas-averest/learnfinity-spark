/**
 * Learner Profile Service
 * Handles operations related to employee learning profiles
 */

import { 
  Employee, 
  LearningPreference, 
  SkillRecord, 
  CareerGoal, 
  LearningMetadata,
  LearningHistoryItem,
  CourseCompletionRecord,
  EmployeeLearningProfile,
  LearningStyle,
} from '../types/employee.types';

// Temporary mock data - in a real implementation, this would connect to a database
const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    userId: 'user-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    title: 'Software Engineer',
    department: 'Engineering',
    profileImageUrl: '/avatars/john-smith.jpg',
    ragStatus: 'green',
    ragStatusLastUpdated: new Date('2025-01-15'),
    hireDate: new Date('2024-06-01'),
    employeeNumber: 'EMP12345',
    isActive: true,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: 'emp-002',
    userId: 'user-002',
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@example.com',
    title: 'HR Specialist',
    department: 'Human Resources',
    profileImageUrl: '/avatars/emily-johnson.jpg',
    ragStatus: 'amber',
    ragStatusLastUpdated: new Date('2025-01-10'),
    hireDate: new Date('2023-11-15'),
    employeeNumber: 'EMP12346',
    isActive: true,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2025-01-10')
  }
];

const mockLearningPreferences: Record<string, LearningPreference> = {
  'emp-001': {
    id: 'pref-001',
    employeeId: 'emp-001',
    primaryStyle: LearningStyle.VISUAL,
    secondaryStyles: [LearningStyle.READING],
    preferredContentFormats: ['video', 'interactive'],
    preferredSessionDuration: 45, // minutes
    preferredLearningTimes: ['morning', 'afternoon'] as any, // Type assertion for mock data
    preferredDevice: 'laptop' as any, // Type assertion for mock data
    selfReported: true,
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-12-01')
  }
};

const mockSkills: Record<string, SkillRecord[]> = {
  'emp-001': [
    {
      id: 'skill-001',
      employeeId: 'emp-001',
      skillName: 'JavaScript',
      proficiencyLevel: 'advanced' as any, // Type assertion for mock data
      proficiencyScore: 0.85,
      verified: true,
      verifiedBy: 'manager-001',
      verifiedAt: new Date('2024-08-15'),
      lastDemonstrated: new Date('2024-12-10'),
      associatedCourses: ['course-001', 'course-002'],
      createdAt: new Date('2024-06-15'),
      updatedAt: new Date('2024-12-10')
    },
    {
      id: 'skill-002',
      employeeId: 'emp-001',
      skillName: 'React',
      proficiencyLevel: 'intermediate' as any, // Type assertion for mock data
      proficiencyScore: 0.65,
      verified: true,
      verifiedBy: 'manager-001',
      verifiedAt: new Date('2024-09-01'),
      lastDemonstrated: new Date('2024-11-20'),
      associatedCourses: ['course-003'],
      createdAt: new Date('2024-07-01'),
      updatedAt: new Date('2024-11-20')
    }
  ]
};

const mockMetadata: Record<string, LearningMetadata> = {
  'emp-001': {
    employeeId: 'emp-001',
    averageSessionDuration: 38, // minutes
    mostActiveTimeOfDay: 'morning' as any, // Type assertion for mock data
    mostUsedDevice: 'laptop' as any, // Type assertion for mock data
    completionRate: 0.78,
    averageQuizScore: 87,
    engagementScore: 8.5,
    lastActive: new Date('2025-01-15')
  }
};

/**
 * Service for managing employee learning profiles
 */
export class LearnerProfileService {
  /**
   * Get an employee by ID
   */
  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    // In a real implementation, this would query the database
    const employee = mockEmployees.find(emp => emp.id === employeeId);
    return employee || null;
  }

  /**
   * Get all employees
   */
  async getAllEmployees(): Promise<Employee[]> {
    // In a real implementation, this would query the database
    return [...mockEmployees];
  }

  /**
   * Get employees filtered by department
   */
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    // In a real implementation, this would query the database
    return mockEmployees.filter(emp => emp.department === department);
  }

  /**
   * Get employees filtered by RAG status
   */
  async getEmployeesByRagStatus(status: 'green' | 'amber' | 'red'): Promise<Employee[]> {
    // In a real implementation, this would query the database
    return mockEmployees.filter(emp => emp.ragStatus === status);
  }

  /**
   * Update an employee's RAG status
   */
  async updateEmployeeRagStatus(
    employeeId: string, 
    status: 'green' | 'amber' | 'red',
    justification?: string
  ): Promise<Employee | null> {
    // In a real implementation, this would update the database
    const employee = mockEmployees.find(emp => emp.id === employeeId);
    
    if (employee) {
      employee.ragStatus = status;
      employee.ragStatusLastUpdated = new Date();
      employee.updatedAt = new Date();
      return employee;
    }
    
    return null;
  }

  /**
   * Get an employee's learning preferences
   */
  async getLearningPreferences(employeeId: string): Promise<LearningPreference | null> {
    // In a real implementation, this would query the database
    return mockLearningPreferences[employeeId] || null;
  }

  /**
   * Update an employee's learning preferences
   */
  async updateLearningPreferences(
    employeeId: string,
    preferences: Partial<LearningPreference>
  ): Promise<LearningPreference | null> {
    // In a real implementation, this would update the database
    let existing = mockLearningPreferences[employeeId];
    
    if (existing) {
      existing = {
        ...existing,
        ...preferences,
        updatedAt: new Date()
      };
      mockLearningPreferences[employeeId] = existing;
      return existing;
    }
    
    // Create new if doesn't exist
    if (!existing && preferences.primaryStyle) {
      const newPrefs: LearningPreference = {
        id: `pref-${Date.now()}`,
        employeeId,
        primaryStyle: preferences.primaryStyle,
        secondaryStyles: preferences.secondaryStyles || [],
        preferredContentFormats: preferences.preferredContentFormats || ['text'],
        preferredSessionDuration: preferences.preferredSessionDuration || 30,
        preferredLearningTimes: preferences.preferredLearningTimes || [],
        preferredDevice: preferences.preferredDevice || 'laptop' as any,
        selfReported: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockLearningPreferences[employeeId] = newPrefs;
      return newPrefs;
    }
    
    return null;
  }

  /**
   * Get an employee's skills
   */
  async getEmployeeSkills(employeeId: string): Promise<SkillRecord[]> {
    // In a real implementation, this would query the database
    return mockSkills[employeeId] || [];
  }

  /**
   * Add a skill to an employee's profile
   */
  async addEmployeeSkill(employeeId: string, skill: Partial<SkillRecord>): Promise<SkillRecord | null> {
    // In a real implementation, this would update the database
    if (!skill.skillName) {
      return null;
    }

    const skills = mockSkills[employeeId] || [];
    
    const newSkill: SkillRecord = {
      id: `skill-${Date.now()}`,
      employeeId,
      skillName: skill.skillName,
      proficiencyLevel: skill.proficiencyLevel || 'beginner' as any,
      proficiencyScore: skill.proficiencyScore || 0.3,
      verified: false,
      associatedCourses: skill.associatedCourses || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    skills.push(newSkill);
    mockSkills[employeeId] = skills;
    
    return newSkill;
  }

  /**
   * Update an employee's skill
   */
  async updateEmployeeSkill(
    employeeId: string,
    skillId: string,
    updates: Partial<SkillRecord>
  ): Promise<SkillRecord | null> {
    // In a real implementation, this would update the database
    const skills = mockSkills[employeeId] || [];
    const skillIndex = skills.findIndex(skill => skill.id === skillId);
    
    if (skillIndex >= 0) {
      skills[skillIndex] = {
        ...skills[skillIndex],
        ...updates,
        updatedAt: new Date()
      };
      mockSkills[employeeId] = skills;
      return skills[skillIndex];
    }
    
    return null;
  }

  /**
   * Get learning metadata for an employee
   */
  async getLearningMetadata(employeeId: string): Promise<LearningMetadata | null> {
    // In a real implementation, this would query the database
    return mockMetadata[employeeId] || null;
  }

  /**
   * Get a comprehensive learning profile for LLM context
   */
  async getLearningProfileForLLM(employeeId: string): Promise<EmployeeLearningProfile | null> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return null;
    
    const preferences = await this.getLearningPreferences(employeeId);
    const skills = await this.getEmployeeSkills(employeeId);
    const metadata = await this.getLearningMetadata(employeeId);
    
    // In a real implementation, you would also fetch learning history, career goals, etc.
    
    return {
      employeeId: employee.id,
      fullName: `${employee.firstName} ${employee.lastName}`,
      title: employee.title,
      department: employee.department || 'Unknown',
      learningPreferences: preferences || {},
      topSkills: skills.slice(0, 5).map(skill => ({
        name: skill.skillName,
        level: skill.proficiencyLevel
      })),
      skillGaps: [], // Would be populated in a real implementation
      careerGoals: [], // Would be populated in a real implementation
      learningHistory: {
        recentCourses: [], // Would be populated in a real implementation
        preferredContentTypes: preferences?.preferredContentFormats || [],
        averageEngagement: metadata?.engagementScore || 0
      },
      currentRagStatus: {
        status: employee.ragStatus,
        since: employee.ragStatusLastUpdated
      }
    };
  }
}

// Export a singleton instance
export const learnerProfileService = new LearnerProfileService(); 