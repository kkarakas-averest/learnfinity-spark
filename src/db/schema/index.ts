/**
 * Export all schema modules
 * 
 * Note: We use individual exports to avoid circular dependencies
 */

// Import and re-export users schema
import {
  users,
  userPreferences,
  userProgress,
  usersRelations,
  userPreferencesRelations,
  userProgressRelations,
  type UserRole,
} from './users';

export {
  users,
  userPreferences,
  userProgress,
  usersRelations,
  userPreferencesRelations,
  userProgressRelations,
  type UserRole,
};

// Import and re-export courses schema
import {
  courses,
  courseModules as modules,
  courseQuizzes as sections,
  enrollments,
  courseReviews,
  coursesRelations,
  courseModulesRelations as modulesRelations,
  courseQuizzesRelations as sectionsRelations,
  enrollmentsRelations,
  courseReviewsRelations,
} from './courses';

export {
  courses,
  modules,
  sections,
  enrollments,
  courseReviews,
  coursesRelations,
  modulesRelations,
  sectionsRelations,
  enrollmentsRelations,
  courseReviewsRelations,
};

// Import and re-export content schema
import {
  generatedContents,
  contentVersions,
  contentCourseAssociations,
  contentAnalytics,
  generatedContentsRelations,
  contentVersionsRelations,
  contentCourseAssociationsRelations,
} from './content';

export {
  generatedContents,
  contentVersions,
  contentCourseAssociations,
  contentAnalytics,
  generatedContentsRelations,
  contentVersionsRelations,
  contentCourseAssociationsRelations,
}; 