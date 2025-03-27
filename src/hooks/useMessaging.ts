import { useState, useEffect, useCallback } from '@/lib/react-helpers';
import messagingService, { 
  Conversation, 
  Message, 
  NewConversation, 
  NewMessage 
} from '@/services/messagingService';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export function useMessaging(isHR: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setConversations([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await messagingService.getConversations(user.id, isHR);
      
      if (error) throw error;
      
      setConversations(data || []);
      
      // Update unread count
      const { count } = await messagingService.getUnreadMessageCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [isHR]);
  
  // Load messages for a specific conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    setMessageLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessages([]);
        setMessageLoading(false);
        return;
      }
      
      // Find the conversation in the already loaded conversations
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      } else {
        // If not found (direct navigation), get just this conversation
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            employee:employee_id (id, name, first_name, last_name, email, profile_image),
            hr_user:hr_user_id (id, name, email)
          `)
          .eq('id', conversationId)
          .single();
        
        if (convError) throw convError;
        
        // Format employee name
        const employeeName = convData.employee?.name || 
          (convData.employee?.first_name && convData.employee?.last_name 
            ? `${convData.employee.first_name} ${convData.employee.last_name}`
            : 'Unknown Employee');
        
        setCurrentConversation({
          ...convData,
          employee_name: employeeName,
          hr_user_name: convData.hr_user?.name || 'HR Staff',
        });
      }
      
      // Get messages
      const { data, error } = await messagingService.getMessages(conversationId, user.id);
      
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark all messages as read
      await messagingService.markAllAsRead(conversationId, user.id);
      
      // Refresh unread count
      fetchConversations();
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load messages');
    } finally {
      setMessageLoading(false);
    }
  }, [conversations, fetchConversations]);
  
  // Create a new conversation
  const createConversation = useCallback(async (newConversation: NewConversation) => {
    try {
      const { data, error } = await messagingService.createConversation(newConversation);
      
      if (error) throw error;
      
      if (data) {
        // Refresh conversations to include the new one
        await fetchConversations();
        return data.id;
      }
      
      return null;
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchConversations]);
  
  // Send a message in a conversation
  const sendMessage = useCallback(async (message: string) => {
    if (!currentConversation) {
      toast({
        title: 'Error',
        description: 'No active conversation',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to send messages',
          variant: 'destructive',
        });
        return;
      }
      
      // Determine if sender is HR or employee
      const senderType = isHR ? 'hr' : 'employee';
      
      const newMessage: NewMessage = {
        conversation_id: currentConversation.id,
        sender_id: user.id,
        sender_type: senderType,
        message
      };
      
      // Add message to local state immediately for better UX
      const optimisticMessage: Message = {
        id: 'temp-' + Date.now(),
        conversation_id: currentConversation.id,
        sender_id: user.id,
        sender_type: senderType,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Actually send the message
      const { data, error } = await messagingService.sendMessage(newMessage);
      
      if (error) throw error;
      
      // Replace optimistic message with real one
      if (data) {
        setMessages(prev => 
          prev.map(msg => msg.id === optimisticMessage.id ? data : msg)
        );
      }
      
      // Refresh conversations to update last message
      fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  }, [currentConversation, isHR, fetchConversations]);
  
  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations();
    
    // Set up a refresh interval for conversations
    const interval = setInterval(fetchConversations, 30000); // refresh every 30 sec
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchConversations]);
  
  // Set up real-time message updates
  useEffect(() => {
    if (!currentConversation) return;
    
    // Subscribe to new messages in the current conversation
    const subscription = supabase
      .channel(`conversation-${currentConversation.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'conversation_messages',
        filter: `conversation_id=eq.${currentConversation.id}`
      }, async (payload) => {
        // Only add the message if it's not from the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && payload.new.sender_id !== user.id) {
          const newMessage = payload.new as Message;
          
          // Add the message to state
          setMessages(prev => [...prev, newMessage]);
          
          // Mark it as read
          await messagingService.markAllAsRead(currentConversation.id, user.id);
          
          // Update unread count
          fetchConversations();
        }
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [currentConversation, fetchConversations]);
  
  return {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loading,
    messageLoading,
    error,
    fetchConversations,
    loadConversation,
    createConversation,
    sendMessage,
  };
} 