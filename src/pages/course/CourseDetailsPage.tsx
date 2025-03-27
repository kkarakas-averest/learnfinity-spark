import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import {
  BookOpen,
  Clock,
  Calendar,
  CheckCircle,
  PlayCircle,
  FileText,
  BarChart2,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';

interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  contentType: 'video' | 'text' | 'quiz' | 'resource';
  contentUrl?: string;
  completed: boolean;
  duration: number;
}

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  enrollmentId: string;
  progress: number;
  ragStatus: 'red' | 'amber' | 'green';
  dueDate?: string;
  moduleCount: number;
  completedModules: number;
  estimatedTimeToComplete: string;
  lastAccessed?: string;
  modules: CourseModule[];
  instructor?: string;
  category?: string;
}

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('content');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }
        
        // Fetch the enrollment for this course
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            progress,
            rag_status,
            completed_modules,
            due_date,
            last_accessed,
            status,
            course:courses (
              id,
              title,
              description,
              estimated_duration,
              module_count,
              instructor,
              category
            )
          `)
          .eq('course_id', id)
          .eq('user_id', session.user.id)
          .single();
          
        if (enrollmentError) {
          if (enrollmentError.code === 'PGRST116') {
            // No enrollment found, redirect to courses page
            toast({
              title: "Not enrolled",
              description: "You are not enrolled in this course",
              variant: "destructive"
            });
            navigate('/learner/courses');
            return;
          }
          throw enrollmentError;
        }
        
        // Update last accessed time
        await supabase
          .from('course_enrollments')
          .update({ last_accessed: new Date().toISOString() })
          .eq('id', enrollmentData.id);
        
        // Fetch course modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', id)
          .order('order', { ascending: true });
          
        if (modulesError) throw modulesError;
        
        // Fetch module completion status
        const { data: completionData, error: completionError } = await supabase
          .from('module_completions')
          .select('module_id, completed')
          .eq('user_id', session.user.id)
          .eq('course_id', id);
          
        if (completionError) throw completionError;
        
        // Create a lookup for completed modules
        const completedModulesMap = new Map();
        completionData?.forEach(completion => {
          completedModulesMap.set(completion.module_id, completion.completed);
        });
        
        // Format modules data with completion status
        const formattedModules: CourseModule[] = modulesData?.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description || '',
          order: module.order,
          contentType: module.content_type || 'text',
          contentUrl: module.content_url,
          completed: completedModulesMap.has(module.id) ? !!completedModulesMap.get(module.id) : false,
          duration: module.estimated_duration || 0
        })) || [];
        
        // Find the first incomplete module to set as current
        const firstIncompleteIndex = formattedModules.findIndex(module => !module.completed);
        setCurrentModuleIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
        
        // Format the course details
        const courseData = (enrollmentData.course as unknown) as {
          id: string;
          title: string;
          description: string;
          estimated_duration: number;
          module_count: number;
          instructor: string;
          category: string;
        };
        
        setCourseDetails({
          id: courseData.id,
          title: courseData.title,
          description: courseData.description || '',
          enrollmentId: enrollmentData.id,
          progress: enrollmentData.progress || 0,
          ragStatus: (enrollmentData.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
          dueDate: enrollmentData.due_date,
          moduleCount: courseData.module_count || formattedModules.length,
          completedModules: enrollmentData.completed_modules || 0,
          estimatedTimeToComplete: `${courseData.estimated_duration || 1}h`,
          lastAccessed: enrollmentData.last_accessed,
          modules: formattedModules,
          instructor: courseData.instructor,
          category: courseData.category
        });
      } catch (error) {
        console.error('Error fetching course details:', error);
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [id, navigate]);
  
  const markModuleAsCompleted = async (moduleId: string) => {
    if (!id || !courseDetails) return;
    
    setUpdatingProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }
      
      // Check if a completion record exists
      const { data: existingCompletion, error: checkError } = await supabase
        .from('module_completions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('course_id', id)
        .eq('module_id', moduleId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // Update or insert completion record
      let completionResult;
      if (existingCompletion) {
        completionResult = await supabase
          .from('module_completions')
          .update({
            completed: true,
            completion_date: new Date().toISOString()
          })
          .eq('id', existingCompletion.id);
      } else {
        completionResult = await supabase
          .from('module_completions')
          .insert({
            user_id: session.user.id,
            course_id: id,
            module_id: moduleId,
            completed: true,
            completion_date: new Date().toISOString()
          });
      }
      
      if (completionResult.error) throw completionResult.error;
      
      // Update the course progress in course_enrollments
      const totalModules = courseDetails.modules.length;
      const completedModules = courseDetails.modules.filter(m => m.id === moduleId || m.completed).length;
      const newProgress = Math.round((completedModules / totalModules) * 100);
      
      const { error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          progress: newProgress,
          completed_modules: completedModules,
          last_accessed: new Date().toISOString(),
          rag_status: newProgress === 100 ? 'green' : newProgress >= 50 ? 'amber' : 'red'
        })
        .eq('id', courseDetails.enrollmentId);
      
      if (updateError) throw updateError;
      
      // Update the local state
      setCourseDetails(prev => {
        if (!prev) return null;
        
        const updatedModules = prev.modules.map(module => 
          module.id === moduleId ? { ...module, completed: true } : module
        );
        
        return {
          ...prev,
          progress: newProgress,
          completedModules,
          ragStatus: newProgress === 100 ? 'green' : newProgress >= 50 ? 'amber' : 'red',
          modules: updatedModules
        };
      });
      
      toast({
        title: "Progress updated",
        description: "Module marked as completed",
      });
      
      // Move to the next module if available
      if (currentModuleIndex < courseDetails.modules.length - 1) {
        setCurrentModuleIndex(currentModuleIndex + 1);
      }
    } catch (error) {
      console.error('Error updating module completion:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    } finally {
      setUpdatingProgress(false);
    }
  };
  
  const renderModuleContent = (module: CourseModule) => {
    switch (module.contentType) {
      case 'video':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
              {module.contentUrl ? (
                <iframe 
                  className="w-full h-full rounded-lg" 
                  src={module.contentUrl} 
                  title={module.title}
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <p>Video content unavailable</p>
                </div>
              )}
            </div>
            <Button 
              disabled={updatingProgress || module.completed} 
              onClick={() => markModuleAsCompleted(module.id)}
              className="w-full"
            >
              {module.completed ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                'Mark as Completed'
              )}
            </Button>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <h3>{module.title}</h3>
              <p>{module.description || 'No content available for this module.'}</p>
              {module.contentUrl && (
                <div dangerouslySetInnerHTML={{ __html: module.contentUrl }} />
              )}
            </div>
            <Button 
              disabled={updatingProgress || module.completed} 
              onClick={() => markModuleAsCompleted(module.id)}
              className="w-full"
            >
              {module.completed ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                'Mark as Completed'
              )}
            </Button>
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">{module.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete this quiz to test your knowledge
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Quizzes are not yet implemented
                </AlertDescription>
              </Alert>
            </div>
            <Button 
              disabled={updatingProgress || module.completed} 
              onClick={() => markModuleAsCompleted(module.id)}
              className="w-full"
            >
              {module.completed ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                'Mark as Completed'
              )}
            </Button>
          </div>
        );
        
      case 'resource':
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">{module.title}</h3>
              <p className="text-sm mb-4">{module.description}</p>
              {module.contentUrl ? (
                <Button variant="outline" className="w-full" asChild>
                  <a href={module.contentUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Open Resource
                  </a>
                </Button>
              ) : (
                <p className="text-muted-foreground">Resource not available</p>
              )}
            </div>
            <Button 
              disabled={updatingProgress || module.completed} 
              onClick={() => markModuleAsCompleted(module.id)}
              className="w-full"
            >
              {module.completed ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                'Mark as Completed'
              )}
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="bg-slate-50 p-6 rounded-lg text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p>Content not available</p>
          </div>
        );
    }
  };

  const renderModulesList = () => {
    if (!courseDetails?.modules.length) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No modules found for this course</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {courseDetails.modules.map((module, index) => (
          <div
            key={module.id}
            className={`p-3 rounded-md cursor-pointer flex items-center gap-3 ${
              index === currentModuleIndex 
                ? 'bg-primary text-primary-foreground'
                : module.completed
                  ? 'bg-primary/10'
                  : 'hover:bg-accent'
            }`}
            onClick={() => setCurrentModuleIndex(index)}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              module.completed 
                ? 'bg-green-500 text-white' 
                : index === currentModuleIndex
                  ? 'bg-white text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {module.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                index === currentModuleIndex 
                  ? 'text-white'
                  : ''
              }`}>
                {module.title}
              </p>
              <div className="flex items-center gap-2 text-xs">
                {module.contentType === 'video' && <PlayCircle className="h-3 w-3" />}
                {module.contentType === 'text' && <FileText className="h-3 w-3" />}
                {module.contentType === 'quiz' && <BarChart2 className="h-3 w-3" />}
                <span>{module.duration} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/learner/courses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-[300px]" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!courseDetails) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/learner/courses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Course Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Course not found</h3>
              <p className="text-muted-foreground mb-4">
                The course you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate('/learner/courses')}>
                Go to My Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentModule = courseDetails.modules[currentModuleIndex];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/learner/courses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold truncate">{courseDetails.title}</h1>
        <div className="ml-auto">
          <RAGStatusBadge status={courseDetails.ragStatus} />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm">Overall Progress</span>
          <span className="text-sm font-medium">{courseDetails.progress}%</span>
        </div>
        <Progress value={courseDetails.progress} className="h-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="info">Course Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              {currentModule ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            Module {currentModuleIndex + 1} of {courseDetails.modules.length}
                          </Badge>
                          <CardTitle>{currentModule.title}</CardTitle>
                        </div>
                        {currentModule.completed && (
                          <Badge variant="success" className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderModuleContent(currentModule)}
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentModuleIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentModuleIndex === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentModuleIndex(prev => Math.min(courseDetails.modules.length - 1, prev + 1))}
                      disabled={currentModuleIndex === courseDetails.modules.length - 1}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No modules available</h3>
                    <p className="text-muted-foreground">
                      This course doesn't have any modules yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>About this Course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">{courseDetails.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Course Details</h3>
                      <ul className="space-y-2">
                        {courseDetails.instructor && (
                          <li className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Instructor:</span> 
                            <span>{courseDetails.instructor}</span>
                          </li>
                        )}
                        {courseDetails.category && (
                          <li className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Category:</span> 
                            <span>{courseDetails.category}</span>
                          </li>
                        )}
                        <li className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Duration:</span> 
                          <span>{courseDetails.estimatedTimeToComplete}</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Modules:</span> 
                          <span>{courseDetails.moduleCount}</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Your Progress</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Completed:</span> 
                          <span>{courseDetails.completedModules} of {courseDetails.moduleCount} modules</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Progress:</span> 
                          <span>{courseDetails.progress}%</span>
                        </li>
                        {courseDetails.lastAccessed && (
                          <li className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Last accessed:</span> 
                            <span>{new Date(courseDetails.lastAccessed).toLocaleString()}</span>
                          </li>
                        )}
                        {courseDetails.dueDate && (
                          <li className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Due date:</span> 
                            <span>{new Date(courseDetails.dueDate).toLocaleDateString()}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                {courseDetails.completedModules} of {courseDetails.moduleCount} modules completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderModulesList()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
