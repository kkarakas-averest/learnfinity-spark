import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/notifications';

export const notificationService = {
  /**
   * Get notifications for the current user
   */
  async getNotifications(limit = 20): Promise<{
    success: boolean;
    notifications?: Notification[];
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Map the data to ensure compatibility with our interface
      const notifications = data.map(notification => ({
        ...notification,
        // Ensure consistency with our frontend model regardless of DB structure
        id: notification.id,
        recipient_id: notification.recipient_id,
        title: notification.title || 'Notification',
        message: notification.message || '',
        is_read: !!notification.is_read,
        created_at: notification.created_at,
        actionLink: notification.action_link || notification.actionLink,
      }));
      
      return { 
        success: true, 
        notifications 
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  
  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  
  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  
  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      
      return { 
        success: true, 
        count: count || 0 
      };
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return { 
        success: false, 
        error: error.message, 
        count: 0 
      };
    }
  }
}; 