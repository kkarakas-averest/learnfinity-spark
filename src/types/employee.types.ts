/**
 * Employee/Learner Data Structures
 * Core types for representing employees and their learning profiles
 */

/**
 * Learning preference styles
 */
export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  READING = 'reading',
  KINESTHETIC = 'kinesthetic'
}

/**
 * Preferred device for learning
 */
export enum LearningDevice {
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  TABLET = 'tablet',
  MOBILE = 'mobile'
}

/**
 * Preferred time of day for learning
 */
export enum LearningTimePreference {
  EARLY_MORNING = 'early_morning', // 5-8AM
  MORNING = 'morning', // 8-11AM
  MIDDAY = 'midday', // 11AM-2PM
  AFTERNOON = 'afternoon', // 2-5PM
  EVENING = 'evening', // 5-8PM
  NIGHT = 'night' // 8-11PM
}

/**
 * Learning preferences for personalizing content delivery
 */
export interface LearningPreference {
  id: string;
  employeeId: string;
  primaryStyle: LearningStyle;
  secondaryStyles: LearningStyle[];
  preferredContentFormats: ('video' | 'text' | 'audio' | 'interactive')[];
  preferredSessionDuration: number; // in minutes
  preferredLearningTimes: LearningTimePreference[];
  preferredDevice: LearningDevice;
  selfReported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Metadata about learning behavior
 */
export interface LearningMetadata {
  employeeId: string;
  averageSessionDuration: number; // in minutes
  mostActiveTimeOfDay: LearningTimePreference;
  mostUsedDevice: LearningDevice;
  completionRate: number; // 0-1 scale
  averageQuizScore: number; // 0-100 scale
  engagementScore: number; // 0-10 scale
  lastActive: Date;
}

/**
 * Skill proficiency levels
 */
export enum ProficiencyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

/**
 * Individual skill record
 */
export interface SkillRecord {
  id: string;
  employeeId: string;
  skillName: string;
  proficiencyLevel: ProficiencyLevel;
  proficiencyScore: number; // 0-1 scale for more granular tracking
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  lastDemonstrated?: Date;
  associatedCourses: string[]; // IDs of courses that teach this skill
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Career goal or aspiration
 */
export interface CareerGoal {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  relatedSkills: string[]; // Skill names
  requiredCourses: string[]; // Course IDs
  progress: number; // 0-1 scale
  status: 'active' | 'completed' | 'deferred';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Core employee data structure
 */
export interface Employee {
  id: string;
  userId: string; // Reference to auth user
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department?: string;
  profileImageUrl?: string;
  ragStatus: 'green' | 'amber' | 'red';
  ragStatusLastUpdated: Date;
  hireDate: Date;
  employeeNumber?: string;
  isActive: boolean;
  skills?: SkillRecord[];
  learningPreferences?: LearningPreference;
  careerGoals?: CareerGoal[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Historical learning activity
 */
export interface LearningHistoryItem {
  id: string;
  employeeId: string;
  activityType: 'course_started' | 'module_completed' | 'assessment_taken' | 'skill_gained' | 'intervention_received';
  relatedItemId: string; // ID of the course, module, assessment, etc.
  relatedItemName: string;
  completionStatus?: 'completed' | 'failed' | 'in_progress';
  score?: number;
  timeSpent: number; // in minutes
  date: Date;
}

/**
 * Course completion record
 */
export interface CourseCompletionRecord {
  id: string;
  employeeId: string;
  courseId: string;
  courseName: string;
  startDate: Date;
  completionDate: Date;
  totalTimeSpent: number; // in minutes
  averageScore: number; // 0-100 scale
  certificateId?: string;
  feedback?: string;
  rating?: number; // 1-5 scale
}

/**
 * Employee learning profile for LLM context
 */
export interface EmployeeLearningProfile {
  employeeId: string;
  fullName: string;
  title: string;
  department: string;
  learningPreferences: Partial<LearningPreference>;
  topSkills: {
    name: string;
    level: ProficiencyLevel;
  }[];
  skillGaps: string[];
  careerGoals: {
    title: string;
    targetDate?: Date;
  }[];
  learningHistory: {
    recentCourses: {
      name: string;
      completionDate: Date;
      score: number;
    }[];
    preferredContentTypes: string[];
    averageEngagement: number;
  };
  currentRagStatus: {
    status: 'green' | 'amber' | 'red';
    since: Date;
    reason?: string;
  };
} 