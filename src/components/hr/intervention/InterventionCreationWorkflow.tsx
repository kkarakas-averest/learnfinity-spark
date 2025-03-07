import React, { useState } from '@/lib/react-helpers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Intervention, 
  InterventionInput, 
  InterventionType,
  InterventionStatus,
  InterventionReason,
  ContentModification,
  ResourceAssignment,
  MentorAssignment,
  FeedbackRequest,
  ScheduleAdjustment,
  InterventionTemplate
} from '@/types/intervention.types';
import ContentModificationForm from './ContentModificationForm';
import ResourceAssignmentPanel from './ResourceAssignmentPanel';
import { RAGStatus } from '@/types/hr.types';

// Mock employee data
const employees = [
  { id: '1', name: 'Alice Johnson', ragStatus: 'amber' as RAGStatus },
  { id: '2', name: 'Bob Smith', ragStatus: 'red' as RAGStatus },
  { id: '3', name: 'Charlie Brown', ragStatus: 'green' as RAGStatus },
  { id: '4', name: 'Dana Lee', ragStatus: 'amber' as RAGStatus },
  { id: '5', name: 'Ethan Wong', ragStatus: 'red' as RAGStatus },
];

// Mock intervention templates
const interventionTemplates = [
  {
    id: '1',
    name: 'Performance Improvement Plan',
    description: 'A structured plan for employees who are struggling with course completion',
    type: 'content_modification' as InterventionType,
    reasonsForUse: ['poor_performance', 'progress_slowdown'],
    contentTemplate: 'We have noticed that you are having some difficulty with the course material. This personalized plan is designed to help you overcome these challenges.'
  },
  {
    id: '2',
    name: 'Additional Resources Package',
    description: 'Supplementary materials for employees who need more context',
    type: 'resource_assignment' as InterventionType,
    reasonsForUse: ['low_engagement', 'poor_performance'],
    contentTemplate: 'To help you better understand the concepts, we have assigned these additional resources.'
  },
  {
    id: '3',
    name: 'Deadline Extension',
    description: 'Extended timeline for course completion',
    type: 'schedule_adjustment' as InterventionType,
    reasonsForUse: ['progress_slowdown', 'employee_request'],
    contentTemplate: 'We have adjusted your deadline to provide more time for completion.'
  },
  {
    id: '4',
    name: 'Mentor Support Program',
    description: 'One-on-one guidance with an experienced mentor',
    type: 'mentor_assignment' as InterventionType,
    reasonsForUse: ['rag_status_change', 'poor_performance'],
    contentTemplate: 'To provide additional support, we have assigned a mentor who will guide you through the challenging aspects of this course.'
  }
];

interface InterventionCreationWorkflowProps {
  onCreated: (intervention: InterventionInput) => void;
  onCancel: () => void;
  hrUserId: string;
}

type Step = 'type' | 'details' | 'content' | 'review';

/**
 * InterventionCreationWorkflow Component
 * 
 * A step-by-step wizard for creating HR interventions
 */
const InterventionCreationWorkflow: React.FC<InterventionCreationWorkflowProps> = ({
  onCreated,
  onCancel,
  hrUserId
}) => {
  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('type');
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [interventionType, setInterventionType] = useState<InterventionType>('content_modification');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [useTemplate, setUseTemplate] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reason, setReason] = useState<InterventionReason>('rag_status_change');
  const [dueDate, setDueDate] = useState<string>('');
  
  // Specific intervention details
  const [contentModifications, setContentModifications] = useState<ContentModification[]>([]);
  const [resourceAssignments, setResourceAssignments] = useState<ResourceAssignment[]>([]);
  const [scheduleAdjustment, setScheduleAdjustment] = useState<ScheduleAdjustment | undefined>();
  const [mentorAssignment, setMentorAssignment] = useState<MentorAssignment | undefined>();
  const [feedbackRequest, setFeedbackRequest] = useState<FeedbackRequest | undefined>();
  
  // Filter employees by RAG status
  const [ragFilter, setRagFilter] = useState<RAGStatus | 'all'>('all');
  const filteredEmployees = ragFilter === 'all' 
    ? employees 
    : employees.filter(e => e.ragStatus === ragFilter);
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    const template = interventionTemplates.find(t => t.id === templateId);
    if (template) {
      setInterventionType(template.type);
      setTitle(template.name);
      setDescription(template.contentTemplate);
      if (template.reasonsForUse.length > 0) {
        setReason(template.reasonsForUse[0] as InterventionReason);
      }
    }
  };
  
  // Handle content modification save
  const handleContentModificationSave = (contentMod: ContentModification) => {
    setContentModifications([contentMod]);
    goToNextStep();
  };
  
  // Handle resource assignments save
  const handleResourceAssignmentsSave = (resources: ResourceAssignment[]) => {
    setResourceAssignments(resources);
    goToNextStep();
  };
  
  // Navigate to next step
  const goToNextStep = () => {
    switch (currentStep) {
      case 'type':
        setCurrentStep('details');
        break;
      case 'details':
        setCurrentStep('content');
        break;
      case 'content':
        setCurrentStep('review');
        break;
      case 'review':
        // Submit the intervention
        handleSubmit();
        break;
    }
  };
  
  // Navigate to previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'details':
        setCurrentStep('type');
        break;
      case 'content':
        setCurrentStep('details');
        break;
      case 'review':
        setCurrentStep('content');
        break;
    }
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Create intervention input
    const intervention: InterventionInput = {
      employeeId: selectedEmployee,
      type: interventionType,
      status: 'pending',
      reason,
      title,
      description,
      createdBy: hrUserId,
      ragStatusAtCreation: employees.find(e => e.id === selectedEmployee)?.ragStatus || 'amber'
    };
    
    // Add due date if provided
    if (dueDate) {
      intervention.dueDate = new Date(dueDate).toISOString();
    }
    
    // Add intervention-specific details based on type
    switch (interventionType) {
      case 'content_modification':
        intervention.contentModifications = contentModifications;
        break;
      case 'resource_assignment':
        intervention.resourceAssignments = resourceAssignments;
        break;
      case 'schedule_adjustment':
        intervention.scheduleAdjustment = scheduleAdjustment;
        break;
      case 'mentor_assignment':
        intervention.mentorAssignment = mentorAssignment;
        break;
      case 'feedback_request':
        intervention.feedbackRequest = feedbackRequest;
        break;
    }
    
    // Call onCreated callback
    onCreated(intervention);
  };
  
  // Get the selected employee name
  const selectedEmployeeName = employees.find(e => e.id === selectedEmployee)?.name || '';
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'type':
        return (
          <div className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-3">
              <Label>Select Employee</Label>
              
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant={ragFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRagFilter('all')}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant={ragFilter === 'red' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRagFilter('red')}
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  Red
                </Button>
                <Button
                  type="button"
                  variant={ragFilter === 'amber' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRagFilter('amber')}
                  className="border-amber-500 text-amber-500 hover:bg-amber-50"
                >
                  Amber
                </Button>
                <Button
                  type="button"
                  variant={ragFilter === 'green' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRagFilter('green')}
                  className="border-green-500 text-green-500 hover:bg-green-50"
                >
                  Green
                </Button>
              </div>
              
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.ragStatus.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Template Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-template"
                  checked={useTemplate}
                  onCheckedChange={(checked) => setUseTemplate(!!checked)}
                />
                <Label htmlFor="use-template">Use an intervention template</Label>
              </div>
              
              {useTemplate && (
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {interventionTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {!useTemplate && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="intervention-type">Intervention Type</Label>
                    <Select value={interventionType} onValueChange={(value) => setInterventionType(value as InterventionType)}>
                      <SelectTrigger id="intervention-type">
                        <SelectValue placeholder="Select intervention type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_modification">Content Modification</SelectItem>
                        <SelectItem value="resource_assignment">Resource Assignment</SelectItem>
                        <SelectItem value="schedule_adjustment">Schedule Adjustment</SelectItem>
                        <SelectItem value="mentor_assignment">Mentor Assignment</SelectItem>
                        <SelectItem value="feedback_request">Feedback Request</SelectItem>
                        <SelectItem value="custom">Custom Intervention</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'details':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Intervention Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this intervention"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and details of this intervention"
                rows={3}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="reason">Reason for Intervention</Label>
              <Select value={reason} onValueChange={(value) => setReason(value as InterventionReason)}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rag_status_change">RAG Status Change</SelectItem>
                  <SelectItem value="progress_slowdown">Progress Slowdown</SelectItem>
                  <SelectItem value="low_engagement">Low Engagement</SelectItem>
                  <SelectItem value="poor_performance">Poor Performance</SelectItem>
                  <SelectItem value="employee_request">Employee Request</SelectItem>
                  <SelectItem value="periodic_review">Periodic Review</SelectItem>
                  <SelectItem value="custom">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="due-date">Due Date (Optional)</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        );
        
      case 'content':
        // Render different content based on intervention type
        switch (interventionType) {
          case 'content_modification':
            return (
              <ContentModificationForm
                onSave={handleContentModificationSave}
                onCancel={goToPreviousStep}
              />
            );
            
          case 'resource_assignment':
            return (
              <ResourceAssignmentPanel
                onSave={handleResourceAssignmentsSave}
                onCancel={goToPreviousStep}
                showHeader={false}
              />
            );
            
          case 'schedule_adjustment':
            // For simplicity, we're showing just a text input
            // In a real app, this would be a more complex form
            return (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="new-deadline">New Deadline</Label>
                  <Input
                    id="new-deadline"
                    type="date"
                    value={scheduleAdjustment?.newDueDate?.split('T')[0] || ''}
                    onChange={(e) => {
                      const newDate = e.target.value 
                        ? new Date(e.target.value).toISOString() 
                        : '';
                      
                      setScheduleAdjustment({
                        newDueDate: newDate,
                        affectedContentIds: ['all'],
                        reason: 'Schedule adjustment for better learning progress'
                      });
                    }}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={goToPreviousStep}>
                    Back
                  </Button>
                  
                  <Button 
                    onClick={goToNextStep}
                    disabled={!scheduleAdjustment?.newDueDate}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            );
            
          default:
            return (
              <div className="text-center py-10">
                <p className="text-lg">Set up for {interventionType.replace('_', ' ')} is not implemented in this demo.</p>
                <div className="flex justify-center space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={goToPreviousStep}>
                    Back
                  </Button>
                  
                  <Button onClick={goToNextStep}>
                    Continue Anyway
                  </Button>
                </div>
              </div>
            );
        }
        
      case 'review':
        return (
          <div className="space-y-6">
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Review Intervention Details</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium">Employee:</p>
                    <p>{selectedEmployeeName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Type:</p>
                    <p>{interventionType.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Reason:</p>
                    <p>{reason.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Due Date:</p>
                    <p>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Title:</p>
                  <p>{title}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Description:</p>
                  <p>{description}</p>
                </div>
                
                {/* Type-specific details */}
                {interventionType === 'content_modification' && contentModifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Content Modifications:</p>
                    <p>Modified content for {contentModifications[0].contentId}</p>
                  </div>
                )}
                
                {interventionType === 'resource_assignment' && resourceAssignments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Resource Assignments:</p>
                    <p>{resourceAssignments.length} resources assigned</p>
                  </div>
                )}
                
                {interventionType === 'schedule_adjustment' && scheduleAdjustment && (
                  <div>
                    <p className="text-sm font-medium">Schedule Adjustment:</p>
                    <p>New deadline: {new Date(scheduleAdjustment.newDueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };
  
  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 'type':
        return 'Select Employee & Intervention Type';
      case 'details':
        return 'Intervention Details';
      case 'content':
        return interventionType === 'content_modification' 
          ? 'Modify Content' 
          : interventionType === 'resource_assignment'
            ? 'Assign Resources'
            : interventionType === 'schedule_adjustment'
              ? 'Adjust Schedule'
              : 'Intervention Content';
      case 'review':
        return 'Review & Create';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{getStepTitle()}</CardTitle>
        <CardDescription>
          {currentStep === 'type' && 'Select the employee and type of intervention you want to create.'}
          {currentStep === 'details' && 'Provide basic details about the intervention.'}
          {currentStep === 'content' && 'Configure the specific content for this intervention.'}
          {currentStep === 'review' && 'Review the intervention details before creating it.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Steps Indicator */}
        <div className="flex mb-8">
          {['type', 'details', 'content', 'review'].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : index < ['type', 'details', 'content', 'review'].indexOf(currentStep)
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="text-xs mt-1">{step.charAt(0).toUpperCase() + step.slice(1)}</div>
              </div>
              
              {index < 3 && (
                <div className="flex-1 flex items-center">
                  <div className={`h-0.5 w-full ${
                    index < ['type', 'details', 'content'].indexOf(currentStep)
                      ? 'bg-primary/50'
                      : 'bg-gray-200'
                  }`}></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Step Content */}
        {renderStepContent()}
      </CardContent>
      
      {/* Footer Actions - Only show for steps 'type', 'details', and 'review' */}
      {(currentStep === 'type' || currentStep === 'details' || currentStep === 'review') && (
        <CardFooter className="flex justify-between">
          {currentStep !== 'type' ? (
            <Button type="button" variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          <Button 
            onClick={goToNextStep}
            disabled={
              (currentStep === 'type' && (!selectedEmployee || (useTemplate && !selectedTemplate))) ||
              (currentStep === 'details' && (!title || !description || !reason))
            }
          >
            {currentStep === 'review' ? 'Create Intervention' : 'Continue'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default InterventionCreationWorkflow; 