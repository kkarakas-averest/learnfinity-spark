import { supabase } from '@/lib/supabase';
import { 
  Notification, 
  NotificationInput, 
  NotificationPreferences,
  NotificationPreferencesInput,
  NotificationType,
  NotificationPriority
} from '@/types/notification.types';

/**
 * NotificationService
 * 
 * Handles all notification operations including:
 * - Creating and retrieving notifications
 * - Managing notification preferences
 * - Handling notification delivery
 */
export class NotificationService {
  private static instance: NotificationService;

  // Singleton pattern to ensure only one instance of the service
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private constructor() {
    // Initialize service
    console.log('Notification Service initialized');
    
    // Use setTimeout to avoid blocking the UI thread during initialization
    setTimeout(() => {
      this.cleanupExpiredNotifications()
        .then(() => console.log('Expired notifications cleanup completed'))
        .catch(err => console.error('Error cleaning up expired notifications:', err));
    }, 5000);
  }

  /**
   * Get notifications for a specific user
   */
  async getNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    types?: NotificationType[];
    minPriority?: NotificationPriority;
  } = {}): Promise<Notification[]> {
    try {
      // For demo, we'll use localStorage as a fallback if Supabase is not available
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.getNotificationsFromLocalStorage(userId, options);
      }
      
      // Start building the query
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipientId', userId)
        .order('createdAt', { ascending: false });
      
      // Apply filters from options
      if (options.unreadOnly) {
        query = query.eq('isRead', false);
      }
      
      if (options.types && options.types.length > 0) {
        query = query.in('type', options.types);
      }
      
      if (options.minPriority) {
        const priorityOrder = ['low', 'medium', 'high', 'urgent'];
        const minIndex = priorityOrder.indexOf(options.minPriority);
        if (minIndex !== -1) {
          const allowedPriorities = priorityOrder.slice(minIndex);
          query = query.in('priority', allowedPriorities);
        }
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      return data as Notification[];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return this.getNotificationsFromLocalStorage(userId, options);
    }
  }
  
  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.getUnreadCountFromLocalStorage(userId);
      }
      
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipientId', userId)
        .eq('isRead', false);
      
      if (error) {
        console.error('Error fetching unread count:', error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return this.getUnreadCountFromLocalStorage(userId);
    }
  }
  
  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.markAsReadInLocalStorage(notificationId);
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return this.markAsReadInLocalStorage(notificationId);
    }
  }
  
  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.markAllAsReadInLocalStorage(userId);
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('recipientId', userId)
        .eq('isRead', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return this.markAllAsReadInLocalStorage(userId);
    }
  }
  
  /**
   * Create a new notification
   */
  async createNotification(notification: NotificationInput): Promise<Notification> {
    try {
      // Add required fields
      const newNotification: Notification = {
        ...notification,
        id: notification.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isRead: notification.isRead || false,
      };
      
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.createNotificationInLocalStorage(newNotification);
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(newNotification)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
      
      return data as Notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      // Create in localStorage as a fallback
      const newNotification: Notification = {
        ...notification,
        id: notification.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isRead: notification.isRead || false,
      };
      return this.createNotificationInLocalStorage(newNotification);
    }
  }
  
  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.deleteNotificationFromLocalStorage(notificationId);
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return this.deleteNotificationFromLocalStorage(notificationId);
    }
  }
  
  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.getNotificationPreferencesFromLocalStorage(userId);
      }
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('userId', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found, create default preferences
          return this.createDefaultNotificationPreferences(userId);
        }
        console.error('Error fetching notification preferences:', error);
        throw error;
      }
      
      return data as NotificationPreferences;
    } catch (error) {
      console.error('Error in getNotificationPreferences:', error);
      return this.getNotificationPreferencesFromLocalStorage(userId);
    }
  }
  
  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: NotificationPreferencesInput
  ): Promise<NotificationPreferences> {
    try {
      if (!supabase) {
        console.warn('Supabase not available, using localStorage fallback');
        return this.updateNotificationPreferencesInLocalStorage(userId, preferences);
      }
      
      // Get current preferences or create defaults if they don't exist
      const currentPrefs = await this.getNotificationPreferences(userId);
      
      // Merge with updates
      const updatedPrefs: NotificationPreferences = {
        ...currentPrefs,
        ...preferences,
        userId,
        updatedAt: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(updatedPrefs)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
      }
      
      return data as NotificationPreferences;
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error);
      return this.updateNotificationPreferencesInLocalStorage(userId, preferences);
    }
  }
  
  /**
   * Create default notification preferences for a user
   */
  private async createDefaultNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const defaultPrefs: NotificationPreferences = {
      userId,
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      alertsEnabled: true,
      courseUpdateEnabled: true,
      ragStatusChangeEnabled: true,
      interventionEnabled: true,
      assignmentEnabled: true,
      deadlineEnabled: true,
      feedbackRequestEnabled: true,
      systemEnabled: true,
      minimumPriority: 'low',
      quietHoursEnabled: false,
      digestEnabled: false,
      updatedAt: new Date().toISOString()
    };
    
    try {
      if (!supabase) {
        return this.saveNotificationPreferencesToLocalStorage(userId, defaultPrefs);
      }
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating default notification preferences:', error);
        throw error;
      }
      
      return data as NotificationPreferences;
    } catch (error) {
      console.error('Error in createDefaultNotificationPreferences:', error);
      return this.saveNotificationPreferencesToLocalStorage(userId, defaultPrefs);
    }
  }
  
  /**
   * Clean up expired notifications
   */
  private async cleanupExpiredNotifications(): Promise<void> {
    try {
      if (!supabase) {
        return this.cleanupExpiredNotificationsInLocalStorage();
      }
      
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expiresAt', now)
        .not('expiresAt', 'is', null);
      
      if (error) {
        console.error('Error cleaning up expired notifications:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in cleanupExpiredNotifications:', error);
      return this.cleanupExpiredNotificationsInLocalStorage();
    }
  }
  
  // LocalStorage fallback methods
  
  private getNotificationsFromLocalStorage(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
      minPriority?: NotificationPriority;
    } = {}
  ): Notification[] {
    try {
      const storageKey = `notifications_${userId}`;
      const storedData = localStorage.getItem(storageKey);
      let notifications: Notification[] = storedData ? JSON.parse(storedData) : [];
      
      // Filter by options
      if (options.unreadOnly) {
        notifications = notifications.filter(n => !n.isRead);
      }
      
      if (options.types && options.types.length > 0) {
        notifications = notifications.filter(n => options.types?.includes(n.type));
      }
      
      if (options.minPriority) {
        const priorityOrder = ['low', 'medium', 'high', 'urgent'];
        const minIndex = priorityOrder.indexOf(options.minPriority);
        if (minIndex !== -1) {
          const allowedPriorities = priorityOrder.slice(minIndex);
          notifications = notifications.filter(n => allowedPriorities.includes(n.priority));
        }
      }
      
      // Sort by creation date (newest first)
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Apply pagination
      if (options.offset !== undefined) {
        const end = options.limit ? options.offset + options.limit : undefined;
        notifications = notifications.slice(options.offset, end);
      } else if (options.limit) {
        notifications = notifications.slice(0, options.limit);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }
  
  private getUnreadCountFromLocalStorage(userId: string): number {
    try {
      const notifications = this.getNotificationsFromLocalStorage(userId, { unreadOnly: true });
      return notifications.length;
    } catch (error) {
      console.error('Error counting unread notifications in localStorage:', error);
      return 0;
    }
  }
  
  private markAsReadInLocalStorage(notificationId: string): void {
    try {
      // Find which user's storage contains this notification
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('notifications_'));
      
      for (const key of storageKeys) {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const notifications: Notification[] = JSON.parse(storedData);
          const updatedNotifications = notifications.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          
          if (JSON.stringify(notifications) !== JSON.stringify(updatedNotifications)) {
            localStorage.setItem(key, JSON.stringify(updatedNotifications));
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error marking notification as read in localStorage:', error);
    }
  }
  
  private markAllAsReadInLocalStorage(userId: string): void {
    try {
      const storageKey = `notifications_${userId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const notifications: Notification[] = JSON.parse(storedData);
        const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
        localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('Error marking all notifications as read in localStorage:', error);
    }
  }
  
  private createNotificationInLocalStorage(notification: Notification): Notification {
    try {
      const userId = notification.recipientId || 'system';
      const storageKey = `notifications_${userId}`;
      const storedData = localStorage.getItem(storageKey);
      let notifications: Notification[] = storedData ? JSON.parse(storedData) : [];
      
      // Add new notification
      notifications.push(notification);
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(notifications));
      
      return notification;
    } catch (error) {
      console.error('Error creating notification in localStorage:', error);
      return notification;
    }
  }
  
  private deleteNotificationFromLocalStorage(notificationId: string): void {
    try {
      // Find which user's storage contains this notification
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('notifications_'));
      
      for (const key of storageKeys) {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const notifications: Notification[] = JSON.parse(storedData);
          const filteredNotifications = notifications.filter(n => n.id !== notificationId);
          
          if (notifications.length !== filteredNotifications.length) {
            localStorage.setItem(key, JSON.stringify(filteredNotifications));
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error deleting notification from localStorage:', error);
    }
  }
  
  private getNotificationPreferencesFromLocalStorage(userId: string): NotificationPreferences {
    try {
      const storageKey = `notification_preferences_${userId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        return JSON.parse(storedData) as NotificationPreferences;
      } else {
        // Create default preferences
        const defaultPrefs: NotificationPreferences = {
          userId,
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          alertsEnabled: true,
          courseUpdateEnabled: true,
          ragStatusChangeEnabled: true,
          interventionEnabled: true,
          assignmentEnabled: true,
          deadlineEnabled: true,
          feedbackRequestEnabled: true,
          systemEnabled: true,
          minimumPriority: 'low',
          quietHoursEnabled: false,
          digestEnabled: false,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(defaultPrefs));
        return defaultPrefs;
      }
    } catch (error) {
      console.error('Error getting notification preferences from localStorage:', error);
      // Return a default object
      return {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        alertsEnabled: true,
        courseUpdateEnabled: true,
        ragStatusChangeEnabled: true,
        interventionEnabled: true,
        assignmentEnabled: true,
        deadlineEnabled: true,
        feedbackRequestEnabled: true,
        systemEnabled: true,
        minimumPriority: 'low',
        quietHoursEnabled: false,
        digestEnabled: false,
        updatedAt: new Date().toISOString()
      };
    }
  }
  
  private updateNotificationPreferencesInLocalStorage(
    userId: string, 
    preferences: NotificationPreferencesInput
  ): NotificationPreferences {
    try {
      // Get current preferences
      const currentPrefs = this.getNotificationPreferencesFromLocalStorage(userId);
      
      // Update with new values
      const updatedPrefs: NotificationPreferences = {
        ...currentPrefs,
        ...preferences,
        userId,
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      return this.saveNotificationPreferencesToLocalStorage(userId, updatedPrefs);
    } catch (error) {
      console.error('Error updating notification preferences in localStorage:', error);
      return this.getNotificationPreferencesFromLocalStorage(userId);
    }
  }
  
  private saveNotificationPreferencesToLocalStorage(
    userId: string, 
    preferences: NotificationPreferences
  ): NotificationPreferences {
    try {
      const storageKey = `notification_preferences_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(preferences));
      return preferences;
    } catch (error) {
      console.error('Error saving notification preferences to localStorage:', error);
      return preferences;
    }
  }
  
  private cleanupExpiredNotificationsInLocalStorage(): void {
    try {
      const now = new Date().toISOString();
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('notifications_'));
      
      for (const key of storageKeys) {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const notifications: Notification[] = JSON.parse(storedData);
          const validNotifications = notifications.filter(n => 
            !n.expiresAt || new Date(n.expiresAt).toISOString() >= now
          );
          
          if (notifications.length !== validNotifications.length) {
            localStorage.setItem(key, JSON.stringify(validNotifications));
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired notifications in localStorage:', error);
    }
  }
} 