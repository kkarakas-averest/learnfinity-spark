/**
 * Assessment Types - TypeScript Type Definitions
 * 
 * This file defines the TypeScript types for assessments, questions, and submissions.
 * These can be used for type safety in the application.
 */

// Enum types
export type AssessmentStatus = 'draft' | 'active' | 'archived';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

// Assessment type
export type Assessment = {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  passingScore: number;
  timeLimitMinutes: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: AssessmentStatus;
};

// Assessment question type
export type AssessmentQuestion = {
  id: string;
  assessmentId: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[]; // For multiple choice questions
  correctAnswer?: string | string[]; // Could be string or array of strings
  points: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

// Assessment submission type
export type AssessmentSubmission = {
  id: string;
  assessmentId: string;
  userId: string; // Employee/learner who submitted
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  passed?: boolean;
  answers?: Record<string, any>; // Store all answers in a structured format
  createdAt: Date;
  updatedAt: Date;
};

// Table names for reference
export const TABLES = {
  ASSESSMENTS: 'assessments',
  ASSESSMENT_QUESTIONS: 'assessment_questions',
  ASSESSMENT_SUBMISSIONS: 'assessment_submissions'
}; 