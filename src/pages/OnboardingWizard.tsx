import React from "@/lib/react-helpers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/state";
import { supabase } from "@/lib/supabase";
import { CheckCircle, ArrowRight, Check } from "lucide-react";

// Define types for learner profile and preferences
interface LearningPreferences {
  learningStyle: string;
  preferredContentTypes: string[];
  preferredLearningPace: string;
  preferredLanguage: string;
  preferredSchedule: string;
  skillGoals: string[];
}

interface LearnerProfile {
  userId: string;
  preferences: LearningPreferences;
  careerGoals: string;
  priorExperience: string;
  completedOnboarding: boolean;
}

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userDetails } = useAuth();
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Form state for learner profile
  const [learnerProfile, setLearnerProfile] = React.useState<LearnerProfile>({
    userId: user?.id || '',
    preferences: {
      learningStyle: 'visual',
      preferredContentTypes: ['video', 'interactive'],
      preferredLearningPace: 'moderate',
      preferredLanguage: 'english',
      preferredSchedule: 'flexible',
      skillGoals: [],
    },
    careerGoals: '',
    priorExperience: '',
    completedOnboarding: false
  });
  
  // The list of skill options for the form
  const skillOptions = [
    { id: 'leadership', label: 'Leadership' },
    { id: 'communication', label: 'Communication' },
    { id: 'technical', label: 'Technical Skills' },
    { id: 'problem-solving', label: 'Problem Solving' },
    { id: 'creativity', label: 'Creativity' },
    { id: 'time-management', label: 'Time Management' },
    { id: 'adaptability', label: 'Adaptability' },
    { id: 'teamwork', label: 'Teamwork' },
  ];
  
  // Calculate progress percentage
  const progressPercentage = (step / 4) * 100;
  
  // Update preferences when form values change
  const updatePreference = (field: keyof LearningPreferences, value: any) => {
    setLearnerProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };
  
  // Toggle skill selection
  const toggleSkill = (skillId: string) => {
    const currentSkills = [...learnerProfile.preferences.skillGoals];
    
    if (currentSkills.includes(skillId)) {
      updatePreference('skillGoals', currentSkills.filter(id => id !== skillId));
    } else {
      updatePreference('skillGoals', [...currentSkills, skillId]);
    }
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Submit the learner profile to the database and trigger AI agent processing
  const handleSubmitProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID is missing. Please log in again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the learner profile with completion flag
      const completeProfile = {
        ...learnerProfile,
        userId: user.id,
        completedOnboarding: true
      };
      
      // Save to Supabase
      const { error } = await supabase
        .from('learner_profiles')
        .upsert({
          user_id: user.id,
          preferences: completeProfile.preferences,
          career_goals: completeProfile.careerGoals,
          prior_experience: completeProfile.priorExperience,
          completed_onboarding: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Trigger AI personalization process
      const personalizationResponse = await fetch('/api/personalize-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!personalizationResponse.ok) {
        const errorData = await personalizationResponse.json();
        throw new Error(errorData.message || 'Failed to personalize learning');
      }
      
      toast({
        title: "Onboarding Complete",
        description: "Your learning preferences have been saved. Redirecting to your personalized dashboard.",
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving learner profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your preferences",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Learnfinity</CardTitle>
          <CardDescription className="text-center">
            Let's personalize your learning experience
          </CardDescription>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Learning Style & Preferences */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Learning Style & Preferences</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>What's your preferred learning style?</Label>
                  <RadioGroup 
                    value={learnerProfile.preferences.learningStyle}
                    onValueChange={(value) => updatePreference('learningStyle', value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="visual" id="visual" />
                      <Label htmlFor="visual">Visual (learn through images, videos)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="auditory" id="auditory" />
                      <Label htmlFor="auditory">Auditory (learn through listening)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reading" id="reading" />
                      <Label htmlFor="reading">Reading/Writing (learn through text)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="kinesthetic" id="kinesthetic" />
                      <Label htmlFor="kinesthetic">Kinesthetic (learn by doing)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>What content types do you prefer?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'video', label: 'Video Lessons' },
                      { id: 'text', label: 'Text Articles' },
                      { id: 'interactive', label: 'Interactive Exercises' },
                      { id: 'audio', label: 'Audio Content' },
                      { id: 'quizzes', label: 'Quizzes & Tests' },
                      { id: 'case-studies', label: 'Case Studies' }
                    ].map(option => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={option.id}
                          checked={learnerProfile.preferences.preferredContentTypes.includes(option.id)}
                          onCheckedChange={() => {
                            const current = [...learnerProfile.preferences.preferredContentTypes];
                            if (current.includes(option.id)) {
                              updatePreference('preferredContentTypes', current.filter(id => id !== option.id));
                            } else {
                              updatePreference('preferredContentTypes', [...current, option.id]);
                            }
                          }}
                        />
                        <Label htmlFor={option.id}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Preferred learning pace</Label>
                  <Select 
                    value={learnerProfile.preferences.preferredLearningPace}
                    onValueChange={(value) => updatePreference('preferredLearningPace', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your preferred pace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow & Thorough</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="fast">Fast-paced</SelectItem>
                      <SelectItem value="self-directed">Self-directed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Time & Language Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Time & Language Preferences</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preferred language for learning content</Label>
                  <Select 
                    value={learnerProfile.preferences.preferredLanguage}
                    onValueChange={(value) => updatePreference('preferredLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>When do you prefer to learn?</Label>
                  <RadioGroup 
                    value={learnerProfile.preferences.preferredSchedule}
                    onValueChange={(value) => updatePreference('preferredSchedule', value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="afternoon" id="afternoon" />
                      <Label htmlFor="afternoon">Afternoon</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="evening" id="evening" />
                      <Label htmlFor="evening">Evening</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flexible" id="flexible" />
                      <Label htmlFor="flexible">Flexible/Varies</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Skill Goals */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Your Skill Goals</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>What skills would you like to improve?</Label>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {skillOptions.map(skill => (
                      <div key={skill.id} className="flex items-start space-x-3 border rounded-md p-3 hover:bg-gray-50 cursor-pointer" 
                        onClick={() => toggleSkill(skill.id)}>
                        <Checkbox 
                          id={`skill-${skill.id}`}
                          checked={learnerProfile.preferences.skillGoals.includes(skill.id)}
                          onCheckedChange={() => toggleSkill(skill.id)}
                          className="mt-0.5"
                        />
                        <Label htmlFor={`skill-${skill.id}`} className="font-medium">
                          {skill.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="career-goals">Career Goals</Label>
                  <Textarea 
                    id="career-goals"
                    placeholder="Describe your career objectives and what you hope to achieve..."
                    value={learnerProfile.careerGoals}
                    onChange={(e) => setLearnerProfile(prev => ({
                      ...prev, 
                      careerGoals: e.target.value
                    }))}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Prior Experience & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Prior Experience & Confirmation</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prior-experience">Prior Learning Experience</Label>
                  <Textarea 
                    id="prior-experience"
                    placeholder="Summarize any previous training, certifications, or relevant work experience..."
                    value={learnerProfile.priorExperience}
                    onChange={(e) => setLearnerProfile(prev => ({
                      ...prev, 
                      priorExperience: e.target.value
                    }))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="rounded-md border p-4 bg-green-50">
                  <h3 className="font-medium flex items-center text-green-800">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Ready to personalize your learning experience
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Based on your preferences, our AI will curate personalized content and learning paths just for you.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button 
              variant="outline" 
              onClick={handlePrevStep}
              disabled={isSubmitting}
            >
              Back
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          {step < 4 ? (
            <Button onClick={handleNextStep} disabled={isSubmitting}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmitProfile}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" /> 
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
