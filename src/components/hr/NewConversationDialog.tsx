import React from '@/lib/react-helpers';
import { useState, useEffect } from '@/lib/react-helpers';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';

interface Employee {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image?: string;
  department?: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (employeeId: string, initialMessage?: string) => void;
}

const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
  onCreateConversation,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState('');

  // Fetch employees from the database
  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('id, name, first_name, last_name, email, profile_image, department')
        .order('name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => {
    const fullName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`;
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (employee.department && employee.department.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleStartConversation = () => {
    if (!selectedEmployeeId) {
      toast({
        title: 'Employee required',
        description: 'Please select an employee to start a conversation',
        variant: 'destructive',
      });
      return;
    }

    onCreateConversation(selectedEmployeeId, initialMessage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a new conversation with an employee
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="employee-search">Search Employee</Label>
            <Input
              id="employee-search"
              placeholder="Search by name, email or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            
            <div className="border rounded-md max-h-[200px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading employees...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No employees found
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmployees.map((employee) => {
                    const fullName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`;
                    return (
                      <button
                        key={employee.id}
                        type="button"
                        className={`flex items-center w-full p-3 text-left hover:bg-accent transition-colors ${
                          selectedEmployeeId === employee.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedEmployeeId(employee.id)}
                      >
                        <Avatar className="h-8 w-8 mr-3">
                          {employee.profile_image ? (
                            <AvatarImage src={employee.profile_image} alt={fullName} />
                          ) : (
                            <AvatarFallback>
                              {fullName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {employee.email} {employee.department && `• ${employee.department}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="initial-message">Initial Message (Optional)</Label>
            <Textarea
              id="initial-message"
              placeholder="Enter your first message..."
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartConversation}
            disabled={!selectedEmployeeId}
          >
            Start Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog; 