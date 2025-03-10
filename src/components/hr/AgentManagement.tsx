import React from "@/lib/react-helpers";
import { Agent } from '@/agents/types';
import { AgentService } from '@/agents/AgentService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  BookOpen,
  FileText
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Define an extended Agent type with additional UI-related properties
interface AgentWithStatus {
  id: string;
  type: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastActivity?: Date;
  healthStatus: 'healthy' | 'warning' | 'error';
  activeTaskCount: number;
  completedTaskCount: number;
}

// Define a task type for the UI
interface AgentTask {
  id: string;
  type: string;
  targetAgent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

// Define a workflow type for the UI
interface Workflow {
  id: string;
  name: string;
  description: string;
  lastRun?: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export default function AgentManagement() {
  const [agents, setAgents] = React.useState<AgentWithStatus[]>([]);
  const [tasks, setTasks] = React.useState<AgentTask[]>([]);
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeAgentId, setActiveAgentId] = React.useState<string | null>(null);
  const [selectedTab, setSelectedTab] = React.useState('agents');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [systemStatus, setSystemStatus] = React.useState<'initializing' | 'running' | 'stopped'>('initializing');
  
  React.useEffect(() => {
    // Load agent data when the component mounts
    loadAgentData();
  }, []);
  
  const loadAgentData = async () => {
    try {
      setIsRefreshing(true);
      
      // In a real implementation, you would fetch this data from your AgentService
      // For now, we'll use mock data
      setTimeout(() => {
        const mockAgents: AgentWithStatus[] = [
          {
            id: '1',
            type: 'manager',
            status: 'running',
            lastActivity: new Date(),
            healthStatus: 'healthy',
            activeTaskCount: 2,
            completedTaskCount: 15,
          },
          {
            id: '2',
            type: 'educator',
            status: 'idle',
            lastActivity: new Date(Date.now() - 15 * 60 * 1000),
            healthStatus: 'healthy',
            activeTaskCount: 0,
            completedTaskCount: 23,
          },
          {
            id: '3',
            type: 'rag-system',
            status: 'idle',
            lastActivity: new Date(Date.now() - 45 * 60 * 1000),
            healthStatus: 'healthy',
            activeTaskCount: 0,
            completedTaskCount: 8,
          },
          {
            id: '4',
            type: 'feedback',
            status: 'idle',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
            healthStatus: 'warning',
            activeTaskCount: 0,
            completedTaskCount: 5,
          }
        ];
        
        const mockTasks: AgentTask[] = [
          {
            id: 't1',
            type: 'generate_content',
            targetAgent: 'educator',
            status: 'in_progress',
            createdAt: new Date(Date.now() - 5 * 60 * 1000),
          },
          {
            id: 't2',
            type: 'determine_rag_status',
            targetAgent: 'rag-system',
            status: 'completed',
            createdAt: new Date(Date.now() - 45 * 60 * 1000),
            completedAt: new Date(Date.now() - 44 * 60 * 1000),
            result: { status: 'green', confidence: 0.95 }
          }
        ];
        
        const mockWorkflows: Workflow[] = [
          {
            id: 'w1',
            name: 'Content Generation',
            description: 'Generate educational content based on topic and audience',
            lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'completed'
          },
          {
            id: 'w2',
            name: 'Learning Path Generation',
            description: 'Create personalized learning paths for employees',
            lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'completed'
          },
          {
            id: 'w3',
            name: 'Employee Intervention',
            description: 'Generate intervention recommendations for at-risk employees',
            status: 'idle'
          }
        ];
        
        setAgents(mockAgents);
        setTasks(mockTasks);
        setWorkflows(mockWorkflows);
        setSystemStatus('running');
        setIsLoading(false);
        setIsRefreshing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error loading agent data:', error);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    loadAgentData();
  };
  
  const handleAgentAction = (agentId: string, action: 'start' | 'pause' | 'restart') => {
    // In a real implementation, you would call your AgentService methods
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        if (action === 'start') return { ...agent, status: 'running' as const };
        if (action === 'pause') return { ...agent, status: 'idle' as const };
        if (action === 'restart') return { ...agent, lastActivity: new Date() };
      }
      return agent;
    }));
  };
  
  const handleSystemAction = (action: 'start' | 'stop' | 'restart') => {
    // In a real implementation, you would call your AgentService methods
    if (action === 'start') setSystemStatus('running');
    if (action === 'stop') setSystemStatus('stopped');
    if (action === 'restart') {
      setSystemStatus('initializing');
      setTimeout(() => setSystemStatus('running'), 2000);
    }
  };
  
  const handleRunWorkflow = (workflowId: string) => {
    // In a real implementation, you would call your AgentService methods
    setWorkflows(prev => prev.map(workflow => {
      if (workflow.id === workflowId) {
        return { ...workflow, status: 'running' as const };
      }
      return workflow;
    }));
    
    // Simulate workflow completion after some time
    setTimeout(() => {
      setWorkflows(prev => prev.map(workflow => {
        if (workflow.id === workflowId) {
          return { 
            ...workflow, 
            status: 'completed' as const,
            lastRun: new Date()
          };
        }
        return workflow;
      }));
    }, 3000);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agent System</h1>
          <p className="text-muted-foreground">
            Monitor and manage your AI agent network
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>System Status:</span>
            {systemStatus === 'running' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                <CheckCircle className="w-3 h-3 mr-1" /> Running
              </Badge>
            )}
            {systemStatus === 'stopped' && (
              <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                <AlertCircle className="w-3 h-3 mr-1" /> Stopped
              </Badge>
            )}
            {systemStatus === 'initializing' && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Initializing
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={systemStatus === 'running' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => handleSystemAction(systemStatus === 'running' ? 'stop' : 'start')}
                >
                  {systemStatus === 'running' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Stop System
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Start System
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {systemStatus === 'running' 
                  ? 'Stop all agents and workflows'
                  : 'Start the agent system'
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="agents">
            <FileText className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <FileText className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <FileText className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <Card key={agent.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="capitalize">
                        {agent.type} Agent
                      </CardTitle>
                      <CardDescription>
                        ID: {agent.id.substring(0, 8)}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        agent.status === 'running' 
                          ? 'bg-green-50 text-green-700' 
                          : agent.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-50 text-gray-700'
                      }
                    >
                      {agent.status === 'running' && <span className="mr-1">●</span>}
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Health</p>
                      <div className="flex items-center">
                        <span 
                          className={`h-2 w-2 rounded-full mr-2 ${
                            agent.healthStatus === 'healthy' 
                              ? 'bg-green-500' 
                              : agent.healthStatus === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span className="text-sm capitalize">
                          {agent.healthStatus}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Last Active</p>
                      <p className="text-sm">
                        {agent.lastActivity 
                          ? new Date(agent.lastActivity).toLocaleTimeString() 
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Tasks Completed</p>
                      <p className="text-sm font-medium">{agent.completedTaskCount}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Active Tasks</p>
                      <p className="text-sm font-medium">{agent.activeTaskCount}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between pt-0">
                  {agent.status === 'running' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAgentAction(agent.id, 'pause')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAgentAction(agent.id, 'start')}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAgentAction(agent.id, 'restart')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                View and manage tasks executed by agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-xs">
                        {task.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>{task.type}</TableCell>
                      <TableCell className="capitalize">{task.targetAgent}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            task.status === 'completed' 
                              ? 'bg-green-50 text-green-700' 
                              : task.status === 'failed'
                                ? 'bg-red-50 text-red-700'
                                : task.status === 'in_progress'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-gray-50 text-gray-700'
                          }
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(task.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {task.completedAt 
                          ? new Date(task.completedAt).toLocaleString() 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Task Details</DialogTitle>
                              <DialogDescription>
                                ID: {task.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Type</p>
                                  <p className="text-sm">{task.type}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Agent</p>
                                  <p className="text-sm capitalize">{task.targetAgent}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Status</p>
                                  <p className="text-sm">{task.status}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Created</p>
                                  <p className="text-sm">{new Date(task.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                              
                              {task.result && (
                                <div>
                                  <p className="text-sm font-medium">Result</p>
                                  <pre className="mt-2 rounded-md bg-slate-950 p-4 text-sm text-slate-50 overflow-x-auto">
                                    {JSON.stringify(task.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {task.error && (
                                <div>
                                  <p className="text-sm font-medium">Error</p>
                                  <div className="mt-2 rounded-md bg-red-50 p-4 text-sm text-red-800">
                                    {task.error}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workflows">
          <div className="grid gap-6">
            {workflows.map(workflow => (
              <Card key={workflow.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{workflow.name}</CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        workflow.status === 'running' 
                          ? 'bg-blue-50 text-blue-700' 
                          : workflow.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : workflow.status === 'failed'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-50 text-gray-700'
                      }
                    >
                      {workflow.status === 'running' && (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      )}
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last run:</span>
                      <span>{workflow.lastRun ? new Date(workflow.lastRun).toLocaleString() : 'Never'}</span>
                    </div>
                    
                    {workflow.status === 'running' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span>65%</span>
                        </div>
                        <Progress value={65} />
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="justify-end pt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={workflow.status === 'running'}
                    onClick={() => handleRunWorkflow(workflow.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Workflow
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Agent System Settings</CardTitle>
              <CardDescription>
                Configure your AI agent system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Settings</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <p className="text-sm font-medium">Enable health monitoring</p>
                    <div className="flex justify-end">
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <p className="text-sm font-medium">Automatic agent recovery</p>
                    <div className="flex justify-end">
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <p className="text-sm font-medium">Task persistence</p>
                    <div className="flex justify-end">
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance Settings</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <p className="text-sm font-medium">Max concurrent tasks</p>
                    <div className="flex justify-end">
                      <input 
                        type="number" 
                        className="w-20 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        defaultValue={5}
                        min={1}
                        max={20}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <p className="text-sm font-medium">Task timeout (seconds)</p>
                    <div className="flex justify-end">
                      <input 
                        type="number" 
                        className="w-20 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        defaultValue={300}
                        min={30}
                        max={3600}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 