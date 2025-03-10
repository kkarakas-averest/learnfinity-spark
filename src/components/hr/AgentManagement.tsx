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
  FileText,
  Edit,
  Clock,
  AlertTriangle,
  BarChart2,
  Loader2
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CourseGenerationRequest, GeneratedCourse } from "@/services/agent-service";

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
  const [courseTitle, setCourseTitle] = React.useState('');
  const [courseDescription, setCourseDescription] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('beginner');
  const [duration, setDuration] = React.useState('medium');
  const [learningObjectives, setLearningObjectives] = React.useState('');
  const [includeQuizzes, setIncludeQuizzes] = React.useState(true);
  const [includeAssignments, setIncludeAssignments] = React.useState(true);
  const [includeResources, setIncludeResources] = React.useState(true);
  const [moduleCount, setModuleCount] = React.useState(3);
  const [generationMode, setGenerationMode] = React.useState('draft');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedCourse, setGeneratedCourse] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [agentStatusData, setAgentStatusData] = React.useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  
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
  
  const handleGenerateCourse = async () => {
    if (!courseTitle.trim()) {
      alert('Please enter a course title');
      return;
    }

    setIsGenerating(true);

    try {
      // Parse learning objectives from the textarea
      const learningObjectivesArray = learningObjectives
        .split('\n')
        .map(obj => obj.trim())
        .filter(obj => obj);
        
      // Create the request object
      const request: CourseGenerationRequest = {
        title: courseTitle,
        description: courseDescription,
        targetAudience: targetAudience as "beginner" | "intermediate" | "advanced",
        duration: duration as "short" | "medium" | "long",
        learningObjectives: learningObjectivesArray,
        includeQuizzes,
        includeAssignments,
        includeResources,
        moduleCount,
        generationMode: generationMode as "draft" | "complete"
      };

      console.log('Sending course generation request:', request);
      
      // Call our API endpoint
      const response = await fetch('/api/agents/course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate course: ${errorData.error}`);
      }

      // Parse the response
      const generatedCourseData = await response.json();
      
      // Update the state with the generated course
      setGeneratedCourse(generatedCourseData);
    } catch (error) {
      console.error('Error generating course:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate course'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetForm = () => {
    setCourseTitle('');
    setCourseDescription('');
    setTargetAudience('beginner');
    setDuration('medium');
    setLearningObjectives('');
    setIncludeQuizzes(true);
    setIncludeAssignments(true);
    setIncludeResources(true);
    setModuleCount(3);
    setGenerationMode('draft');
    setGeneratedCourse(null);
  };
  
  const handleSaveCourse = async () => {
    if (!generatedCourse) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Call the API to save the course
      const response = await fetch('/api/agents/course/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course: generatedCourse }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save course');
      }
      
      const data = await response.json();
      
      // Success message
      setSaveMessage({
        type: 'success',
        text: data.message || 'Course successfully saved to the library!'
      });
      
      // In a real implementation, you would redirect to the course page or show options
      // to customize the course further
    } catch (error) {
      console.error('Error saving course:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save course. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const fetchAgentStatus = React.useCallback(async () => {
    setIsRefreshing(true);
    setStatusError(null);
    
    try {
      const response = await fetch('/api/agents/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch agent status');
      }
      
      const data = await response.json();
      setAgentStatusData(data);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      setStatusError('Failed to fetch agent status. Please try again.');
    } finally {
      setIsRefreshing(false);
      setIsLoadingStatus(false);
    }
  }, []);
  
  React.useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
      setSystemStatus('running');
    }, 3000);
    
    // Fetch agent status
    fetchAgentStatus();
    
    return () => clearTimeout(timer);
  }, [fetchAgentStatus]);
  
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
          <TabsTrigger value="test-creation">
            <FileText className="h-4 w-4 mr-2" />
            Test Course Creation
          </TabsTrigger>
          <TabsTrigger value="agent-status">Agent Status</TabsTrigger>
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
        
        <TabsContent value="test-creation">
          <Card>
            <CardHeader>
              <CardTitle>Test Agent-Generated Course Creation</CardTitle>
              <CardDescription>
                Create a sample course using the multi-agent system to test its functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-6">
                  <div className="col-span-3 space-y-4">
                    <div>
                      <label htmlFor="course-title" className="block text-sm font-medium mb-1">Course Title</label>
                      <input 
                        id="course-title"
                        type="text" 
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Introduction to Artificial Intelligence"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="course-description" className="block text-sm font-medium mb-1">Course Description</label>
                      <textarea 
                        id="course-description"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
                        placeholder="A comprehensive introduction to AI concepts, techniques, and applications..."
                        value={courseDescription}
                        onChange={(e) => setCourseDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="target-audience" className="block text-sm font-medium mb-1">Target Audience</label>
                        <select 
                          id="target-audience"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                        >
                          <option value="beginner">Beginners</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium mb-1">Estimated Duration</label>
                        <select 
                          id="duration"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        >
                          <option value="short">Short (1-2 hours)</option>
                          <option value="medium">Medium (3-5 hours)</option>
                          <option value="long">Long (6+ hours)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="learning-objectives" className="block text-sm font-medium mb-1">Learning Objectives</label>
                      <textarea 
                        id="learning-objectives"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
                        placeholder="- Understand fundamental AI concepts
- Learn about machine learning approaches
- Gain experience with practical AI applications"
                        value={learningObjectives}
                        onChange={(e) => setLearningObjectives(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Options</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="include-quizzes"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            checked={includeQuizzes}
                            onChange={(e) => setIncludeQuizzes(e.target.checked)}
                          />
                          <label htmlFor="include-quizzes" className="ml-2 text-sm">Include Quizzes</label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="include-assignments"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            checked={includeAssignments}
                            onChange={(e) => setIncludeAssignments(e.target.checked)}
                          />
                          <label htmlFor="include-assignments" className="ml-2 text-sm">Include Assignments</label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="include-resources"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            checked={includeResources}
                            onChange={(e) => setIncludeResources(e.target.checked)}
                          />
                          <label htmlFor="include-resources" className="ml-2 text-sm">Include Resources</label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Module Count</h3>
                      <input 
                        type="number" 
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        min="1"
                        max="10"
                        value={moduleCount}
                        onChange={(e) => setModuleCount(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Generation Mode</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="mode-draft"
                            name="generation-mode"
                            className="rounded-full border-gray-300 text-primary focus:ring-primary"
                            checked={generationMode === 'draft'}
                            onChange={() => setGenerationMode('draft')}
                          />
                          <label htmlFor="mode-draft" className="ml-2 text-sm">Draft (Faster)</label>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="mode-complete"
                            name="generation-mode"
                            className="rounded-full border-gray-300 text-primary focus:ring-primary"
                            checked={generationMode === 'complete'}
                            onChange={() => setGenerationMode('complete')}
                          />
                          <label htmlFor="mode-complete" className="ml-2 text-sm">Complete (Slower)</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handleResetForm}>Reset Form</Button>
              <Button 
                onClick={handleGenerateCourse} 
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Generating...
                  </>
                ) : 'Generate Course'}
              </Button>
            </CardFooter>
          </Card>
          
          {generatedCourse && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Course Generation Results</CardTitle>
                <CardDescription>
                  View the course content generated by the AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-4 text-sm">
                  <div className="flex items-center justify-between border-b pb-3 mb-3">
                    <h3 className="text-lg font-medium">{generatedCourse.title}</h3>
                    <Badge variant="outline">{generationMode === 'draft' ? 'Draft' : 'Complete'}</Badge>
                  </div>
                  
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="modules">Modules</TabsTrigger>
                      <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                      <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {generatedCourse.description}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Learning Objectives</h4>
                          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            {generatedCourse.learningObjectives.map((objective: string, index: number) => (
                              <li key={index}>{objective}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Course Structure</h4>
                          <p className="text-sm text-muted-foreground">
                            This course consists of {generatedCourse.modules.length} modules
                            {generatedCourse.quizzes && generatedCourse.quizzes.length > 0 && `, ${generatedCourse.quizzes.length} quizzes`}
                            {generatedCourse.assignments && generatedCourse.assignments.length > 0 && `, ${generatedCourse.assignments.length} practical assignments`}.
                            Estimated completion time: {generatedCourse.estimatedDuration}.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="modules">
                      <div className="space-y-6">
                        {generatedCourse.modules.map((module: any, index: number) => (
                          <div key={module.id} className="rounded-md border p-4">
                            <h4 className="font-medium mb-2">{module.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {module.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Topics:</span> {module.topics.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="quizzes">
                      <div className="space-y-6">
                        {generatedCourse.quizzes && generatedCourse.quizzes.length > 0 ? (
                          generatedCourse.quizzes.map((quiz: any) => (
                            <div key={quiz.id} className="rounded-md border p-4">
                              <h4 className="font-medium mb-2">{quiz.title}</h4>
                              <div className="space-y-3 mt-3">
                                {quiz.questions.map((question: any, qIndex: number) => (
                                  <div key={qIndex} className="space-y-1">
                                    <p className="text-sm font-medium">{qIndex + 1}. {question.question}</p>
                                    <div className="text-sm text-muted-foreground">
                                      {question.options.map((option: string, oIndex: number) => (
                                        <div key={oIndex}>{String.fromCharCode(65 + oIndex)}. {option}</div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            No quizzes were generated for this course.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="raw">
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto text-xs leading-relaxed h-64">
                        {JSON.stringify(generatedCourse, null, 2)}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedCourse, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `${generatedCourse.id}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                >
                  Download JSON
                </Button>
                <Button 
                  onClick={handleSaveCourse}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Saving...
                    </>
                  ) : 'Save to Library'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="agent-status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Status Dashboard</CardTitle>
              <CardDescription>
                Monitor the status and performance of AI agents in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingStatus ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading agent status...</span>
                </div>
              ) : statusError ? (
                <div className="p-6 text-center text-red-500">
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                  <p>{statusError}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={fetchAgentStatus}>
                    Try Again
                  </Button>
                </div>
              ) : agentStatusData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {agentStatusData.agents.map((agent: any) => (
                      <Card 
                        key={agent.id}
                        className={`${
                          agent.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20' : 
                          agent.status === 'busy' ? 'bg-amber-50 dark:bg-amber-900/20' : 
                          'bg-blue-50 dark:bg-blue-900/20'
                        }`}
                      >
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-medium">{agent.name}</CardTitle>
                            <span 
                              className={`px-2 py-1 text-xs rounded-full ${
                                agent.status === 'healthy' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : 
                                agent.status === 'busy' ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' : 
                                'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                              }`}
                            >
                              {agent.status === 'healthy' ? 'Online' : 
                               agent.status === 'busy' ? 'Busy' : 'Idle'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-sm text-muted-foreground">
                            <div className="flex justify-between py-1">
                              <span>Status:</span>
                              <span 
                                className={`font-medium ${
                                  agent.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 
                                  agent.status === 'busy' ? 'text-amber-600 dark:text-amber-400' : 
                                  'text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {agent.status === 'healthy' ? 'Healthy' : 
                                 agent.status === 'busy' ? 'Working' : 'Ready'}
                              </span>
                            </div>
                            {agent.currentTask && (
                              <div className="flex justify-between py-1">
                                <span>Current Task:</span>
                                <span className="font-medium">{agent.currentTask}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-1">
                              <span>Tasks Processed:</span>
                              <span className="font-medium">{agent.tasksProcessed}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span>Last Activity:</span>
                              <span className="font-medium">
                                {new Date(agent.lastActivity).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Recent Tasks */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Agent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {agentStatusData.recentActivity.map((activity: any) => (
                          <div key={activity.id} className="flex items-start space-x-4">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {activity.type === 'content-generation' ? (
                                <Edit className="h-4 w-4" />
                              ) : activity.type === 'risk-identification' ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : (
                                <BarChart2 className="h-4 w-4" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {activity.type === 'content-generation' ? 'Course Content Generation' : 
                                 activity.type === 'risk-identification' ? 'Identified At-Risk Employee' :
                                 'Updated Learning Analytics'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                              <div className="flex items-center pt-1">
                                <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No agent data available.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={fetchAgentStatus}>
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={fetchAgentStatus}>
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Agent Status
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
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
      
      {saveMessage && (
        <div className={`mt-4 p-3 rounded-md ${saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {saveMessage.text}
        </div>
      )}
    </div>
  );
} 