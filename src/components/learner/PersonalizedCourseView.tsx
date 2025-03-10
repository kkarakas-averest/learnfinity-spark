import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Video, FileText, 
  CheckCircle, Clock, BarChart2, Award, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/state';
import { useToast } from '@/components/ui/use-toast';
import { AgentFactory } from '@/agents/AgentFactory';
import { Skeleton } from '@/components/ui/skeleton';

// Add useState and useEffect
const { useState, useEffect } = React;

interface CourseModule {
  id: string;
  title: string;
  description: string;
  sections: CourseSection[];
  isLocked: boolean;
  isCompleted: boolean;
  duration: number; // in minutes
}

interface CourseSection {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'text' | 'quiz' | 'assessment' | 'discussion' | 'exercise';
  content: string;
  isCompleted: boolean;
  duration: number; // in minutes
}

interface PersonalizedInsight {
  type: 'tip' | 'note' | 'connection' | 'challenge';
  text: string;
  moduleId?: string;
  sectionId?: string;
}

const typeIcons = {
  video: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  quiz: <BarChart2 className="h-4 w-4" />,
  assessment: <Award className="h-4 w-4" />,
  discussion: <FileText className="h-4 w-4" />,
  exercise: <FileText className="h-4 w-4" />,
};

const PersonalizedCourseView: React.FC = () => {
  const params = useParams();
  const courseId = params.courseId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('content');
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [enrollmentId, setEnrollmentId] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);

  // Instead, create a simple mock educator agent
  const educatorAgent = {
    processTask: async (task: any) => {
      console.log('Mock educator agent processing task:', task);
      return {
        insights: [
          {
            type: 'tip',
            text: 'Based on your learning style, try taking notes in a mind-map format for this module.'
          },
          {
            type: 'connection',
            text: 'This content connects to your experience in project management from your profile.'
          },
          {
            type: 'challenge',
            text: 'For an extra challenge, try implementing what you learn in this section in a real project.'
          }
        ]
      };
    }
  };

  useEffect(() => {
    if (courseId && user?.id) {
      loadCourseData();
    }
  }, [courseId, user?.id]);

  // Load course data, modules, sections, and enrollment status
  const loadCourseData = async () => {
    setLoading(true);
    try {
      // For demo purposes, use mock data
      setCourse({
        title: "Introduction to Machine Learning",
        description: "Learn the fundamentals of machine learning algorithms and applications."
      });
      
      const mockModules: CourseModule[] = [
        {
          id: "module-1",
          title: "Introduction to AI Concepts",
          description: "Foundational concepts of artificial intelligence",
          isLocked: false,
          isCompleted: false,
          duration: 60,
          sections: [
            {
              id: "section-1-1",
              title: "What is Artificial Intelligence?",
              description: "Overview of AI and its applications",
              contentType: "text",
              content: "<p>Artificial Intelligence (AI) refers to machine-based systems that can make predictions, recommendations, or decisions. This section introduces key AI terminology and concepts.</p>",
              isCompleted: false,
              duration: 15
            },
            {
              id: "section-1-2",
              title: "History of AI Development",
              description: "Timeline of major AI advancements",
              contentType: "video",
              content: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              isCompleted: false,
              duration: 20
            }
          ]
        },
        {
          id: "module-2",
          title: "Machine Learning Fundamentals",
          description: "Core concepts of machine learning",
          isLocked: false,
          isCompleted: false,
          duration: 120,
          sections: [
            {
              id: "section-2-1",
              title: "Types of Machine Learning",
              description: "Supervised, unsupervised, and reinforcement learning",
              contentType: "text",
              content: "<p>This section covers the three main types of machine learning approaches: supervised learning, unsupervised learning, and reinforcement learning.</p>",
              isCompleted: false,
              duration: 30
            },
            {
              id: "section-2-2",
              title: "Quiz: Machine Learning Basics",
              description: "Test your understanding of machine learning concepts",
              contentType: "quiz",
              content: "quiz-content",
              isCompleted: false,
              duration: 15
            }
          ]
        }
      ];
      
      setModules(mockModules);
      setEnrollmentId("mock-enrollment-id");
      setProgress(25);
      
      // Set default active module and section
      if (mockModules.length > 0) {
        setActiveModuleId(mockModules[0].id);
        if (mockModules[0].sections.length > 0) {
          setActiveSectionId(mockModules[0].sections[0].id);
        }
      }
      
      // Load personalized insights
      loadPersonalizedInsights();
      
    } catch (error) {
      console.error('Error loading course:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load personalized insights from AI agent
  const loadPersonalizedInsights = async () => {
    if (!courseId || !user?.id) return;
    
    setLoadingInsights(true);
    try {
      // Use mock insights for demo
      const mockInsights: PersonalizedInsight[] = [
        {
          type: 'tip',
          text: 'Based on your learning style, try taking notes in a mind-map format for this module.'
        },
        {
          type: 'connection',
          text: 'This content connects to your experience in project management from your profile.'
        },
        {
          type: 'challenge',
          text: 'For an extra challenge, try implementing what you learn in this section in a real project.'
        }
      ];
      
      setInsights(mockInsights);
      
      // In real implementation, we would use the educatorAgent:
      // const insightTask = {
      //   type: 'adapt_content',
      //   data: {
      //     employeeId: user.id,
      //     contentId: courseId,
      //     learnerData: {
      //       courseProgress: progress
      //     }
      //   }
      // };
      // const result = await educatorAgent.processTask(insightTask);
      // if (result?.insights) {
      //   setInsights(result.insights);
      // }
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights([{
        type: 'note',
        text: 'Personalized insights are currently unavailable.'
      }]);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Update section completion status
  const markSectionComplete = async (moduleId: string, sectionId: string) => {
    if (!enrollmentId) return;
    
    try {
      // Create a deep copy of modules
      const updatedModules = JSON.parse(JSON.stringify(modules));
      
      // Find the module and section
      const moduleIndex = updatedModules.findIndex((m: CourseModule) => m.id === moduleId);
      if (moduleIndex === -1) return;
      
      const sectionIndex = updatedModules[moduleIndex].sections.findIndex(
        (s: CourseSection) => s.id === sectionId
      );
      if (sectionIndex === -1) return;
      
      // Update the section
      updatedModules[moduleIndex].sections[sectionIndex].isCompleted = true;
      
      // Check if all sections in the module are completed
      const allSectionsCompleted = updatedModules[moduleIndex].sections.every(
        (s: CourseSection) => s.isCompleted
      );
      
      if (allSectionsCompleted) {
        updatedModules[moduleIndex].isCompleted = true;
      }
      
      // Update state
      setModules(updatedModules);
      
      // Calculate new progress percentage
      const totalSections = updatedModules.reduce(
        (sum: number, module: CourseModule) => sum + module.sections.length, 0
      );
      
      const completedSections = updatedModules.reduce(
        (sum: number, module: CourseModule) => 
          sum + module.sections.filter((s: CourseSection) => s.isCompleted).length, 0
      );
      
      const newProgress = Math.round((completedSections / totalSections) * 100);
      setProgress(newProgress);
      
      // In real implementation, we would update the database:
      // const { error } = await supabase
      //   .from('hr_course_enrollments')
      //   .update({
      //     progress: newProgress,
      //     last_activity_at: new Date().toISOString(),
      //     ...(newProgress === 100 ? { 
      //       status: 'completed',
      //       completion_date: new Date().toISOString()
      //     } : {})
      //   })
      //   .eq('id', enrollmentId);
      
      // Show success message
      toast({
        title: 'Progress Saved',
        description: newProgress === 100 
          ? 'Congratulations! You have completed the course.' 
          : 'Your progress has been saved.',
      });
      
      // If completed a section, refresh personalized insights
      loadPersonalizedInsights();
      
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSectionClick = (moduleId: string, sectionId: string) => {
    setActiveModuleId(moduleId);
    setActiveSectionId(sectionId);
    setActiveTab('content');
  };

  // Find active section
  const activeModule = modules.find(m => m.id === activeModuleId);
  const activeSection = activeModule?.sections.find(s => s.id === activeSectionId);

  // Content-specific renderer
  const renderSectionContent = (section: CourseSection) => {
    switch (section.contentType) {
      case 'video':
        return (
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
            <iframe 
              className="w-full h-full rounded-md"
              src={section.content}
              title={section.title}
              allowFullScreen
            ></iframe>
          </div>
        );
      case 'text':
        return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: section.content }} />;
      case 'quiz':
        return (
          <div className="bg-muted p-6 rounded-md">
            <h3 className="text-lg font-medium mb-4">Quiz: {section.title}</h3>
            <p>Quiz content would be rendered here.</p>
            <Button className="mt-4">Start Quiz</Button>
          </div>
        );
      default:
        return <div>{section.content}</div>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48 ml-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-8" />
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Course Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate('/learner')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{course?.title}</h1>
            <p className="text-muted-foreground">{course?.description}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <div className="mr-4">
              <p className="text-sm font-medium">Progress</p>
              <div className="flex items-center">
                <Progress className="w-24 mr-2" value={progress} />
                <span className="text-sm">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sidebar - Course Structure */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-bold mb-4">Course Content</h2>
          
          <div className="bg-muted/30 rounded-md">
            <Accordion type="single" collapsible className="w-full">
              {modules.map((module) => (
                <div key={module.id}>
                  <AccordionTrigger className="px-3">
                    <div className="flex items-center text-left">
                      {module.isCompleted ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <BookOpen className="h-4 w-4 mr-2" />
                      )}
                      <span>{module.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col space-y-1 px-3 pb-2">
                      {module.sections.map((section) => (
                        <button
                          key={section.id}
                          className={`flex items-center text-left p-2 rounded-md text-sm hover:bg-muted transition-colors ${
                            section.id === activeSectionId ? 'bg-muted font-medium' : ''
                          }`}
                          onClick={() => handleSectionClick(module.id, section.id)}
                        >
                          {section.isCompleted ? (
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="h-3 w-3 mr-2 rounded-full border border-current flex-shrink-0" />
                          )}
                          <span className="truncate">{section.title}</span>
                          <span className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
                            {section.duration} min
                          </span>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </div>
              ))}
            </Accordion>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="insights">
                <div className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Insights
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content">
              {activeSection ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{activeSection.title}</h2>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="flex items-center mr-4">
                          {typeIcons[activeSection.contentType]}
                          <span className="ml-1 capitalize">{activeSection.contentType}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{activeSection.duration} min</span>
                        </div>
                      </div>
                    </div>
                    
                    {!activeSection.isCompleted && (
                      <Button 
                        onClick={() => markSectionComplete(activeModuleId, activeSectionId)}
                      >
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="prose max-w-none">
                    {renderSectionContent(activeSection)}
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <Button variant="outline">
                      Previous
                    </Button>
                    <Button>
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-8 rounded-md text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No Content Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Please select a section from the course content menu.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="insights">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" />
                    <CardTitle>Personalized Learning Insights</CardTitle>
                  </div>
                  <CardDescription>
                    AI-generated insights tailored to your learning style and progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInsights ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : insights.length > 0 ? (
                    <div className="space-y-4">
                      {insights.map((insight, index) => (
                        <Alert key={index} className={
                          insight.type === 'tip' ? 'border-blue-500 bg-blue-50' :
                          insight.type === 'connection' ? 'border-purple-500 bg-purple-50' :
                          insight.type === 'challenge' ? 'border-amber-500 bg-amber-50' :
                          'border-gray-500 bg-gray-50'
                        }>
                          <div className="flex items-start">
                            <AlertTitle className="capitalize">{insight.type}</AlertTitle>
                            <AlertDescription>{insight.text}</AlertDescription>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No insights available yet.</p>
                      <Button 
                        variant="outline" 
                        onClick={loadPersonalizedInsights}
                        className="mt-4"
                      >
                        Generate Insights
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedCourseView; 