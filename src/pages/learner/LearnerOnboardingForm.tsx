import React from 'react';
import { useState } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define the form values interface directly
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
      learning_style: 'visual' as const,
      preferred_content_types: [] as string[],
      learning_goals: [] as string[],
      time_availability: '1_to_3h' as const,
      custom_learning_goal: '',
      notification_preferences: 'important_only' as const,
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
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Complete Your Learner Profile</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Style</CardTitle>
              <CardDescription>
                Understanding how you learn best helps us tailor content to your preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Style Section */}
              <FormField
                control={form.control}
                name="learning_style"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>What learning style works best for you?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="visual" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Visual - You prefer images, videos, and spatial understanding
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="auditory" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Auditory - You learn best through listening and discussion
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="reading" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Reading - You prefer text-based information
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="kinesthetic" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Kinesthetic - You learn through hands-on practice and experience
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Content Format Preferences */}
              <FormField
                control={form.control}
                name="preferred_content_types"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Content Format Preferences</FormLabel>
                      <FormDescription>
                        Select the types of content you prefer (select all that apply)
                      </FormDescription>
                    </div>
                    {['videos', 'articles', 'interactive_exercises', 'quizzes', 'case_studies', 'group_discussions'].map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="preferred_content_types"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Learning Goals */}
              <FormField
                control={form.control}
                name="learning_goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What are your learning goals?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you hope to achieve through your learning journey..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about skills you want to develop or knowledge you want to gain
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Learning Availability & Preferences</CardTitle>
              <CardDescription>
                Help us understand when and how you prefer to learn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time Availability */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="time_availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How many hours per week can you dedicate to learning?</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="less_than_1h" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Less than 1 hour
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="1_to_3h" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                1 to 3 hours
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="3_to_5h" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                3 to 5 hours
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="more_than_5h" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                More than 5 hours
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you want to receive updates about your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Notification Frequency */}
              <FormField
                control={form.control}
                name="notification_preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How often would you like to receive notifications?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="important_only">Important Updates Only</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Complete Onboarding'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default LearnerOnboardingForm; 