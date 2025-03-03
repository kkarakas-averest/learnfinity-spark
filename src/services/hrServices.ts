
import { Employee } from './hrEmployeeService';
import { hrEmployeeService } from '/dev-server/src/services/hrEmployeeService';

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
  // Initialize HR database
  initializeHRDatabase: async () => {
    return new Promise<void>((resolve) => {
      console.log("Initializing HR database");
      // Simulating initialization delay
      setTimeout(() => {
        console.log("HR database initialized");
        resolve();
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
