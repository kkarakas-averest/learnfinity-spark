import React, { useState, useEffect } from '@/lib/react-helpers';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { hrEmployeeService } from '@/services/hrEmployeeService';

interface MessageEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
}

const MessageEmployeeModal: React.FC<MessageEmployeeModalProps> = ({ 
  open, 
  onOpenChange, 
  recipientId,
  recipientName,
  recipientEmail
}) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [sending, setSending] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [initComplete, setInitComplete] = useState(false);

  // Initialize the service when the component mounts and is visible
  useEffect(() => {
    if (!open) return;
    
    const initializeService = async () => {
      try {
        // Check if user_notifications table exists
        const { data, error } = await supabase
          .from('user_notifications')
          .select('id')
          .limit(1);
        
        if (error && error.code === '42P01') {
          console.log('user_notifications table does not exist, creating...');
          // Table doesn't exist, initialize
          await hrEmployeeService.initialize();
          
          // Force create the user_notifications table
          await hrEmployeeService.createMissingTables(['user_notifications']);
        }
        
        setInitComplete(true);
      } catch (err) {
        console.error('Error initializing notification service:', err);
        toast({
          title: 'System Error',
          description: 'Could not initialize notification system. Please try again later.',
          variant: 'destructive'
        });
      }
    };
    
    initializeService();
  }, [open]);

  const handleSendMessage = async () => {
    if (!recipientId) {
      toast({
        title: 'Error',
        description: 'Recipient ID is missing',
        variant: 'destructive',
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message to send',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    
    try {
      // First check if the user_notifications table exists
      const { error: checkError } = await supabase
        .from('user_notifications')
        .select('id')
        .limit(1);
      
      // If table doesn't exist, create it
      if (checkError && checkError.code === '42P01') {
        try {
          // Create the tables using SQL function
          const { error: createTableError } = await supabase.rpc(
            'create_required_tables'
          );
          
          if (createTableError) {
            console.error('Error creating required tables:', createTableError);
            throw createTableError;
          }
        } catch (createError) {
          console.error('Failed to create required tables:', createError);
          // Continue execution - we'll try the fallback approach
        }
      }

      // Prepare notification data
      const notificationData = {
        user_id: recipientId,
        title: 'Message from HR',
        message: message,
        type: 'hr_message',
        priority: priority,
        is_read: false,
        metadata: {
          sent_by: 'HR',
          employee_id: recipientId,
          employee_name: recipientName || 'Employee',
        }
      };
      
      // Try to create notification
      const { data: notificationResult, error: notificationError } = await supabase
        .from('user_notifications')
        .insert([notificationData])
        .select();
      
      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        throw notificationError;
      }
      
      // Prepare a simplified activity record
      const activityData = {
        employee_id: recipientId,
        activity_type: 'hr_message',
        description: message
      };
      
      // Try to insert activity - using try/catch to handle missing columns
      try {
        const { error: activityError } = await supabase
          .from('hr_employee_activities')
          .insert([activityData]);
        
        if (activityError) {
          console.warn('Could not create activity record:', activityError);
          // This is non-critical, so we continue
        }
      } catch (activityErr) {
        console.warn('Error creating activity record:', activityErr);
        // Continue as this is non-critical
      }
      
      toast({
        title: 'Message sent',
        description: `Message sent to ${recipientName || 'employee'}`,
      });
      
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      toast({
        title: 'Error sending message',
        description: 'Could not send message. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName || 'Employee'}</DialogTitle>
          <DialogDescription>
            This message will appear in the employee's notification panel when they log in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value: 'normal' | 'high' | 'urgent') => setPriority(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="email-copy"
              checked={sendEmail}
              onCheckedChange={setSendEmail}
            />
            <Label htmlFor="email-copy">Send email copy</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSendMessage} disabled={sending || !message.trim()}>
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageEmployeeModal; 