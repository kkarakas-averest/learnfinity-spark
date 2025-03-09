/**
 * Agent Communication Protocol Types
 * Defines the messaging structure for inter-agent communication
 */

import { AgentType, AgentDecisionType } from './agent-state.types';

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Message types for agent communication
 */
export enum MessageType {
  // Task related messages
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  TASK_UPDATE = 'task_update',
  TASK_CANCELLATION = 'task_cancellation',
  
  // Data related messages
  DATA_REQUEST = 'data_request',
  DATA_RESPONSE = 'data_response',
  DATA_UPDATE = 'data_update',
  
  // Coordination messages
  DELEGATION = 'delegation',
  APPROVAL_REQUEST = 'approval_request',
  APPROVAL_RESPONSE = 'approval_response',
  
  // System messages
  HEARTBEAT = 'heartbeat',
  ERROR = 'error',
  WARNING = 'warning',
  NOTIFICATION = 'notification'
}

/**
 * Status of a message
 */
export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

/**
 * Base agent message structure
 */
export interface AgentMessage {
  id: string;
  type: MessageType;
  sender: {
    agentType: AgentType;
    agentId: string;
  };
  recipient: {
    agentType: AgentType;
    agentId: string;
  } | {
    agentType: AgentType;
    broadcast: true;
  };
  timestamp: Date;
  priority: MessagePriority;
  content: any; // Specific to message type
  correlationId?: string; // For linking related messages
  status: MessageStatus;
  metadata?: {
    ttl?: number; // Time to live in seconds
    retries?: number;
    systemGenerated?: boolean;
  };
}

/**
 * Task delegation between agents
 */
export interface TaskDelegation {
  id: string;
  taskType: AgentDecisionType;
  assignor: {
    agentType: AgentType;
    agentId: string;
  };
  assignee: {
    agentType: AgentType;
    agentId: string;
  };
  priority: MessagePriority;
  context: {
    employeeId?: string;
    courseId?: string;
    otherParams?: Record<string, any>;
  };
  instructions: string;
  deadline?: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * System event notification
 */
export interface EventNotification {
  id: string;
  eventType: string;
  source: {
    type: 'agent' | 'system' | 'user';
    id: string;
  };
  timestamp: Date;
  priority: MessagePriority;
  details: any;
  requiresAction: boolean;
  actionType?: string;
  actionDeadline?: Date;
  audiences: {
    agentTypes: AgentType[];
    employeeIds?: string[];
    hrIds?: string[];
  };
  status: 'created' | 'published' | 'delivered' | 'acted_upon' | 'expired';
}

/**
 * Message Queue Statistics
 */
export interface MessageQueueStats {
  totalMessages: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  byStatus: Record<MessageStatus, number>;
  byType: Record<MessageType, number>;
  oldestMessage: Date;
  processingRate: number; // messages per second
  averageLatency: number; // in milliseconds
}

/**
 * Agent communication channel
 */
export interface CommunicationChannel {
  id: string;
  name: string;
  participants: {
    agentType: AgentType;
    agentId: string;
  }[];
  isPrivate: boolean;
  purpose: string;
  messageCount: number;
  lastActivity: Date;
  status: 'active' | 'archived' | 'closed';
  createdAt: Date;
} 