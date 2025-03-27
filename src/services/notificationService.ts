import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'normal' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

const notificationService = {
  /**
   * Get all notifications for a user
   * @param userId User ID to fetch notifications for
   * @returns Array of notifications
   */
  async getUserNotifications(userId: string): Promise<{ data: Notification[], error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return { data: [], error: error as Error };
    }
  },

  /**
   * Get unread notifications count for a user
   * @param userId User ID to fetch notifications for
   * @returns Number of unread notifications
   */
  async getUnreadCount(userId: string): Promise<{ count: number, error: Error | null }> {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { count: count || 0, error: null };
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      return { count: 0, error: error as Error };
    }
  },

  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   * @returns Success status
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean, error: Error | null }> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Mark all notifications as read for a user
   * @param userId User ID to mark all notifications as read
   * @returns Success status
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean, error: Error | null }> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Delete a notification
   * @param notificationId ID of the notification to delete
   * @returns Success status
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean, error: Error | null }> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error as Error };
    }
  }
};

export default notificationService; 