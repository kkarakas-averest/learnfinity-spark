/**
 * Schema definitions for content storage
 */
import { pgTable, text, timestamp, json, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { courses } from './courses';
import { users } from './users';

/**
 * Generated content table for storing AI-generated educational content
 */
export const generatedContents = pgTable('generated_contents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  contentType: text('content_type').notNull(),
  format: text('format').notNull(),
  originalRequest: json('original_request').notNull(),
  metadata: json('metadata').notNull(),
  suggestedNextSteps: json('suggested_next_steps'),
  relatedTopics: json('related_topics'),
  quiz: json('quiz'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdById: text('created_by_id').references(() => users.id, { onDelete: 'set null' }),
});

/**
 * Relations for generated content
 */
export const generatedContentsRelations = relations(generatedContents, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [generatedContents.createdById],
    references: [users.id],
  }),
  contentVersions: many(contentVersions),
  courseAssociations: many(contentCourseAssociations),
}));

/**
 * Content versions to keep track of edits and revisions
 */
export const contentVersions = pgTable('content_versions', {
  id: text('id').primaryKey(),
  contentId: text('content_id').notNull().references(() => generatedContents.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdById: text('created_by_id').references(() => users.id, { onDelete: 'set null' }),
});

/**
 * Relations for content versions
 */
export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
  content: one(generatedContents, {
    fields: [contentVersions.contentId],
    references: [generatedContents.id],
  }),
  createdBy: one(users, {
    fields: [contentVersions.createdById],
    references: [users.id],
  }),
}));

/**
 * Association between content and courses
 */
export const contentCourseAssociations = pgTable('content_course_associations', {
  id: text('id').primaryKey(),
  contentId: text('content_id').notNull().references(() => generatedContents.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  sectionType: text('section_type'),
  order: integer('order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Relations for content-course associations
 */
export const contentCourseAssociationsRelations = relations(contentCourseAssociations, ({ one }) => ({
  content: one(generatedContents, {
    fields: [contentCourseAssociations.contentId],
    references: [generatedContents.id],
  }),
  course: one(courses, {
    fields: [contentCourseAssociations.courseId],
    references: [courses.id],
  }),
}));

/**
 * Content analytics for tracking engagement
 */
export const contentAnalytics = pgTable('content_analytics', {
  id: text('id').primaryKey(),
  contentId: text('content_id').notNull().references(() => generatedContents.id, { onDelete: 'cascade' }),
  viewCount: integer('view_count').default(0).notNull(),
  averageRating: integer('average_rating'),
  ratingCount: integer('rating_count').default(0).notNull(),
  completionRate: integer('completion_rate'),
  quizAttemptsCount: integer('quiz_attempts_count').default(0),
  quizPassRate: integer('quiz_pass_rate'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 