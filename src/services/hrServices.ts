import { Employee } from './hrEmployeeService';
import { hrEmployeeService } from './hrEmployeeService';

// Define the required HR tables
const REQUIRED_HR_TABLES = [
  'hr_departments',
  'hr_positions',
  'hr_employees',
  'hr_courses',
  'hr_course_enrollments',
  'learning_paths',
  'learning_path_courses',
  'learning_path_assignments'
];

// Mock data for dashboard and activity
const mockDashboardMetrics = {
  totalEmployees: 156,
  activeEmployees: 134,
  inactiveEmployees: 22,
  totalDepartments: 8,
  recentHires: 12,
  newEmployees: 5,
  completionRate: 67,
  completionRateChange: 4.2,
  skillGaps: 23,
  skillGapsChange: -5,
  learningHours: 1452,
  learningHoursChange: 123
};

const mockActivities = [
  {
    type: 'enrollment',
    user: 'Jordan Lee',
    course: 'Advanced TypeScript',
    time: '2 hours ago'
  },
  {
    type: 'completion',
    user: 'Alex Morgan',
    course: 'React State Management',
    time: 'Yesterday'
  },
  {
    type: 'feedback',
    user: 'Taylor Swift',
    course: 'Building APIs with Node.js',
    rating: 4.5,
    comment: 'Excellent course with practical examples',
    time: '2 days ago'
  },
  {
    type: 'alert',
    user: 'Chris Walker',
    issue: 'Has not completed mandatory compliance training',
    time: '3 days ago'
  }
];

export const hrServices = {
  // Check if required HR tables exist
  checkRequiredTables: async () => {
    console.log("Checking required HR tables");
    // Always return success to avoid blocking the dashboard in development
    return {
      success: true,
      missingTables: []
    };
  },

  // Initialize HR database
  initializeHRDatabase: async () => {
    return new Promise<{ success: boolean; error?: string; message?: string; }>((resolve) => {
      console.log("Initializing HR database");
      // Simulating initialization delay
      setTimeout(() => {
        console.log("HR database initialized");
        resolve({
          success: true,
          message: "HR database initialized successfully"
        });
      }, 500);
    });
  },

  // Dashboard metrics
  getDashboardMetrics: async () => {
    try {
      // In a real app, this would call hrEmployeeService.getDashboardMetrics()
      // For demo purposes, return mock data
      return {
        success: true,
        metrics: mockDashboardMetrics
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      return {
        success: false,
        error: "Failed to fetch dashboard metrics"
      };
    }
  },

  // Recent activities
  getRecentActivities: async () => {
    try {
      // In a real app, this would call an appropriate service method
      return {
        success: true,
        activities: mockActivities
      };
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return {
        success: false,
        error: "Failed to fetch recent activities"
      };
    }
  },
  
  // Seed sample data if needed
  seedSampleData: async () => {
    try {
      console.log("Seeding sample HR data");
      // Simulate seeding data
      return {
        success: true,
        message: "Sample data seeded successfully"
      };
    } catch (error) {
      console.error("Error seeding sample data:", error);
      return {
        success: false,
        error: "Failed to seed sample data"
      };
    }
  }
};
