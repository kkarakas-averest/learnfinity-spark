import React, { useState } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define form value types without using zod
interface OnboardingFormValues {
  learning_style: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  preferred_content_types: string[];
  learning_goals: string[];
  time_availability: 'less_than_1h' | '1_to_3h' | '3_to_5h' | 'more_than_5h';
  custom_learning_goal: string;
  notification_preferences: 'daily' | 'weekly' | 'important_only' | 'none';
}

const LearnerOnboardingForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      learning_style: 'visual' as 'visual' | 'auditory' | 'reading' | 'kinesthetic',
      preferred_content_types: [] as string[],
      learning_goals: [] as string[],
      time_availability: '1_to_3h' as 'less_than_1h' | '1_to_3h' | '3_to_5h' | 'more_than_5h',
      custom_learning_goal: '',
      notification_preferences: 'important_only' as 'daily' | 'weekly' | 'important_only' | 'none',
    },
  });
  
  const onSubmit = async (data: OnboardingFormValues) => {
    // Validate form data manually
    if (data.preferred_content_types.length === 0) {
      form.setError('preferred_content_types', {
        type: 'manual',
        message: 'Select at least one content type'
      });
      return;
    }
    
    if (data.learning_goals.length === 0) {
      form.setError('learning_goals', {
        type: 'manual',
        message: 'Select at least one learning goal'
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        throw new Error('You must be logged in to complete onboarding');
      }
      
      // Format the learning preferences data
      const learningPreferences = {
        preferred_learning_style: data.learning_style,
        preferred_content_types: data.preferred_content_types,
        learning_goals: [...data.learning_goals, data.custom_learning_goal].filter(Boolean),
        time_availability: data.time_availability,
        notification_preferences: data.notification_preferences,
      };
      
      // Check if learner profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('learner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // Update or create the learner profile
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('learner_profiles')
          .update({
            learning_preferences: learningPreferences,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('learner_profiles')
          .insert({
            user_id: user.id,
            learning_preferences: learningPreferences,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          });
          
        if (insertError) throw insertError;
      }
      
      // Trigger AI personalization
      const { error: aiError } = await supabase
        .from('ai_agent_tasks')
        .insert({
          user_id: user.id,
          agent_type: 'personalization',
          task_type: 'generate_learning_path',
          status: 'pending',
          priority: 'high',
          data: {
            learning_preferences: learningPreferences,
          },
        });
        
      if (aiError) {
        console.error('Failed to trigger AI personalization, but continuing:', aiError);
      }
      
      // Navigate to the dashboard
      navigate(ROUTES.LEARNER_DASHBOARD);
      
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setError(err.message || 'An error occurred during onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Learning Profile</CardTitle>
          <CardDescription>
            Help us personalize your learning experience by sharing your preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Learning Style */}
              <FormField
                control={form.control}
                name="learning_style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How do you learn best?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="visual" id="visual" />
                          <Label htmlFor="visual">Visual (images, videos, diagrams)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="auditory" id="auditory" />
                          <Label htmlFor="auditory">Auditory (listening, discussing)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="reading" id="reading" />
                          <Label htmlFor="reading">Reading/Writing (text, notes)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="kinesthetic" id="kinesthetic" />
                          <Label htmlFor="kinesthetic">Kinesthetic (hands-on, practice)</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      This helps us select the right type of content for you.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Preferred Content Types */}
              <FormField
                control={form.control}
                name="preferred_content_types"
                render={() => (
                  <FormItem>
                    <FormLabel>What types of content do you prefer?</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="preferred_content_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('videos')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'videos']
                                    : field.value?.filter((v) => v !== 'videos');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Videos
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferred_content_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('articles')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'articles']
                                    : field.value?.filter((v) => v !== 'articles');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Articles
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferred_content_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('interactive_exercises')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'interactive_exercises']
                                    : field.value?.filter((v) => v !== 'interactive_exercises');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Interactive Exercises
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferred_content_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('quizzes')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'quizzes']
                                    : field.value?.filter((v) => v !== 'quizzes');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Quizzes
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferred_content_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('case_studies')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'case_studies']
                                    : field.value?.filter((v) => v !== 'case_studies');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Case Studies
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferred_content_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('discussions')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'discussions']
                                    : field.value?.filter((v) => v !== 'discussions');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Group Discussions
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormDescription>
                      Select all that apply. This helps us deliver content in formats you prefer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Learning Goals */}
              <FormField
                control={form.control}
                name="learning_goals"
                render={() => (
                  <FormItem>
                    <FormLabel>What are your learning goals?</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="learning_goals"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('job_skills')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'job_skills']
                                    : field.value?.filter((v) => v !== 'job_skills');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Improve current job skills
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="learning_goals"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('career_advancement')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'career_advancement']
                                    : field.value?.filter((v) => v !== 'career_advancement');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Career advancement
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="learning_goals"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('certification')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'certification']
                                    : field.value?.filter((v) => v !== 'certification');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Professional certification
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="learning_goals"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes('personal_interest')}
                                onCheckedChange={(checked) => {
                                  const newVal = checked
                                    ? [...field.value, 'personal_interest']
                                    : field.value?.filter((v) => v !== 'personal_interest');
                                  field.onChange(newVal);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Personal interest
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormDescription>
                      Select all that apply. This helps us suggest relevant courses.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Custom Learning Goal */}
              <FormField
                control={form.control}
                name="custom_learning_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Any specific learning goal not listed above?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., I want to learn advanced data visualization techniques..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Tell us about any specific skills or knowledge you'd like to gain.
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              {/* Time Availability */}
              <FormField
                control={form.control}
                name="time_availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How much time can you dedicate to learning each week?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="less_than_1h">Less than 1 hour</SelectItem>
                        <SelectItem value="1_to_3h">1-3 hours</SelectItem>
                        <SelectItem value="3_to_5h">3-5 hours</SelectItem>
                        <SelectItem value="more_than_5h">More than 5 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This helps us pace your learning journey appropriately.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notification Preferences */}
              <FormField
                control={form.control}
                name="notification_preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How often would you like to receive learning reminders?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily reminders</SelectItem>
                        <SelectItem value="weekly">Weekly digest</SelectItem>
                        <SelectItem value="important_only">Important updates only</SelectItem>
                        <SelectItem value="none">No notifications</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      We can send you reminders to help you stay on track.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving preferences...' : 'Complete Onboarding'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          You can update these preferences later in your profile settings.
        </CardFooter>
      </Card>
    </div>
  );
};

export default LearnerOnboardingForm; 