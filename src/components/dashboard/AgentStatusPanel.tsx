import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Types for agent information
interface AgentInfo {
  id: string;
  name: string;
  description: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastActive: string;
  eventCount: number;
}

// Types for agent events
interface AgentEvent {
  id: string;
  sourceAgent: string;
  targetAgent: string | null;
  eventType: string;
  data: any;
  createdAt: string;
  processed: boolean;
}

const AgentStatusPanel = () => {
  const { user, userDetails } = useAuth();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [recentEvents, setRecentEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user has admin access
  const isAdmin = userDetails?.role === 'hr' || userDetails?.role === 'superadmin';
  
  // Fetch agent status on component mount
  useEffect(() => {
    if (user && isAdmin) {
      fetchAgentStatus();
    }
  }, [user, isAdmin]);
  
  // Function to fetch agent status
  const fetchAgentStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch agents from the database
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .order('last_active', { ascending: false });
      
      if (agentError) {
        throw new Error(`Error fetching agents: ${agentError.message}`);
      }
      
      // Fetch recent events
      const { data: eventData, error: eventError } = await supabase
        .from('agent_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (eventError) {
        console.warn('Could not fetch agent events:', eventError);
        // Continue anyway, even if events can't be fetched
      }
      
      // Calculate event counts per agent
      const eventCounts = (agentData || []).reduce((counts: Record<string, number>, agent) => {
        counts[agent.id] = (eventData || []).filter(
          e => e.source_agent === agent.id || e.target_agent === agent.id
        ).length;
        return counts;
      }, {});
      
      // Format agent data
      const formattedAgents: AgentInfo[] = (agentData || []).map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: determineAgentStatus(agent),
        lastActive: agent.last_active,
        eventCount: eventCounts[agent.id] || 0,
      }));
      
      // Format event data
      const formattedEvents: AgentEvent[] = (eventData || []).map(event => ({
        id: event.id,
        sourceAgent: event.source_agent,
        targetAgent: event.target_agent,
        eventType: event.event_type,
        data: event.data,
        createdAt: event.created_at,
        processed: event.processed,
      }));
      
      setAgents(formattedAgents);
      setRecentEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching agent status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  // Determine agent status based on last activity
  const determineAgentStatus = (agent: any): 'idle' | 'running' | 'completed' | 'failed' => {
    const lastActive = new Date(agent.last_active);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
    
    // If agent was active in the last 5 minutes, consider it running
    if (diffMinutes < 5) {
      return 'running';
    }
    
    // If agent was active in the last hour, consider it idle
    if (diffMinutes < 60) {
      return 'idle';
    }
    
    // Otherwise consider it completed (inactive)
    return 'completed';
  };
  
  // Get badge color based on agent status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-500">Idle</Badge>;
      case 'completed':
        return <Badge variant="outline">Inactive</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchAgentStatus();
  };
  
  // If user doesn't have admin access, don't show the component
  if (!isAdmin) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          AI Agent Status
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>
          Monitor the status and activity of AI agents in the system
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="mb-4 p-4 border rounded-md bg-red-50 text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        
        <Tabs defaultValue="agents">
          <TabsList className="mb-4">
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agents">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No agents found. They may not be initialized yet.
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{agent.name}</h3>
                      {getStatusBadge(agent.status)}
                    </div>
                    {agent.description && (
                      <p className="text-sm text-muted-foreground mb-2">{agent.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last active: {formatDate(agent.lastActive)}</span>
                      </div>
                      <div>Events: {agent.eventCount}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="events">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent events found.
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <div key={event.id} className="border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{event.eventType}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span>From: {getAgentName(event.sourceAgent)}</span>
                      {event.targetAgent && (
                        <span>To: {getAgentName(event.targetAgent)}</span>
                      )}
                      {event.processed ? (
                        <Badge variant="outline" className="ml-auto">Processed</Badge>
                      ) : (
                        <Badge className="bg-blue-500 ml-auto">Pending</Badge>
                      )}
                    </div>
                    {event.data && (
                      <div className="mt-2 text-xs bg-muted p-2 rounded-sm font-mono overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        Agents automatically report status updates every few minutes.
      </CardFooter>
    </Card>
  );
  
  // Helper function to get agent name from ID
  function getAgentName(agentId: string): string {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId.substring(0, 8);
  }
};

export default AgentStatusPanel; 