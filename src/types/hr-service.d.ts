
// This file augments the HR service types
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

  export const hrEmployeeService: {
    initialize(): Promise<{ success: boolean; error?: any }>;
    createMissingTables(missingTables: any): Promise<{ success: boolean; error?: any }>;
    getEmployees(): Promise<{ success: boolean; employees?: any[]; error?: any }>;
    getEmployee(id: string): Promise<{ data: Employee; error: any }>;
    createEmployee(employeeData: any): Promise<{ success: boolean; error?: any }>;
    updateEmployee(id: string, employeeData: any): Promise<{ error: any }>;
    deleteEmployee(id: string): Promise<{ success: boolean; error?: any }>;
    resetEmployeePassword(email: string): Promise<{ success: boolean; newPassword?: string; error?: { message: string } }>;
    updateEmployeePassword(email: string, password: string): Promise<{ success: boolean; error?: { message: string } }>;
    uploadEmployeeResume(id: string, file: File): Promise<{ error: any }>;
    createEmployeeFromJSON(employeeJSON: any): Promise<{ success: boolean; error?: any }>;
  };
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
