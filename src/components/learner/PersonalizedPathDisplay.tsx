import React from "@/lib/react-helpers";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ChevronRight, Award, Clock, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/state";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

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
  courses: LearningPathCourse[];
  certificationName?: string;
}

const PersonalizedPathDisplay: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [learningPath, setLearningPath] = React.useState<LearningPath | null>(null);
  
  // Fetch personalized learning path
  React.useEffect(() => {
    if (!user?.id) return;
    
    const fetchLearningPath = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch learning path data from Supabase
        const { data, error } = await supabase
          .from('learning_paths')
          .select(`
            id, 
            name, 
            description, 
            created_at,
            certification_name,
            courses:learning_path_courses(
              id,
              course_id,
              courses(
                id,
                title,
                description,
                estimated_duration,
                skills,
                required_for_certification
              ),
              match_score,
              rag_status,
              progress,
              sections,
              completed_sections
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          // No learning path found, we'll use mock data for now
          setLearningPath(getMockLearningPath());
        } else {
          // Transform the data to match our interface
          const transformedPath: LearningPath = {
            id: data.id,
            name: data.name,
            description: data.description,
            createdAt: data.created_at,
            certificationName: data.certification_name,
            courses: data.courses.map((courseData: any) => ({
              id: courseData.course_id,
              title: courseData.courses.title,
              description: courseData.courses.description,
              duration: courseData.courses.estimated_duration,
              matchScore: courseData.match_score,
              ragStatus: courseData.rag_status,
              progress: courseData.progress,
              sections: courseData.sections,
              completedSections: courseData.completed_sections,
              skills: courseData.courses.skills,
              requiredForCertification: courseData.courses.required_for_certification
            }))
          };
          
          setLearningPath(transformedPath);
        }
      } catch (err) {
        console.error('Error fetching learning path:', err);
        setError('Failed to load your personalized learning path');
        // Set mock data as fallback
        setLearningPath(getMockLearningPath());
      } finally {
        setLoading(false);
      }
    };
    
    fetchLearningPath();
  }, [user?.id]);
  
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
  
  // Mock data function for development
  const getMockLearningPath = (): LearningPath => {
    return {
      id: 'mock-path-1',
      name: 'Personalized Learning Path',
      description: 'This learning path has been created based on your profile and preferences.',
      createdAt: new Date().toISOString(),
      certificationName: 'Professional Development Certificate',
      courses: [
        {
          id: 'course-1',
          title: 'Introduction to Project Management',
          description: 'Learn the fundamentals of project management and team leadership.',
          duration: '4 hours',
          matchScore: 92,
          ragStatus: 'green',
          progress: 75,
          sections: 12,
          completedSections: 9,
          skills: ['leadership', 'communication', 'organization'],
          requiredForCertification: true
        },
        {
          id: 'course-2',
          title: 'Effective Communication in Teams',
          description: 'Develop essential communication skills for collaborative environments.',
          duration: '3 hours',
          matchScore: 85,
          ragStatus: 'amber',
          progress: 30,
          sections: 10,
          completedSections: 3,
          skills: ['communication', 'teamwork', 'empathy'],
          requiredForCertification: true
        },
        {
          id: 'course-3',
          title: 'Problem-Solving Techniques',
          description: 'Master practical approaches to solving complex problems in the workplace.',
          duration: '5 hours',
          matchScore: 88,
          ragStatus: 'red',
          progress: 10,
          sections: 8,
          completedSections: 1,
          skills: ['problem-solving', 'creativity', 'critical-thinking'],
          requiredForCertification: false
        }
      ]
    };
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading your personalized learning path...</p>
      </div>
    );
  }
  
  if (error && !learningPath) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Error Loading Learning Path</CardTitle>
          <CardDescription className="text-red-700">
            {error}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!learningPath) {
    return null;
  }
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          {learningPath.name}
        </CardTitle>
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
      
      <CardContent className="space-y-6">
        {/* Display courses in the learning path */}
        {learningPath.courses.map((course, index) => (
          <div key={course.id} className="space-y-3">
            {index > 0 && <Separator />}
            
            <div className="pt-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-base">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                </div>
                <div>
                  {renderRagStatusBadge(course.ragStatus)}
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Progress: {course.completedSections}/{course.sections} sections</span>
                  <span className="font-medium">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {course.skills.map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                <div className="flex items-center text-xs text-muted-foreground ml-auto">
                  <Clock className="w-3 h-3 mr-1" /> {course.duration}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {course.matchScore}% Match with Your Profile
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-primary flex items-center"
                  onClick={() => handleNavigateToCourse(course.id)}
                >
                  Continue Learning
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="border-t bg-muted/50 flex justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(learningPath.createdAt).toLocaleDateString()}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/learning-paths')}>
          View All Learning Paths
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PersonalizedPathDisplay; 