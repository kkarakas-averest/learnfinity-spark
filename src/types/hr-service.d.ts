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

  export interface EmployeeService {
    initialize(): Promise<{ success: boolean; error?: any }>;
    createMissingTables(missingTables: string[]): Promise<{ success: boolean; error?: any }>;
    getEmployees(): Promise<{ success: boolean; employees?: any[]; error?: any }>;
    getEmployee(id: string): Promise<{ data: Employee; error: any }>;
    createEmployee(employeeData: any): Promise<{ id: string, success: boolean }>;
    updateEmployee(id: string, employeeData: any): Promise<{ success: boolean; error?: any }>;
    deleteEmployee(id: string): Promise<{ success: boolean; error?: any }>;
    uploadEmployeeResume(id: string, file: File): Promise<{ error: any }>;
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
  export interface HRLearnerService {
    // Add missingTables to the return type for getLearnerProgressSummary
    getLearnerProgressSummary(): Promise<{ 
      success: boolean; 
      data?: any; 
      error?: string;
      missingTables?: string[];
    }>;
    
    // Other methods...
  }
}
