export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  hire_date: string;
  position?: string;
  salary?: number;
  manager?: string;
  location?: string;
  phone?: string;
  skills?: string[];
  certifications?: string[];
  performance_rating?: number;
  profile_image?: string;
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.1@example.com",
    department: "Marketing",
    role: "Manager",
    status: "Active",
    hire_date: "2020-08-15",
    position: "Marketing Manager",
    salary: 90000,
    manager: null,
    location: "New York",
    phone: "123-456-7890",
    skills: ["Marketing Strategy", "Team Leadership", "Digital Marketing"],
    certifications: ["Certified Marketing Professional"],
    performance_rating: 4.5,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
  {
    id: "2",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    department: "Engineering",
    role: "Engineer",
    status: "Active",
    hire_date: "2021-02-20",
    position: "Software Engineer",
    salary: 110000,
    manager: "John Smith",
    location: "San Francisco",
    phone: "987-654-3210",
    skills: ["JavaScript", "React", "Node.js"],
    certifications: ["AWS Certified Developer"],
    performance_rating: 4.8,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: "3",
    name: "Bob Williams",
    email: "bob.w@example.com",
    department: "HR",
    role: "HR Specialist",
    status: "Active",
    hire_date: "2022-05-10",
    position: "HR Specialist",
    salary: 75000,
    manager: "John Smith",
    location: "Chicago",
    phone: "555-123-4567",
    skills: ["Recruiting", "Employee Relations", "HR Management"],
    certifications: ["SHRM-CP"],
    performance_rating: 4.2,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.d@example.com",
    department: "Sales",
    role: "Sales Representative",
    status: "Active",
    hire_date: "2023-01-05",
    position: "Sales Representative",
    salary: 80000,
    manager: "John Smith",
    location: "Los Angeles",
    phone: "111-222-3333",
    skills: ["Sales", "Customer Service", "Account Management"],
    certifications: [],
    performance_rating: 4.0,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
  },
  {
    id: "5",
    name: "David Garcia",
    email: "david.g@example.com",
    department: "Finance",
    role: "Accountant",
    status: "Inactive",
    hire_date: "2020-11-30",
    position: "Senior Accountant",
    salary: 95000,
    manager: "John Smith",
    location: "Houston",
    phone: "444-555-6666",
    skills: ["Accounting", "Financial Analysis", "Tax Preparation"],
    certifications: ["CPA"],
    performance_rating: 4.6,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
  },
  {
    id: "6",
    name: "Linda Rodriguez",
    email: "linda.r@example.com",
    department: "Marketing",
    role: "Marketing Coordinator",
    status: "Active",
    hire_date: "2021-07-12",
    position: "Marketing Coordinator",
    salary: 65000,
    manager: "John Smith",
    location: "Miami",
    phone: "777-888-9999",
    skills: ["Social Media Marketing", "Content Creation", "Event Planning"],
    certifications: [],
    performance_rating: 4.3,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Linda",
  },
  {
    id: "7",
    name: "Michael Brown",
    email: "michael.b@example.com",
    department: "Engineering",
    role: "Software Developer",
    status: "Active",
    hire_date: "2022-03-01",
    position: "Software Developer",
    salary: 100000,
    manager: "John Smith",
    location: "Seattle",
    phone: "333-444-5555",
    skills: ["Java", "Spring", "SQL"],
    certifications: ["Oracle Certified Professional"],
    performance_rating: 4.7,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
  },
  {
    id: "8",
    name: "Jennifer Lee",
    email: "jennifer.l@example.com",
    department: "HR",
    role: "Recruiter",
    status: "Active",
    hire_date: "2023-02-15",
    position: "Recruiter",
    salary: 70000,
    manager: "John Smith",
    location: "Austin",
    phone: "666-777-8888",
    skills: ["Recruiting", "Interviewing", "Talent Acquisition"],
    certifications: [],
    performance_rating: 4.1,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer",
  },
  {
    id: "9",
    name: "Christopher Wilson",
    email: "christopher.w@example.com",
    department: "Sales",
    role: "Sales Manager",
    status: "Active",
    hire_date: "2021-10-01",
    position: "Sales Manager",
    salary: 120000,
    manager: "John Smith",
    location: "Dallas",
    phone: "222-333-4444",
    skills: ["Sales Management", "Business Development", "Negotiation"],
    certifications: [],
    performance_rating: 4.9,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Christopher",
  },
  {
    id: "10",
    name: "Angela Martinez",
    email: "angela.m@example.com",
    department: "Finance",
    role: "Financial Analyst",
    status: "Active",
    hire_date: "2022-08-01",
    position: "Financial Analyst",
    salary: 85000,
    manager: "John Smith",
    location: "Denver",
    phone: "888-999-0000",
    skills: ["Financial Modeling", "Budgeting", "Forecasting"],
    certifications: ["CFA"],
    performance_rating: 4.4,
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Angela",
  },
];

export const hrEmployeeService = {
  getEmployees: async (): Promise<{ success: boolean; employees: Employee[]; error?: string }> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, employees: mockEmployees };
    } catch (error) {
      console.error("Error fetching employees:", error);
      return { success: false, employees: [], error: "Failed to fetch employees" };
    }
  },

  getEmployee: async (id: string): Promise<{ success: boolean; employee?: Employee; error?: string }> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const employee = mockEmployees.find(emp => emp.id === id);
      if (employee) {
        return { success: true, employee: employee };
      } else {
        return { success: false, error: "Employee not found" };
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      return { success: false, error: "Failed to fetch employee" };
    }
  },

  getDashboardMetrics: async (): Promise<{
    success: boolean;
    metrics: {
      totalEmployees: any;
      activeEmployees: any;
      inactiveEmployees: any;
      totalDepartments: any;
      recentHires: any;
      newEmployees: any;
      completionRate: any;
      completionRateChange: any;
      skillGaps: any;
      skillGapsChange: any;
      learningHours: any;
      learningHoursChange: any;
    };
    error?: string;
  } | {
    success: boolean;
    error: string;
    metrics?: undefined;
  }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const totalEmployees = mockEmployees.length;
      const activeEmployees = mockEmployees.filter(emp => emp.status === 'Active').length;
      const inactiveEmployees = totalEmployees - activeEmployees;
      const totalDepartments = [...new Set(mockEmployees.map(emp => emp.department))].length;
      const recentHires = mockEmployees.slice(-5); // Last 5 employees
      const newEmployees = 10;
      const completionRate = 75;
      const completionRateChange = 5;
      const skillGaps = 15;
      const skillGapsChange = 2;
      const learningHours = 120;
      const learningHoursChange = 10;

      return {
        success: true,
        metrics: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          totalDepartments,
          recentHires,
          newEmployees,
          completionRate,
          completionRateChange,
          skillGaps,
          skillGapsChange,
          learningHours,
          learningHoursChange,
        }
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      return { success: false, error: "Failed to fetch dashboard metrics" };
    }
  },

  getRecentActivities: async (): Promise<{
    success: boolean;
    activities: any[];
    error?: string;
  } | {
    success: boolean;
    error: string;
    activities?: undefined;
  }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const activities = [
        { id: 1, employee: "John Smith", activity: "Completed Diversity Training", date: "2024-01-20" },
        { id: 2, employee: "Alice Johnson", activity: "Updated Performance Goals", date: "2024-01-18" },
        { id: 3, employee: "Bob Williams", activity: "Reviewed Compensation Plans", date: "2024-01-15" },
      ];

      return { success: true, activities: activities };
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return { success: false, error: "Failed to fetch recent activities" };
    }
  },

  addEmployee: async (employee: Partial<Employee>): Promise<{ success: boolean; message: string; employee?: Employee }> => {
    try {
      // Format hire_date if it exists
      if (employee.hire_date) {
        // Ensure hire_date is a string
        const formattedDate = new Date(employee.hire_date).toISOString().split('T')[0];
        employee.hire_date = formattedDate;
      }
      
      const newEmployee: Employee = {
        id: String(mockEmployees.length + 1),
        name: employee.name || 'New Employee',
        email: employee.email || 'new@example.com',
        department: employee.department || 'Unknown',
        role: employee.role || 'Employee',
        status: employee.status || 'Active',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        position: employee.position || 'Trainee',
        salary: employee.salary || 50000,
        manager: employee.manager || null,
        location: employee.location || 'Remote',
        phone: employee.phone || 'N/A',
        skills: employee.skills || [],
        certifications: employee.certifications || [],
        performance_rating: employee.performance_rating || 3.0,
        profile_image: employee.profile_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=New',
      };

      mockEmployees.push(newEmployee);
      return { success: true, message: "Employee added successfully", employee: newEmployee };
    } catch (error) {
      console.error("Error adding employee:", error);
      return { success: false, message: "Failed to add employee" };
    }
  },

  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<{ success: boolean; message: string }> => {
    try {
      const employeeIndex = mockEmployees.findIndex(emp => emp.id === id);
      if (employeeIndex === -1) {
        return { success: false, message: "Employee not found" };
      }

      // Update the employee properties
      mockEmployees[employeeIndex] = { ...mockEmployees[employeeIndex], ...updates };

      return { success: true, message: "Employee updated successfully" };
    } catch (error) {
      console.error("Error updating employee:", error);
      return { success: false, message: "Failed to update employee" };
    }
  },

  deleteEmployee: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const employeeIndex = mockEmployees.findIndex(emp => emp.id === id);
      if (employeeIndex === -1) {
        return { success: false, message: "Employee not found" };
      }

      mockEmployees.splice(employeeIndex, 1);
      return { success: true, message: "Employee deleted successfully" };
    } catch (error) {
      console.error("Error deleting employee:", error);
      return { success: false, message: "Failed to delete employee" };
    }
  },
};
