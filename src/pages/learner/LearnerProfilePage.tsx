import React, { useState, useEffect } from '@/lib/react-helpers';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Clock, GraduationCap, Award, Book, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format, formatDistance } from 'date-fns';

// Utility function to display how many days ago a date was
const getDaysAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (e) {
    return 'Unknown date';
  }
};

// Types
interface LearningPreferences {
  preferredLearningStyle: string | null;
  preferredContentTypes: string[];
  learningGoals: string[];
}

interface Profile {
  id: string | null;
  userId: string;
  email: string;
  name: string | null;
  bio: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  skills: string[];
  learningPreferences: LearningPreferences;
  createdAt: string | null;
  updatedAt: string | null;
  onboardingCompleted: boolean;
  exists: boolean;
  isHrProfile?: boolean;
  hr?: {
    id: string;
    hire_date?: string;
    status?: string;
    phone?: string;
    manager?: string;
    manager_id?: string;
    department_id?: string;
    position_id?: string;
  };
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  level: string;
  duration_minutes: number;
  progress: number;
  last_accessed?: string;
  completion_status?: string;
  course_type?: string;
  assigned_date?: string;
  due_date?: string;
  hr_training_id?: string;
  hr_training_title?: string;
}

const LearnerProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id: userId } = router.query;

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId && !user?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch profile data
        const targetId = (userId as string) || user?.id;
        const response = await fetch(`/api/learner/profile?userId=${targetId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        
        const profileData = await response.json();
        setProfile(profileData);
        
        // Fetch enrolled courses for the user
        const coursesResponse = await fetch(`/api/learner/courses?userId=${targetId}`);
        
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.courses || []);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId, user?.id]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-10 w-10" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => router.push('/learner/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Not found state
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg mb-4">Profile not found</div>
        <Button onClick={() => router.push('/learner/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const userInitials = profile.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : profile.email.substring(0, 2).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src="" alt={profile.name || 'User'} />
              <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl text-center">
              {profile.name || 'New Learner'}
            </CardTitle>
            {profile.isHrProfile && (
              <Badge variant="outline" className="mt-2">HR Profile</Badge>
            )}
            {profile.title && (
              <div className="text-sm text-muted-foreground mt-1">{profile.title}</div>
            )}
            {profile.department && (
              <div className="text-sm text-muted-foreground">{profile.department}</div>
            )}
          </CardHeader>
          <CardContent>
            {profile.bio && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}
            
            {/* Contact Information */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-16">Email:</span>
                  <span className="text-xs ml-2">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground w-16">Phone:</span>
                    <span className="text-xs ml-2">{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* HR Information */}
            {profile.hr && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">HR Information</h3>
                <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-md border border-slate-200">
                  {profile.hr.hire_date && (
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground w-24">Hire Date:</span>
                      <span className="text-xs ml-2">
                        {format(new Date(profile.hr.hire_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {profile.hr.status && (
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground w-24">Status:</span>
                      <span className="text-xs ml-2 capitalize">
                        <Badge variant={profile.hr.status === 'active' ? 'default' : 'secondary'}>
                          {profile.hr.status.replace('_', ' ')}
                        </Badge>
                      </span>
                    </div>
                  )}
                  {profile.hr.manager && (
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground w-24">Manager:</span>
                      <span className="text-xs ml-2">{profile.hr.manager}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.learningPreferences && (
              <div>
                <h3 className="text-sm font-medium mb-2">Learning Preferences</h3>
                {profile.learningPreferences.preferredLearningStyle && (
                  <div className="mb-2">
                    <span className="text-xs font-medium">Preferred Style:</span>
                    <span className="text-xs ml-2 text-muted-foreground capitalize">
                      {profile.learningPreferences.preferredLearningStyle}
                    </span>
                  </div>
                )}
                
                {profile.learningPreferences.preferredContentTypes && 
                 profile.learningPreferences.preferredContentTypes.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium">Content Types:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.learningPreferences.preferredContentTypes.map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.learningPreferences.learningGoals && 
                 profile.learningPreferences.learningGoals.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Learning Goals:</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 pl-2">
                      {profile.learningPreferences.learningGoals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {(profile.id === null || userId === user?.id) && (
              <Button 
                className="w-full mt-6" 
                variant="secondary"
                onClick={() => router.push('/learner/profile/edit')}
              >
                {profile.exists ? 'Edit Profile' : 'Complete Profile'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Courses and Data */}
        <div className="md:col-span-2">
          <Tabs defaultValue="courses">
            <TabsList className="mb-4">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="stats">Learning Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Enrolled Courses</h2>
                
                {courses.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center justify-center h-40">
                      <Book className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-muted-foreground text-center">
                        No courses enrolled yet
                      </p>
                      {userId === user?.id && (
                        <Button 
                          className="mt-4" 
                          variant="outline"
                          onClick={() => router.push('/learner/courses')}
                        >
                          Browse Courses
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 bg-muted">
                          <div 
                            className="h-48 md:h-full bg-center bg-cover"
                            style={{ backgroundImage: `url(${course.thumbnail_url || '/placeholder-course.jpg'})` }}
                          ></div>
                        </div>
                        <div className="p-6 md:w-3/4">
                          <h3 className="text-lg font-medium mb-2">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {course.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm mb-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>{Math.round(course.duration_minutes / 60)} hours</span>
                            </div>
                            <div className="flex items-center">
                              <GraduationCap className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="capitalize">{course.level}</span>
                            </div>
                            {course.category && (
                              <Badge variant="outline">{course.category}</Badge>
                            )}
                            {course.course_type === 'assigned' && (
                              <Badge variant="secondary">Assigned</Badge>
                            )}
                            {course.course_type === 'hr_assigned' && (
                              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">HR Assigned</Badge>
                            )}
                            {course.hr_training_title && (
                              <Badge variant="outline" className="font-normal">
                                {course.hr_training_title}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} />
                          </div>
                          
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                            {course.last_accessed && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Last accessed {getDaysAgo(course.last_accessed)}</span>
                              </div>
                            )}
                            {course.assigned_date && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Assigned {getDaysAgo(course.assigned_date)}</span>
                              </div>
                            )}
                            {course.due_date && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Due {getDaysAgo(course.due_date)}</span>
                              </div>
                            )}
                            {course.completion_status === 'completed' && (
                              <div className="flex items-center">
                                <Check className="h-3 w-3 mr-1" />
                                <span>Completed</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <Button
                              onClick={() => router.push(`/learner/courses/${course.id}`)}
                              size="sm"
                            >
                              {course.progress > 0 ? 'Continue' : 'Start'} Course
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Courses Completed</span>
                          <span className="font-medium">
                            {courses.filter(c => c.completion_status === 'completed').length} / {courses.length}
                          </span>
                        </div>
                        <Progress 
                          value={courses.length ? 
                            (courses.filter(c => c.completion_status === 'completed').length / courses.length) * 100 
                            : 0
                          } 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Overall Progress</span>
                          <span className="font-medium">
                            {courses.length ? 
                              Math.round(courses.reduce((acc, curr) => acc + curr.progress, 0) / courses.length) 
                              : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={courses.length ? 
                            courses.reduce((acc, curr) => acc + curr.progress, 0) / courses.length
                            : 0
                          } 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courses.filter(c => c.completion_status === 'completed').length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                          <Award className="h-8 w-8 mb-2 text-primary" />
                          <span className="text-sm font-medium">Course Completer</span>
                        </div>
                        {courses.filter(c => c.progress >= 50).length >= 3 && (
                          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                            <GraduationCap className="h-8 w-8 mb-2 text-primary" />
                            <span className="text-sm font-medium">Dedicated Learner</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40">
                        <Award className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                        <p className="text-muted-foreground text-center">
                          Complete courses to earn achievements
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfilePage;
