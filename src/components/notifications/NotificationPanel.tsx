import React, { useState, useEffect } from '@/lib/react-helpers';
import { Sheet, SheetContent, SheetHeader, SheetTitle, ScrollArea, Button, Tabs, TabsContent, TabsList, TabsTrigger, Spinner } from '@/components/ui';
import { Notification, NotificationPriority, NotificationType } from '@/types/notification.types';
import { NotificationService } from '@/services/notification.service';
import NotificationCard from './NotificationCard';
import { BellIcon, CheckCircleIcon, AlertTriangleIcon, SettingsIcon } from '@/components/ui/custom-icons';

interface NotificationPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * NotificationPanel Component
 * 
 * A slide-out panel that displays user notifications, with tabs for different types.
 */
const NotificationPanel: React.FC<NotificationPanelProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important'>('unread');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const notificationService = NotificationService.getInstance();
  
  // Fetch notifications when the panel opens or the active tab changes
  useEffect(() => {
    if (!isOpen || !userId) return;
    
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const options: {
          unreadOnly?: boolean;
          minPriority?: NotificationPriority;
          limit?: number;
        } = { limit: 20 };
        
        // Apply filters based on active tab
        if (activeTab === 'unread') {
          options.unreadOnly = true;
        } else if (activeTab === 'important') {
          options.minPriority = 'high';
        }
        
        const data = await notificationService.getNotifications(userId, options);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, [isOpen, activeTab, userId, notificationService]);
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId);
      
      // Update local state to mark all as read
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Remove a notification from the local state (used when dismissing)
  const handleRemoveNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  // Get empty state message based on active tab
  const getEmptyStateMessage = (): string => {
    switch (activeTab) {
      case 'unread':
        return "You don't have any unread notifications.";
      case 'important':
        return "You don't have any important notifications.";
      default:
        return "You don't have any notifications yet.";
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'all' | 'unread' | 'important')}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="unread" className="text-xs">
                Unread
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="important" className="text-xs">
                Important
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner className="h-6 w-6" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <AlertTriangleIcon className="h-6 w-6 text-destructive mb-2" />
              <p className="text-sm text-gray-600">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab(activeTab)}>
                Try Again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <CheckCircleIcon className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">{getEmptyStateMessage()}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClose={() => handleRemoveNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-3">
          <Button variant="outline" size="sm" className="w-full" onClick={() => { /* Navigate to settings */ }}>
            <SettingsIcon className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPanel; 