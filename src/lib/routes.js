/**
 * Application route constants
 * 
 * This file contains all the route paths used throughout the application.
 * Using these constants instead of hardcoded strings helps maintain consistency
 * and makes it easier to update routes in the future.
 */

export const ROUTES = {
  // Main routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  COURSES: '/courses',
  COURSE_DETAIL: '/course/:id',
  ONBOARDING: '/onboarding',
  
  // User dashboard routes
  DASHBOARD: '/dashboard',
  USER_PROFILE: '/profile',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_BILLING: '/settings/billing',
  
  // HR routes
  HR_LOGIN: '/hr/login',
  HR_DASHBOARD: '/hr/dashboard',
  HR_DASHBOARD_EMPLOYEES: '/hr/dashboard/employees',
  HR_DASHBOARD_EMPLOYEES_NEW: '/hr/dashboard/employees/new',
  HR_DASHBOARD_EMPLOYEES_EDIT: '/hr/dashboard/employees/:id/edit',
  HR_DASHBOARD_EMPLOYEES_VIEW: '/hr/dashboard/employees/:id',
  HR_DASHBOARD_COURSES: '/hr/dashboard/courses',
  HR_DASHBOARD_REPORTS: '/hr/dashboard/reports',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_ORGANIZATIONS: '/admin/organizations',
  ADMIN_USERS: '/admin/users',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_AI: '/admin/ai',
};

// Helper functions for parameterized routes
export const buildRoute = {
  COURSE_DETAIL: (id) => `/course/${id}`,
  HR_DASHBOARD_EMPLOYEES_EDIT: (id) => `/hr-dashboard/employees/${id}/edit`,
  HR_DASHBOARD_EMPLOYEES_VIEW: (id) => `/hr-dashboard/employees/${id}`,
};

export default ROUTES;
