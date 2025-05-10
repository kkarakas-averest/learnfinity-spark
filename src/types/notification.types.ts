/**
 * Notification Type Definitions
 */

// Types of notifications
export type NotificationType = 
  | 'alert'                // General alerts
  | 'course_update'        // Updates to course content
  | 'rag_status_change'    // RAG status changes
  | 'intervention'         // HR interventions
  | 'assignment'           // New course/content assignments
  | 'deadline'             // Upcoming deadlines
  | 'feedback_request'     // Requests for feedback
  | 'system';              // System notifications

// Priority levels for notifications
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Basic notification structure
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  recipientId: string | null; // null for broadcast notifications
  senderId: string | null;    // null for system-generated notifications
  isRead: boolean;
  priority: NotificationPriority;
  actionLink?: string;        // Optional URL or route to navigate to
  actionText?: string;        // Text to display for action button
  relatedEntityId?: string;   // ID of related entity (course, employee, etc.)
  relatedEntityType?: string; // Type of related entity
  expiresAt?: string;         // Optional expiration date
  metadata?: Record<string, any>; // Additional notification-specific data
}

// Input for creating a new notification
export type NotificationInput = Omit<Notification, 'id' | 'createdAt' | 'isRead'> & {
  id?: string;
  isRead?: boolean;
};

// Notification preference settings
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  
  // Types of notifications to receive
  alertsEnabled: boolean;
  courseUpdateEnabled: boolean;
  ragStatusChangeEnabled: boolean;
  interventionEnabled: boolean;
  assignmentEnabled: boolean;
  deadlineEnabled: boolean;
  feedbackRequestEnabled: boolean;
  systemEnabled: boolean;
  
  // Minimum priority level to receive
  minimumPriority: NotificationPriority;
  
  // Quiet hours (Don't send during these hours)
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // Format: HH:MM (24h)
  quietHoursEnd?: string;   // Format: HH:MM (24h)
  
  // Scheduled digest instead of immediate notification
  digestEnabled: boolean;
  digestFrequency?: 'daily' | 'weekly'; // How often to send digests
  
  updatedAt: string;
}

// Input for updating notification preferences
export type NotificationPreferencesInput = Partial<Omit<NotificationPreferences, 'userId' | 'updatedAt'>>;

// Notification template for generating consistent messages
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  titleTemplate: string;       // Template with {{variables}}
  messageTemplate: string;     // Template with {{variables}}
  defaultPriority: NotificationPriority;
  actionLinkTemplate?: string; // Template for action URL
  actionTextTemplate?: string; // Template for action button text
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 