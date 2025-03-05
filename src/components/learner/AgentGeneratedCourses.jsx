import * as React from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Award, BookOpen, CheckCircle, Clock, Info, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import courseDisplayService from '@/services/courseDisplayService';
import { useNavigate } from 'react-router-dom';

const AgentGeneratedCourses = () => {
  const { user, userDetails } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  
  // Fetch courses when the component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use the employee ID as learner ID
        const learnerId = userDetails?.employeeId || user.id;
        const result = await courseDisplayService.fetchAgentGeneratedCourses(learnerId);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch courses');
        }
        
        setCourses(result.courses || []);
        setLearningPath(result.learningPath);
      } catch (err) {
        console.error('Error fetching agent-generated courses:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [user, userDetails]);
  
  // Handle navigation to course
  const handleViewCourse = (courseId) => {
    navigate(`/learning/course/${courseId}`);
  };
  
  // If still loading, show skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/6" />
                <div className="mt-4">
                  <Skeleton className="h-2 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // If no courses available, show empty state
  if (!error && courses.length === 0) {
    return (
      <div className="py-8">
        <div className="text-center space-y-4">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium">No Personalized Courses Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your HR team hasn't created a personalized learning path for you yet. 
            Check back soon or explore our general course catalog.
          </p>
          <Button onClick={() => navigate('/learning')}>
            Browse Course Catalog
          </Button>
        </div>
      </div>
    );
  }
  
  // If error occurred, show error message
  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Learning Path Header */}
      {learningPath && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 rounded-full p-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-800">Your Personalized Learning Path</h3>
              <p className="text-sm text-blue-700 mt-1">
                This learning path was created specially for you based on your profile and career goals.
              </p>
              
              {/* Learning Path Stats */}
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    {learningPath.total_duration || '45 hours'} total
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Earn certification upon completion
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <Badge variant={course.isPlaceholder ? "outline" : "default"} className="ml-2">
                  {course.isPlaceholder ? "Coming Soon" : "AI Generated"}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {/* Course Details */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {course.estimatedDuration || "10 hours"}
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="mr-1 h-4 w-4" />
                    {course.modules?.length || 0} modules
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>0%</span>
                  </div>
                  <Progress value={0} />
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={() => handleViewCourse(course.id)}
                disabled={course.isPlaceholder}
              >
                {course.isPlaceholder ? "Coming Soon" : "Start Learning"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgentGeneratedCourses; 