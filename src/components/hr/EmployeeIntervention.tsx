import React from "@/lib/react-helpers";
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee, Intervention, RAGStatus } from "@/types/hr.types";
import { hrServices } from "@/lib/services/hrServices";

// Define a type that includes the methods we're using
type HRServicesExtended = typeof hrServices & {
  createIntervention: (data: {
    employeeId: string;
    type: Intervention['type'];
    notes: string;
    content: string;
  }) => Promise<{ success: boolean; intervention?: any; error?: string }>;
  
  updateEmployeeRAGStatus: (
    employeeId: string,
    ragDetails: {
      status: RAGStatus;
      justification: string;
      updatedBy?: string;
      recommendedActions?: string[];
    }
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
};

// Cast the imported hrServices to our extended type
const hrServicesExtended = hrServices as HRServicesExtended;

interface EmployeeInterventionProps {
  employee: Employee;
  onInterventionComplete: () => void;
}

const EmployeeIntervention: React.FC<EmployeeInterventionProps> = ({ 
  employee, 
  onInterventionComplete 
}) => {
  const { toast } = useToast();
  const [interventionType, setInterventionType] = React.useState<Intervention['type']>('content_modification');
  const [notes, setNotes] = React.useState('');
  const [content, setContent] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [manualStatus, setManualStatus] = React.useState<RAGStatus>(employee.ragStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create intervention record
      const interventionResult = await hrServicesExtended.createIntervention({
        employeeId: employee.id,
        type: interventionType,
        notes,
        content,
      });

      if (!interventionResult.success) {
        throw new Error(interventionResult.error || 'Failed to create intervention');
      }

      // Update RAG status if changed
      if (manualStatus !== employee.ragStatus) {
        const statusResult = await hrServicesExtended.updateEmployeeRAGStatus(employee.id, {
          status: manualStatus,
          justification: `Manual override by HR: ${notes}`,
          updatedBy: 'hr_user', // In a real implementation, this would be the actual HR user ID
        });

        if (!statusResult.success) {
          throw new Error(statusResult.error || 'Failed to update RAG status');
        }
      }

      toast({
        title: "Intervention Created",
        description: "The intervention has been successfully created and notifications sent.",
      });

      onInterventionComplete();
    } catch (error) {
      console.error("Error creating intervention:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Intervention</CardTitle>
        <CardDescription>
          Create an intervention for {employee.name} who is currently flagged as{" "}
          <span className={`font-bold ${
            employee.ragStatus === 'red' ? 'text-red-500' : 
            employee.ragStatus === 'amber' ? 'text-amber-500' : 
            'text-green-500'
          }`}>
            {employee.ragStatus.toUpperCase()}
          </span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Intervention Type</label>
            <Select
              value={interventionType}
              onValueChange={(value) => setInterventionType(value as Intervention['type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intervention type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content_modification">Content Modification</SelectItem>
                <SelectItem value="remedial_assignment">Remedial Assignment</SelectItem>
                <SelectItem value="notification">Notification Only</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Override RAG Status (Optional)</label>
            <Select
              value={manualStatus}
              onValueChange={(value) => setManualStatus(value as RAGStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="green">Green (On Track)</SelectItem>
                <SelectItem value="amber">Amber (Needs Attention)</SelectItem>
                <SelectItem value="red">Red (Urgent Intervention)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {interventionType === 'content_modification' || interventionType === 'remedial_assignment' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Content / Assignment</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the content modification or provide assignment details..."
                rows={4}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this intervention..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onInterventionComplete}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Create Intervention"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmployeeIntervention; 