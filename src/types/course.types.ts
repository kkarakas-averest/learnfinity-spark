/**
 * Course Content Data Structures
 * Types for representing courses, modules, sections, and related content
 */

/**
 * Available types of learning content
 */
export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  AUDIO = 'audio',
  INTERACTIVE = 'interactive',
  QUIZ = 'quiz',
  ASSESSMENT = 'assessment',
  DISCUSSION = 'discussion',
  EXERCISE = 'exercise',
  PROJECT = 'project'
}

/**
 * Difficulty levels for content
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

/**
 * Metadata about content
 */
export interface ContentMetadata {
  id: string;
  contentId: string;
  difficultyLevel: DifficultyLevel;
  estimatedDuration: number; // in minutes
  keywords: string[];
  skills: string[]; // skill names covered
  prerequisites?: string[]; // content IDs
  lastUpdated: Date;
  version: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Section of content within a module
 */
export interface Section {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  contentType: ContentType;
  content: string; // Could be text content, URL to video, etc.
  order: number;
  isOptional: boolean;
  estimatedDuration: number; // in minutes
  metadata?: ContentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Learning module within a course
 */
export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  sections: Section[];
  isLocked: boolean;
  prerequisiteModuleIds?: string[];
  unlockCriteria?: {
    previousModuleCompletion: boolean;
    specificAssessmentPassed?: string;
    timeDelay?: number; // in days
  };
  metadata?: ContentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Course structure containing modules and overall info
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  bannerImage?: string;
  modules: Module[];
  skillsGained: string[];
  level: DifficultyLevel;
  category: string;
  tags: string[];
  estimatedDuration: number; // in minutes
  isPublished: boolean;
  authorId: string;
  reviewedBy?: string;
  approvedBy?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content variant for adaptive learning
 */
export interface ContentVariant {
  id: string;
  originalContentId: string;
  targetLearningStyle: string; // e.g. 'visual', 'auditory', etc.
  contentType: ContentType;
  content: string;
  difficultyLevel: DifficultyLevel;
  estimatedDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Relationship between prerequisites
 */
export interface PrerequisiteRelationship {
  id: string;
  sourceId: string; // ID of requiring content
  sourceType: 'course' | 'module' | 'section';
  targetId: string; // ID of required content
  targetType: 'course' | 'module' | 'section' | 'skill';
  isRequired: boolean; // false if recommended only
  rationale: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Summary metrics for a course
 */
export interface CourseMetrics {
  courseId: string;
  enrolledCount: number;
  completionRate: number; // 0-1 scale
  averageRating: number; // 1-5 scale
  reviewCount: number;
  averageTimeToComplete: number; // in days
  topFeedbackKeywords: string[];
  completionsByDepartment: Record<string, number>;
  averageQuizScores: Record<string, number>; // moduleId -> average score
  mostChallenging: {
    moduleId: string;
    moduleName: string;
    failRate: number; // 0-1 scale
  };
  droppedOffAt: Record<string, number>; // moduleId -> count of users who dropped off
}

/**
 * Course template for quick course creation
 */
export interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    moduleCount: number;
    moduleTitles: string[];
    defaultSections: {
      moduleIndex: number;
      sectionTypes: ContentType[];
    }[];
  };
  defaultDuration: number; // in minutes
  targetSkillLevel: DifficultyLevel;
  targetAudience: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
} 