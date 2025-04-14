
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import CourseModuleList from './CourseModuleList';
import CourseContentSection from './CourseContentSection';

interface CourseViewProps {
  courseId: string;
  employeeId: string | null;
  hasPersonalizedContent?: boolean;
}

const CourseView: React.FC<CourseViewProps> = ({ 
  courseId, 
  employeeId,
  hasPersonalizedContent: initialPersonalizationState = false
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [hasPersonalizedContent, setHasPersonalizedContent] = useState<boolean>(initialPersonalizationState);
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loadingPersonalization, setLoadingPersonalization] = useState<boolean>(false);
  const [generatingContent, setGeneratingContent] = useState<boolean>(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [personalizedContentSections, setPersonalizedContentSections] = useState<any[]>([]);
  const [contentGenerationStatus, setContentGenerationStatus] = useState<{
    isGenerating: boolean;
    startedAt?: string;
    estimatedCompletion?: string;
  }>({ isGenerating: false });

  // Load course details
  useEffect(() => {
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
        
        // If employee ID is provided, check for personalized content
        if (employeeId) {
          await checkForPersonalizedContent();
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

  // Check for personalized content
  const checkForPersonalizedContent = async () => {
    if (!courseId || !employeeId) return;
    
    try {
      setLoadingPersonalization(true);
      
      // First, get enrollment ID for this course and employee
      const contentService = PersonalizedContentService.getInstance();
      const enrollmentIdResult = await contentService.getEnrollmentId(courseId, employeeId);
      
      if (enrollmentIdResult) {
        setEnrollmentId(enrollmentIdResult);
        
        // Check if content is being generated
        const statusResult = await contentService.getContentGenerationStatus(enrollmentIdResult);
        setContentGenerationStatus(statusResult);
        
        if (!statusResult.isGenerating) {
          // Check if personalized content exists
          const hasContent = await contentService.hasPersonalizedContent(courseId, employeeId);
          setHasPersonalizedContent(hasContent);
          
          if (hasContent) {
            // Load personalized content
            const { content, sections } = await contentService.getPersonalizedContent(courseId, employeeId);
            setPersonalizedContent(content);
            setPersonalizedContentSections(sections);
            
            // Set first module as selected if available
            if (sections && sections.length > 0) {
              const firstModuleId = sections[0].module_id;
              setSelectedModuleId(firstModuleId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking personalized content:', error);
    } finally {
      setLoadingPersonalization(false);
    }
  };

  // Generate personalized content
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
      
      // Make API request to generate content
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
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate personalized content');
      }
      
      toast({
        title: "Content Generation Started",
        description: "Personalized content is being generated for you. This may take a few minutes.",
        variant: "default"
      });
      
      // Update status to show generation in progress
      setContentGenerationStatus({
        isGenerating: true,
        startedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 5 * 60000).toISOString() // Estimate 5 minutes
      });
      
      // Set a timer to check status periodically
      setTimeout(() => checkForPersonalizedContent(), 15000);
      
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

  const renderModuleContent = () => {
    if (!selectedModuleId) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Select a module to view its content</p>
        </div>
      );
    }
    
    // Filter sections for the selected module
    const moduleSections = personalizedContentSections.filter(
      section => section.module_id === selectedModuleId
    ).sort((a, b) => a.order_index - b.order_index);
    
    if (moduleSections.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No content available for this module</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {moduleSections.map(section => (
          <CourseContentSection 
            key={section.id} 
            title={section.title}
            content={section.content}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
            <p className="text-muted-foreground">The requested course could not be found.</p>
            <Button 
              onClick={() => navigate(-1)}
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              {course.skill_level && (
                <div className="mt-2 text-sm font-medium text-muted-foreground">
                  Level: {course.skill_level.charAt(0).toUpperCase() + course.skill_level.slice(1)}
                </div>
              )}
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Back to Courses
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p>{course.description}</p>
          
          {/* Personalization Status */}
          {employeeId && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="text-lg font-medium mb-2">Personalized Learning</h3>
              
              {loadingPersonalization ? (
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <p className="text-sm text-muted-foreground">Checking personalization status...</p>
                </div>
              ) : contentGenerationStatus.isGenerating ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse h-3 w-3 bg-blue-500 rounded-full" />
                    <p className="text-sm font-medium">Generating personalized content...</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This may take a few minutes. You can refresh the page to check progress.
                  </p>
                  {contentGenerationStatus.estimatedCompletion && (
                    <p className="text-xs">
                      Estimated completion: {new Date(contentGenerationStatus.estimatedCompletion).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ) : hasPersonalizedContent ? (
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full" />
                  <p className="text-sm">Personalized content is available for you</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Personalize this course based on your profile
                  </p>
                  <Button 
                    size="sm" 
                    onClick={generatePersonalizedContent}
                    disabled={generatingContent || !enrollmentId}
                  >
                    {generatingContent ? 'Generating...' : 'Generate Personalized Content'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {hasPersonalizedContent && <TabsTrigger value="personalized">Personalized Content</TabsTrigger>}
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Duration</h3>
                  <p>{course.duration || course.estimated_duration || 'Not specified'} {course.duration ? 'hours' : ''}</p>
                </div>
                <div>
                  <h3 className="font-medium">Category</h3>
                  <p>{course.category || 'General'}</p>
                </div>
                {course.skills && course.skills.length > 0 && (
                  <div className="col-span-2">
                    <h3 className="font-medium">Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {course.skills.map((skill: string, index: number) => (
                        <div 
                          key={index} 
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                        >
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {hasPersonalizedContent && (
          <TabsContent value="personalized" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Learning Path</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg font-medium mb-4">Modules</h3>
                    <CourseModuleList
                      modules={
                        Array.from(
                          new Set(
                            personalizedContentSections.map(section => ({
                              id: section.module_id,
                              title: section.module_id.replace(/-/g, ' ').replace(/personalized.*$/, '')
                            }))
                          )
                        )
                      }
                      selectedModuleId={selectedModuleId}
                      onSelectModule={setSelectedModuleId}
                    />
                  </div>
                  <div className="p-4 md:p-6 col-span-3">
                    <h3 className="text-lg font-medium mb-4">Content</h3>
                    {renderModuleContent()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="discussions">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Discussion feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Resources feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseView;
