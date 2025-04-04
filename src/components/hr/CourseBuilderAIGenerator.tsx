import React, { useState } from '@/lib/react-helpers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHRAuth } from '@/state';

/**
 * AI-powered course generation component for HR users
 * Uses GroqAPI to generate complete courses based on a topic and target audience
 */
const CourseBuilderAIGenerator: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hrUser } = useHRAuth();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [modules, setModules] = useState(3);
  const [sectionsPerModule, setSectionsPerModule] = useState(3);
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [skillLevel, setSkillLevel] = useState('intermediate');
  
  const handleGenerate = async () => {
    if (!topic || !targetAudience) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a topic and target audience.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Call the API to generate the course - use the full URL format that works in production
      const baseUrl = window.location.origin;
      console.log('Calling API at:', `${baseUrl}/api/groq-generate`);
      
      const response = await fetch(`${baseUrl}/api/groq-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          targetAudience,
          modules,
          sectionsPerModule,
          includeQuiz,
          userId: '00000000-0000-0000-0000-000000000000', // Valid UUID format for a system user
          customization: {
            skillLevel,
          },
          groqApiKey: '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', // Add API key directly in the request
        }),
      });
      
      let errorMessage = 'Failed to generate course';
      
      if (!response.ok) {
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText
        });
        
        // Try to get the response as text first
        const errorText = await response.text();
        
        // Then try to parse it as JSON if possible
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (parseError) {
          // If JSON parsing fails, use the text directly
          console.error('Error response text:', errorText);
          errorMessage = `${errorMessage}: ${response.status} - ${errorText.substring(0, 100)}...`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Success response from API:', data);
      
      toast({
        title: 'Course generated successfully',
        description: `Created "${topic}" course for ${targetAudience}.`,
      });
      
      // Show success alert with content preview
      toast({
        title: 'Content Preview',
        description: data.content.substring(0, 100) + '...',
        variant: 'default',
      });
      
      // Mock navigation - since our database integration isn't working on Vercel yet
      // navigate(`/hr-dashboard/courses/${data.courseId}`);
      
      // Show more detailed success message
      setTimeout(() => {
        toast({
          title: 'Generation Complete',
          description: 'The course was generated successfully but database storage is not yet available in the production environment.',
          variant: 'default',
        });
      }, 1000);
    } catch (error) {
      console.error('Error generating course:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
          AI Course Generator
        </CardTitle>
        <CardDescription>
          Create complete courses instantly with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Course Topic</Label>
          <Input 
            id="topic" 
            placeholder="e.g. Data Analysis with Python" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience</Label>
          <Input 
            id="audience" 
            placeholder="e.g. Marketing Professionals" 
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modules">Number of Modules</Label>
            <Select 
              value={modules.toString()} 
              onValueChange={(val) => setModules(parseInt(val))}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Module</SelectItem>
                <SelectItem value="2">2 Modules</SelectItem>
                <SelectItem value="3">3 Modules</SelectItem>
                <SelectItem value="4">4 Modules</SelectItem>
                <SelectItem value="5">5 Modules</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sections">Sections per Module</Label>
            <Select 
              value={sectionsPerModule.toString()} 
              onValueChange={(val) => setSectionsPerModule(parseInt(val))}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sections per module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Sections</SelectItem>
                <SelectItem value="3">3 Sections</SelectItem>
                <SelectItem value="4">4 Sections</SelectItem>
                <SelectItem value="5">5 Sections</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level">Skill Level</Label>
            <Select 
              value={skillLevel} 
              onValueChange={setSkillLevel}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quiz">Include Quizzes</Label>
            <Select 
              value={includeQuiz ? "yes" : "no"} 
              onValueChange={(val) => setIncludeQuiz(val === "yes")}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Include quizzes?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, include quizzes</SelectItem>
                <SelectItem value="no">No quizzes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mt-2">
          <p className="text-sm text-gray-500 mb-2">AI will generate:</p>
          <ul className="text-sm space-y-1">
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></div>
              <span>A complete course with title and description</span>
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></div>
              <span>{modules} modules with {sectionsPerModule} sections each</span>
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></div>
              <span>Detailed content for all sections (~500 words each)</span>
            </li>
            {includeQuiz && (
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></div>
                <span>Quiz questions for each module</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !topic || !targetAudience}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Course...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Course with AI
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseBuilderAIGenerator; 