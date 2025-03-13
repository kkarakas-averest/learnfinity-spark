import { supabase } from '@/lib/supabase';
import { seedHRDatabase } from '@/lib/database/seed-hr-database';
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

// High-level HR services for dashboard functionality
export const hrServices = {
  /**
   * Check if required HR tables exist and return a list of missing tables
   * @returns {Promise<{success: boolean, missingTables: string[]}>}
   */
  async checkRequiredTables() {
    try {
      console.log('Checking if HR tables exist...');
      const missingTables = [];
      
      // Check each table for existence
      for (const table of REQUIRED_HR_TABLES) {
        try {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
            
          if (error && error.message && error.message.includes('does not exist')) {
            console.warn(`Table ${table} does not exist`);
            missingTables.push(table);
          }
        } catch (error) {
          console.error(`Error checking table ${table}:`, error);
          missingTables.push(table);
        }
      }
      
      return { 
        success: missingTables.length === 0, 
        missingTables 
      };
    } catch (error) {
      console.error('Error checking required tables:', error);
      return { 
        success: false, 
        missingTables: REQUIRED_HR_TABLES,
        error: error.message || 'Unknown error checking tables' 
      };
    }
  },

  /**
   * Create HR database tables if they don't exist
   */
  async createHRTablesIfNotExist() {
    try {
      console.log('Checking if HR database tables exist...');
      
      // Check if hr_departments table exists
      const { error: checkError } = await supabase
        .from('hr_departments')
        .select('id')
        .limit(1);
        
      // If the table doesn't exist, we'll create the basic schema
      if (checkError && checkError.message.includes('relation "hr_departments" does not exist')) {
        console.log('HR database tables do not exist. Creating them...');
        
        // Create departments table
        const { error: deptError } = await supabase.rpc('create_hr_departments_table');
        if (deptError) {
          console.error('Error creating hr_departments table:', deptError);
          
          // Let's create it directly with SQL
          const { error: sqlError } = await supabase.rpc('execute_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS hr_departments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          });
          
          if (sqlError) {
            console.error('Error creating hr_departments table with SQL:', sqlError);
            return { success: false, error: sqlError };
          }
        }
        
        // Create positions table
        const { error: posError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_positions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title VARCHAR(100) NOT NULL,
              department_id UUID REFERENCES hr_departments(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (posError) {
          console.error('Error creating hr_positions table:', posError);
          return { success: false, error: posError };
        }
        
        // Create RAG status tracking for employees
        const { error: ragError } = await supabase.rpc('execute_sql', {
          sql: `
            ALTER TABLE hr_employees 
            ADD COLUMN IF NOT EXISTS rag_status VARCHAR(10) DEFAULT 'green' CHECK (rag_status IN ('green', 'amber', 'red')),
            ADD COLUMN IF NOT EXISTS status_justification TEXT,
            ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
          `
        });
        
        if (ragError) {
          console.error('Error adding RAG status columns to hr_employees table:', ragError);
          return { success: false, error: ragError };
        }
        
        // Create notifications table
        const { error: notifError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS notifications (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              recipient_id UUID REFERENCES auth.users(id),
              title VARCHAR(200) NOT NULL,
              message TEXT,
              is_read BOOLEAN DEFAULT FALSE,
              action_link VARCHAR(200),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (notifError) {
          console.error('Error creating notifications table:', notifError);
          return { success: false, error: notifError };
        }
        
        // Create interventions table
        const { error: interventionError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS interventions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              employee_id UUID REFERENCES hr_employees(id),
              created_by UUID REFERENCES auth.users(id),
              intervention_type VARCHAR(50) NOT NULL CHECK (intervention_type IN ('content_modification', 'remedial_assignment', 'notification', 'other')),
              notes TEXT,
              content TEXT,
              status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'completed')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_interventions_employee_id ON interventions(employee_id);
          `
        });
        
        if (interventionError) {
          console.error('Error creating interventions table:', interventionError);
          return { success: false, error: interventionError };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error checking or creating HR tables:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Initialize database with sample data
   */
  async initializeHRDatabase() {
    try {
      console.log('Importing verifyHRTables function dynamically...');
      
      // Import the utility function dynamically to avoid circular dependencies
      const { verifyHRTables } = await import('../../utils/hrDatabaseUtils');
      
      console.log('Verifying HR tables...');
      const result = await verifyHRTables();
      
      if (!result.success) {
        console.error('Failed to initialize HR database:', result.error);
        return { success: false, error: result.error };
      }
      
      console.log('HR database initialized successfully:', result.message);
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error initializing HR database:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  },
  
  /**
   * Get dashboard metrics 
   */
  async getDashboardMetrics() {
    try {
      // Mock data for dashboard metrics
      const mockMetrics = {
        activeEmployees: 134,
        newEmployees: 5,
        completionRate: 67,
        completionRateChange: 4.2,
        averageEngagement: 85,
        engagementChange: 2.3,
        coursesAssigned: 230,
        newCoursesAssigned: 12,
        ragStatusCounts: {
          green: 98,
          amber: 28,
          red: 8,
          total: 134
        }
      };
      
      return {
        success: true,
        metrics: mockMetrics
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get recent activities for the HR dashboard
   */
  async getRecentActivities() {
    try {
      // First try to load activities from the JSON file
      try {
        console.log('Attempting to load recent activities from JSON...');
        const response = await fetch('/data/dashboard_metrics.json');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.activities && Array.isArray(data.activities)) {
            console.log('Successfully loaded activities from JSON file');
            return data.activities;
          }
        }
      } catch (jsonError) {
        console.error('Error loading activities from JSON:', jsonError);
      }
      
      // Fallback to mock activities if JSON loading fails
      // Mock data for recent activities
      const activities = [
        {
          id: '1',
          type: 'enrollment',
          user: 'Alex Morgan',
          description: 'enrolled in Advanced TypeScript',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'completion',
          user: 'Jordan Lee',
          description: 'completed React State Management',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'assessment',
          user: 'Taylor Swift',
          description: 'scored 92% on Node.js Assessment',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '4',
          type: 'intervention',
          user: 'Chris Walker',
          description: 'moved to amber status - incomplete compliance training',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'warning'
        },
        {
          id: '5',
          type: 'assignment',
          user: 'HR Admin',
          description: 'assigned Leadership Training to 12 employees',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'info'
        }
      ];
      
      return activities;
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  },
  
  /**
   * Update employee RAG status
   */
  async updateEmployeeRAGStatus(employeeId, ragDetails) {
    try {
      const { status, justification, recommendedActions, updatedBy = 'system' } = ragDetails;
      
      // First, get the current employee data
      const { data: employee, error: fetchError } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', employeeId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Prepare the status history entry
      const statusHistoryEntry = {
        status,
        justification,
        recommendedActions: recommendedActions || [],
        lastUpdated: new Date().toISOString(),
        updatedBy
      };
      
      // Prepare the status history array
      const statusHistory = employee.status_history || [];
      statusHistory.push(statusHistoryEntry);
      
      // Update the employee record
      const { data, error } = await supabase
        .from('hr_employees')
        .update({
          rag_status: status,
          status_justification: justification,
          status_updated_at: new Date().toISOString(),
          status_history: statusHistory
        })
        .eq('id', employeeId);
      
      if (error) throw error;
      
      // Create a notification for Amber or Red status
      if (status === 'amber' || status === 'red') {
        await this.createStatusChangeNotification(employee, status, justification);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating employee RAG status:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Create a notification for status changes
   */
  async createStatusChangeNotification(employee, status, justification) {
    try {
      // Create notification for HR
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: null, // Null means for all HR users
          title: `Employee Status Change: ${employee.name}`,
          message: `${employee.name} status changed to ${status.toUpperCase()}. Reason: ${justification}`,
          is_read: false
        });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get employees by RAG status
   */
  async getEmployeesByRAGStatus(status) {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('rag_status', status);
      
      if (error) throw error;
      
      return { success: true, employees: data };
    } catch (error) {
      console.error('Error fetching employees by RAG status:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get employee count by RAG status
   */
  async getEmployeeCountByRAGStatus(status) {
    try {
      const { count, error } = await supabase
        .from('hr_employees')
        .select('id', { count: 'exact', head: true })
        .eq('rag_status', status);
        
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error(`Error getting ${status} employee count:`, error);
      // Return mock data if query fails
      const mockCounts = { green: 98, amber: 28, red: 8 };
      return mockCounts[status] || 0;
    }
  },
  
  /**
   * Create an intervention for an employee
   */
  async createIntervention(interventionData) {
    try {
      const { employeeId, type, notes, content } = interventionData;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'system';
      
      // Create the intervention record
      const { data: intervention, error } = await supabase
        .from('interventions')
        .insert({
          employee_id: employeeId,
          intervention_type: type,
          notes,
          content,
          created_by: userId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create a notification for the employee
      await this.createInterventionNotification(employeeId, type, notes);
      
      return { success: true, intervention };
    } catch (error) {
      console.error('Error creating intervention:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Create a notification for an intervention
   */
  async createInterventionNotification(employeeId, interventionType, notes) {
    try {
      // Get the employee details
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('name, email')
        .eq('id', employeeId)
        .single();
      
      if (employeeError) throw employeeError;
      
      // Create the notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: employeeId,
          title: getInterventionTitle(interventionType),
          message: `HR has created a new intervention for you: ${notes}`,
          is_read: false
        });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error creating intervention notification:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get interventions for an employee
   */
  async getEmployeeInterventions(employeeId) {
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, interventions: data };
    } catch (error) {
      console.error('Error fetching employee interventions:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get all notifications for HR
   */
  async getHRNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .is('recipient_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, notifications: data };
    } catch (error) {
      console.error('Error fetching HR notifications:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }
};

// Helper function for intervention notification titles
function getInterventionTitle(interventionType) {
  switch (interventionType) {
    case 'content_modification':
      return 'Content Update Available';
    case 'remedial_assignment':
      return 'New Learning Assignment';
    case 'notification':
      return 'Message from HR';
    default:
      return 'HR Intervention';
  }
}

export default hrServices; 