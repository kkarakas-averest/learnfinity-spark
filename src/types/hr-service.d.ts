
/**
 * Type definitions for HR services
 */

export interface HREmployeeService {
  getAllEmployees(): Promise<any>;
  getEmployeeById(id: string): Promise<any>;
  getEmployee?(id: string): Promise<any>; // Alias for getEmployeeById
  createEmployee(employee: any): Promise<any>;
  updateEmployee(id: string, employee: any): Promise<any>;
  deleteEmployee(id: string): Promise<any>;
  searchEmployees(query: string): Promise<any>;
  uploadEmployeeResume?(id: string, file: File): Promise<any>;
  updateEmployeePassword?(id: string, newPassword: string): Promise<any>;
  resetEmployeePassword?(id: string): Promise<any>;
  initialize?(): Promise<any>;
}

export interface HRDepartmentService {
  getAllDepartments(): Promise<any>;
  getDepartments?(): Promise<any>; // Alias for getAllDepartments
  getDepartmentById(id: string): Promise<any>;
  createDepartment(name: string): Promise<any>;
  updateDepartment(id: string, name: string): Promise<any>;
  deleteDepartment(id: string): Promise<any>;
  getDepartmentMetrics(): Promise<any>;
  getDepartmentPositions(departmentId: string): Promise<any>;
}

export interface HRServices {
  initializeHRDatabase(): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  getDashboardMetrics(): Promise<any>;
  getRecentActivities(): Promise<any>;
  seedSampleData(): Promise<any>;
}

// Add Employee type definition for EditEmployeePage
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'onboarding';
  skills?: string[];
  manager?: string;
  bio?: string;
  profileImage?: string;
  [key: string]: any;
}
