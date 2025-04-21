
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { AgentEvent } from './interfaces/BaseAgent';

/**
 * AgentEventBus handles communication between agents using Supabase Realtime
 */
export class AgentEventBus {
  private static listeners: Map<string, Set<(event: AgentEvent) => void>> = new Map();
  private static channels: Map<string, any> = new Map();
  
  /**
   * Initialize the event bus
   */
  public static async initialize(): Promise<void> {
    console.info('Initializing Agent Event Bus');
    
    // Create the agent_events table if it doesn't exist
    try {
      const { error } = await supabase.rpc('create_agent_events_if_not_exists');
      if (error) {
        console.warn('Error creating agent_events table:', error);
      }
    } catch (error) {
      console.warn('Agent events table may not exist yet:', error);
    }
  }
  
  /**
   * Publish an event to the bus
   */
  public static async publish(event: Partial<AgentEvent>): Promise<AgentEvent> {
    const fullEvent: AgentEvent = {
      id: event.id || uuidv4(),
      source: event.source || 'system',
      target: event.target,
      type: event.type || 'unknown',
      data: event.data || {},
      timestamp: event.timestamp || new Date(),
    };
    
    // Store in Supabase for persistence and real-time broadcasting
    const { error } = await supabase
      .from('agent_events')
      .insert({
        id: fullEvent.id,
        source_agent: fullEvent.source,
        target_agent: fullEvent.target,
        event_type: fullEvent.type,
        data: fullEvent.data,
        created_at: fullEvent.timestamp.toISOString(),
      });
    
    if (error) {
      console.error('Error publishing event:', error);
      // Fallback to local dispatch if Supabase fails
      this.dispatchLocalEvent(fullEvent);
    }
    
    return fullEvent;
  }
  
  /**
   * Subscribe to events of a specific type
   */
  public static subscribe(
    eventType: string,
    callback: (event: AgentEvent) => void
  ): () => void {
    // Add to local listeners
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);
    
    // Subscribe to Supabase Realtime channel
    if (!this.channels.has(eventType)) {
      const channel = supabase
        .channel(`agent-events-${eventType}`)
        .on(
          'postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'agent_events', filter: `event_type=eq.${eventType}` },
          (payload: any) => {
            const event: AgentEvent = {
              id: payload.new.id,
              source: payload.new.source_agent,
              target: payload.new.target_agent,
              type: payload.new.event_type,
              data: payload.new.data,
              timestamp: new Date(payload.new.created_at),
            };
            this.dispatchLocalEvent(event);
          }
        )
        .subscribe();
      
      this.channels.set(eventType, channel);
    }
    
    // Return unsubscribe function
    return () => {
      const listenersSet = this.listeners.get(eventType);
      if (listenersSet) {
        listenersSet.delete(callback);
        if (listenersSet.size === 0) {
          // If no more listeners, unsubscribe from Supabase channel
          const channel = this.channels.get(eventType);
          if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(eventType);
          }
          this.listeners.delete(eventType);
        }
      }
    };
  }
  
  /**
   * Dispatch event to local listeners
   */
  private static dispatchLocalEvent(event: AgentEvent): void {
    const listenersSet = this.listeners.get(event.type);
    if (listenersSet) {
      listenersSet.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
}
