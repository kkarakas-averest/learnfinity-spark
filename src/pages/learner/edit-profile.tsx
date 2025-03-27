import React, { useState, useEffect } from '@/lib/react-helpers';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual' },
  { value: 'auditory', label: 'Auditory' },
  { value: 'reading_writing', label: 'Reading/Writing' },
  { value: 'kinesthetic', label: 'Kinesthetic (Hands-on)' },
];

const CONTENT_TYPES = [
  { value: 'videos', label: 'Videos' },
  { value: 'articles', label: 'Articles & Blog Posts' },
  { value: 'infographics', label: 'Infographics' },
  { value: 'interactive', label: 'Interactive Exercises' },
  { value: 'quizzes', label: 'Quizzes & Assessments' },
  { value: 'case_studies', label: 'Case Studies' },
  { value: 'presentations', label: 'Slide Presentations' },
  { value: 'audio', label: 'Audio/Podcasts' },
];

interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

// Simple hook for authentication state
const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching auth session:', error);
        setUser(null);
      } else if (data?.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          role: data.session.user.user_metadata?.role
        });
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    fetchUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: session.user.user_metadata?.role
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return { user, isLoading, isAuthenticated: !!user };
};

const EditLearnerProfilePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isHrProfile, setIsHrProfile] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    skills: '',
    learningStyle: '',
    contentTypes: [] as string[],
    learningGoals: ''
  });
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch dashboard data which includes profile
        const response = await fetch(`/api/learner/dashboard?userId=${user.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile data');
        }
        
        const { profile } = await response.json();
        setProfile(profile);
        setIsHrProfile(!!profile?.isHrProfile);
        
        // Initialize form data
        setFormData({
          name: profile?.name || '',
          title: profile?.title || '',
          bio: profile?.bio || '',
          skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : '',
          learningStyle: profile?.learningPreferences?.preferredLearningStyle || '',
          contentTypes: Array.isArray(profile?.learningPreferences?.preferredContentTypes) 
            ? profile.learningPreferences.preferredContentTypes 
            : [],
          learningGoals: Array.isArray(profile?.learningPreferences?.learningGoals)
            ? profile.learningPreferences.learningGoals.join('\n')
            : ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user?.id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContentTypeToggle = (value: string) => {
    setFormData(prev => {
      const existing = [...prev.contentTypes];
      const index = existing.indexOf(value);
      
      if (index > -1) {
        existing.splice(index, 1);
      } else {
        existing.push(value);
      }
      
      return { ...prev, contentTypes: existing };
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Parse form data
      const skillsArray = formData.skills.split(',')
        .map(s => s.trim())
        .filter(Boolean);
        
      const learningGoalsArray = formData.learningGoals.split('\n')
        .map(g => g.trim())
        .filter(Boolean);
      
      // Prepare profile data for update or creation
      const profileData = {
        user_id: user.id,
        name: formData.name,
        title: formData.title || null,
        bio: formData.bio || null,
        skills: skillsArray,
        learning_preferences: {
          preferred_learning_style: formData.learningStyle || null,
          preferred_content_types: formData.contentTypes,
          learning_goals: learningGoalsArray
        }
      };
      
      let result;
      
      // Check if we're creating a new profile or updating an existing one
      if (profile && !profile.isHrProfile) {
        // Update existing profile
        result = await supabase
          .from('learner_profiles')
          .update(profileData)
          .eq('id', profile.id);
      } else {
        // Create new profile
        result = await supabase
          .from('learner_profiles')
          .insert(profileData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
      
      // Redirect to profile page
      router.push('/learner/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update profile'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error loading profile</h2>
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => router.push('/learner/profile')} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6 space-x-4">
        <Button variant="ghost" onClick={() => router.push('/learner/profile')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to profile
        </Button>
        <h1 className="text-2xl font-bold">
          {isHrProfile ? 'Complete Your Learning Profile' : 'Edit Profile'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Marketing Specialist"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="A brief introduction about yourself..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Textarea
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="e.g. JavaScript, Public Speaking, Project Management"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Learning Preferences */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="learningStyle">Preferred Learning Style</Label>
                <Select 
                  value={formData.learningStyle} 
                  onValueChange={(value) => handleSelectChange('learningStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select learning style" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEARNING_STYLES.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  How do you prefer to consume educational content?
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Content Types</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {CONTENT_TYPES.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`content-${type.value}`}
                        checked={formData.contentTypes.includes(type.value)}
                        onCheckedChange={() => handleContentTypeToggle(type.value)}
                      />
                      <Label 
                        htmlFor={`content-${type.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="learningGoals">Learning Goals</Label>
                <Textarea
                  id="learningGoals"
                  name="learningGoals"
                  value={formData.learningGoals}
                  onChange={handleInputChange}
                  placeholder="Enter each goal on a new line..."
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  What specific skills or knowledge would you like to acquire? Enter each goal on a new line.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => router.push('/learner/profile')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {submitting ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default EditLearnerProfilePage; 