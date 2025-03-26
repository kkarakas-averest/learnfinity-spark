
/**
 * Standard message format for agent communication
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}
