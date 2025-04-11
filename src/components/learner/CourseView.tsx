
import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import { supabase } from '@/lib/supabase';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import { PersonalizedContentView } from '@/components/courses/PersonalizedContentView';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CourseViewProps {
  courseId?: string;
  employeeId?: string | null;
  hasPersonalizedContent?: boolean;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  modules: any[];
}

const CourseView: React.FC<CourseViewProps> = ({ 
  courseId: propsId, 
  employeeId: propsEmployeeId,
  hasPersonalizedContent: propsHasPersonalized
}) => {
  const params = useParams();
  const id = propsId || params.id;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [personalizedContent, setPersonalizedContent] = useState<AICourseContent | null>(null);
  const [personalizedSections, setPersonalizedSections] = useState<AICourseContentSection[]>([]);
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);
  const [hasPersonalized, setHasPersonalized] = useState(!!propsHasPersonalized);
  const [employeeId, setEmployeeId] = useState<string | null>(propsEmployeeId || null);
  const { toast } = useToast();
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        console.log(`Fetching course details for ID: ${id}`);
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
          
        if (courseError) {
          console.log('Error fetching standard course:', courseError);
          // Try the HR courses table as fallback
          console.log('Trying hr_courses table instead...');
          const { data: hrCourseData, error: hrCourseError } = await supabase
            .from('hr_courses')
            .select('*')
            .eq('id', id)
            .single();
            
          if (hrCourseError) {
            console.error('Error fetching HR course:', hrCourseError);
            throw new Error('Course not found');
          }
          
          // Map HR course data to expected format
          setCourse({
            id: hrCourseData.id,
            title: hrCourseData.title,
            description: hrCourseData.description || '',
            modules: [] // Will fetch modules separately
          });
          
          console.log('Found course in hr_courses:', hrCourseData);
        } else {
          setCourse(courseData);
          console.log('Found course in courses:', courseData);
        }
        
        // Identify the employee ID if not provided
        if (!employeeId) {
          console.log('No employee ID provided, looking up from session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('Found user session, checking for HR employee record');
            // Check if there's an HR employee record
            const { data: hrEmployee } = await supabase
              .from('hr_employees')
              .select('id')
              .eq('user_id', session.user.id)
              .single();
              
            if (hrEmployee) {
              console.log('Found HR employee record:', hrEmployee);
              setEmployeeId(hrEmployee.id);
            } else {
              // Fall back to user ID
              console.log('No HR employee record found, using user ID');
              setEmployeeId(session.user.id);
            }
          }
        }
        
      } catch (error) {
        console.error('Error in course view:', error);
        toast({
          title: "Error",
          description: "Failed to load course content",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [id, toast]);

  useEffect(() => {
    const fetchPersonalizedContent = async () => {
      if (!id || !employeeId) {
        console.log('Missing ID or employeeId, skipping personalized content fetch');
        return;
      }
      
      try {
        setIsLoadingPersonalized(true);
        setContentError(null);
        
        console.log(`Fetching personalized content for course ${id} and employee ${employeeId}`);
        
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log("No user session");
          return;
        }
        
        const contentService = PersonalizedContentService.getInstance();
        
        // Check for personalized content using both user ID and employee ID
        console.log(`Checking for personalized content with user ID: ${session.user.id}`);
        let hasContent = await contentService.hasPersonalizedContent(id, session.user.id);
        
        if (!hasContent && employeeId !== session.user.id) {
          console.log(`No content found for user ID, checking with employee ID: ${employeeId}`);
          // Try with employee ID if different from user ID
          hasContent = await contentService.hasPersonalizedContent(id, employeeId);
        }
        
        setHasPersonalized(hasContent);
        
        if (hasContent) {
          console.log('Personalized content exists, fetching it');
          // Try to get content with user ID first
          let contentResult = await contentService.getPersonalizedContent(id, session.user.id);
          
          // If no content found and employee ID is different, try with employee ID
          if (!contentResult.content && employeeId !== session.user.id) {
            console.log(`Trying to fetch content with employee ID: ${employeeId}`);
            contentResult = await contentService.getPersonalizedContent(id, employeeId);
          }
          
          setPersonalizedContent(contentResult.content);
          setPersonalizedSections(contentResult.sections);
          
          console.log(`Found personalized content: ${contentResult.content?.id}, sections: ${contentResult.sections.length}`);
          
          // Switch to personalized content tab if content exists
          if (contentResult.content) {
            setActiveTab('personalized');
          }
        } else {
          console.log('No personalized content found');
        }
      } catch (error) {
        console.error("Error fetching personalized content:", error);
        setContentError(error instanceof Error ? error.message : 'Unknown error fetching personalized content');
      } finally {
        setIsLoadingPersonalized(false);
      }
    };

    fetchPersonalizedContent();
  }, [id, employeeId]);

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
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold">Course Not Found</h2>
            <p className="text-muted-foreground mt-2">The course you're looking for doesn't exist or you don't have access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{course.description}</p>
        </CardContent>
      </Card>

      {contentError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{contentError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {hasPersonalized && (
            <TabsTrigger value="personalized" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4" />
              Personalized Content
            </TabsTrigger>
          )}
          <TabsTrigger value="content">Standard Content</TabsTrigger>
        </TabsList>
        
        {hasPersonalized && (
          <TabsContent value="personalized" className="mt-6">
            <PersonalizedContentView
              content={personalizedContent}
              sections={personalizedSections}
              isLoading={isLoadingPersonalized}
            />
          </TabsContent>
        )}
        
        <TabsContent value="content" className="mt-6">
          {course.modules && course.modules.length > 0 ? (
            <div className="space-y-4">
              {course.modules.map((module, index) => (
                <Card key={module.id || index}>
                  <CardHeader>
                    <CardTitle>{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div dangerouslySetInnerHTML={{ __html: module.content }} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {hasPersonalized 
                    ? "Standard content is not available. Please view the personalized content."
                    : "This course doesn't have any modules yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Development mode debugging */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Debug Information</h3>
          <div className="text-xs font-mono">
            <p>Course ID: {id}</p>
            <p>Employee ID: {employeeId || 'Not set'}</p>
            <p>Has Personalized Content: {hasPersonalized ? 'Yes' : 'No'}</p>
            <p>Active Tab: {activeTab}</p>
            <p>Personalized Content ID: {personalizedContent?.id || 'None'}</p>
            <p>Personalized Sections: {personalizedSections?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseView;
