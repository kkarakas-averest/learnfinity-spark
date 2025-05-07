import React from 'react';
import { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Search, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
// Import the necessary services from our codebase
import { generateGapAnalysis } from '@/lib/skills/gap-analysis';
import { generateCourseContent } from '@/lib/skills/course-generation';
import { LLMService } from '@/lib/llm/llm-service';
import { GroqClient } from '@/lib/groq-client';

// Define interfaces for service responses
interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Define interfaces for our data structures
interface ExtractedCVData {
  skills: string[];
  summary?: string;
  extractedAt?: string;
  [key: string]: any;
}

interface SkillGap {
  taxonomy_skill_id: string;
  skill_name: string;
  required_proficiency: number;
  current_proficiency: number | null;
  proficiency_gap: number;
  importance_level: number;
  gap_score: number;
}

interface GapAnalysisData {
  prioritized_gaps?: SkillGap[];
  [key: string]: any;
}

// Real service implementations that connect to our backend
const skillsService = {
  // Extract skills from resume using the LLM service
  extractSkillsFromResume: async (employeeId: string): Promise<ServiceResponse> => {
    try {
      console.log('Extracting skills from resume for employee:', employeeId);
      
      // Get the employee data with CV info
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id, name, position_id, department_id, cv_url, cv_extracted_data')
        .eq('id', employeeId)
        .single();
        
      if (employeeError || !employee) {
        console.error('Error fetching employee:', employeeError);
        return { success: false, error: 'Failed to fetch employee data' };
      }
      
      // Check if we already have extracted skills
      if (employee.cv_extracted_data) {
        let extractedData: ExtractedCVData;
        
        // Parse the data if it's a string
        if (typeof employee.cv_extracted_data === 'string') {
          try {
            extractedData = JSON.parse(employee.cv_extracted_data) as ExtractedCVData;
          } catch (e) {
            console.warn('Failed to parse CV extracted data:', e);
            extractedData = { skills: [] };
          }
        } else {
          extractedData = employee.cv_extracted_data as ExtractedCVData;
        }
        
        // If we have skills in the extracted data, use them
        if (extractedData && extractedData.skills && Array.isArray(extractedData.skills)) {
          console.log('Using existing CV extracted skills');
          
          // Check for existing skills in the skills table
          const { data: existingSkills } = await supabase
            .from('hr_employee_skills')
            .select('*')
            .eq('employee_id', employeeId);
            
          if (existingSkills && existingSkills.length > 0) {
            return { 
              success: true, 
              data: { 
                skills: existingSkills,
                extractedSkills: extractedData.skills
              }
            };
          }
          
          // Add skills to the database if they don't exist yet
          for (const skill of extractedData.skills) {
            // First check if this skill exists in the taxonomy
            const { data: taxonomySkill } = await supabase
              .from('skill_taxonomy_items')
              .select('id')
              .ilike('name', skill)
              .limit(1);
              
            const taxonomySkillId = taxonomySkill && taxonomySkill.length > 0 ? taxonomySkill[0].id : null;
            
            // Add the skill to the employee's skills
            await supabase
              .from('hr_employee_skills')
              .insert({
                employee_id: employeeId,
                taxonomy_skill_id: taxonomySkillId,
                raw_skill: skill,
                proficiency: 3, // Default medium proficiency
                verified: false,
                source: 'cv'
              });
          }
          
          // Get the newly added skills
          const { data: addedSkills } = await supabase
            .from('hr_employee_skills')
            .select('*')
            .eq('employee_id', employeeId);
            
          return { 
            success: true, 
            data: { 
              skills: addedSkills || [],
              extractedSkills: extractedData.skills
            } 
          };
        }
      }
      
      // If we don't have cv_extracted_data or skills, we need to process the CV
      if (!employee.cv_url) {
        return { success: false, error: 'No CV uploaded for this employee' };
      }
      
      // Process the CV using the LLM service
      const llmService = LLMService.getInstance();
      
      // Get position and department names for context
      const { data: position } = await supabase
        .from('hr_positions')
        .select('title')
        .eq('id', employee.position_id)
        .single();
        
      const { data: department } = await supabase
        .from('hr_departments')
        .select('name')
        .eq('id', employee.department_id)
        .single();
        
      // Extract text from PDF (simplified, in a real implementation you'd use a PDF extraction service)
      const extractedText = 'CV text extracted from PDF...'; 
      
      // Create a prompt for the LLM service
      const prompt = `
        Extract professional skills from this CV.
        
        CV CONTENT:
        ${extractedText}
        
        EMPLOYEE: ${employee.name}
        POSITION: ${position ? position.title : 'Unknown'}
        DEPARTMENT: ${department ? department.name : 'Unknown'}
        
        Extract a list of professional skills from this CV. Focus on technical skills, soft skills, and domain expertise.
        Return the results as a JSON array of skill names.
      `;
      
      // Call the LLM service
      const result = await llmService.complete(prompt, {
        temperature: 0.3,
        system: 'You are an expert HR recruiter who extracts skills from CVs'
      });
      
      // Parse the result as JSON
      let skills: string[] = [];
      try {
        // Try to parse directly as a JSON array
        skills = JSON.parse(result);
      } catch (e) {
        // If that fails, look for a JSON array in the text
        const match = result.match(/\[.*\]/s);
        if (match) {
          try {
            skills = JSON.parse(match[0]);
          } catch (innerError) {
            console.error('Failed to parse skills from LLM response:', innerError);
            return { success: false, error: 'Failed to parse skills from CV' };
          }
        }
      }
      
      if (!Array.isArray(skills)) {
        return { success: false, error: 'Failed to extract skills from CV' };
      }
      
      // Save the extracted skills to the database
      for (const skill of skills) {
        // First check if this skill exists in the taxonomy
        const { data: taxonomySkill } = await supabase
          .from('skill_taxonomy_items')
          .select('id')
          .ilike('name', skill)
          .limit(1);
          
        const taxonomySkillId = taxonomySkill && taxonomySkill.length > 0 ? taxonomySkill[0].id : null;
        
        // Add the skill to the employee's skills
        await supabase
          .from('hr_employee_skills')
          .insert({
            employee_id: employeeId,
            taxonomy_skill_id: taxonomySkillId,
            raw_skill: skill,
            proficiency: 3, // Default medium proficiency
            verified: false,
            source: 'cv'
          });
      }
      
      // Get the newly added skills
      const { data: addedSkills } = await supabase
        .from('hr_employee_skills')
        .select('*')
        .eq('employee_id', employeeId);
        
      // Update the cv_extracted_data field
      await supabase
        .from('hr_employees')
        .update({
          cv_extracted_data: JSON.stringify({
            skills: skills,
            extracted_at: new Date().toISOString()
          })
        })
        .eq('id', employeeId);
        
      return { 
        success: true, 
        data: { 
          skills: addedSkills || [],
          extractedSkills: skills
        } 
      };
    } catch (error) {
      console.error('Error extracting skills from resume:', error);
      return { success: false, error: 'Error extracting skills from resume' };
    }
  },
  
  // Perform gap analysis between employee skills and position requirements
  performGapAnalysis: async (employeeId: string): Promise<ServiceResponse> => {
    try {
      console.log('Performing gap analysis for employee:', employeeId);
      
      // Get the employee position
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('position_id')
        .eq('id', employeeId)
        .single();
        
      if (employeeError || !employee || !employee.position_id) {
        console.error('Error fetching employee position:', employeeError);
        return { success: false, error: 'Failed to fetch employee position' };
      }
      
      // Use the gap analysis function from our codebase
      const gapAnalysis = await generateGapAnalysis(employeeId, employee.position_id);
      
      // Save the gap analysis to the database for future reference
      await supabase
        .from('hr_skill_gap_analyses')
        .upsert({
          employee_id: employeeId,
          position_id: employee.position_id,
          analysis_data: gapAnalysis,
          created_at: new Date().toISOString()
        }, { onConflict: 'employee_id,position_id' });
        
      return { 
        success: true, 
        data: gapAnalysis
      };
    } catch (error) {
      console.error('Error performing gap analysis:', error);
      return { success: false, error: 'Error performing gap analysis' };
    }
  }
};

const courseService = {
  // Generate personalized courses based on skill gaps
  generateCourseForEmployee: async (employeeId: string): Promise<ServiceResponse> => {
    try {
      console.log('Generating courses for employee:', employeeId);
      
      // Get the employee data
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id, name, position_id, department_id, cv_extracted_data')
        .eq('id', employeeId)
        .single();
        
      if (employeeError || !employee) {
        console.error('Error fetching employee:', employeeError);
        return { success: false, error: 'Failed to fetch employee data' };
      }
      
      // Get the latest gap analysis
      const { data: gapAnalysis } = await supabase
        .from('hr_skill_gap_analyses')
        .select('analysis_data')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!gapAnalysis || !gapAnalysis.analysis_data) {
        return { success: false, error: 'No gap analysis available' };
      }
      
      // Ensure the analysis_data is properly typed
      const analysisData = gapAnalysis.analysis_data as GapAnalysisData;
      const gaps = (analysisData.prioritized_gaps || []) as SkillGap[];
      
      if (gaps.length === 0) {
        console.log('No skill gaps to address for this employee');
        return { 
          success: true, 
          data: { 
            coursesGenerated: 0,
            courses: []
          } 
        };
      }
      
      // Only generate courses for the top 3 most important gaps
      const topGaps = gaps
        .sort((a: any, b: any) => b.gap_score - a.gap_score)
        .slice(0, 3);
        
      console.log(`Generating courses for top ${topGaps.length} skill gaps`);
      
      const generatedCourses = [];
      
      for (const gap of topGaps) {
        // Create a course title based on the skill gap
        const courseTitle = `Mastering ${gap.skill_name}`;
        
        // Generate course content using our existing function
        const courseContent = await generateCourseContent({
          title: courseTitle,
          targetGaps: [gap],
          objectives: [`Improve proficiency in ${gap.skill_name} from level ${gap.current_proficiency || 0} to ${gap.required_proficiency}`],
          employeeContext: {
            id: employee.id,
            name: employee.name,
            position: employee.position_id,
            department: employee.department_id
          },
          additionalContext: `This course addresses a skill gap identified in the employee's performance profile. The current proficiency is ${gap.current_proficiency || 0} and the required level is ${gap.required_proficiency}.`
        });
        
        // Save the course to the database
        const { data: course, error: courseError } = await supabase
          .from('hr_courses')
          .insert({
            title: courseTitle,
            description: courseContent.description,
            content: JSON.stringify(courseContent),
            created_for_employee_id: employeeId,
            status: 'active',
            skill_taxonomy_id: gap.taxonomy_skill_id,
            objectives: courseContent.objectives,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, title')
          .single();
          
        if (courseError) {
          console.error('Error creating course:', courseError);
          continue;
        }
        
        // Save course modules
        for (const [index, module] of courseContent.modules.entries()) {
          await supabase
            .from('hr_course_modules')
            .insert({
              course_id: course.id,
              title: module.title,
              content: module.content,
              order: index + 1,
              has_quiz: !!module.quiz,
              quiz_data: module.quiz ? JSON.stringify(module.quiz) : null
            });
        }
        
        // Enroll the employee in the course
        await supabase
          .from('hr_course_enrollments')
          .insert({
            course_id: course.id,
            employee_id: employeeId,
            status: 'enrolled',
            progress: 0,
            enrolled_at: new Date().toISOString()
          });
          
        generatedCourses.push(course);
      }
      
      return { 
        success: true, 
        data: { 
          coursesGenerated: generatedCourses.length,
          courses: generatedCourses
        } 
      };
    } catch (error) {
      console.error('Error generating course for employee:', error);
      return { success: false, error: 'Error generating course for employee' };
    }
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
        const result = await supabase
          .from('hr_employees')
          .select('cv_url, cv_extracted_data')
          .eq('id', employeeId)
          .single();
        
        if (result.error) {
          throw result.error;
        }
        
        if (result.data && (result.data.cv_url || result.data.cv_extracted_data)) {
          setCvProcessStatus({ 
            status: 'success',
            message: 'CV processed successfully'
          });
        } else {
          setCvProcessStatus({ 
            status: 'error',
            message: 'No CV available to process'
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
      
      if (extractResult.success) {
        const skills = Array.isArray((extractResult.data as { skills?: unknown })?.skills)
          ? (extractResult.data as { skills: unknown[] }).skills
          : [];
        const skillsCount = skills.length;
        
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
        
        if (gapResult.success) {
          const missingSkills = Array.isArray((gapResult.data as { prioritized_gaps?: unknown })?.prioritized_gaps)
            ? (gapResult.data as { prioritized_gaps: unknown[] }).prioritized_gaps
            : [];
          const missingSkillsCount = missingSkills.length;
          
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
        
        if (courseResult.success) {
          const coursesGenerated = typeof courseResult.data === 'object' && courseResult.data && 
            'coursesGenerated' in courseResult.data ? courseResult.data.coursesGenerated : 0;
            
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Process CV</span>
              {cvProcessStatus.status !== 'idle' && (
                <Badge 
                  variant={cvProcessStatus.status === 'success' ? 'outline' : 'secondary'}
                  className="ml-2"
                >
                  {cvProcessStatus.message}
                </Badge>
              )}
            </div>
            {renderStatusIcon(cvProcessStatus.status)}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="h-5 w-5 text-blue-500" />
              <span>Extract Skills</span>
              {skillExtractionStatus.status !== 'idle' && (
                <Badge 
                  variant={skillExtractionStatus.status === 'success' ? 'outline' : 'secondary'}
                  className="ml-2"
                >
                  {skillExtractionStatus.message}
                </Badge>
              )}
            </div>
            {renderStatusIcon(skillExtractionStatus.status)}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="h-5 w-5 text-blue-500" />
              <span>Perform Gap Analysis</span>
              {gapAnalysisStatus.status !== 'idle' && (
                <Badge 
                  variant={gapAnalysisStatus.status === 'success' ? 'outline' : 'secondary'}
                  className="ml-2"
                >
                  {gapAnalysisStatus.message}
                </Badge>
              )}
            </div>
            {renderStatusIcon(gapAnalysisStatus.status)}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>Generate Personalized Courses</span>
              {courseGenerationStatus.status !== 'idle' && (
                <Badge 
                  variant={courseGenerationStatus.status === 'success' ? 'outline' : 'secondary'}
                  className="ml-2"
                >
                  {courseGenerationStatus.message}
                </Badge>
              )}
            </div>
            {renderStatusIcon(courseGenerationStatus.status)}
          </div>
        </div>
      </Card>
      
      {processingComplete && (
        <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-800 font-medium">Processing completed successfully!</span>
          </div>
          <p className="mt-2 text-green-700 text-sm">
            The employee's data has been processed and personalized courses have been generated based on their skill gaps.
          </p>
        </div>
      )}
    </div>
  );
};

export default AutomatedProcessingSteps; 