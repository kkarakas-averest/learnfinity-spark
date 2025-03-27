import React, { useState, useEffect } from '@/lib/react-helpers';
import { useRouter } from 'next/router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { 
  BookOpen, Clock, ArrowLeft, ArrowRight, 
  Bookmark, CheckCircle, BarChart2, FileText, 
  Video, ArrowUpRight, Download, MessageSquare,
  Calendar
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  contentType: 'text' | 'video' | 'quiz' | 'interactive';
  content: string;
  resources: Resource[];
  completed: boolean;
  duration: number;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  progress: number;
  modules: CourseModule[];
  ragStatus: 'green' | 'amber' | 'red';
  estimatedDuration: number;
  dueDate: string | null;
  lastAccessed: string | null;
}

/**
 * FeedbackForm component (simplified version)
 */
const FeedbackForm: React.FC<{
  onSubmit: (data: { rating: number; comments: string }) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comments });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                rating >= value ? 'bg-primary text-white' : 'bg-muted'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Comments</label>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Share your thoughts about this course..."
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={rating === 0}>
          Submit Feedback
        </Button>
      </div>
    </form>
  );
};

/**
 * CourseDetailsPage component
 * 
 * Displays a complete course with all its modules and tracks user progress
 */
const CourseDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id: courseId } = router.query;
  
  // States
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, number>>({});
  const [currentTab, setCurrentTab] = useState('content');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Effect to fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || typeof courseId !== 'string') return;
      
      try {
        setLoading(true);
        
        // Fetch course and enrollment data from Supabase
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            course:courses (
              id,
              title,
              description,
              thumbnail_url,
              estimated_duration
            ),
            progress,
            rag_status,
            due_date,
            last_accessed
          `)
          .eq('course_id', courseId)
          .single();
          
        if (enrollmentError) throw enrollmentError;
        
        // Fetch course modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            id,
            title,
            description,
            content_type,
            content,
            duration,
            completed,
            resources:course_resources (
              id,
              title,
              type,
              url
            )
          `)
          .eq('course_id', courseId)
          .order('sequence', { ascending: true });
          
        if (modulesError) throw modulesError;
        
        if (enrollmentData && modulesData) {
          const courseData = enrollmentData.course as any;
          
          // Format the course data
          const formattedCourse: CourseData = {
            id: courseId,
            title: courseData.title,
            description: courseData.description,
            thumbnailUrl: courseData.thumbnail_url,
            progress: enrollmentData.progress || 0,
            ragStatus: (enrollmentData.rag_status || 'green').toLowerCase() as 'green' | 'amber' | 'red',
            estimatedDuration: courseData.estimated_duration || 0,
            dueDate: enrollmentData.due_date,
            lastAccessed: enrollmentData.last_accessed,
            modules: modulesData.map(module => ({
              id: module.id,
              title: module.title,
              description: module.description,
              contentType: module.content_type as CourseModule['contentType'],
              content: module.content,
              duration: module.duration || 0,
              completed: module.completed || false,
              resources: module.resources || []
            }))
          };
          
          setCourse(formattedCourse);
          
          // Set the first module as active by default if none is selected
          if (!activeModule && formattedCourse.modules.length > 0) {
            setActiveModule(formattedCourse.modules[0].id);
          }
          
          // Update last accessed timestamp
          updateLastAccessed(courseId);
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
  }, [courseId, activeModule]);
  
  // Update the last accessed timestamp
  const updateLastAccessed = async (courseId: string) => {
    try {
      await supabase
        .from('course_enrollments')
        .update({ last_accessed: new Date().toISOString() })
        .eq('course_id', courseId);
    } catch (error) {
      console.error('Error updating last accessed timestamp:', error);
    }
  };
  
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
    
    // Save bookmark to database
    try {
      supabase
        .from('module_bookmarks')
        .upsert({
          user_id: '', // TODO: Insert actual user ID from auth
          module_id: moduleId,
          time_seconds: timeInSeconds,
          updated_at: new Date().toISOString()
        });
        
      toast({
        title: 'Bookmark saved',
        description: `Saved your progress at ${Math.floor(timeInSeconds / 60)}:${(timeInSeconds % 60).toString().padStart(2, '0')}`,
      });
    } catch (error) {
      console.error('Error saving bookmark:', error);
    }
  };
  
  // Handle module completion
  const handleCompleteModule = async () => {
    if (!course || !activeModule || typeof courseId !== 'string') return;
    
    try {
      // Update the module completion status
      await supabase
        .from('course_modules')
        .update({ completed: true })
        .eq('id', activeModule);
        
      // Update local state
      setCourse(prevCourse => {
        if (!prevCourse) return null;
        
        const updatedModules = prevCourse.modules.map(module => 
          module.id === activeModule ? { ...module, completed: true } : module
        );
        
        const completedCount = updatedModules.filter(m => m.completed).length;
        const newProgress = Math.round((completedCount / updatedModules.length) * 100);
        
        // Update overall course progress
        supabase
          .from('course_enrollments')
          .update({ 
            progress: newProgress,
            completed_modules: completedCount
          })
          .eq('course_id', courseId);
        
        return {
          ...prevCourse,
          modules: updatedModules,
          progress: newProgress
        };
      });
      
      toast({
        title: 'Module completed',
        description: 'Your progress has been saved.',
      });
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
    if (!course || typeof courseId !== 'string') return;
    
    try {
      await supabase
        .from('course_feedback')
        .insert({
          course_id: courseId,
          user_id: '', // TODO: Insert actual user ID from auth
          rating: data.rating,
          comments: data.comments,
          created_at: new Date().toISOString()
        });
        
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
        <Spinner size="lg" />
        <span className="ml-3">Loading course content...</span>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-2">Course not found</h2>
        <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push('/learner/profile')}>
          Back to Profile
        </Button>
      </div>
    );
  }
  
  const currentModule = course.modules.find(m => m.id === activeModule);
  
  return (
    <div className="container mx-auto py-6 px-4">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => router.push('/learner/profile')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Profile
      </Button>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar - module navigation */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Course Modules</CardTitle>
              <div className="mt-1 text-sm text-muted-foreground">
                <Progress 
                  value={course.progress} 
                  className="h-2 mb-2" 
                  aria-label="Course Progress"
                />
                <div className="flex justify-between">
                  <span>Progress: {course.progress}%</span>
                  <span>{course.modules.filter(m => m.completed).length}/{course.modules.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {course.modules.map((module, index) => (
                  <li 
                    key={module.id}
                    className={`
                      px-4 py-3 cursor-pointer transition
                      ${module.id === activeModule ? 'bg-muted' : 'hover:bg-muted/50'}
                      ${module.completed ? 'text-muted-foreground' : ''}
                    `}
                    onClick={() => handleModuleChange(module.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {index + 1}. {module.title}
                      </span>
                      {module.completed && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {module.duration} min
                      </span>
                      {bookmarks[module.id] && (
                        <Badge variant="outline" className="text-xs">
                          <Bookmark className="h-3 w-3 mr-1" />
                          {Math.floor(bookmarks[module.id] / 60)}:{(bookmarks[module.id] % 60).toString().padStart(2, '0')}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <div className="mt-4 space-y-3">
            {course.dueDate && (
              <Card>
                <CardContent className="p-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(course.dueDate).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardContent className="p-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <p className="font-medium">{course.estimatedDuration} minutes</p>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowFeedbackForm(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Provide Feedback
            </Button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="w-full md:w-3/4">
          {currentModule ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{currentModule.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">{currentModule.description}</p>
                  </div>
                  {currentModule.contentType === 'video' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBookmark(currentModule.id, 0)} // In a real app, you'd get the current video time
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      Bookmark
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs value={currentTab} onValueChange={setCurrentTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content">
                    {renderModuleContent(currentModule)}
                  </TabsContent>
                  
                  <TabsContent value="resources">
                    {currentModule.resources.length > 0 ? (
                      <div className="space-y-3">
                        {currentModule.resources.map(resource => (
                          <Card key={resource.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <a 
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-4 hover:bg-muted/50 transition"
                              >
                                <div className="bg-primary/10 rounded-full p-2 mr-3">
                                  {getResourceIcon(resource.type)}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{resource.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {resource.type.toUpperCase()}
                                  </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                              </a>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No resources available for this module.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => navigateModule('prev')}
                    disabled={course.modules.indexOf(currentModule) === 0}
                    className="flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigateModule('next')}
                    disabled={course.modules.indexOf(currentModule) === course.modules.length - 1}
                    className="flex-1 sm:flex-none"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                
                <div className="w-full sm:w-auto flex justify-end flex-1">
                  <Button 
                    onClick={handleCompleteModule}
                    disabled={currentModule.completed}
                    className="w-full sm:w-auto"
                  >
                    {currentModule.completed ? 'Completed' : 'Mark as Complete'}
                    {currentModule.completed && <CheckCircle className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">
                  No module selected
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Select a module from the list on the left to view its content.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Feedback Dialog */}
      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent className="sm:max-w-[500px]">
          <h2 className="text-xl font-bold mb-4">Course Feedback</h2>
          <FeedbackForm 
            onSubmit={handleFeedbackSubmit}
            onCancel={() => setShowFeedbackForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetailsPage; 