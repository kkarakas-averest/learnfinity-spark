
/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  HR_LOGIN: '/hr-login',
  HR_DASHBOARD: '/hr-dashboard',
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
  SYSTEM_CHECK: '/system-check',
  NOT_FOUND: '/404',
};
