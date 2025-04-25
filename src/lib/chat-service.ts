/**
 * Chat Service
 * 
 * This service handles communication with the chat API endpoints.
 * It provides a consistent interface for sending messages to both NextJS and Vercel serverless endpoints.
 */

import { supabase } from '@/lib/supabase';

// Message interface
export interface ChatMessage {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Employee context interface
export interface EmployeeContext {
  employeeId?: string;
  name?: string;
  position?: string;
  department?: string;
  skills?: Array<{
    skill_name: string;
    proficiency_level: string;
  }>;
  missingSkills?: Array<{
    skill_name: string;
    gap_level?: string;
  }>;
  career?: {
    goals?: string;
    aspirations?: string;
  };
}

// Chat API service
export const chatService = {
  /**
   * Send messages to the chat API
   */
  async sendMessages(
    messages: ChatMessage[],
    employeeContext?: EmployeeContext
  ): Promise<{
    response?: string;
    error?: string;
    debug?: any;
  }> {
    try {
      console.log(`Sending ${messages.length} messages to chat API`);
      
      // Get authentication token if logged in
      let token = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
      }

      // Determine which API endpoint to use
      // Try the Edge function endpoint first
      const API_ENDPOINTS = [
        '/api/groq/chat',           // Try Edge function first
        '/api/chat/conversation',   // Fall back to NextJS API route
      ];
      
      let response = null;
      let errorMessage = '';
      
      // Try each endpoint in sequence until one works
      for (const endpoint of API_ENDPOINTS) {
        try {
          console.log(`Attempting to use chat endpoint: ${endpoint}`);
          
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              messages,
              employeeContext
            })
          });
          
          if (response.ok) {
            console.log(`Chat endpoint ${endpoint} responded successfully`);
            break;
          } else {
            const errorData = await response.json();
            errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
            console.warn(`Chat endpoint ${endpoint} failed: ${errorMessage}`);
            // Continue to try next endpoint
          }
        } catch (endpointError) {
          console.warn(`Error with endpoint ${endpoint}:`, endpointError);
          // Continue to next endpoint
        }
      }
      
      // If no endpoint worked, throw error
      if (!response || !response.ok) {
        throw new Error(errorMessage || 'All chat API endpoints failed');
      }
      
      // Parse and return the response
      const data = await response.json();
      
      if (data.error) {
        console.error('Chat API returned error:', data.error);
        return { error: data.error, debug: data.debug };
      }
      
      return { 
        response: data.response,
        debug: data.debug
      };
    } catch (error: any) {
      console.error('Error in chat service:', error);
      return { 
        error: error.message || 'Unknown error communicating with chat service',
        debug: { error: error.toString(), stack: error.stack }
      };
    }
  },
}; 