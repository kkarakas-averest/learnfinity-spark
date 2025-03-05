
import { useState, useEffect } from '@/lib/react-helpers';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user data
  useEffect(() => {
    const targetId = userId || user?.id;
    
    if (!targetId) {
      setLoading(false);
      return;
    }
    
    // Simulate API call to fetch user data
    const timeout = setTimeout(() => {
      // Mock data
      const mockUserData = {
        id: targetId,
        name: userId ? 'Alex Johnson' : user?.name || 'Current User',
        email: userId ? 'alex.johnson@example.com' : user?.email || 'user@example.com',
        role: 'Learner',
        avatar: null,
        createdAt: '2023-05-15',
        bio: 'Passionate about learning new technologies and skills.',
        company: 'Acme Inc.',
        position: 'Software Engineer',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'UI/UX'],
        progress: {
          courses: 5,
          completed: 3,
          certificatesEarned: 2,
          hoursWatched: 28
        },
        recentActivity: [
          { id: 1, type: 'course_progress', title: 'Completed "JavaScript Basics" module', date: '2023-09-25' },
          { id: 2, type: 'certificate', title: 'Earned "React Developer" certificate', date: '2023-09-20' },
          { id: 3, type: 'course_start', title: 'Started "Advanced Node.js" course', date: '2023-09-15' }
        ]
      };
      
      setUserData(mockUserData);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [userId, user]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center pt-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-1/2 mt-4" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-4 w-2/3 mt-1" />
                <div className="w-full mt-6">
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="w-full md:w-2/3">
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // If user not found
  if (!userData) {
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The user profile you are looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile sidebar */}
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Profile</CardTitle>
              <CardDescription>View and manage your profile information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pt-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="text-lg">{getInitials(userData.name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold mt-4">{userData.name}</h2>
              <p className="text-muted-foreground">{userData.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{userData.role}</Badge>
                {userData.position && (
                  <Badge variant="outline">{userData.position}</Badge>
                )}
              </div>
              <div className="w-full mt-6">
                <Button className="w-full" variant="outline">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Learning Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between mb-1">
                  <span>Courses Progress</span>
                  <span className="font-medium">
                    {userData.progress.completed}/{userData.progress.courses}
                  </span>
                </div>
                <Progress value={(userData.progress.completed / userData.progress.courses) * 100} />
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{userData.progress.certificatesEarned}</div>
                    <div className="text-xs text-muted-foreground">Certificates</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{userData.progress.hoursWatched}</div>
                    <div className="text-xs text-muted-foreground">Hours Watched</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Profile content */}
        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Bio</h3>
                      <p className="text-sm text-muted-foreground">{userData.bio}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                      <div>
                        <h3 className="text-sm font-medium">Company</h3>
                        <p className="text-sm text-muted-foreground">{userData.company || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Position</h3>
                        <p className="text-sm text-muted-foreground">{userData.position || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Member Since</h3>
                        <p className="text-sm text-muted-foreground">{new Date(userData.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h3 className="font-medium mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {userData.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="courses" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>Courses you are currently taking or have completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No courses data available yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {userData.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {userData.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex justify-between border-b pb-3 last:border-0">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No recent activity.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
