import React, { useState, useEffect } from '@/lib/react-helpers';
import { useMessaging } from '@/hooks/useMessaging';
import { useHRAuth } from '@/state';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NewConversation } from '@/services/messagingService';
import { Mail } from 'lucide-react';
import ConversationList from './ConversationList';
import ConversationChat from './ConversationChat';
import NewConversationDialog from '@/components/hr/NewConversationDialog';

interface MessagingInterfaceProps {
  initialEmployeeId?: string;
  variant?: 'full' | 'compact';
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({ 
  initialEmployeeId,
  variant = 'full' 
}) => {
  // Since hrUser doesn't have an id, we'll use the authenticated user's id
  const { hrUser, isAuthenticated } = useHRAuth();
  const [userId, setUserId] = useState<string>('');
  
  // Get the actual user ID from Supabase
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    if (isAuthenticated) {
      fetchUserId();
    }
  }, [isAuthenticated]);
  
  const { 
    conversations, 
    messages, 
    currentConversation,
    loading, 
    messageLoading,
    loadConversation,
    createConversation,
    sendMessage,
  } = useMessaging(true); // true means is HR

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    return conversation.employee_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // If initialEmployeeId is provided, create and load a conversation with that employee
  useEffect(() => {
    if (initialEmployeeId && userId && conversations.length > 0) {
      // Check if conversation with this employee already exists
      const existingConversation = conversations.find(c => c.employee_id === initialEmployeeId);
      if (existingConversation) {
        loadConversation(existingConversation.id);
      } else {
        // Create a new conversation
        const newConversation: NewConversation = {
          employee_id: initialEmployeeId,
          hr_user_id: userId,
          title: 'HR Communication',
        };
        createConversation(newConversation)
          .then(conversationId => {
            if (conversationId) {
              loadConversation(conversationId);
            }
          });
      }
    }
  }, [initialEmployeeId, userId, conversations, createConversation, loadConversation]);

  const handleCreateConversation = async (employeeId: string, initialMessage?: string) => {
    if (!userId) return;
    
    const newConversation: NewConversation = {
      employee_id: employeeId,
      hr_user_id: userId,
      title: 'HR Communication',
      initial_message: initialMessage
    };
    
    const conversationId = await createConversation(newConversation);
    if (conversationId) {
      loadConversation(conversationId);
      setShowNewConversationDialog(false);
    }
  };

  // Compact view just shows a conversation with the specified employee
  if (variant === 'compact' && initialEmployeeId) {
    return (
      <Card className="h-[500px] border">
        <ConversationChat
          conversation={currentConversation}
          messages={messages}
          loading={messageLoading}
          currentUserId={userId}
          isHR={true}
          onSendMessage={sendMessage}
        />
      </Card>
    );
  }

  // Full view shows both conversation list and chat
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-100px)] gap-0 border rounded-md overflow-hidden">
      {/* Left sidebar with conversations */}
      <div className="md:col-span-1 border-r">
        <div className="p-3 border-b">
          <h2 className="text-lg font-medium mb-3">Messages</h2>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <Input 
                placeholder="Search employees..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowNewConversationDialog(true)}
              title="New Conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </Button>
          </div>
        </div>
        
        <ConversationList 
          conversations={filteredConversations}
          activeConversationId={currentConversation?.id}
          loading={loading}
          onSelectConversation={loadConversation}
        />
      </div>
      
      {/* Right side with current conversation */}
      <div className="md:col-span-2 flex flex-col">
        <ConversationChat
          conversation={currentConversation}
          messages={messages}
          loading={messageLoading}
          currentUserId={userId}
          isHR={true}
          onSendMessage={sendMessage}
        />
      </div>
      
      {/* New conversation dialog */}
      <NewConversationDialog 
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        onCreateConversation={handleCreateConversation}
      />
    </div>
  );
};

export default MessagingInterface; 