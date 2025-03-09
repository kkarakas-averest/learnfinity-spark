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
  ContentModification,
  ResourceAssignment,
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
    reasonForUse: 'Poor performance and progress slowdown',
    contentTemplate: 'We have noticed that you are having some difficulty with the course material. This personalized plan is designed to help you overcome these challenges.'
  },
  {
    id: '2',
    name: 'Additional Resources Package',
    description: 'Supplementary materials for employees who need more context',
    type: 'resource_assignment' as InterventionType,
    reasonForUse: 'Low engagement and poor performance',
    resourceIds: ['r1', 'r2', 'r3']
  },
  {
    id: '3',
    name: 'Deadline Extension',
    description: 'Extended timeline for course completion',
    type: 'schedule_adjustment' as InterventionType,
    reasonForUse: 'Progress slowdown and employee request',
    contentTemplate: 'We have adjusted your deadline to provide more time for completion.'
  },
  {
    id: '4',
    name: 'Mentor Support Program',
    description: 'One-on-one guidance with an experienced mentor',
    type: 'mentor_assignment' as InterventionType,
    reasonForUse: 'RAG status change and poor performance',
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
  const [reason, setReason] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Specific intervention details
  const [contentModifications, setContentModifications] = useState<ContentModification[]>([]);
  const [resourceAssignments, setResourceAssignments] = useState<ResourceAssignment[]>([]);
  // Use any type for features not yet supported in the type system
  const [scheduleAdjustment, setScheduleAdjustment] = useState<any | undefined>();
  const [mentorAssignment, setMentorAssignment] = useState<any | undefined>();
  const [feedbackRequest, setFeedbackRequest] = useState<any | undefined>();
  
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
      setDescription(template.description);
      setReason(template.reasonForUse);
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
      reason,
      title,
      description
    };
    
    // Add due date if provided
    if (dueDate) {
      intervention.dueDate = new Date(dueDate).toISOString();
    }
    
    // Add notes if provided
    if (notes) {
      intervention.notes = notes;
    }
    
    // Add intervention-specific details based on type
    switch (interventionType) {
      case 'content_modification':
        intervention.contentModifications = contentModifications;
        break;
      case 'resource_assignment':
        intervention.resourceAssignments = resourceAssignments;
        break;
      // Other types don't have specific properties in InterventionInput yet
      case 'schedule_adjustment':
      case 'mentor_assignment':
      case 'feedback_request':
        // Store data in notes field for now
        if (!intervention.notes) intervention.notes = '';
        intervention.notes += `Additional data for ${interventionType} is available but not supported in the current data model.`;
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
              <Select value={reason} onValueChange={(value) => setReason(value)}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RAG Status Change">RAG Status Change</SelectItem>
                  <SelectItem value="Progress Slowdown">Progress Slowdown</SelectItem>
                  <SelectItem value="Low Engagement">Low Engagement</SelectItem>
                  <SelectItem value="Poor Performance">Poor Performance</SelectItem>
                  <SelectItem value="Employee Request">Employee Request</SelectItem>
                  <SelectItem value="Periodic Review">Periodic Review</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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

            <div className="space-y-1">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this intervention"
                rows={3}
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
                    <p>{reason}</p>
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
                
                {notes && (
                  <div>
                    <p className="text-sm font-medium">Additional Notes:</p>
                    <p>{notes}</p>
                  </div>
                )}
                
                {/* Show specific details based on intervention type */}
                {interventionType === 'content_modification' && contentModifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Content Modifications:</p>
                    <div className="border rounded p-2 mt-1 text-sm">
                      <p><span className="font-medium">Content:</span> {contentModifications[0].contentType} - {contentModifications[0].contentId}</p>
                      <p className="mt-1"><span className="font-medium">Reason:</span> {contentModifications[0].reason}</p>
                    </div>
                  </div>
                )}
                
                {interventionType === 'resource_assignment' && resourceAssignments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Resource Assignments:</p>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {resourceAssignments.map((resource, index) => (
                        <li key={index} className="mb-1">{resource.resourceName} ({resource.resourceType})</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {interventionType === 'schedule_adjustment' && scheduleAdjustment && (
                  <div>
                    <p className="text-sm font-medium">Schedule Adjustment:</p>
                    <p className="text-sm">New deadline: {new Date(scheduleAdjustment.newDueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              By creating this intervention, notifications will be sent to relevant stakeholders and it will be logged in the system.
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Get title and description for current step
  const getStepTitle = () => {
    switch (currentStep) {
      case 'type':
        return {
          title: 'Select Employee and Intervention Type',
          description: 'Choose the employee and the type of intervention you want to create'
        };
      case 'details':
        return {
          title: 'Intervention Details',
          description: 'Provide general information about this intervention'
        };
      case 'content':
        return {
          title: `Configure ${interventionType.replace('_', ' ')}`,
          description: 'Set up the specifics for this intervention type'
        };
      case 'review':
        return {
          title: 'Review and Create',
          description: 'Review the intervention details before submitting'
        };
      default:
        return {
          title: '',
          description: ''
        };
    }
  };
  
  const stepInfo = getStepTitle();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{stepInfo.title}</CardTitle>
        <CardDescription>{stepInfo.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {renderStepContent()}
      </CardContent>
      
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
        
        {currentStep !== 'content' && (
          <Button 
            onClick={goToNextStep}
            disabled={
              (currentStep === 'type' && !selectedEmployee) ||
              (currentStep === 'details' && (!title || !description || !reason))
            }
          >
            {currentStep === 'review' ? 'Create Intervention' : 'Continue'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default InterventionCreationWorkflow; 