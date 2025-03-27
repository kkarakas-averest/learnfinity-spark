import React, { useState, useEffect, useCallback } from "@/lib/react-helpers";
import notificationService, { Notification } from '@/services/notificationService';
import { supabase } from '@/lib/supabase';

export function useNotifications(autoRefresh = true) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }
      
      // Get notifications using the updated interface
      const { data, error: notificationError } = 
        await notificationService.getUserNotifications(user.id);
      
      if (notificationError) {
        throw notificationError;
      }
      
      setNotifications(data || []);
      
      // Get unread count
      const { count, error: countError } = 
        await notificationService.getUnreadCount(user.id);
      
      if (countError) {
        throw countError;
      }
      
      setUnreadCount(count);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error in useNotifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { success, error } = await notificationService.markAsRead(notificationId);
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return { success: true };
      }
      
      throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false };
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false };
      }
      
      const { success, error } = await notificationService.markAllAsRead(user.id);
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        setUnreadCount(0);
        return { success: true };
      }
      
      throw error;
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