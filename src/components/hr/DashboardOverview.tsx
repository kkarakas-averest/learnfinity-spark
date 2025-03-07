import React from '@/lib/react-helpers';
import { 
  Users, 
  BookOpen, 
  BarChart2,
  Clock,
  UserPlus,
  FileText,
  Activity,
  AlertTriangle,
  Award,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';
import { hrServices } from '@/lib/services/hrServices';

// Define an extended type for hrServices
type HRServicesExtended = typeof hrServices & {
  getRecentActivities: () => Promise<any[]>;
  getEmployeesByRAGStatus: (status: string) => Promise<{ success: boolean; employees: any[] }>;
  getEmployeeCountByRAGStatus: (status: string) => Promise<number>;
};

// Cast the imported hrServices to our extended type
const hrServicesExtended = hrServices as HRServicesExtended;

const DashboardOverview: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [keyMetricsData, setKeyMetricsData] = React.useState([]);
  const [recentActivities, setRecentActivities] = React.useState([]);
  const [ragSummary, setRagSummary] = React.useState({
    green: 0,
    amber: 0,
    red: 0,
    total: 0
  });

  React.useEffect(() => {
    // Fetch data when component mounts
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch key metrics data
        const metrics = await hrServicesExtended.getDashboardMetrics();
        if (metrics && metrics.success && metrics.metrics) {
          setKeyMetricsData([
            {
              title: "Active Learners",
              value: metrics.metrics.activeEmployees.toString(),
              change: `${metrics.metrics.newEmployees > 0 ? '+' : ''}${metrics.metrics.newEmployees} this month`,
              trend: metrics.metrics.newEmployees >= 0 ? "up" : "down",
              icon: Users,
            },
            {
              title: "Course Completion",
              value: `${metrics.metrics.completionRate}%`,
              change: `${metrics.metrics.completionRateChange >= 0 ? '+' : ''}${metrics.metrics.completionRateChange}% from last month`,
              trend: metrics.metrics.completionRateChange >= 0 ? "up" : "down",
              icon: CheckCircle,
            },
            {
              title: "Average Engagement",
              value: `${metrics.metrics.averageEngagement}%`,
              change: `${metrics.metrics.engagementChange >= 0 ? '+' : ''}${metrics.metrics.engagementChange}% from last month`,
              trend: metrics.metrics.engagementChange >= 0 ? "up" : "down",
              icon: Activity,
            },
            {
              title: "Courses Assigned",
              value: metrics.metrics.coursesAssigned.toString(),
              change: `${metrics.metrics.newCoursesAssigned > 0 ? '+' : ''}${metrics.metrics.newCoursesAssigned} this month`,
              trend: metrics.metrics.newCoursesAssigned >= 0 ? "up" : "down",
              icon: BookOpen,
            }
          ]);
          
          // Set RAG summary data if available
          if (metrics.metrics.ragStatusCounts) {
            setRagSummary({
              green: metrics.metrics.ragStatusCounts.green || 0,
              amber: metrics.metrics.ragStatusCounts.amber || 0,
              red: metrics.metrics.ragStatusCounts.red || 0,
              total: metrics.metrics.ragStatusCounts.total || 0
            });
          }
        }
        
        // Fetch recent activities
        const activities = await hrServicesExtended.getRecentActivities();
        if (activities && activities.length > 0) {
          setRecentActivities(activities);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [toast]);
  
  // Function to navigate to employees filtered by RAG status
  const viewEmployeesByStatus = (status) => {
    // This will be implemented to navigate to the employees tab with a filter
    console.log(`Viewing employees with ${status} status`);
    // For example: navigate('/hr-dashboard?tab=employees&status=' + status);
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      
      {/* RAG Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded-full bg-green-500"></div>
              <div className="text-2xl font-bold">{ragSummary.green}</div>
              <div className="ml-2 text-sm text-muted-foreground">
                ({Math.round((ragSummary.green / (ragSummary.total || 1)) * 100)}%)
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600 hover:text-green-800"
              onClick={() => viewEmployeesByStatus('green')}
            >
              View Employees
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded-full bg-amber-500"></div>
              <div className="text-2xl font-bold">{ragSummary.amber}</div>
              <div className="ml-2 text-sm text-muted-foreground">
                ({Math.round((ragSummary.amber / (ragSummary.total || 1)) * 100)}%)
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-amber-600 hover:text-amber-800"
              onClick={() => viewEmployeesByStatus('amber')}
            >
              View Employees
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees Requiring Intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 rounded-full bg-red-500"></div>
              <div className="text-2xl font-bold">{ragSummary.red}</div>
              <div className="ml-2 text-sm text-muted-foreground">
                ({Math.round((ragSummary.red / (ragSummary.total || 1)) * 100)}%)
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-800"
              onClick={() => viewEmployeesByStatus('red')}
            >
              View Employees
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Alert for Red status employees */}
      {ragSummary.red > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Urgent Attention Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{ragSummary.red} employee(s) are flagged as requiring immediate intervention.</span>
            <Button variant="outline" size="sm" onClick={() => viewEmployeesByStatus('red')}>
              View Employees
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Original key metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetricsData.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon && <metric.icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Recent Activity Section */}
      <h3 className="text-xl font-semibold mt-8 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <span className="rounded-full p-2 bg-primary/10">
                    {activity.type === 'enrollment' ? (
                      <UserPlus className="h-4 w-4 text-primary" />
                    ) : activity.type === 'completion' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : activity.type === 'achievement' ? (
                      <Award className="h-4 w-4 text-amber-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                      <span className="mx-1 text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">No recent activities found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
