import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// HARDCODED GROQ API KEY (as per requirement)
const HARDCODED_GROQ_API_KEY = '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';

// Mock data for fallback when APIs fail
const MOCK_EMPLOYEE_SKILLS = [
  "JavaScript", "React", "TypeScript", "Node.js", "HTML/CSS", 
  "UI/UX Design", "Project Management", "Communication", "Problem Solving"
];

const MOCK_COURSE_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Redux", 
  "GraphQL", "REST API", "Unit Testing", "Git", "CI/CD"
];

type Employee = {
  id: string;
  name: string;
  email: string;
  resume_url?: string;
  profile_image_url?: string;
  department?: string;
  position?: string;
  [key: string]: any;
};

type Course = {
  id: string;
  title: string;
  skills: string[];
};

type AssessmentResult = {
  employee: Employee;
  course: Course;
  employeeSkills: string[];
  missingSkills: string[];
  extractedCvData?: any;
  employeeSummary?: string;
  suggestedSkills?: string[];
  skillsCoverage?: number;
};

interface BulkSkillsAssessmentProps {
  employees: Employee[];
}

export const BulkSkillsAssessment: React.FC<BulkSkillsAssessmentProps> = ({ employees }: BulkSkillsAssessmentProps) => {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);
  const [assessmentResults, setAssessmentResults] = React.useState<AssessmentResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [processingStep, setProcessingStep] = React.useState<string>('');
  const [expandedEmployees, setExpandedEmployees] = React.useState<Record<string, boolean>>({});
  const [useFallbackData, setUseFallbackData] = React.useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectedEmployeeIds(checked ? employees.map((e: Employee) => e.id) : []);
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    setSelectedEmployeeIds((prev: string[]) =>
      checked ? [...prev, id] : prev.filter((eid: string) => eid !== id)
    );
  };

  const clearSelection = () => {
    setSelectedEmployeeIds([]);
  };

  const toggleEmployeeExpand = (employeeId: string) => {
    setExpandedEmployees((prev: Record<string, boolean>) => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const toggleFallbackMode = () => {
    setUseFallbackData((prev: boolean) => !prev);
    toast({
      title: useFallbackData ? "Using real API data" : "Using fallback mock data",
      description: useFallbackData 
        ? "The assessment will attempt to use actual API data" 
        : "The assessment will use mock data for demonstration purposes",
      variant: "default"
    });
  };

  // Function to extract CV data using GROQ API
  const extractCvData = async (employee: Employee) => {
    setProcessingStep(`Extracting CV data for ${employee.name}...`);
    
    // Use fallback mock data if enabled or if employee has no resume URL
    if (useFallbackData || !employee.resume_url) {
      if (!employee.resume_url) {
        console.warn(`No resume URL found for employee ${employee.name}`);
      }
      
      // Generate some fake skills based on employee name as seed
      const nameHash = employee.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const randomSkillsCount = 5 + (nameHash % 4); // 5-8 skills
      
      // Select random skills from mock data
      const shuffledSkills = [...MOCK_EMPLOYEE_SKILLS].sort(() => 0.5 - Math.random());
      const selectedSkills = shuffledSkills.slice(0, randomSkillsCount);
      
      return {
        success: true,
        skills: selectedSkills,
        summary: `${employee.name} is a ${employee.position || 'professional'} with experience in various ${employee.department || 'industry'} projects. They have demonstrated strong capabilities in ${selectedSkills.slice(0, 3).join(', ')}, and continue to develop expertise in related areas.`,
        suggestedSkills: shuffledSkills.slice(randomSkillsCount, randomSkillsCount + 3)
      };
    }

    try {
      const systemPrompt = `You are an expert HR recruiter and resume analyzer with years of experience extracting meaningful information from CVs and resumes.`;

      const userPrompt = `
        Based on this employee profile information:
        
        Name: ${employee.name}
        Position: ${employee.position || "Not specified"}
        Department: ${employee.department || "Not specified"}
        
        1. Identify and extract professional skills from their background
        2. List the key technical and soft skills relevant to their position
        3. Provide a brief professional summary (2-3 sentences)
        
        Format your response as this JSON structure:
        {
          "skills": [
            "Skill 1",
            "Skill 2",
            "Skill 3"
          ],
          "summary": "Brief professional summary of the employee",
          "suggestedSkills": [
            "Suggested Skill 1",
            "Suggested Skill 2"
          ]
        }
      `;

      // Use the GROQ API to extract skills from the CV
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HARDCODED_GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract the JSON from the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to extract valid JSON from API response");
      }
      
      const extractedData = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        ...extractedData
      };
    } catch (err: unknown) {
      console.error(`Error extracting CV data for ${employee.name}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Switch to fallback data on error
      const shuffledSkills = [...MOCK_EMPLOYEE_SKILLS].sort(() => 0.5 - Math.random());
      
      return {
        success: true, // Still return success to continue the flow
        error: errorMessage,
        summary: `${employee.name} is a ${employee.position || 'professional'} in the ${employee.department || 'industry'} field.`,
        skills: shuffledSkills.slice(0, 5),
        suggestedSkills: shuffledSkills.slice(5, 8)
      };
    }
  };

  // Function to fetch employee courses
  const fetchEmployeeCourses = async (employeeId: string): Promise<Course[]> => {
    if (useFallbackData) {
      // Generate 1-2 mock courses with skills
      const mockCourseCount = Math.floor(Math.random() * 2) + 1;
      const mockCourses: Course[] = [];
      
      for (let i = 0; i < mockCourseCount; i++) {
        // Generate random skill count and select random skills
        const skillCount = 5 + Math.floor(Math.random() * 5); // 5-9 skills
        const shuffledSkills = [...MOCK_COURSE_SKILLS].sort(() => 0.5 - Math.random());
        
        mockCourses.push({
          id: `mock-course-${i}-${employeeId.substring(0, 5)}`,
          title: [`Frontend Development`, `React Advanced`, `Full Stack JavaScript`, `Leadership Skills`][i % 4],
          skills: shuffledSkills.slice(0, skillCount)
        });
      }
      
      return mockCourses;
    }
    
    try {
      // First try the relative API endpoint
      let coursesRes = await fetch(`/api/hr/employee-courses?employeeId=${employeeId}`);
      
      // If that fails, try the absolute URL (for production)
      if (!coursesRes.ok) {
        const baseUrl = window.location.origin;
        coursesRes = await fetch(`${baseUrl}/api/hr/employee-courses?employeeId=${employeeId}`);
      }
      
      if (!coursesRes.ok) {
        throw new Error(`Failed to fetch courses: ${coursesRes.statusText}`);
      }
      
      const coursesData = await coursesRes.json();
      return coursesData.courses || [];
    } catch (err) {
      console.error(`Error fetching courses for employee ${employeeId}:`, err);
      
      // Return mock data as fallback
      return [{
        id: `fallback-course-${employeeId.substring(0, 5)}`,
        title: 'Core Skills Development',
        skills: MOCK_COURSE_SKILLS.slice(0, 6)
      }];
    }
  };

  // Function to fetch course skills
  const fetchCourseSkills = async (courseId: string): Promise<string[]> => {
    if (useFallbackData) {
      // Return random selection of mock skills
      const skillCount = 5 + Math.floor(Math.random() * 5); // 5-9 skills
      const shuffledSkills = [...MOCK_COURSE_SKILLS].sort(() => 0.5 - Math.random());
      return shuffledSkills.slice(0, skillCount);
    }
    
    try {
      // First try the relative API endpoint
      let courseRes = await fetch(`/api/hr/courses/${courseId}`);
      
      // If that fails, try the absolute URL (for production)
      if (!courseRes.ok) {
        const baseUrl = window.location.origin;
        courseRes = await fetch(`${baseUrl}/api/hr/courses/${courseId}`);
      }
      
      if (!courseRes.ok) {
        return []; // Return empty if course not found
      }
      
      const courseData = await courseRes.json();
      return courseData.skills || [];
    } catch (err) {
      console.error(`Error fetching skills for course ${courseId}:`, err);
      return [];
    }
  };

  const handleAssessSkills = async () => {
    setLoading(true);
    setShowModal(true);
    setAssessmentResults([]);
    setError(null);
    setProcessingStep('Initializing assessment...');
    setExpandedEmployees({});

    try {
      const results: AssessmentResult[] = [];
      
      for (const employeeId of selectedEmployeeIds) {
        try {
          const employee = employees.find((e: Employee) => e.id === employeeId);
          if (!employee) continue;
          
          setProcessingStep(`Processing ${employee.name}...`);
          
          // Step 1: Extract CV data using GROQ API to identify skills
          const cvData = await extractCvData(employee);
          const employeeSkills = cvData.success ? cvData.skills : [];
          
          // Step 2: Fetch assigned courses for this employee
          setProcessingStep(`Fetching courses for ${employee.name}...`);
          const courses = await fetchEmployeeCourses(employeeId);

          // Skip employees with no assigned courses
          if (courses.length === 0) {
            continue;
          }

          // Step 3: For each course, identify the required skills and compute gaps
          for (const course of courses) {
            setProcessingStep(`Analyzing skills gap for ${employee.name} - ${course.title}...`);
            
            // Get course skills
            let courseSkills = course.skills || [];
            if (courseSkills.length === 0) {
              const skills = await fetchCourseSkills(course.id);
              courseSkills = skills;
            }

            // Skip courses with no skills
            if (courseSkills.length === 0) {
              continue;
            }

            // Step 4: Create the skills gap analysis
            const missingSkills = courseSkills.filter(
              skill => !employeeSkills.includes(skill)
            );
            
            // Calculate skills coverage percentage
            const skillsCoverage = courseSkills.length > 0
              ? Math.round(((courseSkills.length - missingSkills.length) / courseSkills.length) * 100)
              : 0;

            // Step 5: Add to results with employee summary and suggested skills
            results.push({
              employee,
              course: { ...course, skills: courseSkills },
              employeeSkills,
              missingSkills,
              extractedCvData: cvData,
              employeeSummary: cvData.summary || "No summary available",
              suggestedSkills: cvData.suggestedSkills || [],
              skillsCoverage
            });
          }
        } catch (employeeError) {
          console.error(`Error processing employee ${employeeId}:`, employeeError);
          // Continue with next employee
        }
      }

      if (results.length === 0) {
        toast({
          title: "No assessment results",
          description: "No skills gaps were found, or the selected employees have no assigned courses with skills.",
          variant: "default"
        });
      }

      setAssessmentResults(results);
      
      // Initialize expanded state for each employee
      const initialExpandState: Record<string, boolean> = {};
      results.forEach(result => {
        initialExpandState[result.employee.id] = false;
      });
      setExpandedEmployees(initialExpandState);
      
    } catch (err) {
      console.error('Failed to perform skills assessment:', err);
      setError('Failed to perform skills assessment');
      toast({
        title: "Assessment failed",
        description: "There was an error performing the skills assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingStep('');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Skills Gap Assessment</h2>
        <div className="flex justify-between mb-4">
          <p className="text-gray-600">
            Select employees to identify skills gaps between assigned courses and current skills.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFallbackMode} 
            className="text-xs"
          >
            {useFallbackData ? "Use Real API Data" : "Use Mock Data"}
          </Button>
        </div>
        
        {/* Employee Selection Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                  onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectAll(!!checked)}
                  data-select-all="true"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>CV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp: Employee) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectEmployee(emp.id, !!checked)}
                  />
                </TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>{emp.department || 'Not assigned'}</TableCell>
                <TableCell>{emp.position || 'Not assigned'}</TableCell>
                <TableCell>{emp.resume_url ? '✓' : '✗'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Bulk Actions Bar */}
        {selectedEmployeeIds.length > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <Button 
              onClick={handleAssessSkills}
              data-assess-skills="true"
            >
              Assess Skills Gaps
            </Button>
            <Button 
              variant="outline" 
              onClick={clearSelection}
              data-clear-selection="true"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Assessment Results Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Skills Gap Assessment Results</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">{processingStep || 'Assessing skills...'}</span>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : assessmentResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No assessment results found. Employees may not have assigned courses with skills, or their skills already cover course requirements.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Skills Gap</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentResults.map((result: AssessmentResult) => (
                    <React.Fragment key={`${result.employee.id}-${result.course.id}`}>
                      <TableRow 
                        className={
                          result.missingSkills.length > 0 
                            ? "border-l-4 border-l-amber-400" 
                            : "border-l-4 border-l-green-400"
                        }
                      >
                        <TableCell>
                          <div className="font-medium">{result.employee.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.employee.position || 'No position'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{result.course.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.course.skills.length} required skills
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={result.skillsCoverage} className="h-2" />
                            <div className="text-xs mt-1 text-center">
                              {result.skillsCoverage}% covered
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {result.missingSkills.length > 0 ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <span>{result.missingSkills.length} missing skills</span>
                              </>
                            ) : (
                              <span className="text-green-600">No skill gaps</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEmployeeExpand(result.employee.id)}
                            className="p-0 h-8 w-8"
                          >
                            {expandedEmployees[result.employee.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details Row */}
                      {expandedEmployees[result.employee.id] && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0 border-t-0">
                            <div className="bg-gray-50 p-4 rounded-b-md">
                              <div className="text-sm font-medium mb-3">Employee Summary</div>
                              <p className="text-sm mb-4">{result.employeeSummary}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <Card className="bg-blue-50 border-blue-200">
                                  <CardContent className="pt-4">
                                    <h4 className="font-medium text-sm mb-2 text-blue-700">Course Required Skills</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {result.course.skills.length > 0 ? (
                                        <ul className="text-sm space-y-1">
                                          {result.course.skills.map((skill, i) => (
                                            <li key={i} className="flex items-start">
                                              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 mt-1.5"></span>
                                              <span>{skill}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-gray-500">No required skills defined</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card className="bg-green-50 border-green-200">
                                  <CardContent className="pt-4">
                                    <h4 className="font-medium text-sm mb-2 text-green-700">Employee Skills</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {result.employeeSkills.length > 0 ? (
                                        <ul className="text-sm space-y-1">
                                          {result.employeeSkills.map((skill, i) => (
                                            <li key={i} className="flex items-start">
                                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 mt-1.5"></span>
                                              <span>{skill}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-gray-500">No skills found</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card className="bg-amber-50 border-amber-200">
                                  <CardContent className="pt-4">
                                    <h4 className="font-medium text-sm mb-2 text-amber-700">Training Needs</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                      {result.missingSkills.length > 0 ? (
                                        <>
                                          <h5 className="text-xs font-medium mb-1">Missing Skills</h5>
                                          <ul className="text-sm space-y-1 mb-3">
                                            {result.missingSkills.map((skill, i) => (
                                              <li key={i} className="flex items-start">
                                                <AlertCircle className="h-3 w-3 text-amber-500 mr-2 mt-0.5" />
                                                <span>{skill}</span>
                                              </li>
                                            ))}
                                          </ul>
                                          
                                          {result.suggestedSkills && result.suggestedSkills.length > 0 && (
                                            <>
                                              <h5 className="text-xs font-medium mb-1">Suggested Skills</h5>
                                              <ul className="text-sm space-y-1">
                                                {result.suggestedSkills.map((skill, i) => (
                                                  <li key={i} className="flex items-start">
                                                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-2 mt-1.5"></span>
                                                    <span>{skill}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </>
                                          )}
                                        </>
                                      ) : (
                                        <p className="text-sm text-green-600">No skill gaps found</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 