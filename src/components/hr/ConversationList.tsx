import React from '@/lib/react-helpers';
import { Conversation } from '@/services/messagingService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string | null;
  loading: boolean;
  onSelectConversation: (conversationId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  loading,
  onSelectConversation,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-muted-foreground">
        <Mail className="h-8 w-8 mb-2 opacity-50" />
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Messages with employees will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="divide-y">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={cn(
              "flex items-start space-x-3 p-3 w-full text-left hover:bg-accent/50 transition-colors",
              activeConversationId === conversation.id && "bg-accent"
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <Avatar className="h-10 w-10 mt-1">
              {conversation.employee && conversation.employee.profile_image ? (
                <AvatarImage src={conversation.employee.profile_image} alt={conversation.employee_name || ""} />
              ) : (
                <AvatarFallback>
                  {(conversation.employee_name || "").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="font-medium truncate">
                  {conversation.employee_name}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mt-1 truncate">
                {conversation.last_message || "No messages yet"}
              </div>
              
              <div className="flex items-center mt-1">
                {conversation.unread_count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs py-0 h-5"
                  >
                    {conversation.unread_count} new
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ConversationList; 