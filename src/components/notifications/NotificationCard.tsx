import React, { useState } from '@/lib/react-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ExternalLinkIcon } from '@/components/ui/custom-icons';
import { Notification, NotificationType, NotificationPriority } from '@/types/notification.types';
import { NotificationService } from '@/services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotificationCardProps {
  notification: Notification;
  onClose?: () => void;
  onAction?: (notification: Notification) => void;
  compact?: boolean;
}

/**
 * NotificationCard Component
 * 
 * Displays a single notification with title, message, and actions.
 */
const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onClose,
  onAction,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationService = NotificationService.getInstance();
  
  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType): JSX.Element => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'rag_status_change':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'intervention':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'course_update':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'assignment':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'deadline':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'feedback_request':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get priority class for notification
  const getPriorityClass = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-destructive';
      case 'high':
        return 'border-l-4 border-yellow-500';
      case 'medium':
        return 'border-l-2 border-blue-500';
      case 'low':
      default:
        return '';
    }
  };
  
  // Format date to "X time ago"
  const getTimeAgo = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown time';
    }
  };
  
  // Mark as read when clicked
  const handleMarkAsRead = async () => {
    if (notification.isRead) return;
    
    try {
      setIsLoading(true);
      await notificationService.markAsRead(notification.id);
      // If there's a close handler, call it
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle action button click
  const handleAction = () => {
    handleMarkAsRead();
    
    if (onAction) {
      onAction(notification);
    } else if (notification.actionLink) {
      // If no action handler but actionLink exists, navigate to it
      window.location.href = notification.actionLink;
    }
  };
  
  return (
    <Card 
      className={cn(
        'mb-2 overflow-hidden transition-all duration-200',
        getPriorityClass(notification.priority),
        notification.isRead ? 'bg-gray-50' : 'bg-white',
        compact ? 'p-2' : ''
      )}
      onClick={handleMarkAsRead}
    >
      <CardContent className={cn('flex items-start p-3', compact ? 'p-2' : '')}>
        <div className="mr-3 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className={cn(
              'font-medium',
              notification.isRead ? 'text-gray-700' : 'text-gray-900',
              compact ? 'text-sm' : ''
            )}>
              {notification.title}
            </h3>
            
            <div className="flex gap-1 items-center">
              <span className="text-xs text-gray-500">
                {getTimeAgo(notification.createdAt)}
              </span>
              
              {!notification.isRead && (
                <Badge className="ml-2 h-2 w-2 rounded-full p-0 bg-blue-500" />
              )}
            </div>
          </div>
          
          <p className={cn(
            'mt-1 text-gray-600',
            compact ? 'text-xs' : 'text-sm',
            notification.isRead ? 'text-gray-500' : 'text-gray-600'
          )}>
            {notification.message}
          </p>
          
          {notification.actionText && notification.actionLink && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction();
                }}
              >
                {notification.actionText}
                <ExternalLinkIcon className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCard; 