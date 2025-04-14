
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  BookOpen, 
  Zap, 
  FileText, 
  Sparkles, 
  LoaderCircle
} from 'lucide-react';

export interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  icon: React.ElementType;
}

interface PersonalizedContentGenerationStatusProps {
  steps: GenerationStep[];
  currentStep: number;
  isGenerating: boolean;
  estimatedTimeRemaining?: number; // in seconds
  onGenerateContent: () => void;
  error?: string;
}

const PersonalizedContentGenerationStatus: React.FC<PersonalizedContentGenerationStatusProps> = ({
  steps,
  currentStep,
  isGenerating,
  estimatedTimeRemaining,
  onGenerateContent,
  error
}) => {
  // Calculate overall progress percentage
  const progressPercentage = 
    currentStep < 0 ? 0 : Math.min(Math.round((currentStep / (steps.length - 1)) * 100), 100);

  // Format estimated time remaining
  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds) return 'Calculating...';
    
    if (seconds < 60) return `${seconds} seconds`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds > 0 ? `${remainingSeconds} seconds` : ''}`;
  };

  return (
    <Card className="shadow-md border-slate-200">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-xl font-semibold">Personalized Content Generation</h3>
            <p className="text-slate-600 mt-1">
              {isGenerating 
                ? `Creating your personalized learning experience... (${formatTimeRemaining(estimatedTimeRemaining)})`
                : 'Generate content specifically tailored to your profile and needs'
              }
            </p>
          </div>

          {/* Progress bar */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Starting process</span>
                <span>{progressPercentage}% Complete</span>
                <span>Content ready</span>
              </div>
            </div>
          )}

          {/* Error message if any */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              <div className="font-medium">Generation failed</div>
              <div>{error}</div>
            </div>
          )}

          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = step.status === 'complete';
              const isError = step.status === 'error';
              const isPending = step.status === 'pending';
              const isLoading = step.status === 'loading';
              
              const StepIcon = step.icon;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center p-3 rounded-lg border ${
                    isActive ? 'bg-blue-50 border-blue-200' : 
                    isCompleted ? 'bg-green-50 border-green-100' : 
                    isError ? 'bg-red-50 border-red-200' : 
                    'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`mr-4 ${
                    isCompleted ? 'text-green-500' : 
                    isError ? 'text-red-500' : 
                    isActive ? 'text-blue-500' : 
                    'text-slate-400'
                  }`}>
                    {isLoading ? (
                      <LoaderCircle className="h-6 w-6 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : isError ? (
                      <XCircle className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      isActive ? 'text-blue-700' : 
                      isCompleted ? 'text-green-700' : 
                      isError ? 'text-red-700' : 
                      'text-slate-600'
                    }`}>{step.title}</h4>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                  <div>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {isError && <XCircle className="h-5 w-5 text-red-500" />}
                    {isLoading && <LoaderCircle className="h-5 w-5 text-blue-500 animate-spin" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          {!isGenerating && (
            <Button 
              onClick={onGenerateContent} 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Personalized Content
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizedContentGenerationStatus;
