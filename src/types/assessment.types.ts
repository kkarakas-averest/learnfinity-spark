/**
 * Assessment Framework Types
 * Types for defining questions, quizzes, assessments, and grading structures
 */

import { DifficultyLevel } from './course.types';

/**
 * Types of questions that can be used in assessments
 */
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_SELECT = 'multiple_select',
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  TRUE_FALSE = 'true_false',
  MATCHING = 'matching',
  ORDERING = 'ordering',
  FILL_BLANK = 'fill_blank',
  CODE_ENTRY = 'code_entry',
  FILE_UPLOAD = 'file_upload'
}

/**
 * Types of assessments
 */
export enum AssessmentType {
  QUIZ = 'quiz',
  EXAM = 'exam',
  PRACTICE = 'practice',
  PRE_ASSESSMENT = 'pre_assessment',
  POST_ASSESSMENT = 'post_assessment',
  CERTIFICATION = 'certification',
  SELF_ASSESSMENT = 'self_assessment'
}

/**
 * Base interface for all question types
 */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  difficultyLevel: DifficultyLevel;
  skills: string[]; // Skill names assessed
  explanation?: string; // Explanation shown after answering
  hint?: string; // Optional hint
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Multiple choice question (single correct answer)
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: QuestionType.MULTIPLE_CHOICE;
  options: string[];
  correctOptionIndex: number;
  randomizeOptions?: boolean;
}

/**
 * Multiple select question (multiple correct answers)
 */
export interface MultipleSelectQuestion extends BaseQuestion {
  type: QuestionType.MULTIPLE_SELECT;
  options: string[];
  correctOptionIndices: number[];
  minSelectedOptions?: number;
  maxSelectedOptions?: number;
  randomizeOptions?: boolean;
}

/**
 * True/False question
 */
export interface TrueFalseQuestion extends BaseQuestion {
  type: QuestionType.TRUE_FALSE;
  isTrue: boolean;
}

/**
 * Short answer question
 */
export interface ShortAnswerQuestion extends BaseQuestion {
  type: QuestionType.SHORT_ANSWER;
  correctAnswers: string[]; // Possible correct answers
  caseSensitive: boolean;
  maxLength?: number;
}

/**
 * Long answer question
 */
export interface LongAnswerQuestion extends BaseQuestion {
  type: QuestionType.LONG_ANSWER;
  rubric?: {
    criteria: string;
    maxPoints: number;
  }[];
  minLength?: number;
  maxLength?: number;
  sampleAnswer?: string; // For grading reference
}

/**
 * Matching question (match items in two columns)
 */
export interface MatchingQuestion extends BaseQuestion {
  type: QuestionType.MATCHING;
  leftItems: string[];
  rightItems: string[];
  correctPairs: [number, number][]; // Pairs of indices, e.g. [[0, 2], [1, 0]]
  randomizeItems?: boolean;
}

/**
 * Ordering question (put items in correct order)
 */
export interface OrderingQuestion extends BaseQuestion {
  type: QuestionType.ORDERING;
  items: string[];
  correctOrder: number[]; // Indices in correct order
  randomizeItems?: boolean;
}

/**
 * Fill in the blank question
 */
export interface FillBlankQuestion extends BaseQuestion {
  type: QuestionType.FILL_BLANK;
  text: string; // Contains placeholders like [blank1], [blank2]
  blanks: {
    id: string; // e.g. "blank1"
    acceptableAnswers: string[];
    caseSensitive: boolean;
  }[];
}

/**
 * Code entry question
 */
export interface CodeEntryQuestion extends BaseQuestion {
  type: QuestionType.CODE_ENTRY;
  language: string; // e.g. "javascript", "python"
  starterCode?: string;
  correctCode?: string[]; // Alternative correct implementations
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
  executionTimeLimit?: number; // in milliseconds
  memoryLimit?: number; // in MB
}

/**
 * Union type for all question types
 */
export type Question = 
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion
  | MatchingQuestion
  | OrderingQuestion
  | FillBlankQuestion
  | CodeEntryQuestion;

/**
 * Criteria for grading assessments
 */
export interface GradingCriteria {
  id: string;
  passingScore: number; // Minimum points to pass
  passingPercentage: number; // Alternative as percentage (0-100)
  maxAttempts?: number; // Maximum attempts allowed
  showCorrectAnswers: boolean; // Whether to show correct answers after completion
  showExplanations: boolean; // Whether to show explanations after completion
  gradingDelay?: number; // Delay before showing grades (in minutes)
  penaltyPerAttempt?: number; // Point reduction for additional attempts
  timeLimit?: number; // Time limit in minutes
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quiz or assessment data structure
 */
export interface AssessmentData {
  id: string;
  title: string;
  description: string;
  type: AssessmentType;
  questions: Question[];
  totalPoints: number;
  timeLimit?: number; // in minutes
  randomizeQuestions: boolean;
  questionsPerAttempt?: number; // Number of questions randomly selected each attempt
  gradingCriteria: GradingCriteria;
  courseId?: string; // Associated course
  moduleId?: string; // Associated module
  sectionId?: string; // Associated section
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's answer to a question
 */
export interface QuestionResponse {
  questionId: string;
  responseData: any; // Type depends on question type
  startedAt: Date;
  submittedAt: Date;
  timeSpent: number; // in seconds
}

/**
 * User's assessment attempt
 */
export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  responses: QuestionResponse[];
  score: number;
  percentage: number;
  passed: boolean;
  startedAt: Date;
  submittedAt: Date;
  gradedAt?: Date;
  gradedBy?: string; // "auto" or user ID
  timeSpent: number; // in seconds
  feedback?: string;
  attemptNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Assessment results for analytics
 */
export interface AssessmentResults {
  assessmentId: string;
  totalAttempts: number;
  averageScore: number;
  medianScore: number;
  passRate: number; // 0-1 scale
  averageTimeSpent: number; // in seconds
  questionStats: {
    questionId: string;
    questionText: string;
    correctRate: number; // 0-1 scale
    averageTimeSpent: number; // in seconds
    difficulty: number; // Calculated difficulty 0-1
  }[];
  userStats?: { // For individual user analysis
    userId: string;
    attempts: number;
    bestScore: number;
    averageScore: number;
    totalTimeSpent: number; // in seconds
    strengthAreas: string[]; // Skills where user performs well
    weaknessAreas: string[]; // Skills where user struggles
  }[];
} 