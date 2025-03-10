import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Clock, FileText, Book, Award, Activity, Star, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

// Service and types
import { getEmployeeProfile, updateEmployeeProfile } from '@/services/employee-profile.service';
import { EnhancedEmployeeProfile } from '@/types/employee-profile.types';
import { RAGStatus } from '@/types/hr.types';

// Components
import SkillsInventory from '@/components/hr/profile/SkillsInventory';
import LearningHistory from '@/components/hr/profile/LearningHistory';
import CareerDevelopment from '@/components/hr/profile/CareerDevelopment';
import FeedbackPreferences from '@/components/hr/profile/FeedbackPreferences';
import ProfileEditor from '@/components/hr/profile/ProfileEditor';

// This will be broken down into separate components later
const PersonalInfoSection = ({ profile, loading, onEditPersonal }: { 
  profile: EnhancedEmployeeProfile | null, 
  loading: boolean,
  onEditPersonal: () => void
}) => {
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
        <Button variant="outline" size="sm" onClick={onEditPersonal}>
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
const LearningPreferencesSection = ({ profile, onEdit }: { 
  profile: EnhancedEmployeeProfile | null,
  onEdit: () => void 
}) => (
  <Card className="w-full mb-6">
    <CardHeader className="flex flex-row items-start justify-between">
      <div>
        <CardTitle>Learning Preferences</CardTitle>
        <CardDescription>How this employee prefers to learn and engage with content</CardDescription>
      </div>
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit Preferences
      </Button>
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
  profile ? (
    <CareerDevelopment 
      careerGoals={profile.careerGoals} 
      skills={profile.skills}
      isEditable={false}
    />
  ) : (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Career Development</CardTitle>
        <CardDescription>Career goals and development plans</CardDescription>
      </CardHeader>
      <CardContent>
        <p>No career development data available</p>
      </CardContent>
    </Card>
  )
);

const AILearningSection = ({ profile }: { profile: EnhancedEmployeeProfile | null }) => {
  if (!profile) return null;

  // Get RAG status color function (same as in the PersonalInfoSection)
  const getRagStatusColor = (status: RAGStatus): string => {
    switch (status) {
      case 'red': return 'bg-destructive text-destructive-foreground';
      case 'amber': return 'bg-yellow-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  // Generate mock data if no learning path exists yet
  const mockLearningPath = {
    courses: [
      {
        id: 'course-1',
        title: 'Introduction to Project Management',
        description: 'Learn the fundamentals of project management and team leadership.',
        duration: '4 hours',
        matchScore: 92,
        ragStatus: 'green' as RAGStatus,
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
        ragStatus: 'amber' as RAGStatus,
        progress: 30,
        sections: 10,
        completedSections: 3,
        skills: ['communication', 'teamwork', 'empathy'],
        requiredForCertification: true
      }
    ],
    updatedAt: new Date().toISOString()
  };

  // Mock agent activity data
  const mockAgentActivity = [
    {
      type: 'recommendation',
      description: 'Recommended additional resources for Problem-Solving module based on recent assessment results',
      agent: 'Content Recommendation Agent',
      timestamp: new Date().toISOString()
    },
    {
      type: 'alert',
      description: 'Employee showing signs of difficulty with technical concepts in Programming Fundamentals course',
      agent: 'Learning Progress Agent',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      type: 'update',
      description: 'Learning path updated based on new skill acquisition in Project Management',
      agent: 'Personalization Agent',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Use existing data or mock data
  const learningPath = profile.learningPath || mockLearningPath;
  const agentActivity = profile.agentActivity || mockAgentActivity;

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>AI-Personalized Learning Path</CardTitle>
          <CardDescription>
            Learning path automatically curated by AI agents based on employee's profile, skills, and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {learningPath && learningPath.courses ? (
              <>
                <div className="grid gap-4">
                  {learningPath.courses.map((course: any) => (
                    <div key={course.id} className="border rounded-md p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        </div>
                        <Badge className={`${getRagStatusColor(course.ragStatus)} capitalize`}>
                          {course.ragStatus}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      
                      <div className="flex items-center text-sm mt-2 justify-between">
                        <div className="text-muted-foreground">
                          Match Score: <span className="font-semibold">{course.matchScore}%</span>
                        </div>
                        <div className="text-muted-foreground">
                          Estimated Duration: <span className="font-semibold">{course.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-muted-foreground italic mt-4">
                  Last updated: {new Date(learningPath.updatedAt).toLocaleDateString()}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-8 border rounded-md bg-muted/50">
                <div className="text-center">
                  <h3 className="font-medium mb-2">No Learning Path Available</h3>
                  <p className="text-sm text-muted-foreground">
                    This employee doesn't have a personalized learning path yet.
                    They may need to complete the onboarding process.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      // Here we would trigger the AI agent to generate a learning path
                      toast({
                        title: "AI Request Sent",
                        description: "Request to generate a personalized learning path has been sent to the AI system."
                      });
                    }}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Generate Learning Path
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Agent Activity</CardTitle>
          <CardDescription>
            Recent AI actions and recommendations for this employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentActivity && agentActivity.length > 0 ? (
              <div className="border rounded-md divide-y">
                {agentActivity.map((activity: any, index: number) => (
                  <div key={index} className="p-3">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${
                        activity.type === 'recommendation' ? 'bg-blue-500' :
                        activity.type === 'alert' ? 'bg-amber-500' :
                        'bg-green-500'
                      } mr-2`}></div>
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground">{activity.agent}</span>
                          <span className="inline-block mx-2 text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  No recent AI agent activity for this employee.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

/**
 * Employee Profile Page Component
 * 
 * Displays comprehensive employee profile information with a tabbed interface
 * for different profile sections
 */
const EmployeeProfilePage: React.FC = () => {
  const params = useParams();
  const employeeId = params.employeeId;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('personal-info');
  const [profile, setProfile] = React.useState<EnhancedEmployeeProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // State for edit modals
  const [editSection, setEditSection] = React.useState<'personal' | 'learning-preferences' | 'feedback-preferences' | null>(null);
  
  React.useEffect(() => {
    fetchProfile();
  }, [employeeId]);
  
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
  
  const handleGoBack = () => {
    navigate('/hr-dashboard/employees');
  };
  
  const handleEditPersonal = () => {
    setEditSection('personal');
  };
  
  const handleEditLearningPreferences = () => {
    setEditSection('learning-preferences');
  };
  
  const handleEditFeedbackPreferences = () => {
    setEditSection('feedback-preferences');
  };
  
  const handleCloseEditor = () => {
    setEditSection(null);
  };
  
  const handleSaveProfileSection = async (sectionData: any) => {
    if (!profile || !employeeId) return;
    
    try {
      let updatedProfile = { ...profile };
      
      switch (editSection) {
        case 'personal':
          updatedProfile = {
            ...profile,
            name: sectionData.name,
            email: sectionData.email,
            phoneNumber: sectionData.phoneNumber,
            manager: sectionData.manager,
            bio: sectionData.bio
          };
          break;
        case 'learning-preferences':
          updatedProfile = {
            ...profile,
            learningPreferences: sectionData
          };
          break;
        case 'feedback-preferences':
          updatedProfile = {
            ...profile,
            contentFeedback: {
              ...profile.contentFeedback,
              preferredTopics: sectionData.preferredTopics,
              dislikedTopics: sectionData.dislikedTopics
            }
          };
          break;
      }
      
      await updateEmployeeProfile(employeeId, updatedProfile);
      setProfile(updatedProfile);
      toast({
        title: "Profile updated",
        description: "Employee profile has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the profile. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const tabIcons = {
    'personal-info': <FileText className="h-4 w-4 mr-2" />,
    'learning-preferences': <Book className="h-4 w-4 mr-2" />,
    'skills': <Award className="h-4 w-4 mr-2" />,
    'learning-history': <Clock className="h-4 w-4 mr-2" />,
    'career-development': <Activity className="h-4 w-4 mr-2" />,
    'feedback': <MessageSquare className="h-4 w-4 mr-2" />,
    'ai-learning': <Star className="h-4 w-4 mr-2" />,
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
          <PersonalInfoSection 
            profile={profile} 
            loading={loading} 
            onEditPersonal={handleEditPersonal} 
          />
          
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
              <TabsTrigger value="ai-learning" className="flex items-center">
                {tabIcons['ai-learning']}
                <span className="hidden md:inline">AI Learning</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal-info">
              <div className="space-y-4">
                {/* Personal info is already shown above */}
              </div>
            </TabsContent>
            
            <TabsContent value="learning-preferences">
              <LearningPreferencesSection 
                profile={profile}
                onEdit={handleEditLearningPreferences}
              />
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
              <FeedbackPreferences 
                profile={profile} 
                isEditable={true}
                onEdit={handleEditFeedbackPreferences}
              />
            </TabsContent>
            
            <TabsContent value="ai-learning">
              <AILearningSection profile={profile} />
            </TabsContent>
          </Tabs>
          
          {/* Profile Editor Modal */}
          {profile && editSection && (
            <ProfileEditor
              profile={profile}
              section={editSection}
              isOpen={!!editSection}
              onClose={handleCloseEditor}
              onSave={handleSaveProfileSection}
            />
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeProfilePage; 