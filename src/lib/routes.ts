/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  HR_LOGIN: '/hr-login',
  HR_DASHBOARD: '/hr-dashboard',
  HR_DASHBOARD_EMPLOYEES: '/hr-dashboard/employees',
  HR_DASHBOARD_EMPLOYEES_NEW: '/hr-dashboard/employees/new',
  HR_DASHBOARD_EMPLOYEES_VIEW: '/hr-dashboard/employees/:id',
  HR_DASHBOARD_EMPLOYEES_EDIT: '/hr-dashboard/employees/:id/edit',
  HR_DASHBOARD_COURSES: '/hr-dashboard/courses',
  HR_DASHBOARD_REPORTS: '/hr-dashboard/reports',
  EMPLOYEE_CREATE: '/hr/employee/create',
  EMPLOYEE_ONBOARDING: '/hr/employee/onboarding',
  EMPLOYEE_DETAILS: (id: string) => `/hr/employee/${id}`,
  EMPLOYEE_EDIT: (id: string) => `/hr/employee/${id}/edit`,
  COURSE_DETAILS: (id: string) => `/course/${id}`,
  COURSE_LIST: '/courses',
  COURSE_CREATE: '/course/create',
  LEARNER_DASHBOARD: '/learner-dashboard',
  LEARNER_PROFILE: '/learner/profile',
  LEARNER_COURSES: '/learner/courses',
  DASHBOARD: '/dashboard',
  MENTOR_DASHBOARD: '/mentor-dashboard',
  ADMIN_DASHBOARD: '/admin-dashboard',
  SYSTEM_CHECK: '/system-check',
  NOT_FOUND: '/404',
};

// Helper functions for parameterized routes
export const buildRoute = {
  HR_DASHBOARD_EMPLOYEES_VIEW: (id: string) => `/hr-dashboard/employees/${id}`,
  HR_DASHBOARD_EMPLOYEES_EDIT: (id: string) => `/hr-dashboard/employees/${id}/edit`,
  COURSE_DETAILS: (id: string) => `/course/${id}`,
};
