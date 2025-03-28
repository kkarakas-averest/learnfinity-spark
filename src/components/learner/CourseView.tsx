import React, { useState, useEffect } from '@/lib/react-helpers';
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
  Video, ArrowUpRight, Download, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { RAGStatus } from '@/types/hr.types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FeedbackForm } from './FeedbackForm';
import CourseContentService, { Course, CourseModule, CourseSection, CourseResource } from '@/services/CourseContentService';
import { supabase } from '@/lib/supabase';

/**
 * CourseView component
 * 
 * Displays a complete course with all its modules and tracks user progress
 */
const CourseView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const courseContentService = CourseContentService.getInstance();
  
  // States
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('content');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Effect to fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Get the current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }
        
        // Fetch course data with all content
        const courseData = await courseContentService.getCourseById(id, session.user.id);
        
        if (courseData) {
          setCourse(courseData);
          // Set the first module as active by default if none is selected
          if (!activeModule && courseData.modules.length > 0) {
            setActiveModule(courseData.modules[0].id);
            // Set the first section as active if available
            if (courseData.modules[0].sections.length > 0) {
              setActiveSection(courseData.modules[0].sections[0].id);
            }
          }
        } else {
          toast({
            title: 'Course not found',
            description: 'The requested course could not be loaded.',
            variant: 'destructive'
          });
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
  }, [id, toast, navigate]);
  
  // Handle module change
  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
    
    // Find the first section in this module
    const module = course?.modules.find(m => m.id === moduleId);
    if (module && module.sections.length > 0) {
      setActiveSection(module.sections[0].id);
    } else {
      setActiveSection(null);
    }
    
    // Reset current tab to content when changing modules
    setCurrentTab('content');
  };
  
  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setCurrentTab('content');
  };
  
  // Handle module completion
  const handleCompleteModule = async () => {
    if (!course || !activeModule || !id) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }
      
      const success = await courseContentService.markContentAsCompleted(
        session.user.id,
        id,
        activeModule,
        'module'
      );
      
      if (success) {
        // Update local state
        setCourse(prevCourse => {
          if (!prevCourse) return null;
          
          return {
            ...prevCourse,
            modules: prevCourse.modules.map(module => 
              module.id === activeModule ? { ...module, isCompleted: true } : module
            ),
            // Recalculate progress based on completed modules
            progress: Math.round(
              ((prevCourse.modules.filter(m => m.isCompleted || m.id === activeModule).length) / 
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
  
  // Handle section completion
  const handleCompleteSection = async (sectionId: string) => {
    if (!course || !id) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }
      
      const success = await courseContentService.markContentAsCompleted(
        session.user.id,
        id,
        sectionId,
        'section'
      );
      
      if (success) {
        // Update local state - mark the section as completed
        setCourse(prevCourse => {
          if (!prevCourse) return null;
          
          return {
            ...prevCourse,
            modules: prevCourse.modules.map(module => ({
              ...module,
              sections: module.sections.map(section => 
                section.id === sectionId ? { ...section, isCompleted: true } : section
              )
            }))
          };
        });
        
        toast({
          title: 'Section completed',
          description: 'Your progress has been saved.',
        });
      }
    } catch (error) {
      console.error('Error completing section:', error);
      toast({
        title: 'Error',
        description: 'Failed to update section status. Please try again.',
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
      const targetModule = course.modules[targetIndex];
      setActiveModule(targetModule.id);
      
      // Also set the first section if available
      if (targetModule.sections.length > 0) {
        setActiveSection(targetModule.sections[0].id);
      } else {
        setActiveSection(null);
      }
      
      setCurrentTab('content');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handle feedback submission
  const handleFeedbackSubmit = async (data: { rating: number; comments: string }) => {
    if (!course) return;
    
    try {
      // For now, just show a success message
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
      });
      setShowFeedbackForm(false);
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
  const renderSectionContent = (section: CourseSection) => {
    switch (section.contentType) {
      case 'text':
        return (
          <div className="prose prose-slate max-w-none">
            {/* In a real app, you'd use a markdown renderer here */}
            <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br>').replace(/#{1,6}\s+(.*)/g, '<h3>$1</h3>') }} />
          </div>
        );
      case 'video':
        return (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-center text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-2" />
              Video content would be embedded here.<br />
              URL: {section.content}
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
  const getResourceIcon = (type: CourseResource['type']) => {
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
        <Button onClick={() => navigate('/learner/courses')}>Return to Courses</Button>
      </div>
    );
  }
  
  const activeModuleData = course.modules.find(m => m.id === activeModule);
  const activeSectionData = activeModuleData?.sections.find(s => s.id === activeSection);
  
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
              onClick={() => navigate('/learner/courses')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
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
            {course.instructor && (
              <div className="flex items-center">
                <span>Instructor: {course.instructor}</span>
              </div>
            )}
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
                    <div key={module.id} className="mb-4">
                      <Button
                        variant={module.id === activeModule ? "default" : "ghost"}
                        className={`w-full justify-start h-auto py-3 px-3 ${
                          module.isCompleted ? "text-muted-foreground hover:text-primary" : ""
                        }`}
                        onClick={() => handleModuleChange(module.id)}
                      >
                        <div className="flex items-center mr-2">
                          {module.isCompleted ? (
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
                            {module.duration} min • {module.sections.length} sections
                          </div>
                        </div>
                      </Button>
                      
                      {/* Show sections for the active module */}
                      {module.id === activeModule && module.sections.length > 0 && (
                        <div className="pl-8 mt-2 space-y-1">
                          {module.sections.map((section, sIndex) => (
                            <Button
                              key={section.id}
                              variant={section.id === activeSection ? "secondary" : "ghost"}
                              size="sm"
                              className={`w-full justify-start text-left ${
                                section.isCompleted ? "text-muted-foreground hover:text-primary" : ""
                              }`}
                              onClick={() => handleSectionChange(section.id)}
                            >
                              <div className="flex items-center mr-2">
                                {section.isCompleted ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <span className="text-xs">{sIndex + 1}.</span>
                                )}
                              </div>
                              <span className="text-sm truncate">{section.title}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Module Content */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            {activeModuleData && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{activeModuleData.title}</CardTitle>
                      <p className="text-muted-foreground mt-1">{activeModuleData.description}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-0 rounded-none border-b">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="m-0">
                    <CardContent className="p-6" id="module-content">
                      {activeSectionData ? (
                        <div>
                          <h3 className="text-xl font-semibold mb-4">{activeSectionData.title}</h3>
                          {renderSectionContent(activeSectionData)}
                          
                          <div className="mt-8 flex justify-between">
                            <Button 
                              variant="outline" 
                              onClick={() => handleCompleteSection(activeSectionData.id)}
                              disabled={activeSectionData.isCompleted}
                            >
                              {activeSectionData.isCompleted ? 'Completed' : 'Mark as Complete'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Select a section to view its content.</p>
                      )}
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="resources" className="m-0">
                    <CardContent className="p-6">
                      {activeModuleData.resources.length > 0 ? (
                        <div className="space-y-4">
                          {activeModuleData.resources.map(resource => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 rounded-md hover:bg-muted transition-colors"
                            >
                              {getResourceIcon(resource.type)}
                              <div>
                                <div className="font-medium">{resource.title}</div>
                                {resource.description && (
                                  <div className="text-sm text-muted-foreground">{resource.description}</div>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No resources available for this module.</p>
                      )}
                    </CardContent>
                  </TabsContent>
                </Tabs>
                
                <CardFooter className="flex justify-between p-6 pt-0">
                  <Button 
                    variant="outline"
                    onClick={() => navigateModule('prev')}
                    disabled={course.modules.indexOf(activeModuleData) === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous Module
                  </Button>
                  
                  <Button
                    onClick={() => handleCompleteModule()}
                    disabled={activeModuleData.isCompleted}
                  >
                    {activeModuleData.isCompleted ? 'Module Completed' : 'Complete & Continue'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Feedback Dialog */}
            <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
              <DialogContent>
                <FeedbackForm onSubmit={handleFeedbackSubmit} />
              </DialogContent>
            </Dialog>
            
            {/* Feedback Button */}
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                className="text-muted-foreground"
                onClick={() => setShowFeedbackForm(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Provide Feedback
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView; 