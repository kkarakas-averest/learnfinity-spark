import { supabase } from '@/lib/supabase';

export interface Conversation {
  id: string;
  employee_id: string;
  hr_user_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  metadata?: any;
  
  // Joined fields
  employee_name?: string;
  hr_user_name?: string;
  unread_count?: number;
  last_message?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'hr' | 'employee';
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
  
  // Joined fields
  sender_name?: string;
}

export interface NewConversation {
  employee_id: string;
  hr_user_id: string;
  title: string;
  initial_message?: string;
  metadata?: any;
}

export interface NewMessage {
  conversation_id: string;
  sender_id: string;
  sender_type: 'hr' | 'employee';
  message: string;
  metadata?: any;
}

/**
 * Messaging Service
 * Handles conversations and messages between HR and employees
 */
const messagingService = {
  /**
   * Get all conversations for a user (HR or employee)
   * @param userId User ID to fetch conversations for
   * @param isHR Whether the user is an HR user
   * @returns List of conversations with additional metadata
   */
  async getConversations(userId: string, isHR: boolean): Promise<{ data: Conversation[], error: Error | null }> {
    try {
      // Build the query based on user type
      let query = supabase
        .from('conversations')
        .select(`
          *,
          employee:employee_id (id, name, first_name, last_name, email, profile_image),
          hr_user:hr_user_id (id, name, email)
        `)
        .order('last_message_at', { ascending: false });
      
      // Filter by the appropriate user ID
      if (isHR) {
        query = query.eq('hr_user_id', userId);
      } else {
        query = query.eq('employee_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get unread count for each conversation
      const enhancedData = await Promise.all((data || []).map(async (conv) => {
        // Get unread message count
        const { count: unreadCount, error: countError } = await supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId); // Only count messages not sent by current user
        
        if (countError) throw countError;
        
        // Get last message
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('conversation_messages')
          .select('message')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (lastMessageError) throw lastMessageError;
        
        // Format employee name
        const employeeName = conv.employee?.name || 
          (conv.employee?.first_name && conv.employee?.last_name 
            ? `${conv.employee.first_name} ${conv.employee.last_name}`
            : 'Unknown Employee');
        
        return {
          ...conv,
          employee_name: employeeName,
          hr_user_name: conv.hr_user?.name || 'HR Staff',
          unread_count: unreadCount || 0,
          last_message: lastMessageData?.[0]?.message || ''
        };
      }));
      
      return { data: enhancedData, error: null };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { data: [], error: error as Error };
    }
  },
  
  /**
   * Get messages for a specific conversation
   * @param conversationId ID of the conversation
   * @param userId Current user ID (for marking messages as read)
   * @returns List of messages in the conversation
   */
  async getMessages(conversationId: string, userId: string): Promise<{ data: Message[], error: Error | null }> {
    try {
      // Get the conversation to verify access
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (convError) throw convError;
      
      if (!convData) {
        throw new Error('Conversation not found');
      }
      
      // Verify the user has access to this conversation
      if (convData.employee_id !== userId && convData.hr_user_id !== userId) {
        throw new Error('You do not have access to this conversation');
      }
      
      // Get all messages in the conversation
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Mark unread messages as read
      const messagesToMark = (data || [])
        .filter(msg => !msg.is_read && msg.sender_id !== userId)
        .map(msg => msg.id);
      
      if (messagesToMark.length > 0) {
        const { error: updateError } = await supabase
          .from('conversation_messages')
          .update({ is_read: true })
          .in('id', messagesToMark);
        
        if (updateError) {
          console.error('Error marking messages as read:', updateError);
        }
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { data: [], error: error as Error };
    }
  },
  
  /**
   * Create a new conversation
   * @param conversation New conversation data
   * @returns The created conversation
   */
  async createConversation(conversation: NewConversation): Promise<{ data: Conversation | null, error: Error | null }> {
    try {
      // First check if a conversation already exists between these users
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('*')
        .eq('employee_id', conversation.employee_id)
        .eq('hr_user_id', conversation.hr_user_id);
      
      if (checkError) throw checkError;
      
      let conversationId;
      
      // If conversation exists, use it
      if (existingConv && existingConv.length > 0) {
        conversationId = existingConv[0].id;
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            employee_id: conversation.employee_id,
            hr_user_id: conversation.hr_user_id,
            title: conversation.title,
            metadata: conversation.metadata || {}
          })
          .select()
          .single();
        
        if (error) throw error;
        
        conversationId = newConv.id;
      }
      
      // If there's an initial message, add it
      if (conversation.initial_message) {
        const { error: msgError } = await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: conversation.hr_user_id,
            sender_type: 'hr',
            message: conversation.initial_message
          });
        
        if (msgError) throw msgError;
      }
      
      // Get the complete conversation data
      const { data: convData, error: getError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (getError) throw getError;
      
      return { data: convData, error: null };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { data: null, error: error as Error };
    }
  },
  
  /**
   * Send a new message in a conversation
   * @param message New message data
   * @returns The created message
   */
  async sendMessage(message: NewMessage): Promise<{ data: Message | null, error: Error | null }> {
    try {
      // Verify the conversation exists and user has access
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', message.conversation_id)
        .single();
      
      if (convError) throw convError;
      
      // Verify the user has access to this conversation
      if (convData.employee_id !== message.sender_id && convData.hr_user_id !== message.sender_id) {
        throw new Error('You do not have permission to send messages in this conversation');
      }
      
      // Create the message
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          sender_type: message.sender_type,
          message: message.message,
          metadata: message.metadata || {}
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Also create a notification for the other party
      try {
        const recipientId = message.sender_type === 'hr' 
          ? convData.employee_id 
          : convData.hr_user_id;
        
        await supabase.from('user_notifications').insert({
          user_id: recipientId,
          title: 'New Message',
          message: message.message.substring(0, 100) + (message.message.length > 100 ? '...' : ''),
          type: 'message',
          priority: 'normal',
          is_read: false,
          metadata: {
            conversation_id: message.conversation_id,
            sender_id: message.sender_id,
            sender_type: message.sender_type
          }
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Continue even if notification fails
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { data: null, error: error as Error };
    }
  },
  
  /**
   * Mark all messages in a conversation as read
   * @param conversationId ID of the conversation
   * @param userId Current user ID
   * @returns Success status
   */
  async markAllAsRead(conversationId: string, userId: string): Promise<{ success: boolean, error: Error | null }> {
    try {
      // Verify the conversation exists and user has access
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (convError) throw convError;
      
      // Verify the user has access to this conversation
      if (convData.employee_id !== userId && convData.hr_user_id !== userId) {
        throw new Error('You do not have access to this conversation');
      }
      
      // Mark all messages not sent by current user as read
      const { error } = await supabase
        .from('conversation_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error as Error };
    }
  },
  
  /**
   * Get unread message count for a user
   * @param userId User ID 
   * @returns Count of unread messages
   */
  async getUnreadMessageCount(userId: string): Promise<{ count: number, error: Error | null }> {
    try {
      // Get conversations the user is part of
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`employee_id.eq.${userId},hr_user_id.eq.${userId}`);
      
      if (convError) throw convError;
      
      if (!conversations || conversations.length === 0) {
        return { count: 0, error: null };
      }
      
      // Get unread message count across all conversations
      const conversationIds = conversations.map(c => c.id);
      const { count, error } = await supabase
        .from('conversation_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', userId);
      
      if (error) throw error;
      
      return { count: count || 0, error: null };
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return { count: 0, error: error as Error };
    }
  }
};

export default messagingService; 