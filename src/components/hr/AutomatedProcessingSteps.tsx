import React from 'react';
import { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Search, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
// @ts-expect-error: No type declaration for hrEmployeeService yet
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';

// Define interfaces for service responses
interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Mock services until properly implemented
const skillsService = {
  extractSkillsFromResume: async (employeeId: string): Promise<ServiceResponse> => {
    return await hrEmployeeService.getEmployeeSkills(employeeId);
  },
  performGapAnalysis: async (employeeId: string): Promise<ServiceResponse> => {
    return { 
      success: true, 
      data: { 
        missingSkills: [],
        positionRequirements: [],
        employeeSkills: []
      } 
    };
  }
};

const courseService = {
  generateCourseForEmployee: async (employeeId: string): Promise<ServiceResponse> => {
    return { 
      success: true, 
      data: { 
        coursesGenerated: 0,
        courses: []
      } 
    };
  }
};

interface ProcessingStepProps {
  employeeId: string;
  hasCv: boolean;
  hasPositionRequirements: boolean;
  onProcessingComplete: () => void;
}

type ProcessStatus = 'idle' | 'loading' | 'success' | 'error';

interface StepStatus {
  status: ProcessStatus;
  message?: string;
}

const AutomatedProcessingSteps: React.FC<ProcessingStepProps> = ({
  employeeId,
  hasCv,
  hasPositionRequirements,
  onProcessingComplete
}: ProcessingStepProps) => {
  const [processing, setProcessing] = useState(false);
  const [cvProcessStatus, setCvProcessStatus] = useState<StepStatus>({ status: 'idle' });
  const [skillExtractionStatus, setSkillExtractionStatus] = useState<StepStatus>({ status: 'idle' });
  const [gapAnalysisStatus, setGapAnalysisStatus] = useState<StepStatus>({ status: 'idle' });
  const [courseGenerationStatus, setCourseGenerationStatus] = useState<StepStatus>({ status: 'idle' });
  const [processingComplete, setProcessingComplete] = useState(false);
  
  const startAutomatedProcess = async (): Promise<void> => {
    if (processing) return;
    
    setProcessing(true);
    setProcessingComplete(false);
    
    // Step 1: Process CV if exists
    if (hasCv) {
      try {
        setCvProcessStatus({ status: 'loading' });
        const result = await hrEmployeeService.processCv(employeeId);
        
        if (result.success) {
          setCvProcessStatus({ 
            status: 'success',
            message: 'CV processed successfully'
          });
        } else {
          setCvProcessStatus({ 
            status: 'error',
            message: result.error || 'Failed to process CV'
          });
          setProcessing(false);
          return;
        }
      } catch (error) {
        setCvProcessStatus({ 
          status: 'error',
          message: 'An error occurred while processing CV'
        });
        setProcessing(false);
        return;
      }
    } else {
      setCvProcessStatus({ 
        status: 'idle',
        message: 'No CV available to process'
      });
    }
    
    // Step 2: Extract skills from CV
    try {
      setSkillExtractionStatus({ status: 'loading' });
      const extractResult = await skillsService.extractSkillsFromResume(employeeId);
      const skillsCount = Array.isArray(extractResult.data && (extractResult.data as any).skills) ? (extractResult.data as any).skills.length : 0;
      if (extractResult.success) {
        setSkillExtractionStatus({ 
          status: 'success',
          message: `${skillsCount} skills extracted`
        });
      } else {
        setSkillExtractionStatus({ 
          status: 'error',
          message: extractResult.error || 'Failed to extract skills'
        });
        setProcessing(false);
        return;
      }
    } catch (error) {
      setSkillExtractionStatus({ 
        status: 'error',
        message: 'An error occurred during skill extraction'
      });
      setProcessing(false);
      return;
    }
    
    // Step 3: Perform Gap Analysis (Only if position requirements exist)
    if (hasPositionRequirements) {
      try {
        setGapAnalysisStatus({ status: 'loading' });
        const gapResult = await skillsService.performGapAnalysis(employeeId);
        const missingSkillsCount = Array.isArray(gapResult.data && (gapResult.data as any).missingSkills) ? (gapResult.data as any).missingSkills.length : 0;
        if (gapResult.success) {
          setGapAnalysisStatus({ 
            status: 'success',
            message: `${missingSkillsCount} skill gaps identified`
          });
        } else {
          setGapAnalysisStatus({ 
            status: 'error',
            message: gapResult.error || 'Failed to perform gap analysis'
          });
          setProcessing(false);
          return;
        }
      } catch (error) {
        setGapAnalysisStatus({ 
          status: 'error',
          message: 'An error occurred during gap analysis'
        });
        setProcessing(false);
        return;
      }
    } else {
      setGapAnalysisStatus({ 
        status: 'idle',
        message: 'Position requirements needed for gap analysis'
      });
    }
    
    // Step 4: Generate Personalized Courses
    if (hasPositionRequirements) {
      try {
        setCourseGenerationStatus({ status: 'loading' });
        const courseResult = await courseService.generateCourseForEmployee(employeeId);
        const coursesGenerated = typeof courseResult.data === 'object' && courseResult.data && (courseResult.data as any).coursesGenerated ? (courseResult.data as any).coursesGenerated : 0;
        if (courseResult.success) {
          setCourseGenerationStatus({ 
            status: 'success',
            message: `${coursesGenerated} courses generated`
          });
        } else {
          setCourseGenerationStatus({ 
            status: 'error',
            message: courseResult.error || 'Failed to generate courses'
          });
          setProcessing(false);
          return;
        }
      } catch (error) {
        setCourseGenerationStatus({ 
          status: 'error',
          message: 'An error occurred during course generation'
        });
        setProcessing(false);
        return;
      }
    } else {
      setCourseGenerationStatus({ 
        status: 'idle',
        message: 'Position requirements needed for course generation'
      });
    }
    
    setProcessing(false);
    setProcessingComplete(true);
    onProcessingComplete();
  };
  
  // Render status icon based on status
  const renderStatusIcon = (status: ProcessStatus): React.ReactNode => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Automated Processing</h3>
        <Button
          onClick={startAutomatedProcess}
          disabled={processing || (!hasCv && !hasPositionRequirements)}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : processingComplete ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Process Again
            </>
          ) : (
            'Process Employee Data'
          )}
        </Button>
      </div>
      
      <Card className="p-4">
        <div className="space-y-4">
          {/* Step 1: CV Processing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>CV Processing</span>
              {!hasCv && (
                <Badge variant="outline" className="text-xs">
                  No CV Uploaded
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cvProcessStatus.message && (
                <span className="text-sm text-muted-foreground">
                  {cvProcessStatus.message}
                </span>
              )}
              {renderStatusIcon(cvProcessStatus.status)}
            </div>
          </div>
          
          <Separator />
          
          {/* Step 2: Skill Extraction */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              <span>Skill Extraction</span>
            </div>
            <div className="flex items-center gap-2">
              {skillExtractionStatus.message && (
                <span className="text-sm text-muted-foreground">
                  {skillExtractionStatus.message}
                </span>
              )}
              {renderStatusIcon(skillExtractionStatus.status)}
            </div>
          </div>
          
          <Separator />
          
          {/* Step 3: Gap Analysis */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Gap Analysis</span>
              {!hasPositionRequirements && (
                <Badge variant="outline" className="text-xs">
                  Requires Position Skills
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {gapAnalysisStatus.message && (
                <span className="text-sm text-muted-foreground">
                  {gapAnalysisStatus.message}
                </span>
              )}
              {renderStatusIcon(gapAnalysisStatus.status)}
            </div>
          </div>
          
          <Separator />
          
          {/* Step 4: Course Generation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>Course Generation</span>
              {!hasPositionRequirements && (
                <Badge variant="outline" className="text-xs">
                  Requires Position Skills
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {courseGenerationStatus.message && (
                <span className="text-sm text-muted-foreground">
                  {courseGenerationStatus.message}
                </span>
              )}
              {renderStatusIcon(courseGenerationStatus.status)}
            </div>
          </div>
        </div>
      </Card>
      
      {processingComplete && (
        <Card className="bg-green-50 border-green-200 p-4">
          <div className="flex items-center text-green-700">
            <CheckCircle className="h-6 w-6 mr-2" />
            <div>
              <h4 className="font-medium">Processing Complete</h4>
              <p className="text-sm">The employee profile has been fully processed. Skills have been extracted, gaps identified, and personalized courses generated.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AutomatedProcessingSteps; 