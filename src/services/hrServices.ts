import hrService from './hrService';
import hrEmployeeService from './hrEmployeeService';
import hrCourseService from './hrCourseService';
import hrDepartmentService from './hrDepartmentService';
import hrLearningPathService from './hrLearningPathService';

// Export all HR services
export {
  hrService,          // Core HR service with database operations
  hrEmployeeService,  // Employee-specific operations
  hrCourseService,    // Course-specific operations
  hrDepartmentService, // Department and position operations
  hrLearningPathService // Learning path operations
};

// Default export for convenience
export default {
  hr: hrService,
  employees: hrEmployeeService,
  courses: hrCourseService,
  departments: hrDepartmentService,
  learningPaths: hrLearningPathService
}; 