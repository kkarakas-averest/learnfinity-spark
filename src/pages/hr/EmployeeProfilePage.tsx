
import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';
import { 
  User, Mail, Phone, Building, Calendar, Award, 
  FileText, BarChart, Loader2
} from 'lucide-react';
import EmployeeProfileSummary from '@/components/hr/EmployeeProfileSummary';
import RAGStatusBadge from '@/components/hr/RAGStatusBadge';
import RAGStatusHistory from '@/components/hr/RAGStatusHistory';
import { useHRAuth } from '@/state';

const EmployeeProfilePage = () => {
  const { employeeId } = useParams();
  const { toast } = useToast();
  const { hrUser } = useHRAuth();
  
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeUrl, setResumeUrl] = useState('');

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        setError('Employee ID is missing');
        setLoading(false);
        return;
      }

      try {
        // Fetch the employee data
        const { data, error } = await supabase
          .from('hr_employees')
          .select(`
            *,
            hr_departments (id, name),
            hr_positions (id, title),
            manager:manager_id (id, name, email)
          `)
          .eq('id', employeeId)
          .single();

        if (error) {
          console.error('Error fetching employee data:', error);
          setError(`Failed to load employee data: ${error.message}`);
          toast({
            title: 'Error',
            description: 'Failed to load employee data',
            variant: 'destructive',
          });
        } else if (data) {
          setEmployeeData(data);
          
          // If resume_url exists, set it
          if (data.resume_url || data.cv_file_url) {
            setResumeUrl(data.resume_url || data.cv_file_url || '');
          }
        } else {
          setError('Employee not found');
          toast({
            title: 'Error',
            description: 'Employee not found',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Exception fetching employee:', err);
        setError(`An unexpected error occurred: ${err.message}`);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while loading employee data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId, toast]);

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <div className="md:col-span-2">
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !employeeData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Failed to load employee profile'}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formatted data
  const department = employeeData.hr_departments?.name || 'Not assigned';
  const position = employeeData.hr_positions?.title || 'Not assigned';
  const manager = employeeData.manager || null;
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{employeeData.name}</h1>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="outline">{position}</Badge>
          <Badge variant="outline">{department}</Badge>
          <RAGStatusBadge status={employeeData.rag_status || 'green'} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{employeeData.email}</p>
                </div>
              </div>
              
              {/* Phone */}
              {employeeData.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{employeeData.phone}</p>
                  </div>
                </div>
              )}
              
              {/* Department */}
              <div className="flex items-start">
                <Building className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">{department}</p>
                </div>
              </div>
              
              {/* Position */}
              <div className="flex items-start">
                <Award className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Position</p>
                  <p className="text-sm text-muted-foreground">{position}</p>
                </div>
              </div>
              
              {/* Hire Date */}
              {employeeData.hire_date && (
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Hire Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(employeeData.hire_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Manager */}
              {manager && (
                <div className="flex items-start">
                  <User className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Manager</p>
                    <p className="text-sm text-muted-foreground">{manager.name}</p>
                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                  </div>
                </div>
              )}
              
              {/* Resume Link */}
              {resumeUrl && (
                <div className="flex items-start">
                  <FileText className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Resume</p>
                    <a 
                      href={resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Resume
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Skills Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {employeeData.skills && employeeData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {employeeData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </CardContent>
          </Card>
          
          {/* RAG Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RAG Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <RAGStatusHistory employeeId={employeeId} />
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Employee overview will be displayed here.</p>
                  
                  {/* CV Extracted Data */}
                  {employeeData.cv_extracted_data && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Resume Highlights</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <pre className="whitespace-pre-wrap text-sm">
                          {JSON.stringify(employeeData.cv_extracted_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="learning" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Learning data will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activities" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Activities will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assessments" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Assessments will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfilePage;
