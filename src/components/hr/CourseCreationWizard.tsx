import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  Award, 
  CheckCircle, 
  Video, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Layers,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

// Define types for module and section
type CourseModule = {
  id: string;
  title: string;
  description: string;
  order: number;
  sections: CourseSection[];
};

type CourseSection = {
  id: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment';
  content: string;
  order: number;
  duration_minutes: number;
};

// Define form schemas for each step
const courseBasicsSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  category: z.string().min(1, { message: 'Please select a category' }),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_hours: z.string().transform((val) => parseInt(val, 10)),
  tags: z.string().optional(),
  is_featured: z.boolean().default(false),
});

const moduleSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
});

const sectionSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  content_type: z.enum(['video', 'text', 'quiz', 'assignment']),
  content: z.string().min(5, { message: 'Content must be at least 5 characters' }),
  duration_minutes: z.string().transform((val) => parseInt(val, 10)),
});

// Type definitions for the form data
type FormData = {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  tags: string;
  is_featured: boolean;
};

type ModuleData = {
  title: string;
  description?: string;
};

type SectionData = {
  title: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment';
  content: string;
  duration_minutes: number;
};

/**
 * CourseCreationWizard component
 * A step-by-step wizard for creating new courses in the system
 */
const CourseCreationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [courseData, setCourseData] = React.useState<any>(null);
  const [modules, setModules] = React.useState<CourseModule[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = React.useState<number | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<boolean>(false);
  
  // Initialize forms with proper types
  const courseBasicsForm = useForm({
    resolver: zodResolver(courseBasicsSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      level: 'intermediate',
      estimated_hours: '1',
      tags: '',
      is_featured: false,
    },
  });

  const moduleForm = useForm({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const sectionForm = useForm({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: '',
      content_type: 'text',
      content: '',
      duration_minutes: '5',
    },
  });

  // Submit course basics
  const onCourseBasicsSubmit = (data: FormData) => {
    setCourseData({
      ...data,
      // Parse tags from comma-separated string to array
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
    });
    setCurrentStep(2);
  };

  // Add a new module
  const addModule = (data: ModuleData) => {
    const newModule: CourseModule = {
      id: `temp-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      order: modules.length + 1,
      sections: [],
    };
    
    setModules([...modules, newModule]);
    moduleForm.reset();
    setCurrentModuleIndex(modules.length); // Set to the new module
  };

  // Add a section to the current module
  const addSection = (data: SectionData) => {
    if (currentModuleIndex === null) return;
    
    const newSection: CourseSection = {
      id: `temp-${Date.now()}`,
      ...data,
      order: modules[currentModuleIndex].sections.length + 1,
    };
    
    const updatedModules = [...modules];
    updatedModules[currentModuleIndex].sections.push(newSection);
    setModules(updatedModules);
    sectionForm.reset();
  };

  // Edit a module
  const editModule = (moduleIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentSectionIndex(null);
    
    const module = modules[moduleIndex];
    moduleForm.setValue('title', module.title);
    moduleForm.setValue('description', module.description);
  };

  // Edit a section
  const editSection = (moduleIndex: number, sectionIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentSectionIndex(sectionIndex);
    
    const section = modules[moduleIndex].sections[sectionIndex];
    sectionForm.setValue('title', section.title);
    sectionForm.setValue('content_type', section.content_type);
    sectionForm.setValue('content', section.content);
    sectionForm.setValue('duration_minutes', section.duration_minutes.toString());
  };

  // Update a module
  const updateModule = (data: ModuleData) => {
    if (currentModuleIndex === null) return;
    
    const updatedModules = [...modules];
    updatedModules[currentModuleIndex] = {
      ...updatedModules[currentModuleIndex],
      title: data.title,
      description: data.description || '',
    };
    
    setModules(updatedModules);
    moduleForm.reset();
    setCurrentModuleIndex(null);
  };

  // Update a section
  const updateSection = (data: SectionData) => {
    if (currentModuleIndex === null || currentSectionIndex === null) return;
    
    const updatedModules = [...modules];
    updatedModules[currentModuleIndex].sections[currentSectionIndex] = {
      ...updatedModules[currentModuleIndex].sections[currentSectionIndex],
      ...data,
    };
    
    setModules(updatedModules);
    sectionForm.reset();
    setCurrentSectionIndex(null);
  };

  // Remove a module
  const removeModule = (index: number) => {
    const updatedModules = [...modules];
    updatedModules.splice(index, 1);
    
    // Update order for remaining modules
    updatedModules.forEach((module, idx) => {
      module.order = idx + 1;
    });
    
    setModules(updatedModules);
    
    if (currentModuleIndex === index) {
      setCurrentModuleIndex(null);
      moduleForm.reset();
    }
  };

  // Remove a section
  const removeSection = (moduleIndex: number, sectionIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].sections.splice(sectionIndex, 1);
    
    // Update order for remaining sections
    updatedModules[moduleIndex].sections.forEach((section, idx) => {
      section.order = idx + 1;
    });
    
    setModules(updatedModules);
    
    if (currentModuleIndex === moduleIndex && currentSectionIndex === sectionIndex) {
      setCurrentSectionIndex(null);
      sectionForm.reset();
    }
  };

  // Final submit
  const submitCourse = async () => {
    if (!courseData || modules.length === 0) {
      setError('Course must have basic information and at least one module.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create course
      const { data: courseInsertData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          level: courseData.level,
          estimated_hours: courseData.estimated_hours,
          tags: courseData.tags,
          is_featured: courseData.is_featured,
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .select('id')
        .single();
      
      if (courseError) throw new Error(`Error creating course: ${courseError.message}`);
      
      const courseId = courseInsertData.id;
      
      // Insert modules
      for (const module of modules) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            title: module.title,
            description: module.description,
            order: module.order,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .select('id')
          .single();
        
        if (moduleError) throw new Error(`Error creating module: ${moduleError.message}`);
        
        // Insert sections for this module
        for (const section of module.sections) {
          const { error: sectionError } = await supabase
            .from('module_sections')
            .insert({
              module_id: moduleData.id,
              title: section.title,
              content_type: section.content_type,
              content: section.content,
              order: section.order,
              duration_minutes: section.duration_minutes,
              created_at: new Date(),
              updated_at: new Date(),
            });
          
          if (sectionError) throw new Error(`Error creating section: ${sectionError.message}`);
        }
      }
      
      setSuccess(true);
      setCurrentStep(3);
      
    } catch (err) {
      console.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset all forms and state
  const resetForms = () => {
    courseBasicsForm.reset();
    moduleForm.reset();
    sectionForm.reset();
    setCourseData(null);
    setModules([]);
    setCurrentModuleIndex(null);
    setCurrentSectionIndex(null);
    setCurrentStep(1);
    setError(null);
    setSuccess(false);
  };

  // Navigate between steps
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Create New Course</h2>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${currentStep === 1 ? 'bg-primary' : 'bg-gray-300'}`}></span>
          <span className={`h-2 w-2 rounded-full ${currentStep === 2 ? 'bg-primary' : 'bg-gray-300'}`}></span>
          <span className={`h-2 w-2 rounded-full ${currentStep === 3 ? 'bg-primary' : 'bg-gray-300'}`}></span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Course Basics */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Course Basics
            </CardTitle>
            <CardDescription>
              Enter the fundamental information about your course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...courseBasicsForm}>
              <form onSubmit={courseBasicsForm.handleSubmit(onCourseBasicsSubmit)} className="space-y-6">
                <FormField
                  control={courseBasicsForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter course title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive title for your course
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseBasicsForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a comprehensive description of your course" 
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Explain what learners will gain from this course
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={courseBasicsForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="leadership">Leadership</SelectItem>
                            <SelectItem value="professional_skills">Professional Skills</SelectItem>
                            <SelectItem value="compliance">Compliance</SelectItem>
                            <SelectItem value="health_safety">Health & Safety</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the most appropriate category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courseBasicsForm.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Level</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="beginner" />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Beginner</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="intermediate" />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Intermediate</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="advanced" />
                              </FormControl>
                              <FormLabel className="cursor-pointer">Advanced</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={courseBasicsForm.control}
                    name="estimated_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration (hours)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Approximate time to complete the course
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={courseBasicsForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter comma-separated tags" {...field} />
                        </FormControl>
                        <FormDescription>
                          Keywords that describe your course (e.g., JavaScript, Management, Health)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={courseBasicsForm.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Course</FormLabel>
                        <FormDescription>
                          Highlight this course on the dashboard and catalog
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit">
                    Next: Content Structure
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Course Structure */}
      {currentStep === 2 && courseData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="mr-2 h-5 w-5" />
                Course Structure
              </CardTitle>
              <CardDescription>
                Organize your course into modules and sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left side: Module and Section Creation/Editing */}
                <div className="space-y-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">
                      {currentModuleIndex !== null
                        ? currentSectionIndex !== null
                          ? 'Edit Section'
                          : 'Edit Module'
                        : 'Add Module'}
                    </h3>

                    {currentSectionIndex === null ? (
                      <Form {...moduleForm}>
                        <form
                          onSubmit={moduleForm.handleSubmit(
                            currentModuleIndex !== null ? updateModule : addModule
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={moduleForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Module Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter module title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={moduleForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Module Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter module description"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-between">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                moduleForm.reset();
                                setCurrentModuleIndex(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              {currentModuleIndex !== null ? 'Update Module' : 'Add Module'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <Form {...sectionForm}>
                        <form
                          onSubmit={sectionForm.handleSubmit(updateSection)}
                          className="space-y-4"
                        >
                          <FormField
                            control={sectionForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Section Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter section title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sectionForm.control}
                            name="content_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select content type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="assignment">Assignment</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sectionForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={
                                      sectionForm.watch('content_type') === 'video'
                                        ? 'Enter video URL'
                                        : 'Enter content'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sectionForm.control}
                            name="duration_minutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration (minutes)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-between">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                sectionForm.reset();
                                setCurrentSectionIndex(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Update Section</Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </div>

                  {currentModuleIndex !== null && currentSectionIndex === null && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Add Section</h3>
                      <Form {...sectionForm}>
                        <form
                          onSubmit={sectionForm.handleSubmit(addSection)}
                          className="space-y-4"
                        >
                          <FormField
                            control={sectionForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Section Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter section title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sectionForm.control}
                            name="content_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select content type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="assignment">Assignment</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sectionForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={
                                      sectionForm.watch('content_type') === 'video'
                                        ? 'Enter video URL'
                                        : 'Enter content'
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sectionForm.control}
                            name="duration_minutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration (minutes)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full">
                            <X className="mr-2 h-4 w-4" /> Add Section
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}
                </div>

                {/* Right side: Course Structure Preview */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Course Structure</h3>
                  {modules.length === 0 ? (
                    <div className="bg-muted p-6 rounded-lg text-center">
                      <p className="text-muted-foreground">
                        Add your first module to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modules.map((module, moduleIndex) => (
                        <div key={module.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{`Module ${moduleIndex + 1}: ${module.title}`}</h4>
                              {module.description && (
                                <p className="text-sm text-muted-foreground">
                                  {module.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editModule(moduleIndex)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => removeModule(moduleIndex)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>

                          {module.sections.length > 0 ? (
                            <div className="space-y-2 mt-4 pl-4 border-l-2">
                              {module.sections.map((section, sectionIndex) => (
                                <div
                                  key={section.id}
                                  className="flex justify-between items-center bg-muted p-2 rounded-md"
                                >
                                  <div className="flex items-center">
                                    {section.content_type === 'video' && (
                                      <Video className="h-4 w-4 mr-2" />
                                    )}
                                    {section.content_type === 'text' && (
                                      <FileText className="h-4 w-4 mr-2" />
                                    )}
                                    {section.content_type === 'quiz' && (
                                      <Layers className="h-4 w-4 mr-2" />
                                    )}
                                    {section.content_type === 'assignment' && (
                                      <FileText className="h-4 w-4 mr-2" />
                                    )}
                                    <span>{section.title}</span>
                                    <span className="text-xs text-muted-foreground ml-2 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {section.duration_minutes} min
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        editSection(moduleIndex, sectionIndex)
                                      }
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() =>
                                        removeSection(moduleIndex, sectionIndex)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground pl-4 mt-2">
                              No sections added yet
                            </p>
                          )}

                          {currentModuleIndex !== moduleIndex && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setCurrentModuleIndex(moduleIndex);
                                setCurrentSectionIndex(null);
                              }}
                            >
                              <X className="mr-1 h-3 w-3" /> Add Section
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => goToStep(1)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Basics
              </Button>
              <Button
                onClick={submitCourse}
                disabled={isSubmitting || modules.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Course...
                  </>
                ) : (
                  <>
                    Create Course
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 3: Success */}
      {currentStep === 3 && success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              Course Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Your course has been created and is now in draft status.</p>
            <Alert>
              <AlertTitle>What's Next?</AlertTitle>
              <AlertDescription>
                Your course is now in draft mode. You can:
                <ul className="list-disc ml-6 mt-2">
                  <li>Publish it when you're ready</li>
                  <li>Continue editing the content</li>
                  <li>Assign it to employees or learners</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" onClick={resetForms}>
              Create Another Course
            </Button>
            <Button>
              View All Courses
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default CourseCreationWizard; 