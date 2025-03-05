
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

// Add any other employee-related types here
