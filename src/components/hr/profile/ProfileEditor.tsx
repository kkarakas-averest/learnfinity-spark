import React from '@/lib/react-helpers';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Plus } from '@/components/ui/icons/index';
import { EnhancedEmployeeProfile, LearningStylePreference, DevicePreference, ContentFormatPreference, LearningTimePreference } from '@/types/employee-profile.types';

// Define the section types that can be edited
type EditSection = 'personal' | 'learning-preferences' | 'feedback-preferences';

interface ProfileEditorProps {
  profile: EnhancedEmployeeProfile;
  section: EditSection;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sectionData: any) => Promise<void>; // Will be typed properly based on section
}

// Schema for personal information
const personalInfoSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().optional(),
  manager: z.string().optional(),
  bio: z.string().max(500, { message: "Bio cannot exceed 500 characters" }).optional(),
});

// Learning style type
const learningStyleEnum = z.enum(['visual', 'auditory', 'reading', 'kinesthetic', 'mixed']);
const learningTimeEnum = z.enum(['morning', 'afternoon', 'evening', 'weekend', 'flexible']);
const deviceEnum = z.enum(['desktop', 'laptop', 'tablet', 'mobile', 'multiple']);
const contentFormatEnum = z.enum(['video', 'article', 'interactive', 'simulation', 'quiz', 'discussion']);
const difficultyEnum = z.enum(['easy', 'moderate', 'challenging', 'mixed']);

// Schema for learning preferences
const learningPreferencesSchema = z.object({
  learningStyle: learningStyleEnum,
  preferredTimes: z.array(learningTimeEnum)
    .min(1, { message: "Select at least one preferred time" }),
  preferredDevice: deviceEnum,
  preferredContentFormats: z.array(contentFormatEnum)
    .min(1, { message: "Select at least one content format" }),
  averageSessionDuration: z.number().min(5, { message: "Session must be at least 5 minutes" }),
  prefersDifficulty: difficultyEnum,
  prefersCollaboration: z.boolean(),
  prefersDeadlines: z.boolean(),
  additionalPreferences: z.string().max(300, { message: "Additional preferences cannot exceed 300 characters" }).optional(),
});

// Schema for feedback preferences
const feedbackPreferencesSchema = z.object({
  preferredTopics: z.array(z.string().min(1)).min(0),
  dislikedTopics: z.array(z.string().min(1)).min(0),
  newPreferredTopic: z.string().optional(),
  newDislikedTopic: z.string().optional(),
});

/**
 * ProfileEditor Component
 * 
 * Modal form for editing different sections of an employee profile
 */
const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  section,
  isOpen,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [newTopicInput, setNewTopicInput] = React.useState('');
  const [newDislikedTopicInput, setNewDislikedTopicInput] = React.useState('');

  // Form setup based on section type
  let formSchema;
  let defaultValues: any;
  let title = '';
  let description = '';

  switch (section) {
    case 'personal':
      formSchema = personalInfoSchema;
      defaultValues = {
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phoneNumber || '',
        manager: profile.manager || '',
        bio: profile.bio || '',
      };
      title = 'Edit Personal Information';
      description = 'Update the employee\'s basic information';
      break;
    case 'learning-preferences':
      formSchema = learningPreferencesSchema;
      defaultValues = {
        ...profile.learningPreferences,
      };
      title = 'Edit Learning Preferences';
      description = 'Update how this employee prefers to learn';
      break;
    case 'feedback-preferences':
      formSchema = feedbackPreferencesSchema;
      defaultValues = {
        preferredTopics: [...profile.contentFeedback.preferredTopics],
        dislikedTopics: [...profile.contentFeedback.dislikedTopics],
        newPreferredTopic: '',
        newDislikedTopic: '',
      };
      title = 'Edit Feedback & Preferences';
      description = 'Update content preferences and topic interests';
      break;
    default:
      formSchema = z.object({});
      defaultValues = {};
      title = 'Edit Profile';
      description = 'Update employee information';
  }

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const preferredTopics = watch('preferredTopics') || [];
  const dislikedTopics = watch('dislikedTopics') || [];

  const handleAddPreferredTopic = () => {
    if (newTopicInput.trim() && !preferredTopics.includes(newTopicInput.trim())) {
      setValue('preferredTopics', [...preferredTopics, newTopicInput.trim()]);
      setNewTopicInput('');
    }
  };

  const handleRemovePreferredTopic = (topic: string) => {
    setValue('preferredTopics', preferredTopics.filter(t => t !== topic));
  };

  const handleAddDislikedTopic = () => {
    if (newDislikedTopicInput.trim() && !dislikedTopics.includes(newDislikedTopicInput.trim())) {
      setValue('dislikedTopics', [...dislikedTopics, newDislikedTopicInput.trim()]);
      setNewDislikedTopicInput('');
    }
  };

  const handleRemoveDislikedTopic = (topic: string) => {
    setValue('dislikedTopics', dislikedTopics.filter(t => t !== topic));
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Remove helper fields used only in the UI
      if (section === 'feedback-preferences') {
        const { newPreferredTopic, newDislikedTopic, ...cleanData } = data;
        await onSave(cleanData);
      } else {
        await onSave(data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Personal Info Form
  const renderPersonalInfoForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
        <Input id="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" {...register('phoneNumber')} />
        {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager">Manager</Label>
        <Input id="manager" {...register('manager')} />
        {errors.manager && <p className="text-sm text-destructive">{errors.manager.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" {...register('bio')} rows={4} />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message?.toString()}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Changes</Button>
      </DialogFooter>
    </form>
  );

  // Learning Preferences Form
  const renderLearningPreferencesForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Preferred Learning Style <span className="text-destructive">*</span></Label>
        <Controller
          name="learningStyle"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select learning style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visual">Visual</SelectItem>
                <SelectItem value="auditory">Auditory</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.learningStyle && <p className="text-sm text-destructive">{errors.learningStyle.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label>Preferred Times <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 gap-2">
          <Controller
            name="preferredTimes"
            control={control}
            render={({ field }) => (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="morning" 
                    checked={field.value.includes('morning')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'morning']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'morning'));
                      }
                    }}
                  />
                  <Label htmlFor="morning">Morning</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="afternoon" 
                    checked={field.value.includes('afternoon')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'afternoon']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'afternoon'));
                      }
                    }}
                  />
                  <Label htmlFor="afternoon">Afternoon</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="evening" 
                    checked={field.value.includes('evening')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'evening']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'evening'));
                      }
                    }}
                  />
                  <Label htmlFor="evening">Evening</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="weekend" 
                    checked={field.value.includes('weekend')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'weekend']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'weekend'));
                      }
                    }}
                  />
                  <Label htmlFor="weekend">Weekend</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="flexible" 
                    checked={field.value.includes('flexible')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'flexible']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'flexible'));
                      }
                    }}
                  />
                  <Label htmlFor="flexible">Flexible</Label>
                </div>
              </>
            )}
          />
        </div>
        {errors.preferredTimes && <p className="text-sm text-destructive">{errors.preferredTimes.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label>Preferred Device <span className="text-destructive">*</span></Label>
        <Controller
          name="preferredDevice"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select preferred device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="multiple">Multiple Devices</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.preferredDevice && <p className="text-sm text-destructive">{errors.preferredDevice.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label>Preferred Content Formats <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 gap-2">
          <Controller
            name="preferredContentFormats"
            control={control}
            render={({ field }) => (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="video" 
                    checked={field.value.includes('video')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'video']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'video'));
                      }
                    }}
                  />
                  <Label htmlFor="video">Video</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="article" 
                    checked={field.value.includes('article')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'article']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'article'));
                      }
                    }}
                  />
                  <Label htmlFor="article">Article</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="interactive" 
                    checked={field.value.includes('interactive')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'interactive']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'interactive'));
                      }
                    }}
                  />
                  <Label htmlFor="interactive">Interactive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="simulation" 
                    checked={field.value.includes('simulation')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'simulation']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'simulation'));
                      }
                    }}
                  />
                  <Label htmlFor="simulation">Simulation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="quiz" 
                    checked={field.value.includes('quiz')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'quiz']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'quiz'));
                      }
                    }}
                  />
                  <Label htmlFor="quiz">Quiz</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="discussion" 
                    checked={field.value.includes('discussion')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, 'discussion']);
                      } else {
                        field.onChange(field.value.filter((v: string) => v !== 'discussion'));
                      }
                    }}
                  />
                  <Label htmlFor="discussion">Discussion</Label>
                </div>
              </>
            )}
          />
        </div>
        {errors.preferredContentFormats && <p className="text-sm text-destructive">{errors.preferredContentFormats.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="averageSessionDuration">Average Session Duration (minutes) <span className="text-destructive">*</span></Label>
        <Controller
          name="averageSessionDuration"
          control={control}
          render={({ field }) => (
            <Input 
              id="averageSessionDuration"
              type="number"
              min="5"
              onChange={(e) => field.onChange(parseInt(e.target.value))}
              value={field.value}
            />
          )}
        />
        {errors.averageSessionDuration && <p className="text-sm text-destructive">{errors.averageSessionDuration.message?.toString()}</p>}
      </div>

      <div className="space-y-2">
        <Label>Preferred Difficulty <span className="text-destructive">*</span></Label>
        <Controller
          name="prefersDifficulty"
          control={control}
          render={({ field }) => (
            <RadioGroup 
              onValueChange={field.onChange} 
              defaultValue={field.value} 
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy">Easy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id="moderate" />
                <Label htmlFor="moderate">Moderate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="challenging" id="challenging" />
                <Label htmlFor="challenging">Challenging</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed">Mixed</Label>
              </div>
            </RadioGroup>
          )}
        />
        {errors.prefersDifficulty && <p className="text-sm text-destructive">{errors.prefersDifficulty.message?.toString()}</p>}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Controller
            name="prefersCollaboration"
            control={control}
            render={({ field }) => (
              <Checkbox 
                id="prefersCollaboration" 
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="prefersCollaboration">Prefers Collaborative Learning</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Controller
            name="prefersDeadlines"
            control={control}
            render={({ field }) => (
              <Checkbox 
                id="prefersDeadlines" 
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="prefersDeadlines">Prefers Strict Deadlines</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalPreferences">Additional Preferences</Label>
        <Textarea id="additionalPreferences" {...register('additionalPreferences')} rows={3} />
        {errors.additionalPreferences && <p className="text-sm text-destructive">{errors.additionalPreferences.message?.toString()}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Changes</Button>
      </DialogFooter>
    </form>
  );

  // Feedback Preferences Form
  const renderFeedbackPreferencesForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Preferred Topics</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {preferredTopics.map((topic, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              {topic}
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 text-muted-foreground" 
                onClick={() => handleRemovePreferredTopic(topic)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            value={newTopicInput}
            onChange={(e) => setNewTopicInput(e.target.value)}
            placeholder="Add new preferred topic"
            className="flex-1"
          />
          <Button 
            type="button"
            onClick={handleAddPreferredTopic}
            disabled={!newTopicInput.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Topics to Improve</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {dislikedTopics.map((topic, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              {topic}
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 text-muted-foreground" 
                onClick={() => handleRemoveDislikedTopic(topic)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            value={newDislikedTopicInput}
            onChange={(e) => setNewDislikedTopicInput(e.target.value)}
            placeholder="Add topic to improve"
            className="flex-1"
          />
          <Button 
            type="button"
            onClick={handleAddDislikedTopic}
            disabled={!newDislikedTopicInput.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Changes</Button>
      </DialogFooter>
    </form>
  );

  // Render form based on section
  const renderForm = () => {
    switch (section) {
      case 'personal':
        return renderPersonalInfoForm();
      case 'learning-preferences':
        return renderLearningPreferencesForm();
      case 'feedback-preferences':
        return renderFeedbackPreferencesForm();
      default:
        return <p>Unknown section type</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor; 