import * as React from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import hrEmployeeService from '@/services/hrEmployeeService';
import { hrServices } from '@/services/hrServices';

const DashboardOverview: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [keyMetricsData, setKeyMetricsData] = React.useState([]);
  const [recentActivities, setRecentActivities] = React.useState([]);

  React.useEffect(() => {
    // Fetch data when component mounts
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch key metrics data
        const metrics = await hrServices.getDashboardMetrics();
        if (metrics) {
          setKeyMetricsData([
            {
              title: "Active Learners",
              value: metrics.activeEmployees.toString(),
              change: `${metrics.newEmployees > 0 ? '+' : ''}${metrics.newEmployees} this month`,
              trend: metrics.newEmployees >= 0 ? "up" : "down",
              icon: Users,
            },
            {
              title: "Course Completion",
              value: `${metrics.completionRate}%`,
              change: `${metrics.completionRateChange >= 0 ? '+' : ''}${metrics.completionRateChange}% from last month`,
              trend: metrics.completionRateChange >= 0 ? "up" : "down",
              icon: CheckCircle,
            },
            {
              title: "Skill Gaps",
              value: metrics.skillGaps.toString(),
              change: `${metrics.skillGapsChange >= 0 ? '+' : ''}${metrics.skillGapsChange} this month`,
              trend: metrics.skillGapsChange <= 0 ? "up" : "down", // Fewer skill gaps is positive
              icon: Activity,
            },
            {
              title: "Learning Hours",
              value: metrics.learningHours.toLocaleString(),
              change: `${metrics.learningHoursChange >= 0 ? '+' : ''}${metrics.learningHoursChange} this month`,
              trend: metrics.learningHoursChange >= 0 ? "up" : "down",
              icon: Clock,
            },
          ]);
        }
        
        // Fetch recent activities
        const activities = await hrServices.getRecentActivities();
        if (activities && activities.length > 0) {
          setRecentActivities(activities);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization's learning initiatives
        </p>
      </div>

      {/* Key Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyMetricsData.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className={`text-xs mt-1 ${
                  metric.trend === "up" 
                    ? "text-green-600" 
                    : metric.trend === "down" 
                    ? "text-red-600" 
                    : "text-muted-foreground"
                }`}>
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Add Employee</h3>
                  <p className="text-sm text-muted-foreground">Onboard new team members</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4"
                onClick={() => window.location.href = '/hr-dashboard/employees/new'}
              >
                Add Employee
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Assign Courses</h3>
                  <p className="text-sm text-muted-foreground">Set learning paths for employees</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4"
                onClick={() => window.location.href = '/hr-dashboard/courses'}
              >
                Assign Courses
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Generate Report</h3>
                  <p className="text-sm text-muted-foreground">Create learning analytics reports</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4"
                onClick={() => window.location.href = '/hr-dashboard/reports'}
              >
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardHeader>
            <CardTitle>Learning Activity</CardTitle>
            <CardDescription>Recent enrollments, completions, and feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 rounded-md bg-secondary/20">
                    <div className={`rounded-full p-2 ${
                      activity.type === 'enrollment' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'completion' ? 'bg-green-100 text-green-600' :
                      activity.type === 'feedback' ? 'bg-purple-100 text-purple-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {activity.type === 'enrollment' && <BookOpen className="h-4 w-4" />}
                      {activity.type === 'completion' && <Award className="h-4 w-4" />}
                      {activity.type === 'feedback' && <MessageSquare className="h-4 w-4" />}
                      {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{activity.user}</div>
                        <Badge variant="outline" className="text-xs">
                          {activity.time}
                        </Badge>
                      </div>
                      {activity.type === 'enrollment' && (
                        <p className="text-sm mt-1">Enrolled in <span className="font-medium">{activity.course}</span></p>
                      )}
                      {activity.type === 'completion' && (
                        <p className="text-sm mt-1">Completed <span className="font-medium">{activity.course}</span></p>
                      )}
                      {activity.type === 'feedback' && (
                        <div className="mt-1">
                          <p className="text-sm">Rated <span className="font-medium">{activity.course}</span> ({activity.rating}/5)</p>
                          <p className="text-sm text-muted-foreground mt-1">"{activity.comment}"</p>
                        </div>
                      )}
                      {activity.type === 'alert' && (
                        <p className="text-sm mt-1 text-amber-700">{activity.issue}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent activities to display</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/hr-dashboard/activities'}
            >
              View All Activity
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default DashboardOverview; 