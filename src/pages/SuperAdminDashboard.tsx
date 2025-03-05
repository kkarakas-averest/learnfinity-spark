
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Building, 
  GraduationCap, 
  BrainCircuit, 
  Clock, 
  ArrowUpRight,
  Shield,
  AlertTriangle 
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgressIndicator from "@/components/ProgressIndicator";

// Mock data
const mockStats = [
  {
    title: "Total Organizations",
    value: "24",
    change: "+3 this month",
    trend: "up",
    icon: Building,
  },
  {
    title: "Active Learners",
    value: "4,328",
    change: "+258 this week",
    trend: "up",
    icon: Users,
  },
  {
    title: "Course Completion",
    value: "68%",
    change: "+5% from last month",
    trend: "up",
    icon: GraduationCap,
  },
  {
    title: "AI Responses",
    value: "18,945",
    change: "98.7% accuracy rate",
    trend: "up",
    icon: BrainCircuit,
  },
];

const mockRecentActivities = [
  {
    action: "New organization onboarded",
    details: "TechCorp Inc. was added by admin",
    time: "2 hours ago",
    icon: Building,
  },
  {
    action: "AI Model updated",
    details: "Performance tuning for course recommendations",
    time: "5 hours ago",
    icon: BrainCircuit,
  },
  {
    action: "New HR admin added",
    details: "Jane Doe was promoted to HR admin at GlobalTech",
    time: "Yesterday",
    icon: Users,
  },
  {
    action: "System maintenance completed",
    details: "Database optimization and security updates",
    time: "2 days ago",
    icon: Shield,
  },
];

const mockSystemAlerts = [
  {
    title: "High server load detected",
    details: "Resource utilization above 85% for 30 minutes",
    severity: "medium",
    time: "45 minutes ago",
  },
  {
    title: "Multiple failed login attempts",
    details: "10+ failed attempts from IP 192.168.1.34",
    severity: "high",
    time: "2 hours ago",
  },
  {
    title: "Storage approaching capacity",
    details: "File storage at 78% capacity",
    severity: "low",
    time: "1 day ago",
  },
];

const mockOrganizations = [
  {
    name: "TechCorp Solutions",
    users: 324,
    completionRate: 72,
    status: "active",
  },
  {
    name: "GlobalTech Industries",
    users: 518,
    completionRate: 65,
    status: "active",
  },
  {
    name: "Innovate Learning Ltd",
    users: 127,
    completionRate: 81,
    status: "active",
  },
  {
    name: "Future Academy",
    users: 203,
    completionRate: 59,
    status: "trial",
  },
];

const SuperAdminDashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      if (user.role !== "superadmin") {
        navigate("/login");
      }
    } catch (error) {
      console.error("Failed to parse user data", error);
      navigate("/login");
    }
  }, [navigate]);

  if (!userRole) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide overview and management
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs mt-1 ${
                  stat.trend === "up" 
                    ? "text-green-600" 
                    : stat.trend === "down" 
                    ? "text-red-600" 
                    : "text-muted-foreground"
                }`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Platform Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="system">System Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest actions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="bg-secondary rounded-full p-2">
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{activity.action}</h4>
                        <p className="text-xs text-muted-foreground">{activity.details}</p>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View all activity
                </Button>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Security and performance notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSystemAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className={`rounded-full p-2 ${
                        alert.severity === "high" 
                          ? "bg-red-100 text-red-600" 
                          : alert.severity === "medium"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <p className="text-xs text-muted-foreground">{alert.details}</p>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {alert.time}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View all alerts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Organizations</CardTitle>
                  <Button size="sm" className="gap-1">
                    <span>Add Organization</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Organizations using the learning platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-3 text-sm font-medium text-muted-foreground bg-secondary/50">
                    <div>Organization</div>
                    <div className="text-center">Users</div>
                    <div className="text-center">Completion Rate</div>
                    <div className="text-center">Status</div>
                  </div>
                  {mockOrganizations.map((org, index) => (
                    <div key={index} className="grid grid-cols-4 p-3 text-sm border-t items-center">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-center">{org.users}</div>
                      <div className="text-center">
                        <ProgressIndicator 
                          progress={org.completionRate} 
                          size="sm" 
                          showLabel={false} 
                          className="w-24 mx-auto" 
                        />
                      </div>
                      <div className="text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          org.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {org.status === "active" ? "Active" : "Trial"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View all organizations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Server CPU Usage</span>
                        <span className="text-sm font-medium">48%</span>
                      </div>
                      <ProgressIndicator progress={48} size="sm" showLabel={false} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Memory Usage</span>
                        <span className="text-sm font-medium">62%</span>
                      </div>
                      <ProgressIndicator progress={62} size="sm" showLabel={false} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Database Load</span>
                        <span className="text-sm font-medium">34%</span>
                      </div>
                      <ProgressIndicator progress={34} size="sm" showLabel={false} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Storage Space</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <ProgressIndicator progress={78} size="sm" showLabel={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Response Accuracy</span>
                        <span className="text-sm font-medium">98.7%</span>
                      </div>
                      <ProgressIndicator progress={98.7} size="sm" showLabel={false} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Content Generation</span>
                        <span className="text-sm font-medium">92.4%</span>
                      </div>
                      <ProgressIndicator progress={92.4} size="sm" showLabel={false} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Average Response Time</span>
                        <span className="text-sm font-medium">1.2s</span>
                      </div>
                      <ProgressIndicator progress={80} size="sm" showLabel={false} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Uptime</span>
                        <span className="text-sm font-medium">99.98%</span>
                      </div>
                      <ProgressIndicator progress={99.98} size="sm" showLabel={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
