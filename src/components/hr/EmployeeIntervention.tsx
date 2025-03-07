import React, { useState, useEffect } from '@/lib/react-helpers';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Intervention, 
  InterventionInput,
  InterventionStatus
} from '@/types/intervention.types';
import { InterventionService } from '@/services/intervention.service';
import { useToast } from '@/components/ui/use-toast';
import { format, formatDistance } from 'date-fns';
import InterventionCreationWorkflow from './intervention/InterventionCreationWorkflow';
import { FileTextIcon, CalendarIcon, UserIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, PlusIcon, PackageIcon } from '@/components/ui/custom-icons';
import { Badge } from '@/components/ui/badge';

// Mock user ID for the current HR user
const CURRENT_HR_USER_ID = 'hr-001';

/**
 * EmployeeIntervention Component
 * 
 * A dashboard for HR users to manage employee interventions
 */
const EmployeeIntervention: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreationWorkflow, setShowCreationWorkflow] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<InterventionStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { toast } = useToast();
  const interventionService = InterventionService.getInstance();
  
  // Load interventions
  useEffect(() => {
    const loadInterventions = async () => {
      try {
        setLoading(true);
        const data = await interventionService.getInterventions({
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        setInterventions(data);
      } catch (error) {
        console.error('Error loading interventions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load interventions.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadInterventions();
  }, [interventionService, statusFilter, toast]);
  
  // Create new intervention
  const handleCreateIntervention = async (intervention: InterventionInput) => {
    try {
      setLoading(true);
      const createdIntervention = await interventionService.createIntervention(intervention);
      
      setInterventions([createdIntervention, ...interventions]);
      
      toast({
        title: 'Success',
        description: 'Intervention created successfully.',
      });
      
      setShowCreationWorkflow(false);
    } catch (error) {
      console.error('Error creating intervention:', error);
      toast({
        title: 'Error',
        description: 'Failed to create intervention.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update intervention status
  const handleUpdateStatus = async (id: string, status: InterventionStatus) => {
    try {
      const updatedIntervention = await interventionService.updateIntervention(id, { status });
      
      setInterventions(
        interventions.map(intervention => 
          intervention.id === id ? updatedIntervention : intervention
        )
      );
      
      toast({
        title: 'Success',
        description: 'Intervention status updated successfully.',
      });
    } catch (error) {
      console.error('Error updating intervention status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update intervention status.',
        variant: 'destructive',
      });
    }
  };
  
  // Filter and search interventions
  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = 
      intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });
  
  // Get status badge
  const getStatusBadge = (status: InterventionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-gray-100">Pending</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
    }
  };
  
  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content_modification':
        return <FileTextIcon className="h-5 w-5 text-blue-500" />;
      case 'resource_assignment':
        return <PackageIcon className="h-5 w-5 text-purple-500" />;
      case 'schedule_adjustment':
        return <CalendarIcon className="h-5 w-5 text-orange-500" />;
      case 'mentor_assignment':
        return <UserIcon className="h-5 w-5 text-green-500" />;
      case 'feedback_request':
        return <FileTextIcon className="h-5 w-5 text-teal-500" />;
      default:
        return <FileTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get RAG status icon
  const getRagStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'amber':
        return <AlertTriangleIcon className="h-4 w-4 text-amber-500" />;
      case 'red':
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Get relative time
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Interventions</h1>
          <p className="text-muted-foreground">
            Create and manage interventions to help employees who need additional support.
          </p>
        </div>
        
        <Button onClick={() => setShowCreationWorkflow(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create Intervention
        </Button>
      </div>
      
      {showCreationWorkflow ? (
        <InterventionCreationWorkflow
          onCreated={handleCreateIntervention}
          onCancel={() => setShowCreationWorkflow(false)}
          hrUserId={CURRENT_HR_USER_ID}
        />
      ) : (
        <>
          <div className="flex justify-between">
            <Tabs 
              defaultValue="all" 
              className="w-[400px]"
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as InterventionStatus | 'all')}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="w-[300px]">
              <Input
                placeholder="Search interventions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInterventions.length === 0 ? (
            <div className="text-center py-10 border rounded-md">
              <h3 className="text-lg font-medium">No interventions found</h3>
              <p className="text-muted-foreground mt-1">
                {statusFilter !== 'all' 
                  ? `There are no ${statusFilter} interventions.` 
                  : 'There are no interventions matching your filters.'}
              </p>
              <Button className="mt-4" onClick={() => setShowCreationWorkflow(true)}>
                <PlusIcon className="mr-2 h-4 w-4" /> Create Intervention
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredInterventions.map(intervention => (
                <Card key={intervention.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {getTypeIcon(intervention.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{intervention.title}</h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <span className="flex items-center mr-3">
                                {getRagStatusIcon(intervention.ragStatusAtCreation)}
                                <span className="ml-1 capitalize">{intervention.ragStatusAtCreation}</span>
                              </span>
                              
                              <span className="mr-3">
                                Type: <span className="capitalize">{intervention.type.replace('_', ' ')}</span>
                              </span>
                              
                              <span>
                                Created: {getRelativeTime(intervention.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(intervention.status)}
                            
                            {intervention.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(intervention.id, 'active')}
                              >
                                Start
                              </Button>
                            )}
                            
                            {intervention.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(intervention.id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <p className="mt-2">{intervention.description}</p>
                        
                        {intervention.dueDate && (
                          <div className="mt-2 flex items-center text-sm">
                            <ClockIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>Due: {formatDate(intervention.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeIntervention; 