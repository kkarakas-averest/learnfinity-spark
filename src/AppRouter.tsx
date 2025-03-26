
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ROUTES } from './lib/routes';

// Layout components
import MainLayout from './layouts/MainLayout';
import HRLayout from './layouts/HRLayout';
import LearnerLayout from './layouts/LearnerLayout';

// Pages
import HomePage from './pages/HomePage';
import HRDashboardPage from './pages/hr/HRDashboardPage';
import LoginPage from './pages/auth/LoginPage';
import HRLoginPage from './pages/auth/HRLoginPage';
import NotFoundPage from './pages/NotFoundPage';
import LearnerDashboardPage from './pages/learner/LearnerDashboardPage';
import LearnerCoursesPage from './pages/learner/LearnerCoursesPage';
import LearnerProfilePage from './pages/learner/LearnerProfilePage';
import CourseDetailsPage from './pages/course/CourseDetailsPage';
import CourseListPage from './pages/course/CourseListPage';
import CreateCoursePage from './pages/course/CreateCoursePage';
import EmployeesPage from './pages/hr/EmployeesPage';
import CreateEmployeePage from './components/hr/CreateEmployeePage';
import EmployeeProfilePage from './pages/hr/EmployeeProfilePage';
import EditEmployeePage from './pages/hr/EditEmployeePage';
import EmployeeOnboardingPage from './pages/hr/EmployeeOnboardingPage';
import SystemHealthCheck from './pages/SystemHealthCheck';

// Import protected route helpers
import HRProtectedRoute from './components/auth/HRProtectedRoute';
import LearnerProtectedRoute from './components/auth/LearnerProtectedRoute';

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.HR_LOGIN, element: <HRLoginPage /> },
      { path: ROUTES.SYSTEM_CHECK, element: <SystemHealthCheck /> },
      
      // HR routes
      {
        path: ROUTES.HR_DASHBOARD,
        element: (
          <HRProtectedRoute>
            <HRLayout />
          </HRProtectedRoute>
        ),
        children: [
          { index: true, element: <HRDashboardPage /> },
          // Employee routes
          { path: 'employees', element: <EmployeesPage /> },
          { path: 'employee/create', element: <CreateEmployeePage /> },
          { path: 'employee/onboarding', element: <EmployeeOnboardingPage /> },
          { path: 'employee/:id', element: <EmployeeProfilePage /> },
          { path: 'employee/:id/edit', element: <EditEmployeePage /> },
        ],
      },
      
      // Learner routes
      {
        path: ROUTES.LEARNER_DASHBOARD,
        element: (
          <LearnerProtectedRoute>
            <LearnerLayout />
          </LearnerProtectedRoute>
        ),
        children: [
          { index: true, element: <LearnerDashboardPage /> },
          { path: 'courses', element: <LearnerCoursesPage /> },
          { path: 'profile', element: <LearnerProfilePage /> },
        ],
      },
      
      // Course routes
      { path: ROUTES.COURSE_LIST, element: <CourseListPage /> },
      { path: 'course/:id', element: <CourseDetailsPage /> },
      { path: ROUTES.COURSE_CREATE, element: <CreateCoursePage /> },
      
      // 404 route
      { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
    ],
  },
]);

function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
