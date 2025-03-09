import React, { useEffect, useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { BellIcon } from '@/components/ui/custom-icons';
import { NotificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  userId: string;
  onClick?: () => void;
  className?: string;
  hideZero?: boolean;
}

/**
 * NotificationBadge Component
 * 
 * Displays a bell icon with a badge indicating the number of unread notifications.
 * Clicking on the badge can trigger the notification panel to open.
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  userId,
  onClick,
  className,
  hideZero = true,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize notification service
  const notificationService = NotificationService.getInstance();
  
  // Fetch unread count when component mounts or userId changes
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const count = await notificationService.getUnreadCount(userId);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUnreadCount();
    
    // Set up polling to check for new notifications periodically
    const intervalId = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, [userId, notificationService]);
  
  // Don't render if loading, no count, and hideZero is true
  if (isLoading && unreadCount === 0 && hideZero) {
    return null;
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        'relative',
        className
      )}
      aria-label={`${unreadCount} unread notifications`}
    >
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
};

export default NotificationBadge; 