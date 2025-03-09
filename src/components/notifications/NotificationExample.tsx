import React, { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BellIcon } from '@/components/ui/custom-icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { NotificationService } from '@/services/notification.service';
import { NotificationPriority, NotificationType } from '@/types/notification.types';
import NotificationBadge from './NotificationBadge';
import NotificationPanel from './NotificationPanel';

interface NotificationExampleProps {
  userId: string;
}

/**
 * NotificationExample Component
 * 
 * A demonstration component that shows how to use the notification system components
 * and allows creating test notifications.
 */
const NotificationExample: React.FC<NotificationExampleProps> = ({ userId }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [title, setTitle] = useState('New notification');
  const [message, setMessage] = useState('This is a test notification message.');
  const [type, setType] = useState<NotificationType>('system');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  
  const notificationService = NotificationService.getInstance();
  
  const handleCreateNotification = async () => {
    try {
      await notificationService.createNotification({
        recipientId: userId,
        senderId: null, // System-generated notification
        title,
        message,
        type,
        priority,
        isRead: false,
      });
      
      toast({
        title: 'Notification created',
        description: 'A new notification has been created.',
      });
      
      // Reset form
      setTitle('New notification');
      setMessage('This is a test notification message.');
      setType('system');
      setPriority('medium');
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create notification.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification System Demo</CardTitle>
          <CardDescription>
            Test the notification system by creating notifications and viewing them
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex justify-end mb-4">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPanelOpen(true)}
                aria-label="Open notifications"
              >
                <BellIcon className="h-5 w-5" />
              </Button>
              <div className="absolute -top-1 -right-1">
                <NotificationBadge 
                  userId={userId} 
                  onClick={() => setIsPanelOpen(true)}
                  hideWhenZero
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="message">Notification Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <Label>Notification Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label>Priority</Label>
              <RadioGroup value={priority} onValueChange={(value) => setPriority(value as NotificationPriority)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high">High</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent">Urgent</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button onClick={handleCreateNotification}>Create Notification</Button>
        </CardFooter>
      </Card>
      
      <NotificationPanel
        userId={userId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
};

export default NotificationExample; 