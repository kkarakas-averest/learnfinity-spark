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
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { QuestionType, TABLES } from '@/utils/database/schema/assessments';

// Define types for assessment and questions
type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  order: number;
};

// Form schema
const assessmentSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  courseId: z.string().optional(),
  passingScore: z.string().transform((val) => parseInt(val, 10)),
  timeLimit: z.string().transform((val) => parseInt(val, 10)),
  isRequired: z.boolean().default(false),
});

const questionSchema = z.object({
  text: z.string().min(3, { message: 'Question text is required' }),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer'] as const),
  points: z.string().transform((val) => parseInt(val, 10)),
});

// Types for form data
type AssessmentData = {
  title: string;
  description: string;
  courseId?: string;
  passingScore: number;
  timeLimit: number; 
  isRequired: boolean;
};

type QuestionData = {
  text: string;
  type: QuestionType;
  points: number;
};

/**
 * AssessmentBuilder component
 * Allows creation of assessments with various question types
 */
const AssessmentBuilder: React.FC = () => {
  // State for tracking the assessment building process
  const [currentStep, setCurrentStep] = React.useState(1);
  const [assessmentData, setAssessmentData] = React.useState<AssessmentData | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = React.useState<number | null>(null);
  const [optionInput, setOptionInput] = React.useState('');
  const [options, setOptions] = React.useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = React.useState<string | string[]>('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  
  // Initialize forms
  const assessmentForm = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      title: '',
      description: '',
      courseId: '',
      passingScore: '70',
      timeLimit: '30',
      isRequired: true,
    },
  });

  const questionForm = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: '',
      type: 'multiple_choice',
      points: '10',
    },
  });

  // Handle assessment basic info submission
  const onAssessmentSubmit = (data: AssessmentData) => {
    setAssessmentData(data);
    setCurrentStep(2);
  };

  // Add a new question
  const addQuestion = (data: QuestionData) => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      text: data.text,
      type: data.type,
      points: data.points,
      order: questions.length + 1,
      options: data.type === 'multiple_choice' ? [...options] : undefined,
      correctAnswer: data.type !== 'short_answer' ? correctAnswer : undefined,
    };

    setQuestions([...questions, newQuestion]);
    questionForm.reset();
    setOptions([]);
    setCorrectAnswer('');
  };

  // Edit an existing question
  const editQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    const question = questions[index];
    
    questionForm.setValue('text', question.text);
    questionForm.setValue('type', question.type);
    questionForm.setValue('points', question.points.toString());
    
    if (question.options) {
      setOptions(question.options);
    } else {
      setOptions([]);
    }
    
    if (question.correctAnswer) {
      setCorrectAnswer(question.correctAnswer);
    } else {
      setCorrectAnswer('');
    }
  };

  // Update a question
  const updateQuestion = (data: QuestionData) => {
    if (editingQuestionIndex === null) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[editingQuestionIndex] = {
      ...updatedQuestions[editingQuestionIndex],
      text: data.text,
      type: data.type,
      points: data.points,
      options: data.type === 'multiple_choice' ? [...options] : undefined,
      correctAnswer: data.type !== 'short_answer' ? correctAnswer : undefined,
    };
    
    setQuestions(updatedQuestions);
    questionForm.reset();
    setOptions([]);
    setCorrectAnswer('');
    setEditingQuestionIndex(null);
  };

  // Remove a question
  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    
    // Update order for remaining questions
    updatedQuestions.forEach((q, idx) => {
      q.order = idx + 1;
    });
    
    setQuestions(updatedQuestions);
    
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      questionForm.reset();
      setOptions([]);
      setCorrectAnswer('');
    }
  };

  // Handle option management for multiple choice questions
  const addOption = () => {
    if (optionInput.trim() !== '') {
      setOptions([...options, optionInput.trim()]);
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    // Also update correct answer if it was this option
    if (Array.isArray(correctAnswer) && correctAnswer.includes(options[index])) {
      setCorrectAnswer(correctAnswer.filter(ans => ans !== options[index]));
    } else if (correctAnswer === options[index]) {
      setCorrectAnswer('');
    }
  };

  // Handle correct answer for multiple choice
  const handleCorrectAnswerChange = (option: string) => {
    const questionType = questionForm.watch('type');
    
    if (questionType === 'multiple_choice') {
      // For multiple choice, allow multiple correct answers
      if (Array.isArray(correctAnswer)) {
        if (correctAnswer.includes(option)) {
          setCorrectAnswer(correctAnswer.filter(ans => ans !== option));
        } else {
          setCorrectAnswer([...correctAnswer, option]);
        }
      } else {
        setCorrectAnswer([option]);
      }
    } else {
      // For true/false, only one correct answer
      setCorrectAnswer(option);
    }
  };

  // Save the complete assessment
  const saveAssessment = async () => {
    if (!assessmentData || questions.length === 0) {
      setError('Assessment must have basic information and at least one question.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Insert assessment
      const { data: assessmentInsertData, error: assessmentError } = await supabase
        .from(TABLES.ASSESSMENTS)
        .insert({
          title: assessmentData.title,
          description: assessmentData.description,
          course_id: assessmentData.courseId || null,
          passing_score: assessmentData.passingScore,
          time_limit_minutes: assessmentData.timeLimit,
          is_required: assessmentData.isRequired,
          created_at: new Date(),
          updated_at: new Date(),
          status: 'active',
        })
        .select('id')
        .single();
      
      if (assessmentError) throw new Error(`Error creating assessment: ${assessmentError.message}`);
      
      const assessmentId = assessmentInsertData.id;
      
      // Insert questions
      for (const question of questions) {
        const { error: questionError } = await supabase
          .from(TABLES.ASSESSMENT_QUESTIONS)
          .insert({
            assessment_id: assessmentId,
            question_text: question.text,
            question_type: question.type,
            options: question.options || null,
            correct_answer: question.correctAnswer || null,
            points: question.points,
            order: question.order,
            created_at: new Date(),
            updated_at: new Date(),
          });
        
        if (questionError) throw new Error(`Error creating question: ${questionError.message}`);
      }
      
      setSuccess(true);
      setCurrentStep(3);
      
    } catch (err) {
      console.error('Error saving assessment:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Reset the form
  const resetForms = () => {
    assessmentForm.reset();
    questionForm.reset();
    setOptions([]);
    setCorrectAnswer('');
    setAssessmentData(null);
    setQuestions([]);
    setCurrentStep(1);
    setError(null);
    setSuccess(false);
  };

  // Navigation between steps
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Create New Assessment</h2>
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

      {/* Step 1: Assessment Basics */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Assessment Details
            </CardTitle>
            <CardDescription>
              Enter the basic information about your assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...assessmentForm}>
              <form onSubmit={assessmentForm.handleSubmit(onAssessmentSubmit)} className="space-y-6">
                <FormField
                  control={assessmentForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assessment title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear title that describes what is being assessed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={assessmentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a description of this assessment" 
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Instructions and purpose of the assessment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={assessmentForm.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Course (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter course ID" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link this assessment to a course
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={assessmentForm.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum percentage needed to pass
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={assessmentForm.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Limit (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum time allowed for completion
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={assessmentForm.control}
                  name="isRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Required Assessment</FormLabel>
                        <FormDescription>
                          Mark as required for course completion
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit">
                    Next: Create Questions
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Question Creation */}
      {currentStep === 2 && assessmentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Assessment Questions
            </CardTitle>
            <CardDescription>
              Create and organize questions for this assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left side: Question form */}
              <div className="space-y-6">
                <Form {...questionForm}>
                  <form
                    onSubmit={questionForm.handleSubmit(
                      editingQuestionIndex !== null ? updateQuestion : addQuestion
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={questionForm.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your question"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Reset options and answer if type changes
                              if (value !== 'multiple_choice') {
                                setOptions([]);
                              }
                              setCorrectAnswer(value === 'true_false' ? 'true' : '');
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* For multiple choice: Option management */}
                    {questionForm.watch('type') === 'multiple_choice' && (
                      <div className="space-y-3 border p-3 rounded-md">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add an option"
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                          />
                          <Button type="button" onClick={addOption} size="sm">
                            Add
                          </Button>
                        </div>
                        
                        {options.length > 0 && (
                          <div className="space-y-2 mt-3">
                            <p className="text-sm font-medium">Options:</p>
                            {options.map((option, index) => (
                              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={
                                      Array.isArray(correctAnswer)
                                        ? correctAnswer.includes(option)
                                        : correctAnswer === option
                                    }
                                    onCheckedChange={() => handleCorrectAnswerChange(option)}
                                    id={`option-${index}`}
                                  />
                                  <label htmlFor={`option-${index}`} className="text-sm">
                                    {option}
                                  </label>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeOption(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground">
                              Check the correct answer(s)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* For true/false: Option selection */}
                    {questionForm.watch('type') === 'true_false' && (
                      <div className="space-y-3 border p-3 rounded-md">
                        <p className="text-sm font-medium">Correct Answer:</p>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={correctAnswer === 'true'}
                              onCheckedChange={() => setCorrectAnswer('true')}
                              id="true"
                            />
                            <label htmlFor="true" className="text-sm">True</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={correctAnswer === 'false'}
                              onCheckedChange={() => setCorrectAnswer('false')}
                              id="false"
                            />
                            <label htmlFor="false" className="text-sm">False</label>
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={questionForm.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Point value for this question
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      {editingQuestionIndex !== null && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingQuestionIndex(null);
                            questionForm.reset();
                            setOptions([]);
                            setCorrectAnswer('');
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" className="ml-auto">
                        {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>

              {/* Right side: Question preview */}
              <div>
                <h3 className="text-lg font-medium mb-4">Assessment Questions</h3>
                {questions.length === 0 ? (
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      Add your first question to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">Question {index + 1} ({question.points} pts)</h4>
                            <p className="text-sm">{question.text}</p>
                            
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs font-medium">Options:</p>
                                <ul className="text-sm list-disc list-inside">
                                  {question.options.map((option, optIndex) => (
                                    <li key={optIndex} className={
                                      Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option)
                                        ? 'text-green-600 font-medium'
                                        : ''
                                    }>
                                      {option}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {question.type === 'true_false' && (
                              <p className="text-sm mt-2">
                                Answer: <span className="font-medium">{question.correctAnswer === 'true' ? 'True' : 'False'}</span>
                              </p>
                            )}
                            
                            {question.type === 'short_answer' && (
                              <p className="text-sm italic mt-2">Free text response</p>
                            )}
                            
                            <p className="text-xs text-muted-foreground mt-2">
                              Type: {question.type.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editQuestion(index)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeQuestion(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6">
                  <p className="text-sm font-medium">Assessment Summary</p>
                  <p className="text-sm">Total Questions: {questions.length}</p>
                  <p className="text-sm">Total Points: {questions.reduce((total, q) => total + q.points, 0)}</p>
                  <p className="text-sm">Passing Score: {assessmentData.passingScore}%</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => goToStep(1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
            <Button
              onClick={saveAssessment}
              disabled={saving || questions.length === 0}
            >
              {saving ? 'Saving...' : 'Save Assessment'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Success */}
      {currentStep === 3 && success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              Assessment Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Your assessment has been created and is now available for use.</p>
            <Alert>
              <AlertTitle>Next Steps</AlertTitle>
              <AlertDescription>
                You can now:
                <ul className="list-disc ml-6 mt-2">
                  <li>Assign this assessment to learners</li>
                  <li>Link it to courses</li>
                  <li>Preview the assessment experience</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" onClick={resetForms}>
              Create Another Assessment
            </Button>
            <Button>
              View All Assessments
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default AssessmentBuilder; 