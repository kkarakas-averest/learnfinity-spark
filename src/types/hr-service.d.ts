
// Declarations for HR service methods
declare module '@/services/hrDepartmentService' {
  export const hrDepartmentService: {
    getAllDepartments(): Promise<any>;
    getDepartmentById(id: string): Promise<any>;
    createDepartment(name: string): Promise<any>;
    updateDepartment(id: string, name: string): Promise<any>;
    deleteDepartment(id: string): Promise<any>;
    getDepartmentMetrics(): Promise<any>;
    getDepartmentPositions(departmentId: string): Promise<any>;
    // Add other methods as needed
  };
}

declare module '@/services/hrEmployeeService' {
  export const hrEmployeeService: {
    getAllEmployees(): Promise<any>;
    getEmployeeById(id: string): Promise<any>;
    createEmployee(employee: any): Promise<any>;
    updateEmployee(id: string, employee: any): Promise<any>;
    deleteEmployee(id: string): Promise<any>;
    searchEmployees(query: string): Promise<any>;
    // Add other methods as needed
  };
}

declare module '@/services/hrServices' {
  export const hrServices: {
    initializeHRDatabase(): Promise<{ success: boolean; error?: string; }>;
    getDashboardMetrics(): Promise<any>;
    getRecentActivities(): Promise<any>;
    // Add other methods as needed
  };
}
