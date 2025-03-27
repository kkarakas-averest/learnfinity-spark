import React, { useState, useRef, useEffect } from '@/lib/react-helpers';
import { Conversation, Message } from '@/services/messagingService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatRelative } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationChatProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  currentUserId: string;
  isHR: boolean;
  onSendMessage: (message: string) => void;
}

const ConversationChat: React.FC<ConversationChatProps> = ({
  conversation,
  messages,
  loading,
  currentUserId,
  isHR,
  onSendMessage,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
        <div className="mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-30"
          >
            <path d="M17 6.1H3M21 12.1H3M21 18.1H3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No conversation selected</h3>
        <p className="text-sm max-w-md mt-1">
          Select a conversation from the list or start a new one by messaging an employee.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Conversation header */}
      <div className="border-b p-3 flex items-center">
        <Avatar className="h-9 w-9 mr-2">
          {/* Show employee avatar for HR, HR avatar for employee */}
          {isHR ? (
            conversation.employee && conversation.employee.profile_image ? (
              <AvatarImage src={conversation.employee.profile_image} alt={conversation.employee_name || ""} />
            ) : (
              <AvatarFallback>
                {(conversation.employee_name || "").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )
          ) : (
            <AvatarFallback>HR</AvatarFallback>
          )}
        </Avatar>
        <div className="ml-2">
          <div className="font-medium">{isHR ? conversation.employee_name : conversation.hr_user_name}</div>
          <div className="text-xs text-muted-foreground">{conversation.title}</div>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation by sending a message.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUserId;
              const isHRMessage = message.sender_type === 'hr';

              return (
                <div 
                  key={message.id} 
                  className={cn(
                    "flex items-start space-x-2",
                    isCurrentUser && "flex-row-reverse space-x-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 mt-1">
                    {isHRMessage ? (
                      <AvatarFallback>HR</AvatarFallback>
                    ) : (
                      conversation.employee && conversation.employee.profile_image ? (
                        <AvatarImage 
                          src={conversation.employee.profile_image} 
                          alt={conversation.employee_name || ""}
                        />
                      ) : (
                        <AvatarFallback>
                          {(conversation.employee_name || "").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )
                    )}
                  </Avatar>
                  
                  <div className={cn(
                    "rounded-lg p-3 max-w-[75%]",
                    isCurrentUser 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <div className="break-words whitespace-pre-wrap">{message.message}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {formatRelative(new Date(message.created_at), new Date())}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <div className="border-t p-3 flex items-end">
        <Textarea 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[60px] resize-none flex-1 mr-2"
        />
        <Button 
          onClick={handleSend} 
          size="icon" 
          disabled={!newMessage.trim()}
          className="rounded-full h-9 w-9"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ConversationChat; 