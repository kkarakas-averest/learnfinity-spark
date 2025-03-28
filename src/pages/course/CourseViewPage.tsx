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
        
        // Check if the user is enrolled in this course
        const { data: enrollment, error } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('user_id', session.user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') { // No enrollment found
            toast({
              title: "Not enrolled",
              description: "You need to enroll in this course first",
              variant: "destructive"
            });
            navigate('/learner/courses');
            return;
          }
          throw error;
        }
        
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking course access:', error);
        toast({
          title: "Error",
          description: "Failed to verify course access",
          variant: "destructive"
        });
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