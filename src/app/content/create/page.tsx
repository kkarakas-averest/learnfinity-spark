'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentType, DifficultyLevel } from '@/types/course.types';
import { ContentGenerationRequest, GeneratedContent } from '@/agents/types';
import { generateContent } from '@/app/actions/content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

// Define form schema using Zod
const formSchema = z.object({
  contentType: z.nativeEnum(ContentType),
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  skillLevel: z.nativeEnum(DifficultyLevel),
  learningObjectives: z.string().min(10, 'Learning objectives must be at least 10 characters'),
  keywords: z.string().optional(),
  tone: z.string(),
  contentLength: z.string(),
  includeExamples: z.boolean().default(true),
  includeQuizQuestions: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateContentPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedContent, setGeneratedContent] = React.useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = React.useState('edit');

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentType: ContentType.TEXT,
      topic: '',
      skillLevel: DifficultyLevel.INTERMEDIATE,
      learningObjectives: '',
      keywords: '',
      tone: 'conversational',
      contentLength: 'standard',
      includeExamples: true,
      includeQuizQuestions: true,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    
    try {
      // Format learning objectives as an array
      const learningObjectives = values.learningObjectives
        .split('\n')
        .map((obj) => obj.trim())
        .filter((obj) => obj.length > 0);
      
      // Format keywords as an array
      const keywords = values.keywords
        ? values.keywords.split(',').map((kw) => kw.trim()).filter((kw) => kw.length > 0)
        : undefined;
      
      // Create the content generation request
      const request: ContentGenerationRequest = {
        contentType: values.contentType,
        topic: values.topic,
        targetAudience: {
          skillLevel: values.skillLevel,
        },
        learningObjectives,
        keywords,
        tone: values.tone,
        contentLength: values.contentLength,
        includeExamples: values.includeExamples,
        includeQuizQuestions: values.includeQuizQuestions,
      };
      
      // Call the server action to generate content
      const response = await generateContent(request);
      
      if (response.success && response.content) {
        setGeneratedContent(response.content);
        setActiveTab('preview');
      } else {
        console.error('Error generating content:', response.error);
        alert(`Error generating content: ${response.error}`);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert(`Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create AI-Generated Content</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Content Generator</CardTitle>
              <CardDescription>
                Fill out the form below to generate educational content using AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ContentType.TEXT}>Text</SelectItem>
                            <SelectItem value={ContentType.VIDEO}>Video Script</SelectItem>
                            <SelectItem value={ContentType.INTERACTIVE}>Interactive Content</SelectItem>
                            <SelectItem value={ContentType.QUIZ}>Quiz</SelectItem>
                            <SelectItem value={ContentType.EXERCISE}>Exercise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Introduction to Machine Learning" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="skillLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select skill level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={DifficultyLevel.BEGINNER}>Beginner</SelectItem>
                            <SelectItem value={DifficultyLevel.INTERMEDIATE}>Intermediate</SelectItem>
                            <SelectItem value={DifficultyLevel.ADVANCED}>Advanced</SelectItem>
                            <SelectItem value={DifficultyLevel.EXPERT}>Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="learningObjectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Objectives (one per line)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., Understand the basics of machine learning algorithms" 
                            className="min-h-[100px]" 
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords (comma-separated)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., algorithms, supervised learning, classification" 
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tone</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="conversational">Conversational</SelectItem>
                              <SelectItem value="technical">Technical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contentLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Length</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select length" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="brief">Brief</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="comprehensive">Comprehensive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="includeExamples"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Examples</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="includeQuizQuestions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include Quiz Questions</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Content...
                      </>
                    ) : (
                      'Generate Content'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          {generatedContent ? (
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{generatedContent.title}</CardTitle>
                <CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                      {generatedContent.contentType}
                    </span>
                    {generatedContent.metadata.model && (
                      <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-md text-xs">
                        {generatedContent.metadata.model}
                      </span>
                    )}
                    <span className="bg-muted px-2 py-1 rounded-md text-xs">
                      {new Date(generatedContent.metadata.generatedAt).toLocaleString()}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    {generatedContent.quiz && (
                      <TabsTrigger value="quiz">Quiz</TabsTrigger>
                    )}
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="prose max-w-none dark:prose-invert">
                    <Markdown>{generatedContent.content}</Markdown>
                  </TabsContent>
                  
                  <TabsContent value="edit">
                    <Textarea 
                      className="font-mono h-[500px] w-full" 
                      value={generatedContent.content}
                      onChange={(e) => setGeneratedContent({
                        ...generatedContent,
                        content: e.target.value
                      })}
                    />
                  </TabsContent>
                  
                  {generatedContent.quiz && (
                    <TabsContent value="quiz">
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold">Quiz Questions</h3>
                        {generatedContent.quiz.questions.map((question, index) => (
                          <div key={question.id} className="border p-4 rounded-md">
                            <h4 className="font-bold">Question {index + 1}: {question.question}</h4>
                            {question.type === 'multiple-choice' && question.options && (
                              <div className="mt-2 space-y-2">
                                {question.options.map((option, optIndex) => (
                                  <div 
                                    key={optIndex}
                                    className={`p-2 rounded-md ${
                                      question.correctAnswer === option || question.correctAnswer === optIndex
                                        ? 'bg-green-100 dark:bg-green-900'
                                        : 'bg-muted'
                                    }`}
                                  >
                                    {option}
                                    {(question.correctAnswer === option || question.correctAnswer === optIndex) && (
                                      <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {question.type === 'true-false' && (
                              <div className="mt-2 space-y-2">
                                <div className={`p-2 rounded-md ${
                                  question.correctAnswer === 'True' ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
                                }`}>
                                  True
                                  {question.correctAnswer === 'True' && (
                                    <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                                  )}
                                </div>
                                <div className={`p-2 rounded-md ${
                                  question.correctAnswer === 'False' ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'
                                }`}>
                                  False
                                  {question.correctAnswer === 'False' && (
                                    <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                                  )}
                                </div>
                              </div>
                            )}
                            {question.type === 'short-answer' && (
                              <div className="mt-2 p-2 rounded-md bg-green-100 dark:bg-green-900">
                                Answer: {question.correctAnswer as string}
                              </div>
                            )}
                            {question.explanation && (
                              <div className="mt-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950">
                                <span className="font-bold">Explanation:</span> {question.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                  
                  <TabsContent value="metadata">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold">Summary</h3>
                        <p>{generatedContent.summary || 'No summary available'}</p>
                      </div>
                      
                      {generatedContent.suggestedNextSteps && generatedContent.suggestedNextSteps.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold">Suggested Next Steps</h3>
                          <ul className="list-disc pl-5">
                            {generatedContent.suggestedNextSteps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {generatedContent.relatedTopics && generatedContent.relatedTopics.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold">Related Topics</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {generatedContent.relatedTopics.map((topic, index) => (
                              <span key={index} className="bg-muted px-2 py-1 rounded-md text-sm">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-bold">Generation Details</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="text-sm font-bold">Model:</div>
                          <div className="text-sm">{generatedContent.metadata.model}</div>
                          
                          <div className="text-sm font-bold">Version:</div>
                          <div className="text-sm">{generatedContent.metadata.version}</div>
                          
                          <div className="text-sm font-bold">Tokens Used:</div>
                          <div className="text-sm">{generatedContent.metadata.tokensUsed}</div>
                          
                          <div className="text-sm font-bold">Generated At:</div>
                          <div className="text-sm">
                            {new Date(generatedContent.metadata.generatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="mr-2" onClick={() => window.print()}>
                  Print / Save as PDF
                </Button>
                <Button>
                  Save to Library
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-bold mb-2">No Content Generated Yet</h3>
                <p className="text-muted-foreground">
                  Fill out the form and click "Generate Content" to create AI-powered educational material.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 