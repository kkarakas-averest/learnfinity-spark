import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// Import from our new state management system
import { useAuth, useUser, useUI } from '@/state';

/**
 * ProfilePage component that displays user profile information, skills, and progress
 * Uses the new state management system with useAuth, useUser, and useUI hooks
 */
const ProfilePageMigrated: React.FC = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { userDetails: currentUserDetails } = useUser();
  const { toastError } = useUI();
  
  const [userData, setUserData] = useState<any>(null);
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
    const fetchUserData = async () => {
      try {
        // Simulate API call
        const mockUserData = {
          id: targetId,
          name: userId ? 'Alex Johnson' : user?.email?.split('@')[0] || 'Current User',
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
        
        // In a real app, we'd make an API call here
        // const response = await fetch(`/api/users/${targetId}`);
        // if (!response.ok) throw new Error('Failed to fetch user data');
        // const userData = await response.json();
        
        setUserData(mockUserData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toastError(
          'Error loading profile',
          error instanceof Error ? error.message : 'Failed to load user profile'
        );
      } finally {
        setLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchUserData, 1000);
    return () => clearTimeout(timeout);
  }, [userId, user, toastError]);

  const getInitials = (name: string) => {
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
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>The requested user profile could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="text-lg">{getInitials(userData.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-center">{userData.name}</CardTitle>
                <CardDescription className="text-center">{userData.email}</CardDescription>
                <div className="mt-2">
                  <Badge variant="outline">{userData.role}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground">{userData.bio}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Company</h4>
                  <p className="text-sm text-muted-foreground">{userData.company}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Position</h4>
                  <p className="text-sm text-muted-foreground">{userData.position}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Member Since</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {userData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Overview</CardTitle>
                  <CardDescription>Your learning progress and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard 
                      title="Courses in Progress" 
                      value={userData.progress.courses - userData.progress.completed} 
                      total={userData.progress.courses}
                      percent={(userData.progress.courses - userData.progress.completed) / userData.progress.courses * 100}
                    />
                    <StatCard 
                      title="Courses Completed" 
                      value={userData.progress.completed} 
                      total={userData.progress.courses}
                      percent={userData.progress.completed / userData.progress.courses * 100}
                    />
                    <StatCard 
                      title="Certificates Earned" 
                      value={userData.progress.certificatesEarned} 
                      total={userData.progress.certificatesEarned}
                      percent={100}
                    />
                    <StatCard 
                      title="Hours Watched" 
                      value={userData.progress.hoursWatched} 
                      total={userData.progress.hoursWatched}
                      percent={100}
                      format="hours"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>Courses you are enrolled in</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Course list will be displayed here</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent learning activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start pb-4 border-b last:border-0">
                        <div className="mr-4 p-2 rounded-full bg-primary/10">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="certificates">
              <Card>
                <CardHeader>
                  <CardTitle>My Certificates</CardTitle>
                  <CardDescription>Certificates you have earned</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Certificate list will be displayed here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Helper components

interface StatCardProps {
  title: string;
  value: number;
  total: number;
  percent: number;
  format?: 'count' | 'hours';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, total, percent, format = 'count' }) => {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="flex items-baseline mb-2">
        <span className="text-2xl font-bold mr-1">{value}</span>
        {format === 'count' && total !== value && (
          <span className="text-sm text-muted-foreground">/ {total}</span>
        )}
        {format === 'hours' && (
          <span className="text-sm text-muted-foreground ml-1">hours</span>
        )}
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'course_progress':
      return <span className="text-blue-500">📚</span>;
    case 'certificate':
      return <span className="text-green-500">🏆</span>;
    case 'course_start':
      return <span className="text-purple-500">🚀</span>;
    default:
      return <span className="text-gray-500">📋</span>;
  }
};

export default ProfilePageMigrated; 