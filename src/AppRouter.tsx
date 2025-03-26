import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// Layouts
import MainLayout from './layouts/MainLayout';
import HRLayout from './layouts/HRLayout';
import LearnerLayout from './layouts/LearnerLayout';

// Pages
import HomePage from './pages/HomePage';
import HRDashboardRoot from './pages/hr/HRDashboardRoot';
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
import EmployeeProfilePage from './pages/hr/EmployeeProfilePage';
import EditEmployeePage from './components/hr/EditEmployeePage';
import CreateEmployeePage from './components/hr/CreateEmployeePage';

// Protected Routes
import HRProtectedRoute from './components/auth/HRProtectedRoute';
import LearnerProtectedRoute from './components/auth/LearnerProtectedRoute';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Layout Routes */}
        <Route path={ROUTES.HOME} element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.HR_LOGIN} element={<HRLoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* HR Dashboard Routes */}
        <Route 
          path={ROUTES.HR_DASHBOARD} 
          element={
            <HRProtectedRoute>
              <HRLayout />
            </HRProtectedRoute>
          }
        >
          <Route index element={<HRDashboardRoot />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employee/new" element={<CreateEmployeePage />} />
          <Route path="employee/:id" element={<EmployeeProfilePage />} />
          <Route path="employee/:id/edit" element={<EditEmployeePage />} />
          {/* Add other HR routes as needed */}
        </Route>

        {/* Learner Routes */}
        <Route 
          path={ROUTES.LEARNER_DASHBOARD} 
          element={
            <LearnerProtectedRoute>
              <LearnerLayout />
            </LearnerProtectedRoute>
          }
        >
          <Route index element={<LearnerDashboardPage />} />
          <Route path="courses" element={<LearnerCoursesPage />} />
          <Route path="profile" element={<LearnerProfilePage />} />
        </Route>

        {/* Course Routes */}
        <Route path={ROUTES.COURSE_LIST} element={<CourseListPage />} />
        <Route path={ROUTES.COURSE_DETAILS(':id')} element={<CourseDetailsPage />} />
        <Route path={ROUTES.COURSE_CREATE} element={<CreateCoursePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
