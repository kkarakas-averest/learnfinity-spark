# State Management Migration Progress

## Overview

This document tracks our progress in migrating components to use the new state management system. 

## Migration Status

| Component | Status | Notes |
|-----------|--------|-------|
| `src/main.tsx` | ✅ Created migrated version | Created `mainMigrated.tsx` that uses StateProvider instead of AuthProvider |
| `src/pages/LoginPage.tsx` | ✅ Created migrated version | Created `LoginPageMigrated.tsx` that uses useAuth hook |
| `src/pages/RegisterPage.tsx` | ✅ Created migrated version | Created `RegisterPageMigrated.tsx` that uses useAuth hook |
| `src/pages/HRLogin.tsx` | ✅ Created migrated version | Created `HRLoginMigrated.tsx` that uses useHRAuth hook |
| `src/pages/HRDashboard.tsx` | ✅ Created migrated version | Created `HRDashboardMigrated.tsx` that uses useHRAuth and useUI hooks |
| `src/pages/Courses.tsx` | ✅ Created migrated version | Created `CoursesMigrated.tsx` that uses useCourses hook |
| `src/components/ProtectedRoute.tsx` | ✅ Created migrated version | Created `ProtectedRouteMigrated.tsx` that uses useAuth hook |
| `src/components/Navbar.tsx` | ✅ Created migrated version | Created `NavbarMigrated.tsx` that uses useAuth and useUI hooks |
| `src/components/DashboardLayout.tsx` | ✅ Created migrated version | Created `DashboardLayoutMigrated.tsx` that uses useAuth and useUI hooks |
| `src/pages/Dashboard.tsx` | ❌ Not migrated | Uses old AuthContext |
| `src/pages/ProfilePage.tsx` | ❌ Not migrated | Uses old AuthContext |
| `src/components/DiagnosticTool.tsx` | ❌ Not migrated | Uses old AuthContext |
| `src/components/learner/AgentGeneratedCourses.jsx` | ❌ Not migrated | Uses old AuthContext |
| `src/hooks/useLearningData.ts` | ❌ Not migrated | Uses old AuthContext |

## Next Steps

1. **Replace files with migrated versions**: After testing and validation, replace the original files with their migrated versions.

2. **Continue component migration**: Focus on migrating the remaining components in the following order:
   - LoginPage and RegisterPage (critical for user authentication)
   - ProtectedRoute (important for route protection)
   - Navbar and DashboardLayout (common UI components)
   - Dashboard, ProfilePage (feature components)
   - Remaining components

3. **Update imports across the codebase**: Once a critical mass of components has been migrated, update imports in all files to use `@/state` instead of `@/contexts/AuthContext`.

4. **Remove old context files**: Once all components have been migrated, remove the old context files.

## Implementation Notes

### New Context Structure
- `StateProvider`: Central provider for all state
- Domain-specific hooks:
  - `useAuth`: Authentication state
  - `useHRAuth`: HR authentication state
  - `useUser`: User profile and preferences
  - `useCourses`: Course listings and progress
  - `useUI`: UI state (toasts, modals, theme)

### Migration Pattern

When migrating a component:

1. Import the new hooks:
   ```jsx
   // Old
   import { useAuth } from '@/contexts/AuthContext';
   
   // New
   import { useAuth, useUI } from '@/state';
   ```

2. Replace toast usage:
   ```jsx
   // Old
   import { useToast } from '@/components/ui/use-toast';
   const { toast } = useToast();
   toast({ title: 'Success', description: 'Operation completed' });
   
   // New
   import { useUI } from '@/state';
   const { toast, toastSuccess, toastError } = useUI();
   toastSuccess('Success', 'Operation completed');
   ```

3. Add error handling using the UI state:
   ```jsx
   try {
     // operation
   } catch (error) {
     toastError('Error', error.message);
   }
   ``` 