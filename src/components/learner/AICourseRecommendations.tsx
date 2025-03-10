import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, Clock, Award, ArrowRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/state';
import { AgentFactory } from '@/agents/AgentFactory';

const { useState, useEffect } = React;

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  matchScore: number; // Personalization match score (0-100)
  skills: string[];
  aiGenerated: boolean;
}

interface EnhancedUserDetails {
  id?: string;
  name?: string;
  email?: string;
  ragStatus?: string;
  skills?: Array<{ name: string }>;
}

const AICourseRecommendations: React.FC = () => {
  const { user, userDetails } = useAuth();
  const enhancedUserDetails = userDetails as EnhancedUserDetails;
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // Instead, create a simple mock educator agent
  const educatorAgent = {
    processTask: async (task: any) => {
      console.log('Mock educator agent processing task:', task);
      return []; // Return empty array as fallback
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recommendationTask = {
        type: 'recommend_resources',
        data: {
          employeeId: user?.id,
          currentStatus: enhancedUserDetails?.ragStatus || 'GREEN',
          topics: enhancedUserDetails?.skills?.map(s => s.name) || ['Programming', 'Leadership', 'Communication'],
          count: 5
        }
      };

      setRecommendations(getSampleRecommendations());
      
      // Uncomment this for real agent use:
      // const result = await educatorAgent.processTask(recommendationTask);
      // 
      // // Transform agent results into course format
      // const recommendedCourses = result.map((resource, index) => ({
      //   id: resource.id || `ai-course-${index}`,
      //   title: resource.title,
      //   description: resource.description,
      //   category: resource.topics ? resource.topics[0] : 'AI Generated',
      //   duration: `${resource.duration} min`,
      //   level: resource.difficulty.charAt(0).toUpperCase() + resource.difficulty.slice(1) as 'Beginner' | 'Intermediate' | 'Advanced',
      //   matchScore: Math.floor(Math.random() * 30) + 70, // For demo, random 70-100% match
      //   skills: resource.topics || [],
      //   aiGenerated: true
      // }));
      //
      // setRecommendations(recommendedCourses);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      toast({
        title: 'Recommendation Error',
        description: 'Failed to load personalized recommendations. Please try again later.',
        variant: 'destructive',
      });
      
      // Fallback to sample recommendations
      setRecommendations(getSampleRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Successfully Enrolled',
        description: 'You have been enrolled in this course. Start learning now!',
        variant: 'default',
      });
      
      // Remove from recommendations or mark as enrolled
      setRecommendations(prev => prev.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Enrollment Failed',
        description: 'Unable to enroll in this course. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(null);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'Advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSampleRecommendations = (): Course[] => [
    {
      id: 'sample-1',
      title: 'Advanced Data Analytics',
      description: 'Master data analysis techniques using modern tools and methodologies.',
      category: 'Data Science',
      duration: '6 hours',
      level: 'Intermediate',
      matchScore: 95,
      skills: ['Analytics', 'Python', 'Statistics'],
      aiGenerated: true
    },
    {
      id: 'sample-2',
      title: 'Leadership Communication',
      description: 'Enhance your leadership communication skills for effective team management.',
      category: 'Leadership',
      duration: '3 hours',
      level: 'Beginner',
      matchScore: 89,
      skills: ['Communication', 'Leadership', 'Management'],
      aiGenerated: true
    },
    {
      id: 'sample-3',
      title: 'AI-Assisted Project Management',
      description: 'Learn how to leverage AI tools for more efficient project management.',
      category: 'Project Management',
      duration: '4 hours',
      level: 'Intermediate',
      matchScore: 82,
      skills: ['Project Management', 'AI Tools', 'Productivity'],
      aiGenerated: true
    }
  ];
  
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-0">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No personalized recommendations available yet.</p>
            <Button 
              variant="outline" 
              onClick={loadRecommendations} 
              className="mt-4"
            >
              Generate Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" /> 
          AI-Recommended Courses
        </h2>
        <Button variant="ghost" size="sm" onClick={loadRecommendations}>
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map(course => (
          <Card key={course.id} className="overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Badge className="text-xs">{course.category}</Badge>
                <Badge variant="outline" className="bg-primary/10 text-xs">
                  {course.matchScore}% Match
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-grow pb-2">
              <CardDescription className="line-clamp-3">
                {course.description}
              </CardDescription>
              
              <div className="flex flex-wrap gap-1 mt-3">
                {course.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
            
            <div className="px-6 pb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  <span className={`px-1.5 py-0.5 rounded-full ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
              </div>
            </div>
            
            <CardFooter className="pt-0">
              <Button 
                className="w-full" 
                onClick={() => handleEnroll(course.id)}
                disabled={enrolling === course.id}
              >
                {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                {enrolling !== course.id && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AICourseRecommendations; 