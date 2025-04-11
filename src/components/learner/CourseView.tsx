
import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import { supabase } from '@/lib/supabase';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import { PersonalizedContentView } from '@/components/courses/PersonalizedContentView';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
          
        if (courseError) {
          console.error('Error fetching course:', courseError);
          // Try the HR courses table as fallback
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
        } else {
          setCourse(courseData);
        }
        
        // Identify the employee ID if not provided
        if (!employeeId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Check if there's an HR employee record
            const { data: hrEmployee } = await supabase
              .from('hr_employees')
              .select('id')
              .eq('user_id', session.user.id)
              .single();
              
            if (hrEmployee) {
              setEmployeeId(hrEmployee.id);
            } else {
              // Fall back to user ID
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
      if (!id || !employeeId) return;
      
      try {
        setIsLoadingPersonalized(true);
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log("No user session");
          return;
        }
        
        const contentService = PersonalizedContentService.getInstance();
        
        // Check for personalized content using both user ID and employee ID
        let hasContent = await contentService.hasPersonalizedContent(id, session.user.id);
        
        if (!hasContent && employeeId !== session.user.id) {
          // Try with employee ID if different from user ID
          hasContent = await contentService.hasPersonalizedContent(id, employeeId);
        }
        
        setHasPersonalized(hasContent);
        
        if (hasContent) {
          // Try to get content with user ID first
          let contentResult = await contentService.getPersonalizedContent(id, session.user.id);
          
          // If no content found and employee ID is different, try with employee ID
          if (!contentResult.content && employeeId !== session.user.id) {
            contentResult = await contentService.getPersonalizedContent(id, employeeId);
          }
          
          setPersonalizedContent(contentResult.content);
          setPersonalizedSections(contentResult.sections);
          
          // Switch to personalized content tab if content exists
          setActiveTab('personalized');
        }
      } catch (error) {
        console.error("Error fetching personalized content:", error);
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
    </div>
  );
};

export default CourseView;
