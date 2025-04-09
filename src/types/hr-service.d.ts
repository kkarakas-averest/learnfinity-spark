// Type definitions for HR service
declare module '@/services/hrEmployeeService' {
  export interface Employee {
    id: string;
    name: string;
    email: string;
    department_id?: string;
    position_id?: string;
    status: string;
    company_id: string;
    phone?: string;
    resume_url?: string;
  }

  export interface Course {
    id: string;
    title: string;
    description?: string;
    progress: number;
    enrollment_date?: string;
    completion_date?: string;
  }

  export interface Skill {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    inProgress: boolean;
  }

  export interface Activity {
    id: string;
    activity_type: string;
    description: string;
    timestamp: string;
    course_title?: string;
  }

  export interface EmployeeService {
    initialize(): Promise<{ success: boolean; error?: any }>;
    createMissingTables(missingTables: string[]): Promise<{ success: boolean; error?: any }>;
    getEmployees(): Promise<{ success: boolean; employees?: any[]; error?: any }>;
    getEmployee(id: string): Promise<{ data: Employee; error: any }>;
    getEmployeeCourses(employeeId: string): Promise<{ data: Course[] | null; error: any }>;
    getEmployeeSkills(employeeId: string): Promise<{ data: Skill[] | null; error: any }>;
    getEmployeeActivities(employeeId: string, limit?: number): Promise<{ data: Activity[] | null; error: any }>;
    getDepartments(): Promise<{ success: boolean; departments?: any[]; error?: any }>;
    createEmployee(employeeData: any): Promise<{ id: string; error?: { message: string } }>;
    updateEmployee(id: string, employeeData: any): Promise<{ success: boolean; error?: any }>;
    deleteEmployee(id: string): Promise<{ success: boolean; error?: any }>;
    uploadEmployeeResume(id: string, file: File): Promise<SupabaseResponse<{ resumeUrl: string }>>;
    resetEmployeePassword(email: string): Promise<{ success: boolean; newPassword?: string; error?: { message: string } }>;
    updateEmployeePassword(email: string, password: string): Promise<{ success: boolean; error?: { message: string } }>;
    createEmployeeFromJSON(employeeJSON: any): Promise<{ success: boolean }>;
  }

  export const hrEmployeeService: EmployeeService;
}

declare module '@/lib/services/hrDepartmentService' {
  export const hrDepartmentService: {
    getAllDepartments(): Promise<any>;
    getDepartmentById(id: string): Promise<any>;
    createDepartment(name: string): Promise<any>;
    updateDepartment(id: string, name: string): Promise<any>;
    deleteDepartment(id: string): Promise<any>;
    getDepartmentMetrics(): Promise<any>;
    getDepartmentPositions(departmentId: string): Promise<any>;
    getPositions(departmentId: string): Promise<{ data: any[]; error: any }>;
    getDepartments(): Promise<{ data: any[]; error: any }>;
  };
}

declare module '@/lib/services/hrServices' {
  export const hrServices: {
    initializeHRDatabase(): Promise<{ success: boolean; error?: string; message?: string }>;
    getDashboardMetrics(): Promise<any>;
    getRecentActivities(): Promise<any>;
  };
}

declare module '@/services/hrLearnerService' {
  import type { EmployeeProgress, LearningStatistics } from '@/types/hr.types';

  export interface HRLearnerService {
    checkRequiredTablesExist(): Promise<{ success: boolean; missingTables?: string[] }>;
    
    createOrUpdateLearnerProfile(employeeData: any): Promise<{ 
      success: boolean; 
      data?: any; 
      error?: string;
      action?: 'created' | 'updated';
    }>;
    
    assignLearningPath(assignment: {
      user_id: string;
      learning_path_id: string;
      assigned_by: string;
      due_date?: Date;
      priority?: 'high' | 'medium' | 'low';
      mandatory?: boolean;
      notes?: string;
    }): Promise<{ 
      success: boolean; 
      data?: any; 
      error?: string;
      action?: 'created' | 'updated';
    }>;
    
    getLearnerProgressSummary(): Promise<{
      success: boolean;
      data?: {
        statistics: LearningStatistics;
        employees: EmployeeProgress[];
      };
      error?: string;
      missingTables?: string[];
    }>;
  }

  export const hrLearnerService: HRLearnerService;
}
