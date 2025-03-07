export type NotificationType = 
  | 'course_update'   // New content or course updates
  | 'feedback_request'  // Request for feedback on completed modules
  | 'status_change'   // Change in RAG status
  | 'intervention'    // HR intervention (additional resources, etc.)
  | 'deadline'        // Upcoming deadlines
  | 'system'          // System messages
  | string;           // Allow any other string type to be more flexible

export interface Notification {
  id: string;
  recipient_id: string;  // Using snake_case to match DB convention
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  
  // Optional fields - these may not exist in your DB schema
  type?: NotificationType;
  actionLink?: string;
  action_link?: string;  // Alternative name in snake_case
  metadata?: Record<string, any>;
} 