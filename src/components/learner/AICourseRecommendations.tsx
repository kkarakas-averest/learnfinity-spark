import React from "@/lib/react-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/state";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  matchScore: number;
  duration: number;
  tags: string[];
}

interface PathCourse {
  id: string;
  title: string;
  description: string;
  [key: string]: any; // For other properties that might be in the course
}

interface LearningPathData {
  id: string;
  title: string;
  description: string;
  courses: PathCourse[];
  [key: string]: any; // For other properties that might be in the learning path
}

const AICourseRecommendations: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = React.useState<CourseRecommendation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchRecommendations = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // This would normally be a separate API endpoint, but for now
      // we'll use the learning path API and transform the data
      const response = await fetch(`/api/learner/learning-path?userId=${user.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No learning path found, which means no recommendations yet
          setRecommendations([]);
          return;
        }
        throw new Error('Failed to fetch course recommendations');
      }
      
      const data = await response.json() as LearningPathData;
      
      // Generate some additional recommendations based on the learning path
      // In a real implementation, this would come from a dedicated recommendations API
      if (data && data.courses && data.courses.length > 0) {
        const mainPathCourseIds = new Set<string>(data.courses.map(course => course.id));
        const relatedRecommendations = generateRelatedRecommendations(data.courses, mainPathCourseIds);
        setRecommendations(relatedRecommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching course recommendations:', error);
      setError('Failed to load course recommendations');
      
      toast({
        variant: 'destructive',
        title: 'Error loading recommendations',
        description: 'Could not load your course recommendations. Please try again later.'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, toast]);

  // Generate related recommendations based on the courses in the learning path
  const generateRelatedRecommendations = (pathCourses: PathCourse[], existingCourseIds: Set<string>): CourseRecommendation[] => {
    // This is a placeholder implementation that would be replaced by a real AI recommendation engine
    const relatedCourses: CourseRecommendation[] = [
      {
        id: 'rec-1',
        title: 'Advanced Data Visualization',
        description: 'Master techniques for creating compelling data visualizations for complex datasets.',
        matchScore: 87,
        duration: 4,
        tags: ['data', 'visualization', 'analytics']
      },
      {
        id: 'rec-2',
        title: 'Business Communication Essentials',
        description: 'Enhance your written and verbal communication skills for professional environments.',
        matchScore: 92,
        duration: 3,
        tags: ['communication', 'business', 'skills']
      },
      {
        id: 'rec-3',
        title: 'Design Thinking Workshop',
        description: 'Learn creative problem-solving techniques used by leading design firms.',
        matchScore: 79,
        duration: 2,
        tags: ['design', 'creativity', 'innovation']
      },
      {
        id: 'rec-4',
        title: 'Emotional Intelligence at Work',
        description: 'Develop emotional awareness and relationship management skills for workplace success.',
        matchScore: 84,
        duration: 3,
        tags: ['emotional-intelligence', 'leadership', 'psychology']
      }
    ].filter(course => !existingCourseIds.has(course.id))
     .sort((a, b) => b.matchScore - a.matchScore)
     .slice(0, 3); // Limit to 3 recommendations
    
    return relatedCourses;
  };

  const refreshRecommendations = async () => {
    setIsRefreshing(true);
    await fetchRecommendations();
  };

  // Fetch recommendations on component mount and when user changes
  React.useEffect(() => {
    fetchRecommendations();
  }, [user?.id, fetchRecommendations]);

  if (isLoading && !isRefreshing) {
    return (
      <Card className="w-full h-64 flex items-center justify-center">
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading course recommendations...</p>
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
              <h3 className="text-lg font-semibold text-red-800">Error Loading Recommendations</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={fetchRecommendations}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center py-10">
            <Sparkles className="h-12 w-12 text-orange-400" />
            <div>
              <h3 className="text-xl font-semibold">No Recommendations Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Complete some courses in your learning path to get personalized recommendations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-orange-400" />
            AI Recommended Courses
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs"
            onClick={refreshRecommendations}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map(course => (
            <div 
              key={course.id} 
              className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {course.description}
                  </p>
                </div>
                <Badge className="bg-orange-100 text-orange-800 ml-1 text-xs">
                  <Star className="h-3 w-3 mr-1 fill-orange-500 text-orange-500" />
                  {course.matchScore}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" /> 
                  {course.duration} hours
                </div>
                <Link to={`/course/${course.id}`}>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    View Course
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {course.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs font-normal px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AICourseRecommendations; 