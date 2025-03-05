
// Type definitions for HR service
declare module '@/services/hrEmployeeService' {
  interface EmployeeService {
    initialize(): Promise<{ success: boolean; error?: any }>;
    createMissingTables(missingTables: string[]): Promise<{ success: boolean; error?: any }>;
    getEmployees(): Promise<any[]>;
    getEmployee(id: string): Promise<any>;
    createEmployee(employeeData: any): Promise<{ id: string, success: boolean }>;
    updateEmployee(id: string, employeeData: any): Promise<{ success: boolean; error?: any }>;
    deleteEmployee(id: string): Promise<{ success: boolean; error?: any }>;
    createEmployeeFromJSON(employeeJSON: any): Promise<{ success: boolean }>;
  }

  export const hrEmployeeService: EmployeeService;
}
