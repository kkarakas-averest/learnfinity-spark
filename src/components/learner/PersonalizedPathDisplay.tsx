import React from "@/lib/react-helpers";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ChevronRight, Award, Clock, CheckCircle, AlertTriangle, AlertCircle, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/state";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface LearningPathCourse {
  id: string;
  title: string;
  description: string;
  duration: string;
  matchScore: number;
  ragStatus: 'green' | 'amber' | 'red';
  progress: number;
  sections: number;
  completedSections: number;
  skills: string[];
  requiredForCertification: boolean;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  courses: LearningPathCourse[];
  certificationName?: string;
}

const PersonalizedPathDisplay: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [learningPath, setLearningPath] = React.useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const fetchLearningPath = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/learner/learning-path?userId=${user.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No learning path found, this is expected for new users
          setLearningPath(null);
          return;
        }
        throw new Error('Failed to fetch learning path');
      }
      
      const data = await response.json();
      setLearningPath(data);
    } catch (error) {
      console.error('Error fetching learning path:', error);
      setError('Failed to load your personalized learning path');
      
      toast({
        variant: 'destructive',
        title: 'Error loading learning path',
        description: 'Could not load your personalized learning path. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  const generateLearningPath = async () => {
    if (!user?.id) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      toast({
        title: 'Generating your personalized learning path',
        description: 'Our AI is analyzing your profile to create a custom path. This may take a moment...',
        duration: 5000,
      });
      
      const response = await fetch('/api/learner/learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate learning path');
      }
      
      toast({
        title: 'Learning path created!',
        description: 'Your personalized learning path has been created successfully.',
        duration: 3000,
      });
      
      // Fetch the newly created learning path
      fetchLearningPath();
    } catch (error) {
      console.error('Error generating learning path:', error);
      setError('Failed to generate your personalized learning path');
      
      toast({
        variant: 'destructive',
        title: 'Error generating learning path',
        description: 'Could not generate your personalized learning path. Please try again later.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch learning path on component mount and when user changes
  React.useEffect(() => {
    fetchLearningPath();
  }, [user?.id, fetchLearningPath]);

  // Navigate to course
  const handleNavigateToCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };
  
  // Render rag status badge
  const renderRagStatusBadge = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" /> On Track
          </Badge>
        );
      case 'amber':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <AlertTriangle className="w-3 h-3 mr-1" /> Needs Attention
          </Badge>
        );
      case 'red':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" /> Critical
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const getStatusColor = (status: 'red' | 'amber' | 'green') => {
    switch (status) {
      case 'red':
        return 'text-red-500 bg-red-100';
      case 'amber':
        return 'text-amber-500 bg-amber-100';
      case 'green':
        return 'text-green-500 bg-green-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full h-64 flex items-center justify-center">
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading your personalized learning path...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Learning Path</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={fetchLearningPath}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!learningPath) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center py-10">
            <Sparkles className="h-12 w-12 text-blue-500" />
            <div>
              <h3 className="text-xl font-semibold">No Learning Path Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You haven't created a personalized learning path yet. Let our AI generate one for you based on your profile.
              </p>
            </div>
            <Button 
              className="mt-4" 
              onClick={generateLearningPath}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Learning Path
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle>{learningPath.name}</CardTitle>
        <CardDescription>
          {learningPath.description}
        </CardDescription>
        {learningPath.certificationName && (
          <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Award className="w-3 h-3 mr-1" />
            {learningPath.certificationName}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {learningPath.courses.map((course, index) => (
            <div key={course.id} className="border rounded-lg p-4 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-lg flex items-center">
                    <span className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">
                      {index + 1}
                    </span>
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                </div>
                <Badge className={`${getStatusColor(course.ragStatus)} ml-2`}>
                  {course.ragStatus === 'green' ? 'On Track' : 
                   course.ragStatus === 'amber' ? 'Needs Attention' : 
                   'Falling Behind'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Clock className="h-4 w-4" />
                <span>{course.duration} hours</span>
                <span className="mx-2">•</span>
                <BookOpen className="h-4 w-4" />
                <span>{course.completedSections}/{course.sections} sections</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
              
              <div className="mt-3 flex justify-end">
                <Link to={`/course/${course.id}`}>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700">
                    Continue <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(learningPath.updatedAt).toLocaleDateString()}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-blue-500"
          onClick={() => fetchLearningPath()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PersonalizedPathDisplay; 