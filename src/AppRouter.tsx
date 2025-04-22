import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ROUTES, buildRoute } from '@/lib/routes';

// Layouts
import MainLayout from './layouts/MainLayout';
import HRLayout from './layouts/HRLayout';
import LearnerLayout from './layouts/LearnerLayout';
import { SuperAdminLayout } from '@/features/super-admin/components/SuperAdminLayout';

// Pages
import HomePage from './pages/HomePage';
import HRDashboardRoot from './pages/hr/HRDashboardRoot';
import LoginPage from './pages/auth/LoginPage';
import HRLoginPage from './pages/auth/HRLoginPage';
import AcceptInvitePage from './pages/auth/AcceptInvitePage';
import NotFoundPage from './pages/NotFoundPage';
import LearnerDashboardPage from './pages/learner/LearnerDashboardPage';
import LearnerCoursesPage from './pages/learner/LearnerCoursesPage';
import LearnerProfilePage from './pages/learner/LearnerProfilePage';
import LearnerOnboardingPage from './pages/learner/LearnerOnboardingPage';
import CourseViewPage from './pages/course/CourseViewPage';
import CourseDetailsPage from './pages/course/CourseDetailsPage';
import CourseListPage from './pages/course/CourseListPage';
import CreateCoursePage from './pages/course/CreateCoursePage';
import EmployeesPage from './pages/hr/EmployeesPage';
import EmployeeProfilePage from './pages/hr/EmployeeProfilePage';
import EditEmployeePage from './components/hr/EditEmployeePage';
import CreateEmployeePage from './components/hr/CreateEmployeePage';

// Super Admin Pages
import SuperAdminDashboard from '@/features/super-admin/pages/SuperAdminDashboard';
import ManageCompaniesPage from '@/features/super-admin/pages/ManageCompaniesPage';
import ManageUsersPage from '@/features/super-admin/pages/ManageUsersPage';
import InviteUserPage from '@/features/super-admin/pages/InviteUserPage';

// Protected Routes
import HRProtectedRoute from './components/auth/HRProtectedRoute';
import LearnerProtectedRoute from './components/auth/LearnerProtectedRoute';

// Tell TypeScript to ignore type errors for the Route component
// This is a workaround for React Router v6 TypeScript issues
const TypeSafeRoute = Route as any;

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Layout Routes (Public/Auth) */}
        <TypeSafeRoute path={ROUTES.HOME} element={<MainLayout />}>
          <TypeSafeRoute index element={<HomePage />} />
          <TypeSafeRoute path={ROUTES.LOGIN} element={<LoginPage />} />
          <TypeSafeRoute path={ROUTES.HR_LOGIN} element={<HRLoginPage />} />
          <TypeSafeRoute path="/accept-invite" element={<AcceptInvitePage />} />
        </TypeSafeRoute>

        {/* HR Dashboard Routes */}
        <TypeSafeRoute 
          path={ROUTES.HR_DASHBOARD} 
          element={
            <HRProtectedRoute>
              <HRLayout />
            </HRProtectedRoute>
          }
        >
          <TypeSafeRoute index element={<HRDashboardRoot />} />
          <TypeSafeRoute path="employees" element={<EmployeesPage />} />
          <TypeSafeRoute path="employees/new" element={<CreateEmployeePage />} />
          <TypeSafeRoute path="employees/:id" element={<EmployeeProfilePage />} />
          <TypeSafeRoute path="employees/:id/edit" element={<EditEmployeePage />} />
        </TypeSafeRoute>

        {/* Super Admin Routes */}
        <TypeSafeRoute path="/super-admin" element={<SuperAdminLayout />}>
          <TypeSafeRoute index element={<SuperAdminDashboard />} />
          <TypeSafeRoute path="companies" element={<ManageCompaniesPage />} />
          <TypeSafeRoute path="users" element={<ManageUsersPage />} />
          <TypeSafeRoute path="invite" element={<InviteUserPage />} />
        </TypeSafeRoute>

        {/* Learner Routes */}
        <TypeSafeRoute 
          path={ROUTES.LEARNER_DASHBOARD} 
          element={
            <LearnerProtectedRoute>
              <LearnerLayout />
            </LearnerProtectedRoute>
          }
        >
          <TypeSafeRoute index element={<LearnerDashboardPage />} />
          <TypeSafeRoute path="courses" element={<LearnerCoursesPage />} />
          <TypeSafeRoute path="profile" element={<LearnerProfilePage />} />
          <TypeSafeRoute path="onboarding" element={<LearnerOnboardingPage />} />
        </TypeSafeRoute>

        {/* Course Routes */}
        <TypeSafeRoute 
          path={ROUTES.COURSE_LIST} 
          element={
            <LearnerProtectedRoute>
              <LearnerLayout>
                <CourseListPage />
              </LearnerLayout>
            </LearnerProtectedRoute>
          } 
        />
        <TypeSafeRoute 
          path={ROUTES.COURSE_VIEW} 
          element={
            <LearnerProtectedRoute>
              <LearnerLayout>
                <CourseViewPage />
              </LearnerLayout>
            </LearnerProtectedRoute>
          } 
        />
        <TypeSafeRoute 
          path="/course/:id" 
          element={
            <LearnerProtectedRoute>
              <LearnerLayout>
                <CourseDetailsPage />
              </LearnerLayout>
            </LearnerProtectedRoute>
          } 
        />
        <TypeSafeRoute 
          path={ROUTES.COURSE_CREATE} 
          element={
            <HRProtectedRoute>
              <HRLayout>
                <CreateCoursePage />
              </HRLayout>
            </HRProtectedRoute>
          } 
        />

        {/* Catch-all 404 Route - Must be last */}
        <TypeSafeRoute path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
