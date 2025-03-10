/**
 * Course schema definitions
 */
import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  json, 
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { users } from './users';
import { DifficultyLevel } from '@/types/course.types';

/**
 * Courses table
 */
export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Basic course info
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetAudience: text("target_audience").notNull(),
  estimatedDuration: text("estimated_duration").notNull(),
  
  // Content details
  learningObjectives: json("learning_objectives").notNull().$type<string[]>(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by").notNull(), // References users.id
  isPublished: boolean("is_published").default(false).notNull(),
  status: text("status").default("draft").notNull(), // draft, published, archived
  version: integer("version").default(1).notNull(),
  
  // AI generation metadata
  generationPrompt: text("generation_prompt"),
  generatedBy: text("generated_by"), // Which agent generated this course
  generationModel: text("generation_model"), // Model used for generation
  generationConfig: json("generation_config").default({})
});

/**
 * Course modules
 */
export const courseModules = pgTable("course_modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  
  // Module details
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull(), // For ordering modules
  
  // Content
  topics: json("topics").notNull().$type<string[]>(),
  content: text("content").notNull(), // Markdown content
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  estimatedDuration: text("estimated_duration"),
  
  // Links to resources and other content
  resourceIds: json("resource_ids").default([]).$type<string[]>()
});

/**
 * Course quizzes
 */
export const courseQuizzes = pgTable("course_quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  moduleId: uuid("module_id").references(() => courseModules.id), // Optional module association
  
  // Quiz details
  title: text("title").notNull(),
  description: text("description"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  passingScore: integer("passing_score").default(70).notNull(), // Percentage
  
  // Configuration
  timeLimit: integer("time_limit"), // In minutes
  allowReview: boolean("allow_review").default(true).notNull(),
  randomizeQuestions: boolean("randomize_questions").default(false).notNull()
});

/**
 * Quiz questions
 */
export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id").notNull().references(() => courseQuizzes.id, { onDelete: 'cascade' }),
  
  // Question details
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // multiple-choice, true-false, short-answer
  options: json("options").default([]).$type<string[]>(), // For multiple choice
  correctAnswer: json("correct_answer").notNull(), // Can be string or number depending on type
  explanation: text("explanation"),
  
  // Metadata
  orderIndex: integer("order_index").notNull(),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  points: integer("points").default(1).notNull()
});

/**
 * Course assignments
 */
export const courseAssignments = pgTable("course_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  moduleId: uuid("module_id").references(() => courseModules.id), // Optional module association
  
  // Assignment details
  title: text("title").notNull(),
  description: text("description").notNull(),
  tasks: json("tasks").notNull().$type<string[]>(),
  submission: text("submission").notNull(), // Instructions for submission
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  dueDate: timestamp("due_date"),
  estimatedDuration: text("estimated_duration")
});

/**
 * Course resources
 */
export const courseResources = pgTable("course_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  moduleId: uuid("module_id").references(() => courseModules.id), // Optional module association
  
  // Resource details
  title: text("title").notNull(),
  type: text("type").notNull(), // video, article, book, etc.
  url: text("url").notNull(),
  description: text("description").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
  externalSource: boolean("external_source").default(true).notNull(),
  
  // For categorization
  tags: json("tags").default([]).$type<string[]>()
});

/**
 * Course enrollments
 */
export const enrollments = pgTable('enrollments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  status: text('status').$type<'active' | 'completed' | 'dropped'>().default('active').notNull(),
  progress: integer('progress').default(0).notNull(), // 0-100%
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Course reviews
 */
export const courseReviews = pgTable('course_reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations
 */
export const coursesRelations = relations(courses, ({ one, many }) => ({
  author: one(users, {
    fields: [courses.createdBy],
    references: [users.id],
  }),
  modules: many(courseModules),
  enrollments: many(enrollments),
  reviews: many(courseReviews),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id],
  }),
  quizzes: many(courseQuizzes),
  assignments: many(courseAssignments),
  resources: many(courseResources),
}));

export const courseQuizzesRelations = relations(courseQuizzes, ({ one }) => ({
  module: one(courseModules, {
    fields: [courseQuizzes.moduleId],
    references: [courseModules.id],
  }),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(courseQuizzes, {
    fields: [quizQuestions.quizId],
    references: [courseQuizzes.id],
  }),
}));

export const courseAssignmentsRelations = relations(courseAssignments, ({ one }) => ({
  module: one(courseModules, {
    fields: [courseAssignments.moduleId],
    references: [courseModules.id],
  }),
}));

export const courseResourcesRelations = relations(courseResources, ({ one }) => ({
  module: one(courseModules, {
    fields: [courseResources.moduleId],
    references: [courseModules.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const courseReviewsRelations = relations(courseReviews, ({ one }) => ({
  user: one(users, {
    fields: [courseReviews.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseReviews.courseId],
    references: [courses.id],
  }),
})); 