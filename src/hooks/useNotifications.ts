import React, { useState, useEffect, useCallback } from "@/lib/react-helpers";
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types/notifications';

export function useNotifications(autoRefresh = true) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await notificationService.getNotifications();
      
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
      } else {
        setError(result.error || 'Failed to fetch notifications');
      }
      
      // Get unread count
      const countResult = await notificationService.getUnreadCount();
      if (countResult.success) {
        setUnreadCount(countResult.count);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error in useNotifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return result;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false };
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      }
      
      return result;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { success: false };
    }
  }, []);
  
  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    // Setup polling if autoRefresh is true
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(fetchNotifications, 30000); // refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchNotifications, autoRefresh]);
  
  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
} 