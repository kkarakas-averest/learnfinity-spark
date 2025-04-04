import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import CourseView from '@/components/learner/CourseView';
import { supabase } from '@/lib/supabase';

/**
 * CourseViewPage component
 * 
 * This page displays the full course content and allows users to interact with course modules.
 * It leverages the CourseView component which handles the detailed content display and user interactions.
 */
const CourseViewPage: React.FC = () => {
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check if the user has access to this course
    const checkCourseAccess = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/login');
          return;
        }

        // First, check if the user is enrolled in this course via regular enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('user_id', session.user.id)
          .single();
        
        // If regular enrollment exists, grant access
        if (!enrollmentError && enrollment) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // If regular enrollment check failed with a different error than "not found", log it
        if (enrollmentError && enrollmentError.code !== 'PGRST116') {
          console.error('Error checking course enrollment:', enrollmentError);
        }

        // Next, check if the course is HR-assigned to this user
        const { data: hrEnrollment, error: hrError } = await supabase
          .from('hr_course_enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('employee_id', session.user.id)
          .single();

        if (!hrError && hrEnrollment) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // For development/testing - if the course ID is from mock data, grant access
        // This is because mock data courses (like comm-skills-01) won't be in the database
        if (id.startsWith('comm-skills-') || id.startsWith('data-python-') || id.startsWith('leadership-')) {
          console.log('Granting access to mock course:', id);
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // If neither enrollment type was found, deny access
        if ((enrollmentError && enrollmentError.code === 'PGRST116') || 
            (hrError && hrError.code === 'PGRST116')) {
          toast({
            title: "Not enrolled",
            description: "You need to enroll in this course first",
            variant: "destructive"
          });
          setHasAccess(false);
        } else {
          throw new Error('Failed to verify course access');
        }
      } catch (error) {
        console.error('Error checking course access:', error);
        toast({
          title: "Error",
          description: "Failed to verify course access",
          variant: "destructive"
        });
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkCourseAccess();
  }, [id, navigate]);

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

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <h2 className="text-2xl font-bold">Access Required</h2>
            <p className="text-muted-foreground">You need to be enrolled in this course to view its content.</p>
            <Button onClick={() => navigate('/learner/courses')}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CourseView />;
};

export default CourseViewPage; 