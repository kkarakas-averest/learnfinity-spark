import React, { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '../ui/button';
import { BellIcon, CheckCircleIcon } from '@/components/ui/custom-icons';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { toast } from '../ui/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import notificationService, { Notification } from '@/services/notificationService';
import { supabase } from '@/lib/supabase';

const UserNotifications: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      // Get notifications
      const { data: notificationsData, error: notificationsError } = 
        await notificationService.getUserNotifications(user.id);
      
      if (notificationsError) throw notificationsError;
      
      // Get unread count
      const { count: unreadCountData, error: countError } = 
        await notificationService.getUnreadCount(user.id);
      
      if (countError) throw countError;
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { success, error } = await notificationService.markAllAsRead(user.id);
      
      if (!success) throw error;
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { success, error } = await notificationService.markAsRead(notificationId);
      
      if (!success) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up a refresh interval
    const intervalId = setInterval(fetchNotifications, 60000); // Refresh every minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8">
              <CheckCircleIcon className="h-4 w-4 mr-1" /> Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map(notification => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className={`cursor-default px-4 py-3 ${!notification.is_read ? 'bg-accent/30' : ''}`}
                  onMouseEnter={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                    {notification.type === 'hr_message' && (
                      <Badge 
                        variant={notification.priority === 'high' ? 'destructive' : 
                              notification.priority === 'urgent' ? 'destructive' : 'outline'} 
                        className="mt-1"
                      >
                        {notification.priority === 'high' ? 'High Priority' : 
                         notification.priority === 'urgent' ? 'Urgent' : 'HR Message'}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
        <CardFooter className="flex justify-center border-t p-3">
          <Button variant="ghost" size="sm" className="w-full h-8">
            View all notifications
          </Button>
        </CardFooter>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNotifications; 