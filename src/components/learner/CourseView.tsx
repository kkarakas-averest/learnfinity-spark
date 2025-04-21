import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import CourseModuleList from './CourseModuleList';
import CourseContentSection from './CourseContentSection';
import PersonalizedCourseContent from './PersonalizedCourseContent';
import RegenerateContentButtonVite from '@/components/CourseView/RegenerateContentButtonVite';
import { Progress } from '@/components/ui/progress';
import { AICourseContentSection } from '@/lib/types/content';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  FileText, 
  Sparkles, 
  BarChart2, 
  Award,
  Library,
  Book
} from 'lucide-react';
import type { IconProps } from 'lucide-react';

// Define a type for the Lucide icon component
type IconComponent = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

interface CourseViewProps {
  courseId: string;
  employeeId: string | null;
  hasPersonalizedContent?: boolean;
}

const CourseView: React.FC<CourseViewProps> = ({ 
  courseId, 
  employeeId,
  hasPersonalizedContent: initialPersonalizationState = false
}: CourseViewProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [course, setCourse] = React.useState<any>(null);
  const [hasPersonalizedContent, setHasPersonalizedContent] = React.useState<boolean>(initialPersonalizationState);
  const [personalizedContent, setPersonalizedContent] = React.useState<any>(null);
  const [selectedModuleId, setSelectedModuleId] = React.useState<string | null>(null);
  const [loadingPersonalization, setLoadingPersonalization] = React.useState<boolean>(false);
  const [generatingContent, setGeneratingContent] = React.useState<boolean>(false);
  const [enrollmentId, setEnrollmentId] = React.useState<string | null>(null);
  const [personalizedContentSections, setPersonalizedContentSections] = React.useState<any[]>([]);
  const [contentGenerationStatus, setContentGenerationStatus] = React.useState<{
    isGenerating: boolean;
    startedAt?: string;
    estimatedCompletion?: string;
  }>({ isGenerating: false });
  const [pollingIntervalId, setPollingIntervalId] = React.useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>('content');
  const [courseProgress, setCourseProgress] = React.useState<number>(0);
  const [completedModules, setCompletedModules] = React.useState<string[]>([]);

  const stopPolling = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  };

  React.useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [pollingIntervalId]);

  React.useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('hr_courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (error) throw error;
        
        setCourse(data);
        
        if (employeeId) {
          await checkForPersonalizedContent();
          // Fetch progress data (mock for now)
          const mockProgress = Math.floor(Math.random() * 100);
          setCourseProgress(mockProgress);
          
          // Simulate completed modules for demonstration
          if (data?.modules?.length > 0) {
            const moduleIds = data.modules.map((m: any) => m.id);
            const completed = moduleIds.slice(0, Math.floor(mockProgress / 33));
            setCompletedModules(completed);
          }
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast({
          title: "Error",
          description: "Could not load course details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseData();
  }, [courseId, employeeId]);

  const checkForPersonalizedContent = async (isPolling: boolean = false) => {
    if (!courseId || !employeeId) return;
    
    if (!isPolling) {
        setLoadingPersonalization(true);
    }
    
    try {
      const contentService = PersonalizedContentService.getInstance();
      const enrollmentIdResult = await contentService.getEnrollmentId(courseId, employeeId);
      
      if (enrollmentIdResult) {
        setEnrollmentId(enrollmentIdResult);
        
        const statusResult = await contentService.getContentGenerationStatus(enrollmentIdResult);
        setContentGenerationStatus(statusResult);
        
        if (isPolling && !statusResult.isGenerating) {
            stopPolling();
            console.log('[Polling] Content generation finished according to status.');
            const hasContent = await contentService.hasPersonalizedContent(courseId, employeeId);
            setHasPersonalizedContent(hasContent);
            
            if (hasContent) {
              const { content, sections } = await contentService.getPersonalizedContent(courseId, employeeId);
              setPersonalizedContent(content);
              setPersonalizedContentSections(sections);
              
              if (sections && sections.length > 0) {
                const firstModuleId = sections[0].module_id;
                setSelectedModuleId(firstModuleId);
              }
            }
        } else if (!statusResult.isGenerating) {
          const hasContent = await contentService.hasPersonalizedContent(courseId, employeeId);
          setHasPersonalizedContent(hasContent);
          
          if (hasContent) {
            const { content, sections } = await contentService.getPersonalizedContent(courseId, employeeId);
            setPersonalizedContent(content);
            setPersonalizedContentSections(sections);
            if (sections && sections.length > 0) {
              const firstModuleId = sections[0].module_id;
              setSelectedModuleId(firstModuleId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking personalized content:', error);
      stopPolling();
    } finally {
        if (!isPolling) {
             setLoadingPersonalization(false);
        }
    }
  };

  const generatePersonalizedContent = async () => {
    if (!courseId || !employeeId || !enrollmentId) {
      toast({
        title: "Cannot Generate Content",
        description: "Missing required information for personalization",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setGeneratingContent(true);
      
      try {
        const response = await fetch('/api/hr/courses/enhance-course-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            courseId,
            employeeId,
            modules: 3,
            sectionsPerModule: 3,
            includeQuiz: true
          })
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to generate personalized content');
        }

        toast({
          title: "Content Generation Started",
          description: "Personalized content is being generated for you. This may take a few minutes.",
          variant: "default"
        });
        
        setContentGenerationStatus({
          isGenerating: true,
          startedAt: new Date().toISOString(),
          estimatedCompletion: new Date(Date.now() + 5 * 60000).toISOString()
        });
        
        setTimeout(() => checkForPersonalizedContent(), 15000);
        
        return;
      } catch (serverError) {
        console.error('Server-side content generation failed:', serverError);
        console.log('Using client-side fallback due to API failure:', serverError);
        
        await generateClientSideFallbackContent();
      }
      
    } catch (error: any) {
      console.error('Error generating personalized content:', error);
      toast({
        title: "Error Generating Content",
        description: error.message || "An error occurred while generating personalized content",
        variant: "destructive"
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const generateClientSideFallbackContent = async () => {
    try {
      if (!courseId || !employeeId || !course) {
        throw new Error("Missing required data for content generation");
      }
      
      const contentId = uuidv4();
      
      const { error: contentError } = await supabase
        .from('ai_course_content')
        .insert({
          id: contentId,
          course_id: courseId,
          title: course.title,
          description: `Personalized version of ${course.title}`,
          learning_objectives: [
            "Understand core concepts with personalized examples",
            "Apply knowledge to your specific role",
            "Develop practical skills relevant to your position"
          ],
          created_for_user_id: employeeId,
          is_active: true,
          version: '1.0',
          metadata: {
            generation_method: 'client-fallback',
            modules: 3,
            sections_per_module: 3
          }
        });
      
      if (contentError) {
        console.error('Error creating ai_course_content record:', contentError);
        throw contentError;
      }
      
      for (let i = 0; i < 3; i++) {
        const moduleId = `module-${i + 1}-personalized-${employeeId.slice(0, 8)}`;
        
        await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            module_id: moduleId,
            title: `Module ${i + 1}: ${["Fundamentals", "Applied Concepts", "Advanced Topics"][i]} for Your Role`,
            description: `This module covers ${["basic", "intermediate", "advanced"][i]} concepts customized for your role.`,
            order_index: i,
            is_personalized: true,
            created_for: employeeId
          });
        
        for (let j = 0; j < 3; j++) {
          await supabase
            .from('ai_course_content_sections')
            .insert({
              content_id: contentId,
              title: `Section ${i+1}.${j+1}: ${["Introduction", "Core Concepts", "Practical Application"][j]}`,
              module_id: moduleId,
              section_id: `section-${j + 1}`,
              content: `<div class="prose max-w-none">
                <h2>Section ${i+1}.${j+1}</h2>
                <p>This is personalized content for ${course.title}, created specifically for your role and experience level.</p>
                <p>In a real implementation, this would include customized examples, role-specific applications, and personalized learning paths.</p>
                <h3>Key Points</h3>
                <ul>
                  <li>Personalized examples relevant to your position</li>
                  <li>Customized exercises based on your experience</li>
                  <li>Targeted learning outcomes for your career growth</li>
                </ul>
                <blockquote>
                  <p>The content is generated as a fallback since the AI content generation service is currently unavailable.</p>
                </blockquote>
              </div>`,
              order_index: j
            });
        }
      }
      
      await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_id: contentId,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('course_id', courseId);
      
      toast({
        title: "Content Generated",
        description: "Fallback personalized content has been created. You can now view the personalized course.",
        variant: "default"
      });
      
      setHasPersonalizedContent(true);
      await checkForPersonalizedContent();
      
    } catch (error) {
      console.error('Error in client-side content generation:', error);
      toast({
        title: "Client-side Generation Failed",
        description: "Could not create fallback personalized content.",
        variant: "destructive"
      });
    }
  };

  const renderModuleContent = () => {
    if (!course || !course.modules || !selectedModuleId) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Select a module to begin</h3>
            <p className="text-muted-foreground">Choose a module from the list to view its content.</p>
          </CardContent>
        </Card>
      );
    }

    const selectedModule = course.modules.find((m: any) => m.id === selectedModuleId);
    if (!selectedModule) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
          {completedModules.includes(selectedModuleId) && (
            <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Completed</span>
            </Badge>
          )}
        </div>
        
        {selectedModule.sections && selectedModule.sections.map((section: any, index: number) => (
          <CourseContentSection 
            key={index} 
            title={section.title} 
            content={section.content} 
          />
        ))}
      </div>
    );
  };

  const renderCourseContentArea = () => {
    if (hasPersonalizedContent && personalizedContent && personalizedContentSections.length > 0) {
      return (
        <PersonalizedCourseContent 
          content={personalizedContent} 
          sections={personalizedContentSections}
          isLoading={loadingPersonalization}
        />
      );
    }

    return renderModuleContent();
  };

  const renderCourseStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title="Progress" 
          value={`${courseProgress}%`} 
          description="Course completion" 
          icon={BarChart2} 
          color="bg-blue-50 text-blue-500"
        />
        <StatCard 
          title="Estimated Time" 
          value={course?.estimated_hours ? `${course.estimated_hours} hours` : "2-3 hours"} 
          description="To complete" 
          icon={Clock} 
          color="bg-amber-50 text-amber-500"
        />
        <StatCard 
          title="Certificate" 
          value={courseProgress >= 100 ? "Available" : "On completion"} 
          description="Course achievement" 
          icon={Award} 
          color="bg-green-50 text-green-500"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Hero Section with Course Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg mb-8 overflow-hidden">
        <div className="p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
              <p className="text-blue-100 mb-4 max-w-3xl">{course?.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {course?.tags?.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {tag}
                  </Badge>
                ))}
                {!course?.tags?.length && (
                  <>
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                      Professional Skills
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                      Career Development
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RegenerateContentButtonVite
                courseId={courseId}
                userId={employeeId || undefined}
              />
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500" 
              style={{ width: `${courseProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>{courseProgress}% complete</span>
            <span>{Math.round((completedModules.length / (course?.modules?.length || 1)) * 100)}% of modules completed</span>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      {renderCourseStats()}
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar - Module Navigation */}
        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Library className="mr-2 h-5 w-5 text-blue-600" />
                Course Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {course?.modules?.map((module: any, index: number) => (
                  <Button
                    key={module.id}
                    variant={selectedModuleId === module.id ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      selectedModuleId === module.id 
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedModuleId(module.id)}
                  >
                    <div className="flex items-center w-full gap-2">
                      {completedModules.includes(module.id) ? (
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                      )}
                      <span className="truncate">{module.title}</span>
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
            {hasPersonalizedContent && (
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setHasPersonalizedContent(false)}
                >
                  View Standard Content
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          <Tabs defaultValue="content" className="mb-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="content" onClick={() => setActiveTab('content')}>
                <FileText className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="discussion" onClick={() => setActiveTab('discussion')}>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Discussion
                </div>
              </TabsTrigger>
              <TabsTrigger value="resources" onClick={() => setActiveTab('resources')}>
                <div className="flex items-center">
                  <Book className="h-4 w-4 mr-2" />
                  Resources
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-4">
              {renderCourseContentArea()}
            </TabsContent>
            
            <TabsContent value="discussion" className="mt-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-medium mb-2">Discussion Board</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect with fellow learners and discuss course content.
                  </p>
                  <Button variant="outline">View Discussions</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="resources" className="mt-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-medium mb-2">Additional Resources</h3>
                  <p className="text-muted-foreground mb-4">
                    Explore supplementary materials to enhance your learning.
                  </p>
                  <Button variant="outline">Browse Resources</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: IconComponent;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  color
}: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseView;
