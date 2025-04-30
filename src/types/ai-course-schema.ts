import { z } from 'zod';
import type { infer as zInfer } from 'zod';

/**
 * Schema for uploaded document metadata
 */
export const uploadSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid().nullable(),
  file_path: z.string(),
  processed: z.boolean().default(false),
  extracted_text: z.string().nullable(),
  file_name: z.string().nullable(),
  file_type: z.string().nullable(),
});

export type Upload = zInfer<typeof uploadSchema>;

/**
 * Schema for employee skill data
 */
export const skillSchema = z.object({
  name: z.string(),
  proficiencyLevel: z.number().min(0).max(5).optional(),
  gapLevel: z.number().min(0).max(5).optional(),
  isMissing: z.boolean().default(false),
});

export type Skill = zInfer<typeof skillSchema>;

/**
 * Schema for course data
 */
export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  estimatedDuration: z.number().optional(),
  difficultyLevel: z.string().optional(),
  status: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
});

export type Course = zInfer<typeof courseSchema>;

/**
 * Schema for quiz questions
 */
export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })),
  explanation: z.string().optional(),
});

export type QuizQuestion = zInfer<typeof quizQuestionSchema>;

/**
 * Schema for course content section
 */
export const contentSectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  orderIndex: z.number().int(),
  caseStudy: z.string().optional(),
  actionableTakeaway: z.string().optional(),
  quiz: z.array(quizQuestionSchema).optional(),
  logicalSectionId: z.string().optional(),
});

export type ContentSection = zInfer<typeof contentSectionSchema>;

/**
 * Schema for AI course content
 */
export const aiCourseContentSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  version: z.string(),
  createdForUserId: z.string().uuid().optional(),
  metadata: z.object({}).passthrough().default({}),
  personalizationContext: z.object({}).passthrough().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  content: z.object({}).passthrough().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  personalizationParams: z.object({}).passthrough().optional(),
  learningObjectives: z.array(z.string()).optional(),
  sections: z.array(contentSectionSchema).optional(),
});

export type AICourseContent = zInfer<typeof aiCourseContentSchema>;

/**
 * Schema for course generation request
 */
export const courseGenerationRequestSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  skillsToAddress: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedDuration: z.number().optional(),
  uploadIds: z.array(z.string().uuid()).optional(),
  personalizationParams: z.object({}).passthrough().optional(),
});

export type CourseGenerationRequest = zInfer<typeof courseGenerationRequestSchema>;

/**
 * Schema for course publication request
 */
export const coursePublicationRequestSchema = z.object({
  contentId: z.string().uuid(),
  employeeIds: z.array(z.string().uuid()),
  sendNotification: z.boolean().default(true),
  assignmentMessage: z.string().optional(),
  dueDate: z.string().optional(),
});

export type CoursePublicationRequest = zInfer<typeof coursePublicationRequestSchema>;

/**
 * Schema for upload command
 */
export const uploadCommandSchema = z.object({
  command: z.literal("/upload"),
  content: z.string().optional(),
});

/**
 * Schema for generate command
 */
export const generateCommandSchema = z.object({
  command: z.literal("/generate"),
  content: z.string(),
});

/**
 * Schema for publish command
 */
export const publishCommandSchema = z.object({
  command: z.literal("/publish"),
  content: z.string(),
});

/**
 * Schema for bulk generation command
 */
export const bulkCommandSchema = z.object({
  command: z.literal("/bulk"),
  content: z.string(),
});

/**
 * Schema for bulk status command
 */
export const bulkStatusCommandSchema = z.object({
  command: z.literal("/bulk-status"),
  content: z.string(),
});

/**
 * Union type for all possible commands
 */
export const courseAICommandSchema = z.discriminatedUnion("command", [
  uploadCommandSchema,
  generateCommandSchema,
  publishCommandSchema,
  bulkCommandSchema,
  bulkStatusCommandSchema,
]);

export type CourseAICommand = zInfer<typeof courseAICommandSchema>; 