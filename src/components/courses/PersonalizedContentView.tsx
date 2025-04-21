"use client";

import { useState, useEffect } from '@/lib/react-helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AICourseContent, AICourseContentSection } from '@/lib/types/content';
import PersonalizedContentGenerationStatus from './PersonalizedContentGenerationStatus';
import PersonalizedCourseContent from '../learner/PersonalizedCourseContent'; // Properly import the component
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, 
  Circle, 
  User, 
  Zap, 
  FileText, 
  Sparkles, 
  Loader2
} from 'lucide-react';

interface PersonalizedContentViewProps {
  content: AICourseContent | null;
  sections: AICourseContentSection[];
  isLoading: boolean;
  employeeId?: string | null;
  courseId?: string | null;
  onGenerateContent?: () => Promise<void>;
  onContentReady?: () => Promise<void>;
}

interface StepType {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  icon: React.ComponentType;
}

export function PersonalizedContentView({
  content,
  sections,
  isLoading,
  employeeId,
  courseId,
  onGenerateContent,
  onContentReady
}: PersonalizedContentViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [generationError, setGenerationError] = useState<string | undefined>();
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>();
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [shouldRefetchContent, setShouldRefetchContent] = useState(false);
  const { toast } = useToast();
  
  const generationSteps: StepType[] = [
    {
      id: 'profile-data',
      title: 'Profile Data Retrieved',
      description: 'Your employee profile and CV data are loaded',
      status: 'pending',
      icon: User
    },
    {
      id: 'course-data',
      title: 'Course Materials Analyzed',
      description: 'Course content is analyzed to prepare for personalization',
      status: 'pending',
      icon: BookOpen
    },
    {
      id: 'llm-api',
      title: 'AI Personalization Started',
      description: 'LLM API is called to generate tailored content',
      status: 'pending',
      icon: Zap
    },
    {
      id: 'content-creation',
      title: 'Content Creation',
      description: 'Converting AI responses into structured learning materials',
      status: 'pending',
      icon: FileText
    },
    {
      id: 'course-ready',
      title: 'Course Ready',
      description: 'Your personalized course is now available',
      status: 'pending',
      icon: Sparkles
    }
  ];
  
  const [steps, setSteps] = useState<StepType[]>(generationSteps);
  
  useEffect(() => {
    if (isGenerating) {
      setEstimatedTimeRemaining(300);
      
      const checkStatusInterval = setInterval(async () => {
        if (!courseId || !employeeId) return;
        
        try {
          const { data: statusData, error: statusError } = await supabase
            .from('hr_course_enrollments')
            .select('personalized_content_generation_status, personalized_content_id')
            .eq('course_id', courseId)
            .eq('employee_id', employeeId)
            .single();
            
          if (statusError) throw statusError;
          
          if (statusData?.personalized_content_generation_status === 'in_progress') {
            if (currentStep < 1) setCurrentStep(1);
            else if (currentStep < 2) setCurrentStep(2);
            
            setEstimatedTimeRemaining((prev: number | undefined) => prev ? Math.max(prev - 10, 60) : 180);
            
            updateStepStatus(0, 'complete');
            updateStepStatus(1, 'complete');
            updateStepStatus(2, 'loading');
          } 
          else if (statusData?.personalized_content_generation_status === 'completed') {
            setIsGenerating(false);
            clearInterval(checkStatusInterval);
            setPollInterval(null);
            
            updateStepStatus(0, 'complete');
            updateStepStatus(1, 'complete');
            updateStepStatus(2, 'complete');
            updateStepStatus(3, 'complete');
            updateStepStatus(4, 'complete');
            setCurrentStep(4);
            
            setShouldRefetchContent(true);
            if (onContentReady) {
              try {
                await onContentReady();
              } catch (error) {
                console.error("Error refreshing content:", error);
                toast({
                  title: "Content is ready",
                  description: "Please refresh the page to view your personalized content", 
                  variant: "default"
                });
              }
            } else {
              toast({
                title: "Content generation complete", 
                description: "Your personalized content is ready",
                variant: "default"
              });
            }
          } 
          else if (statusData?.personalized_content_generation_status === 'failed') {
            setGenerationError('Content generation failed. Please try again later.');
            setIsGenerating(false);
            clearInterval(checkStatusInterval);
            setPollInterval(null);
            
            updateStepStatus(currentStep, 'error');
          }
          else if (statusData?.personalized_content_id) {
            setIsGenerating(false);
            clearInterval(checkStatusInterval);
            setPollInterval(null);
            
            generationSteps.forEach((_, index) => updateStepStatus(index, 'complete'));
            setCurrentStep(4);
          }
          
        } catch (error) {
          console.error('Error checking personalization status:', error);
        }
      }, 5000);
      
      setPollInterval(checkStatusInterval);
      
      return () => {
        if (checkStatusInterval) clearInterval(checkStatusInterval);
      };
    }
  }, [isGenerating, courseId, employeeId, currentStep]);
  
  const updateStepStatus = (stepIndex: number, status: 'pending' | 'loading' | 'complete' | 'error') => {
    setSteps((prevSteps: StepType[]) => {
      const newSteps = [...prevSteps];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = { ...newSteps[stepIndex], status };
      }
      return newSteps;
    });
  };
  
  const handleGenerateContent = async () => {
    if (!employeeId || !courseId || !onGenerateContent) {
      toast({
        title: "Cannot generate content",
        description: "Missing required information for personalization",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      setGenerationError(undefined);
      setCurrentStep(0);
      
      updateStepStatus(0, 'loading');
      
      await onGenerateContent();
      
      updateStepStatus(0, 'complete');
      setCurrentStep(1);
      updateStepStatus(1, 'loading');
      
    } catch (error: any) {
      console.error("Error starting content generation:", error);
      setGenerationError(error.message || "Failed to start content generation");
      setIsGenerating(false);
      updateStepStatus(0, 'error');
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : content && sections.length > 0 ? (
        <PersonalizedCourseContent 
          content={content}
          sections={sections}
          isLoading={isLoading}
        />
      ) : (
        <PersonalizedContentGenerationStatus
          initialSteps={steps.map((step: StepType, index: number) => ({
            id: index + 1,
            name: step.title,
            description: step.description,
            status: step.status,
            icon: step.icon
          }))}
          initialCurrentStep={currentStep}
          initialIsGenerating={isGenerating}
          onGenerateContent={handleGenerateContent}
          error={generationError}
          courseId={courseId || undefined}
          employeeId={employeeId || undefined}
        />
      )}
    </div>
  );
}
