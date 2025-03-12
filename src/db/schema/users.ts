/**
 * User schema definitions
 */
import { pgTable, text, timestamp, json, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export type UserRole = 'admin' | 'instructor' | 'learner' | 'manager';

/**
 * Users table
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  imageUrl: text('image_url'),
  role: text('role').$type<UserRole>().default('learner').notNull(),
  department: text('department'),
  position: text('position'),
  skills: json('skills').$type<string[]>().default([]),
  interests: json('interests').$type<string[]>().default([]),
  learningStyle: text('learning_style').$type<'visual' | 'auditory' | 'reading' | 'kinesthetic'>(),
  experienceLevel: text('experience_level').$type<'beginner' | 'intermediate' | 'advanced' | 'expert'>().default('beginner'),
  completedCourses: json('completed_courses').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * User preferences
 */
export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  emailFrequency: text('email_frequency').$type<'daily' | 'weekly' | 'never'>().default('weekly'),
  darkMode: boolean('dark_mode').default(false),
  preferences: json('preferences').default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * User progress tracking
 */
export const userProgress = pgTable('user_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull(),
  moduleId: text('module_id'),
  sectionId: text('section_id'),
  progress: json('progress'),
  status: text('status').$type<'not_started' | 'in_progress' | 'completed'>().default('not_started').notNull(),
  lastActivity: timestamp('last_activity'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(userPreferences),
  progress: many(userProgress),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
})); 