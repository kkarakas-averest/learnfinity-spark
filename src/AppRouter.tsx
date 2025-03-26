
import React from '@/lib/react-helpers';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.HR_LOGIN} element={<HRLoginPage />} />
          <Route path={ROUTES.SYSTEM_CHECK} element={<SystemHealthCheck />} />
          
          {/* HR routes */}
          <Route path={ROUTES.HR_DASHBOARD} element={
            <HRProtectedRoute>
              <HRLayout />
            </HRProtectedRoute>
          }>
            <Route index element={<HRDashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employee/create" element={<CreateEmployeePage />} />
            <Route path="employee/onboarding" element={<EmployeeOnboardingPage />} />
            <Route path="employee/:id" element={<EmployeeProfilePage />} />
            <Route path="employee/:id/edit" element={<EditEmployeePage />} />
          </Route>
          
          {/* Learner routes */}
          <Route path={ROUTES.LEARNER_DASHBOARD} element={
            <LearnerProtectedRoute>
              <LearnerLayout />
            </LearnerProtectedRoute>
          }>
            <Route index element={<LearnerDashboardPage />} />
            <Route path="courses" element={<LearnerCoursesPage />} />
            <Route path="profile" element={<LearnerProfilePage />} />
          </Route>
          
          {/* Course routes */}
          <Route path={ROUTES.COURSE_LIST} element={<CourseListPage />} />
          <Route path="course/:id" element={<CourseDetailsPage />} />
          <Route path={ROUTES.COURSE_CREATE} element={<CreateCoursePage />} />
          
          {/* 404 route */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRouter;
