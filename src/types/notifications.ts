export type NotificationType = 
  | 'course_update'   // New content or course updates
  | 'feedback_request'  // Request for feedback on completed modules
  | 'status_change'   // Change in RAG status
  | 'intervention'    // HR intervention (additional resources, etc.)
  | 'deadline'        // Upcoming deadlines
  | 'system';         // System messages

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionLink?: string;
  metadata?: Record<string, any>;
} 