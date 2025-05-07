import React, { useState, useEffect } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EmployeeProfileForm from './EmployeeProfileForm';
import { PositionRequirementsEditor } from './PositionRequirementsEditor';
import AutomatedProcessingSteps from './AutomatedProcessingSteps';
import { hrEmployeeService } from '@/services/hrEmployeeService';

// Define interfaces
interface FormData {
  name: string;
  email: string;
  departmentId: string;
  positionId: string;
  status: string;
  companyId: string;
  courseIds: string[];
  resumeFile: File | null;
}

interface EmployeeData {
  name: string;
  email: string;
  department_id: string;
  position_id: string;
  status: string;
  company_id: string;
  hire_date: string;
  course_ids: string[];
  resume_url?: string; // Optional property for resume URL
}

// Progress indicator component
const ProgressSteps: React.FC<{currentStep: number, isOnboardingFlow?: boolean}> = ({ 
  currentStep, 
  isOnboardingFlow = false
}: {
  currentStep: number, 
  isOnboardingFlow?: boolean
}) => {
  let steps = [
    { label: "Employee Info", number: 1 },
    { label: "Position Requirements", number: 2 },
    { label: "Skills & Courses", number: 3 }
  ];
  
  // If coming from organization setup, show the complete flow
  if (isOnboardingFlow) {
    steps = [
      { label: "Departments", number: 1 },
      { label: "Positions", number: 2 },
      { label: "Review Org", number: 3 },
      { label: "Employee Info", number: 4 },
      { label: "Position Requirements", number: 5 },
      { label: "Skills & Courses", number: 6 }
    ];
  }
  
  return (
    <div className="w-full py-4">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step.number 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-xs mt-1 ${isOnboardingFlow ? 'hidden md:block' : ''}`}>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`h-1 flex-1 mx-2 ${
                  currentStep > index + 1 ? 'bg-primary' : 'bg-gray-200'
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; title: string; department_id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('basic-info');
  const [createdEmployee, setCreatedEmployee] = useState<EmployeeData | null>(null);
  const [hasUploadedResume, setHasUploadedResume] = useState(false);
  const [hasPositionRequirements, setHasPositionRequirements] = useState(false);
  const [processingStarted, setProcessingStarted] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isOnboardingFlow, setIsOnboardingFlow] = useState(false);
  const [globalCurrentStep, setGlobalCurrentStep] = useState(4); // Default to step 4 in the global flow
  
  // Check if this is part of onboarding flow on component mount
  useEffect(() => {
    try {
      const onboardingData = localStorage.getItem('onboardingFlow');
      if (onboardingData) {
        const parsedData = JSON.parse(onboardingData);
        if (parsedData.orgSetupComplete) {
          setIsOnboardingFlow(true);
          setGlobalCurrentStep(parsedData.currentStep || 4);
        }
      }
    } catch (err) {
      console.error('Error parsing onboarding flow data:', err);
    }
  }, []);
  
  // Update local step and global step when tab changes
  useEffect(() => {
    let localStep = 1;
    let globalStep = 4;
    
    if (currentTab === 'basic-info') {
      localStep = 1;
      globalStep = 4;
    } else if (currentTab === 'skill-requirements') {
      localStep = 2;
      globalStep = 5;
      if (hasPositionRequirements && !processingStarted) {
        localStep = 3;
        globalStep = 6;
      }
    }
    
    setCurrentStep(localStep);
    
    if (isOnboardingFlow) {
      setGlobalCurrentStep(globalStep);
      // Update in localStorage
      try {
        const onboardingData = localStorage.getItem('onboardingFlow');
        if (onboardingData) {
          const parsedData = JSON.parse(onboardingData);
          localStorage.setItem('onboardingFlow', JSON.stringify({
            ...parsedData,
            currentStep: globalStep
          }));
        }
      } catch (err) {
        console.error('Error updating onboarding flow data:', err);
      }
    }
  }, [currentTab, hasPositionRequirements, processingStarted, isOnboardingFlow]);
  
  // Fetch departments and positions when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get departments
        const deptResult = await hrEmployeeService.getDepartments();
        if (deptResult.success && Array.isArray(deptResult.departments)) {
          setDepartments(deptResult.departments);
        } else {
          console.error('Failed to fetch departments:', deptResult.error);
        }
        // TODO: Implement fetching positions when hrEmployeeService.getPositions is available
        setPositions([]);
      } catch (err) {
        console.error('Error fetching department/position data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      setHasUploadedResume(!!formData.resumeFile);
      const employeeData: EmployeeData = {
        name: formData.name,
        email: formData.email,
        department_id: formData.departmentId,
        position_id: formData.positionId,
        status: formData.status || 'active',
        company_id: formData.companyId,
        hire_date: new Date().toISOString().split('T')[0],
        course_ids: []
      };
      const result = await hrEmployeeService.createEmployee(employeeData);
      if ('id' in result && typeof result.id === 'string') {
        const employeeId = result.id;
        if (formData.resumeFile && employeeId) {
          try {
            const { error: resumeError } = await hrEmployeeService.uploadEmployeeResume(employeeId, formData.resumeFile);
            if (resumeError) {
              console.warn('Resume upload failed:', resumeError.message);
            }
          } catch (uploadErr) {
            console.warn('Error uploading resume:', uploadErr);
          }
        }
        setCreatedEmployee({ ...employeeData, id: employeeId });
        setCurrentTab('skill-requirements');
      } else {
        setError('Failed to create employee');
        console.error('Employee creation failed:', result);
      }
    } catch (err) {
      setError('An error occurred while creating the employee');
      console.error('Error in handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementsComplete = () => {
    setHasPositionRequirements(true);
  };
  
  const handleProcessingComplete = () => {
    setCurrentStep(3);
    setProcessingComplete(true);
    console.log('All processing completed successfully');
  };
  
  const startProcessing = () => {
    setProcessingStarted(true);
  };
  
  const handleCourseAssignment = async (courseIds: string[]) => {
    if (!createdEmployee?.id) return;
    // Implement course assignment logic or call the correct service method if available
    try {
      // Example: await hrEmployeeService.assignCourses(createdEmployee.id, courseIds);
      console.log('Courses successfully assigned to employee (stub)');
    } catch (err) {
      console.error('Error assigning courses:', err);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{isOnboardingFlow ? "Complete Organization Setup" : "Add New Employee"}</h1>
        <Button 
          variant="outline"
          onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees`)}
        >
          Cancel
        </Button>
      </div>
      
      <ProgressSteps 
        currentStep={isOnboardingFlow ? globalCurrentStep : currentStep} 
        isOnboardingFlow={isOnboardingFlow} 
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic-info" disabled={loading}>Basic Information</TabsTrigger>
          <TabsTrigger value="skill-requirements" disabled={!createdEmployee}>Skills & Development</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeProfileForm 
                onSubmit={handleSubmit}
                isLoading={loading}
                departments={departments}
                positions={positions}
                showCourseSelection={false}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div></div>
              <Button 
                type="submit" 
                form="employee-form"
                disabled={loading}
              >
                Create Employee & Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="skill-requirements">
          <div className="space-y-6">
            {!hasPositionRequirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Position Skill Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  {createdEmployee ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Define the skills required for {createdEmployee.name}'s position as {createdEmployee.position}.
                        These skills will be used for personalized learning and skills gap analysis.
                      </p>
                      
                      <PositionRequirementsEditor
                        positionId={createdEmployee.position_id}
                        positionTitle={createdEmployee.position}
                        departmentId={createdEmployee.department_id}
                        departmentName={createdEmployee.department}
                        onClose={handleRequirementsComplete}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-6">
                      <p>Please complete the Basic Information step first</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab('basic-info')}
                    disabled={loading}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Employee Details
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees`)}
                    >
                      Skip for Now
                    </Button>
                    <Button 
                      type="button"
                      onClick={startProcessing}
                      disabled={!hasPositionRequirements}
                    >
                      Continue to Processing
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}
            
            {(hasPositionRequirements || processingStarted) && (
              <Card>
                <CardHeader>
                  <CardTitle>Skill Analysis & Course Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <AutomatedProcessingSteps
                    employeeId={createdEmployee.id}
                    hasCv={hasUploadedResume}
                    hasPositionRequirements={hasPositionRequirements}
                    onProcessingComplete={handleProcessingComplete}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  {processingComplete ? (
                    <Button 
                      onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees/${createdEmployee.id}`)}
                    >
                      View Employee Profile
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees`)}
                    >
                      Skip for Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
            
            {processingComplete && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Based on the skills gap analysis, assign appropriate courses to help {createdEmployee?.name} 
                    develop the necessary skills for their role.
                  </p>
                  
                  <EmployeeProfileForm 
                    onSubmit={(formData: FormData) => {
                      handleCourseAssignment(formData.courseIds);
                      navigate(`${ROUTES.HR_DASHBOARD}/employees/${createdEmployee.id}`);
                    }}
                    isLoading={loading}
                    initialData={{
                      name: createdEmployee?.name || '',
                      email: createdEmployee?.email || '',
                      departmentId: createdEmployee?.department_id || '',
                      positionId: createdEmployee?.position_id || '',
                      status: createdEmployee?.status || 'active',
                      companyId: createdEmployee?.company_id || '',
                    }}
                    showCourseSelection={true}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateEmployeePage;
