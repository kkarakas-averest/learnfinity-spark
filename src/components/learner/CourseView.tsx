import React from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, Clock, ArrowLeft, ArrowRight, 
  Bookmark, CheckCircle, BarChart2, FileText, 
  Video, ArrowUpRight, Download, MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { RAGStatus } from '@/types/hr.types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FeedbackForm } from './FeedbackForm';
import courseService, { CourseData, CourseModule, Resource } from '@/services/courseService';

/**
 * CourseView component
 * 
 * Displays a complete course with all its modules and tracks user progress
 */
const CourseView: React.FC = () => {
  // @ts-ignore - Using courseId without type parameter
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // States
  const [course, setCourse] = React.useState<CourseData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeModule, setActiveModule] = React.useState<string | null>(null);
  const [bookmarks, setBookmarks] = React.useState<Record<string, number>>({});
  const [currentTab, setCurrentTab] = React.useState('content');
  const [showFeedbackForm, setShowFeedbackForm] = React.useState(false);
  
  // Effect to fetch course data
  React.useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const courseData = await courseService.getCourseById(courseId);
        
        if (courseData) {
          setCourse(courseData);
          // Set the first module as active by default if none is selected
          if (!activeModule && courseData.modules.length > 0) {
            setActiveModule(courseData.modules[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course content. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, toast, activeModule]);
  
  // Handle module change
  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
    // Reset current tab to content when changing modules
    setCurrentTab('content');
  };
  
  // Handle module bookmark
  const handleBookmark = (moduleId: string, timeInSeconds: number) => {
    setBookmarks(prev => ({
      ...prev,
      [moduleId]: timeInSeconds
    }));
    
    // In a real app, save this to the server
    courseService.updateBookmark(courseId || '', moduleId, timeInSeconds)
      .then(success => {
        if (success) {
          toast({
            title: 'Bookmark saved',
            description: `Saved your progress at ${Math.floor(timeInSeconds / 60)}:${(timeInSeconds % 60).toString().padStart(2, '0')}`,
          });
        }
      })
      .catch(error => {
        console.error('Error saving bookmark:', error);
      });
  };
  
  // Handle module completion
  const handleCompleteModule = async () => {
    if (!course || !activeModule) return;
    
    try {
      const success = await courseService.updateModuleCompletion(course.id, activeModule, true);
      
      if (success) {
        // Update local state
        setCourse(prevCourse => {
          if (!prevCourse) return null;
          
          return {
            ...prevCourse,
            modules: prevCourse.modules.map(module => 
              module.id === activeModule ? { ...module, completed: true } : module
            ),
            // Recalculate progress
            progress: Math.round(
              ((prevCourse.modules.filter(m => m.completed || m.id === activeModule).length) / 
              prevCourse.modules.length) * 100
            )
          };
        });
        
        toast({
          title: 'Module completed',
          description: 'Your progress has been saved.',
        });
      }
    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module status. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Navigate to next/previous module
  const navigateModule = (direction: 'next' | 'prev') => {
    if (!course || !activeModule) return;
    
    const currentIndex = course.modules.findIndex(m => m.id === activeModule);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (targetIndex >= 0 && targetIndex < course.modules.length) {
      setActiveModule(course.modules[targetIndex].id);
      setCurrentTab('content');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handle feedback submission
  const handleFeedbackSubmit = async (data: { rating: number; comments: string }) => {
    if (!course) return;
    
    try {
      const success = await courseService.submitFeedback(course.id, data);
      
      if (success) {
        toast({
          title: 'Feedback submitted',
          description: 'Thank you for your feedback!',
        });
        setShowFeedbackForm(false);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Render content based on type
  const renderModuleContent = (module: CourseModule) => {
    switch (module.contentType) {
      case 'text':
        return (
          <div className="prose prose-slate max-w-none">
            {/* In a real app, you'd use a markdown renderer here */}
            <div dangerouslySetInnerHTML={{ __html: module.content.replace(/\n/g, '<br>').replace(/#{1,6}\s+(.*)/g, '<h3>$1</h3>') }} />
          </div>
        );
      case 'video':
        return (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-center text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-2" />
              Video content would be embedded here.<br />
              URL: {module.content}
            </p>
          </div>
        );
      case 'quiz':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Module Quiz</h3>
            <p className="text-gray-500 mb-4">The quiz interface would be implemented here.</p>
            <Button>Start Quiz</Button>
          </div>
        );
      case 'interactive':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Interactive Exercise</h3>
            <p className="text-gray-500 mb-4">Interactive learning component would be displayed here.</p>
            <Button>Launch Interactive Exercise</Button>
          </div>
        );
      default:
        return <p>Content unavailable</p>;
    }
  };
  
  // Render resource icon based on type
  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'file':
        return <Download className="w-4 h-4" />;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course content...</p>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
        <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }
  
  const activeModuleData = course.modules.find(m => m.id === activeModule);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Course Header */}
      <div className="bg-slate-950 text-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-300 hover:text-white mb-4 md:mb-0 -ml-2 md:ml-0"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-3">
              <RAGStatusBadge status={course.ragStatus} />
              <span className="text-sm font-medium">
                {course.progress}% Complete
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          <p className="text-slate-300 mt-2 mb-4 max-w-3xl">{course.description}</p>
          
          <div className="flex flex-wrap gap-4 items-center text-sm text-slate-300">
            <div className="flex items-center">
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {course.level}
              </Badge>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {course.duration}
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {course.modules.length} Modules
            </div>
          </div>
          
          <Progress 
            value={course.progress} 
            className="mt-4 h-2 bg-slate-800" 
          />
        </div>
      </div>
      
      {/* Course Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Navigation Sidebar */}
          <div className="order-2 lg:order-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl">Course Modules</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <div className="space-y-1">
                  {course.modules.map((module, index) => (
                    <Button
                      key={module.id}
                      variant={module.id === activeModule ? "default" : "ghost"}
                      className={`w-full justify-start h-auto py-3 px-3 ${
                        module.completed ? "text-muted-foreground hover:text-primary" : ""
                      }`}
                      onClick={() => handleModuleChange(module.id)}
                    >
                      <div className="flex items-center mr-2">
                        {module.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{module.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {module.duration} • {module.contentType}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Module Content */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            {activeModuleData ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">{activeModuleData.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{activeModuleData.description}</p>
                    </div>
                    <div className="flex items-center mt-4 md:mt-0 space-x-2">
                      <div className="text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 inline-block mr-1" />
                        {activeModuleData.duration}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto md:ml-0"
                        onClick={() => handleBookmark(activeModuleData.id, 0)}
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        Bookmark
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <Separator />
                
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-0 rounded-none border-b">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="m-0">
                    <CardContent className="p-6" id="module-content">
                      {renderModuleContent(activeModuleData)}
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="resources" className="m-0">
                    <CardContent className="p-6">
                      {activeModuleData.resources && activeModuleData.resources.length > 0 ? (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Additional Resources</h3>
                          <ul className="space-y-2">
                            {activeModuleData.resources.map(resource => (
                              <li key={resource.id}>
                                <a 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-md mr-3">
                                    {getResourceIcon(resource.type)}
                                  </div>
                                  <div>
                                    <p className="font-medium">{resource.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                                  </div>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No additional resources available for this module.
                        </p>
                      )}
                    </CardContent>
                  </TabsContent>
                </Tabs>
                
                <CardFooter className="flex justify-between py-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => navigateModule('prev')}
                    disabled={course.modules.findIndex(m => m.id === activeModule) === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous Module
                  </Button>
                  
                  {activeModuleData.completed ? (
                    <Button
                      onClick={() => navigateModule('next')}
                      disabled={course.modules.findIndex(m => m.id === activeModule) === course.modules.length - 1}
                    >
                      Next Module
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleCompleteModule}>
                      Mark as Complete
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Please select a module to view its content.</p>
                </CardContent>
              </Card>
            )}
            
            {/* Feedback Button */}
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                className="flex items-center" 
                onClick={() => setShowFeedbackForm(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Provide Feedback
              </Button>
            </div>
            
            {/* Feedback Dialog */}
            <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
              <DialogContent className="sm:max-w-[500px]">
                <FeedbackForm 
                  courseId={course.id}
                  onSubmit={handleFeedbackSubmit}
                  onCancel={() => setShowFeedbackForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView; 