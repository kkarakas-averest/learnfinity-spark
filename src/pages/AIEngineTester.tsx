import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Check, AlertCircle, FileText, BookOpen, User, BarChart2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Add useState and useEffect
const { useState, useEffect } = React;

// Mock agent service for testing
const mockAgentProcessing = async (agentType: string, taskType: string, data: any): Promise<any> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  switch (agentType) {
    case 'educator':
      if (taskType === 'recommend_resources') {
        return [
          {
            id: 'rec-1',
            title: 'Introduction to Neural Networks',
            description: 'A comprehensive introduction to neural networks and deep learning fundamentals.',
            topics: ['AI', 'Machine Learning', 'Deep Learning'],
            duration: 120,
            difficulty: 'intermediate'
          },
          {
            id: 'rec-2',
            title: 'DevOps for ML Engineers',
            description: 'Learn how to implement CI/CD for machine learning models.',
            topics: ['DevOps', 'MLOps', 'Continuous Integration'],
            duration: 90,
            difficulty: 'advanced'
          }
        ];
      } else if (taskType === 'adapt_content') {
        return {
          insights: [
            {
              type: 'tip',
              text: 'Given your background in software development, you might find it helpful to compare neural networks to object-oriented programming concepts.'
            },
            {
              type: 'challenge',
              text: 'Try implementing a simple neural network from scratch using only NumPy to deepen your understanding.'
            },
            {
              type: 'connection',
              text: 'This content relates to your recent work on data pipelines - consider how these concepts could improve your data preprocessing.'
            }
          ],
          adaptedContent: {
            highlightedSections: ['Introduction', 'Backpropagation'],
            suggestedPath: ['Basic Concepts', 'Implementation', 'Advanced Topics'],
            pace: 'moderate'
          }
        };
      }
      break;
      
    case 'analyzer':
      if (taskType === 'determine_rag_status') {
        return {
          status: 'YELLOW',
          confidence: 0.85,
          reasons: [
            'Completion rate below target (65% vs 80% target)',
            'Assessment scores are adequate but inconsistent',
            'Engagement patterns show gaps in certain skill areas'
          ],
          recommendations: [
            'Provide supplementary materials for data structures',
            'Schedule 1:1 check-in to discuss learning pace',
            'Consider adjusting deadlines for upcoming assignments'
          ]
        };
      }
      break;
      
    case 'integrator':
      if (taskType === 'generate_learning_report') {
        return {
          summary: 'Employee is making good progress across technical skills but shows gaps in leadership modules.',
          skillGaps: ['Team Management', 'Strategic Planning'],
          strengths: ['Technical Implementation', 'Problem Solving'],
          recommendedFocus: 'Leadership & Management',
          courseCompletionTrend: [65, 70, 72, 68, 75],
          dataPoints: {
            coursesStarted: 12,
            coursesCompleted: 8,
            avgScore: 82,
            learningHours: 48
          }
        };
      }
      break;
      
    case 'monitor':
      if (taskType === 'track_engagement') {
        return {
          engagementScore: 78,
          trend: 'improving',
          patterns: {
            timeOfDay: 'morning',
            sessionLength: 'medium',
            completionRate: 'high'
          },
          anomalies: ['Skipped key module on security principles'],
          recommendations: ['Reinforce security content', 'Offer extended access to labs']
        };
      }
      break;
  }
  
  return { error: 'No matching process handler' };
};

// Main component
const AIEngineTester: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('educator');
  const [activeTask, setActiveTask] = useState('');
  const [inputJson, setInputJson] = useState('{\n  "employeeId": "123",\n  "currentStatus": "GREEN",\n  "topics": ["Programming", "ML", "Cloud"],\n  "count": 3\n}');
  const [outputJson, setOutputJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Select task options for each agent
  const taskOptions = {
    educator: [
      { value: 'recommend_resources', label: 'Recommend Learning Resources' },
      { value: 'adapt_content', label: 'Generate Personalized Insights' },
      { value: 'generate_learning_path', label: 'Create Learning Path' }
    ],
    analyzer: [
      { value: 'determine_rag_status', label: 'Determine RAG Status' },
      { value: 'identify_patterns', label: 'Identify Learning Patterns' },
      { value: 'explain_status', label: 'Explain Status Reasons' }
    ],
    integrator: [
      { value: 'generate_learning_report', label: 'Generate Learning Report' },
      { value: 'sync_external_data', label: 'Sync with External Systems' },
      { value: 'consolidate_feedback', label: 'Consolidate Feedback' }
    ],
    monitor: [
      { value: 'track_engagement', label: 'Track User Engagement' },
      { value: 'detect_anomalies', label: 'Detect Learning Anomalies' },
      { value: 'suggest_intervention', label: 'Suggest Interventions' }
    ]
  };
  
  // Set default task when tab changes
  useEffect(() => {
    if (taskOptions[activeTab]?.length > 0) {
      setActiveTask(taskOptions[activeTab][0].value);
      
      // Set default input JSON based on task
      const defaultInputs = {
        recommend_resources: '{\n  "employeeId": "123",\n  "currentStatus": "GREEN",\n  "topics": ["Programming", "ML", "Cloud"],\n  "count": 3\n}',
        adapt_content: '{\n  "employeeId": "456",\n  "contentId": "course-789",\n  "learnerData": {\n    "courseProgress": 45,\n    "learningStyle": "visual"\n  }\n}',
        determine_rag_status: '{\n  "employeeId": "789",\n  "learningHistory": [\n    {"courseId": "c1", "status": "completed", "score": 85},\n    {"courseId": "c2", "status": "in_progress", "progress": 60}\n  ],\n  "targetSkills": ["JavaScript", "React", "Node.js"]\n}',
        generate_learning_report: '{\n  "employeeId": "101",\n  "timeframe": "last_30_days",\n  "includeDetails": true\n}',
        track_engagement: '{\n  "employeeId": "202",\n  "period": "last_14_days",\n  "courseIds": ["c1", "c2", "c3"]\n}'
      };
      
      setInputJson(defaultInputs[taskOptions[activeTab][0].value] || '{\n  // Input data for this task\n}');
      setOutputJson('');
    }
  }, [activeTab]);
  
  // Update input JSON when task changes
  useEffect(() => {
    if (activeTask) {
      const defaultInputs = {
        recommend_resources: '{\n  "employeeId": "123",\n  "currentStatus": "GREEN",\n  "topics": ["Programming", "ML", "Cloud"],\n  "count": 3\n}',
        adapt_content: '{\n  "employeeId": "456",\n  "contentId": "course-789",\n  "learnerData": {\n    "courseProgress": 45,\n    "learningStyle": "visual"\n  }\n}',
        determine_rag_status: '{\n  "employeeId": "789",\n  "learningHistory": [\n    {"courseId": "c1", "status": "completed", "score": 85},\n    {"courseId": "c2", "status": "in_progress", "progress": 60}\n  ],\n  "targetSkills": ["JavaScript", "React", "Node.js"]\n}',
        generate_learning_report: '{\n  "employeeId": "101",\n  "timeframe": "last_30_days",\n  "includeDetails": true\n}',
        track_engagement: '{\n  "employeeId": "202",\n  "period": "last_14_days",\n  "courseIds": ["c1", "c2", "c3"]\n}'
      };
      
      setInputJson(defaultInputs[activeTask] || '{\n  // Input data for this task\n}');
      setOutputJson('');
    }
  }, [activeTask]);
  
  // Handle the test submission
  const handleTestAgent = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Parse the input JSON
      let inputData;
      try {
        inputData = JSON.parse(inputJson);
      } catch (e) {
        throw new Error('Invalid JSON in the input field');
      }
      
      // Call the mock agent processing function
      const result = await mockAgentProcessing(activeTab, activeTask, inputData);
      
      // Format and display the result
      setOutputJson(JSON.stringify(result, null, 2));
      
      toast({
        title: 'AI agent processing complete',
        description: 'The agent has returned a response',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error testing agent:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Processing Error',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get the task label from its value
  const getTaskLabel = (value: string): string => {
    const task = taskOptions[activeTab]?.find(t => t.value === value);
    return task ? task.label : value;
  };
  
  // Get agent icon
  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'educator': return <BookOpen className="h-5 w-5" />;
      case 'analyzer': return <BarChart2 className="h-5 w-5" />;
      case 'integrator': return <FileText className="h-5 w-5" />;
      case 'monitor': return <User className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            AI Engine Tester
          </h1>
          <p className="text-muted-foreground">
            Test and debug AI agent functionality in isolation
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Agent Selection */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Selection</CardTitle>
              <CardDescription>
                Choose an agent and task to test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="educator" className="flex items-center justify-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Educator
                  </TabsTrigger>
                  <TabsTrigger value="analyzer" className="flex items-center justify-center">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Analyzer
                  </TabsTrigger>
                  <TabsTrigger value="integrator" className="flex items-center justify-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Integrator
                  </TabsTrigger>
                  <TabsTrigger value="monitor" className="flex items-center justify-center">
                    <User className="mr-2 h-4 w-4" />
                    Monitor
                  </TabsTrigger>
                </TabsList>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="task">Select Task</Label>
                    <Select
                      value={activeTask}
                      onValueChange={setActiveTask}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskOptions[activeTab]?.map(task => (
                          <SelectItem key={task.value} value={task.value}>
                            {task.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full"
                      onClick={handleTestAgent}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Test Agent'}
                      {!loading && <Sparkles className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Tabs>
              
              <div className="pt-4">
                <Alert>
                  <AlertTitle className="flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Testing Mode
                  </AlertTitle>
                  <AlertDescription>
                    This page uses mock responses to simulate AI agent behavior without consuming real API credits.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Panel: Input and Output */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getAgentIcon(activeTab)}
                <span className="ml-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Agent</span>
                <span className="mx-2">→</span>
                <span className="text-sm font-normal">{getTaskLabel(activeTask)}</span>
              </CardTitle>
              <CardDescription>
                Enter input parameters and view the result
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Section */}
              <div className="space-y-2">
                <Label htmlFor="inputJson">Input Parameters (JSON)</Label>
                <Textarea
                  id="inputJson"
                  value={inputJson}
                  onChange={(e) => setInputJson(e.target.value)}
                  className="h-64 font-mono"
                  placeholder="Enter JSON input for the agent"
                />
              </div>
              
              <Separator />
              
              {/* Output Section */}
              <div className="space-y-2">
                <Label htmlFor="outputJson">Agent Response</Label>
                <div className="relative">
                  <Textarea
                    id="outputJson"
                    value={outputJson}
                    readOnly
                    className={`h-80 font-mono ${!outputJson ? 'text-muted-foreground' : ''}`}
                    placeholder="Agent response will appear here..."
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
                        <p>AI Agent Processing...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIEngineTester; 