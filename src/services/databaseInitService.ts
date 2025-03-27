import { supabase } from '@/lib/supabase';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { toast } from '@/components/ui/use-toast';

/**
 * Database Initialization Service
 * Handles the creation and verification of required database tables
 */
export const databaseInitService = {
  /**
   * Initialize all required tables for the application
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  async initialize(): Promise<{success: boolean, error?: Error}> {
    try {
      console.log('Initializing database tables...');
      
      // Initialize the HR employee service
      const hrResult = await hrEmployeeService.initialize();
      if (!hrResult.success) {
        console.warn('HR service initialization warning:', hrResult.error);
      }
      
      // Check for user_notifications table
      await this.ensureUserNotificationsTable();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      return { success: false, error: error as Error };
    }
  },
  
  /**
   * Ensure the user_notifications table exists
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  async ensureUserNotificationsTable(): Promise<{success: boolean, error?: Error}> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .select('id')
        .limit(1);
        
      if (error && error.code === '42P01') {
        console.log('Creating user_notifications table...');
        
        // Table doesn't exist, create it
        const sql = `
          CREATE TABLE IF NOT EXISTS user_notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            priority VARCHAR(20) DEFAULT 'normal',
            is_read BOOLEAN DEFAULT false,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        const { error: createError } = await supabase.rpc('execute_sql', { sql });
        
        if (createError) {
          console.error('Failed to create user_notifications table:', createError);
          return { success: false, error: new Error(createError.message) };
        }
        
        console.log('user_notifications table created successfully');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error ensuring user_notifications table:', error);
      return { success: false, error: error as Error };
    }
  }
};

export default databaseInitService; 