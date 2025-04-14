"use client";

import React, { useState, useEffect } from 'react';
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
  CheckCircle2, 
  XCircle, 
  User, 
  Zap, 
  FileText, 
  Sparkles, 
  LoaderCircle
} from 'lucide-react';

interface PersonalizedContentViewProps {
  content: AICourseContent | null;
  sections: AICourseContentSection[];
  isLoading: boolean;
  employeeId?: string | null;
  courseId?: string | null;
  onGenerateContent?: () => Promise<void>;
}

export function PersonalizedContentView({
  content,
  sections,
  isLoading,
  employeeId,
  courseId,
  onGenerateContent
}: PersonalizedContentViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [generationError, setGenerationError] = useState<string | undefined>();
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>();
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const generationSteps = [
    {
      id: 'profile-data',
      title: 'Profile Data Retrieved',
      description: 'Your employee profile and CV data are loaded',
      status: 'pending' as const,
      icon: User
    },
    {
      id: 'course-data',
      title: 'Course Materials Analyzed',
      description: 'Course content is analyzed to prepare for personalization',
      status: 'pending' as const,
      icon: BookOpen
    },
    {
      id: 'llm-api',
      title: 'AI Personalization Started',
      description: 'LLM API is called to generate tailored content',
      status: 'pending' as const,
      icon: Zap
    },
    {
      id: 'content-creation',
      title: 'Content Creation',
      description: 'Converting AI responses into structured learning materials',
      status: 'pending' as const,
      icon: FileText
    },
    {
      id: 'course-ready',
      title: 'Course Ready',
      description: 'Your personalized course is now available',
      status: 'pending' as const,
      icon: Sparkles
    }
  ];
  
  const [steps, setSteps] = useState(generationSteps);
  
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
            
            setEstimatedTimeRemaining(prev => prev ? Math.max(prev - 10, 60) : 180);
            
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
            
            window.location.reload();
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
    setSteps(prevSteps => {
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
          steps={steps}
          currentStep={currentStep}
          isGenerating={isGenerating}
          estimatedTimeRemaining={estimatedTimeRemaining}
          onGenerateContent={handleGenerateContent}
          error={generationError}
        />
      )}
    </div>
  );
}
