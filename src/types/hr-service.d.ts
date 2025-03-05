
/**
 * HR Service type declarations
 */

declare interface HRServicesResult {
  success: boolean;
  error?: string;
  [key: string]: any;
}

declare interface HREmployeeService {
  getEmployees(): Promise<any>;
  getEmployeeById(id: string): Promise<any>;
  createEmployee(data: any): Promise<any>;
  updateEmployee(id: string, data: any): Promise<any>;
  deleteEmployee(id: string): Promise<any>;
  getEmployeeCourses(employeeId: string): Promise<any>;
  checkHRTablesExist(): Promise<any>;
  createEmployeeWithUserAccount(employeeData: any): Promise<any>;
}

declare interface HRDepartmentService {
  getAllDepartments(): Promise<any>;
  getDepartments(): Promise<any>; // Adding missing method
  getDepartmentById(id: string): Promise<any>;
  createDepartment(name: string): Promise<any>;
  updateDepartment(id: string, name: string): Promise<any>;
  deleteDepartment(id: string): Promise<any>;
  getDepartmentMetrics(): Promise<any>;
  getDepartmentPositions(departmentId: string): Promise<any>;
  getPositions(): Promise<any>;
}

declare interface HRServices {
  initializeHRDatabase(): Promise<HRServicesResult>;
  getDashboardMetrics(): Promise<any>;
  getRecentActivities(): Promise<any>;
}
