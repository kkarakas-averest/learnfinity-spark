import React from 'react';
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

// Mock data for key metrics
const keyMetrics = [
  {
    title: "Active Learners",
    value: "248",
    change: "+12 this month",
    trend: "up",
    icon: Users,
  },
  {
    title: "Course Completion",
    value: "62%",
    change: "+4% from last month",
    trend: "up",
    icon: CheckCircle,
  },
  {
    title: "Skill Gaps",
    value: "18",
    change: "-3 this month",
    trend: "down",
    icon: Activity,
  },
  {
    title: "Learning Hours",
    value: "1,845",
    change: "+142 this month",
    trend: "up",
    icon: Clock,
  },
];

// Mock data for recent activity
const recentActivities = [
  {
    type: "enrollment",
    user: "Alex Johnson",
    course: "Introduction to Data Science",
    time: "2 hours ago",
    icon: BookOpen,
  },
  {
    type: "completion",
    user: "Sarah Miller",
    course: "Leadership Fundamentals",
    time: "5 hours ago",
    icon: Award,
  },
  {
    type: "feedback",
    user: "James Wilson",
    course: "Project Management",
    comment: "The real-world examples were very helpful.",
    rating: 4.5,
    time: "Yesterday",
    icon: MessageSquare,
  },
  {
    type: "alert",
    user: "Emma Davis",
    issue: "No activity for 14 days",
    time: "2 days ago",
    icon: AlertTriangle,
  },
];

const DashboardOverview: React.FC = () => {
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
          {keyMetrics.map((metric, index) => (
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
              <Button className="w-full mt-4">Add Employee</Button>
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
              <Button className="w-full mt-4">Assign Courses</Button>
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
              <Button className="w-full mt-4">Generate Report</Button>
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
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 rounded-md bg-secondary/20">
                  <div className={`rounded-full p-2 ${
                    activity.type === 'enrollment' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'completion' ? 'bg-green-100 text-green-600' :
                    activity.type === 'feedback' ? 'bg-purple-100 text-purple-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <activity.icon className="h-4 w-4" />
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
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button variant="outline" className="w-full">View All Activity</Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default DashboardOverview; 