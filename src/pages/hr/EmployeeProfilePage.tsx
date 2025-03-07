import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Clock, FileText, Book, Award, Activity, Star, MessageSquare } from 'lucide-react';

// Service and types
import { getEmployeeProfile } from '@/services/employee-profile.service';
import { EnhancedEmployeeProfile } from '@/types/employee-profile.types';
import { RAGStatus } from '@/types/hr.types';

// Components
import SkillsInventory from '@/components/hr/profile/SkillsInventory';
import LearningHistory from '@/components/hr/profile/LearningHistory';

// This will be broken down into separate components later
const PersonalInfoSection = ({ profile, loading }: { profile: EnhancedEmployeeProfile | null, loading: boolean }) => {
  if (loading) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-40" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const getRagStatusColor = (status: RAGStatus): string => {
    switch (status) {
      case 'red': return 'bg-destructive text-destructive-foreground';
      case 'amber': return 'bg-yellow-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{profile.name}</CardTitle>
          <CardDescription>
            {profile.position} • {profile.department}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profilePictureUrl} alt={profile.name} />
              <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <Badge className={`${getRagStatusColor(profile.ragStatus)} capitalize`}>
              {profile.ragStatus} Status
            </Badge>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{profile.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{profile.phoneNumber || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Manager</p>
                <p>{profile.manager || 'Not assigned'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p>{profile.startDate}</p>
              </div>
            </div>
            
            {profile.bio && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Bio</p>
                <p className="text-sm">{profile.bio}</p>
              </div>
            )}
            
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{profile.courses}</span>
                <span className="text-xs text-muted-foreground">Courses</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{profile.coursesCompleted}</span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{profile.progress}%</span>
                <span className="text-xs text-muted-foreground">Progress</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Placeholder components for other tabs - these will be implemented as separate components
const LearningPreferencesSection = ({ profile }: { profile: EnhancedEmployeeProfile | null }) => (
  <Card className="w-full mb-6">
    <CardHeader>
      <CardTitle>Learning Preferences</CardTitle>
      <CardDescription>How this employee prefers to learn and engage with content</CardDescription>
    </CardHeader>
    <CardContent>
      {profile ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Learning Style</p>
              <p className="capitalize">{profile.learningPreferences.learningStyle}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Preferred Times</p>
              <div className="flex flex-wrap gap-1">
                {profile.learningPreferences.preferredTimes.map((time) => (
                  <Badge key={time} variant="outline" className="capitalize">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Preferred Device</p>
              <p className="capitalize">{profile.learningPreferences.preferredDevice}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Average Session</p>
              <p>{profile.learningPreferences.averageSessionDuration} minutes</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Preferred Content Formats</p>
            <div className="flex flex-wrap gap-1">
              {profile.learningPreferences.preferredContentFormats.map((format) => (
                <Badge key={format} variant="outline" className="capitalize">
                  {format}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Preferred Difficulty</p>
              <p className="capitalize">{profile.learningPreferences.prefersDifficulty}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Prefers Collaboration</p>
              <p>{profile.learningPreferences.prefersCollaboration ? 'Yes' : 'No'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Prefers Deadlines</p>
              <p>{profile.learningPreferences.prefersDeadlines ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No learning preferences data available</p>
      )}
    </CardContent>
  </Card>
);

const SkillsSection = ({ profile }: { profile: EnhancedEmployeeProfile | null }) => (
  <Card className="w-full mb-6">
    <CardHeader>
      <CardTitle>Skills Inventory</CardTitle>
      <CardDescription>Skills and competencies assessment</CardDescription>
    </CardHeader>
    <CardContent>
      {profile ? (
        <SkillsInventory skills={profile.skills} isEditable={false} />
      ) : (
        <p>No skills data available</p>
      )}
    </CardContent>
  </Card>
);

const LearningHistorySection = ({ profile, loading }: { profile: EnhancedEmployeeProfile | null, loading: boolean }) => (
  profile ? (
    <LearningHistory 
      completedCourses={profile.completedCourses} 
      learningActivities={profile.learningActivities}
      isLoading={loading}
    />
  ) : (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Learning History</CardTitle>
        <CardDescription>Course completions and learning activities</CardDescription>
      </CardHeader>
      <CardContent>
        <p>No learning history data available</p>
      </CardContent>
    </Card>
  )
);

const CareerDevelopmentSection = ({ profile }: { profile: EnhancedEmployeeProfile | null }) => (
  <Card className="w-full mb-6">
    <CardHeader>
      <CardTitle>Career Development</CardTitle>
      <CardDescription>Career goals and development plans</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Career development will be implemented here</p>
    </CardContent>
  </Card>
);

const FeedbackSection = ({ profile }: { profile: EnhancedEmployeeProfile | null }) => (
  <Card className="w-full mb-6">
    <CardHeader>
      <CardTitle>Feedback & Preferences</CardTitle>
      <CardDescription>Content feedback and topic preferences</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Feedback and preferences will be implemented here</p>
    </CardContent>
  </Card>
);

/**
 * Employee Profile Page Component
 * 
 * Displays comprehensive employee profile information with a tabbed interface
 * for different profile sections
 */
const EmployeeProfilePage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal-info');
  const [profile, setProfile] = useState<EnhancedEmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!employeeId) {
        setError('Employee ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const profileData = await getEmployeeProfile(employeeId);
        setProfile(profileData);
        setError(null);
      } catch (err) {
        console.error('Error fetching employee profile:', err);
        setError('Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [employeeId]);
  
  const handleGoBack = () => {
    navigate('/hr-dashboard/employees');
  };
  
  const tabIcons = {
    'personal-info': <FileText className="h-4 w-4 mr-2" />,
    'learning-preferences': <Book className="h-4 w-4 mr-2" />,
    'skills': <Award className="h-4 w-4 mr-2" />,
    'learning-history': <Clock className="h-4 w-4 mr-2" />,
    'career-development': <Activity className="h-4 w-4 mr-2" />,
    'feedback': <MessageSquare className="h-4 w-4 mr-2" />,
  };
  
  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
        <h1 className="text-2xl font-bold">Employee Profile</h1>
      </div>
      
      {error ? (
        <Card className="w-full mb-6">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={handleGoBack} className="mt-4">
              Return to Employees
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <PersonalInfoSection profile={profile} loading={loading} />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6">
              <TabsTrigger value="personal-info" className="flex items-center">
                {tabIcons['personal-info']}
                <span className="hidden md:inline">Info</span>
              </TabsTrigger>
              <TabsTrigger value="learning-preferences" className="flex items-center">
                {tabIcons['learning-preferences']}
                <span className="hidden md:inline">Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center">
                {tabIcons['skills']}
                <span className="hidden md:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="learning-history" className="flex items-center">
                {tabIcons['learning-history']}
                <span className="hidden md:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="career-development" className="flex items-center">
                {tabIcons['career-development']}
                <span className="hidden md:inline">Career</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center">
                {tabIcons['feedback']}
                <span className="hidden md:inline">Feedback</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal-info">
              <div className="space-y-4">
                {/* Personal info is already shown above */}
              </div>
            </TabsContent>
            
            <TabsContent value="learning-preferences">
              <LearningPreferencesSection profile={profile} />
            </TabsContent>
            
            <TabsContent value="skills">
              <SkillsSection profile={profile} />
            </TabsContent>
            
            <TabsContent value="learning-history">
              <LearningHistorySection profile={profile} loading={loading} />
            </TabsContent>
            
            <TabsContent value="career-development">
              <CareerDevelopmentSection profile={profile} />
            </TabsContent>
            
            <TabsContent value="feedback">
              <FeedbackSection profile={profile} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default EmployeeProfilePage; 