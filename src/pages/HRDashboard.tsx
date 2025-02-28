import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  Upload,
  UserPlus,
  Search,
  Download,
  Bot
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ProgressIndicator from "@/components/ProgressIndicator";
import AgentStatusPanel from "@/components/dashboard/AgentStatusPanel";

// Mock data
const mockStats = [
  {
    title: "Total Employees",
    value: "248",
    change: "+12 this month",
    trend: "up",
    icon: Users,
  },
  {
    title: "Active Courses",
    value: "16",
    change: "+3 this week",
    trend: "up",
    icon: BookOpen,
  },
  {
    title: "Completion Rate",
    value: "62%",
    change: "+4% from last month",
    trend: "up",
    icon: BarChart3,
  },
  {
    title: "Learning Hours",
    value: "1,845",
    change: "+142 this month",
    trend: "up",
    icon: Clock,
  },
];

const mockEmployees = [
  {
    name: "Alex Johnson",
    email: "alex.j@techcorp.com",
    department: "Engineering",
    courses: 4,
    progress: 75,
    status: "active",
  },
  {
    name: "Sarah Miller",
    email: "sarah.m@techcorp.com",
    department: "Product",
    courses: 3,
    progress: 42,
    status: "active",
  },
  {
    name: "James Wilson",
    email: "james.w@techcorp.com",
    department: "Marketing",
    courses: 2,
    progress: 89,
    status: "active",
  },
  {
    name: "Emma Davis",
    email: "emma.d@techcorp.com",
    department: "HR",
    courses: 5,
    progress: 34,
    status: "active",
  },
];

const mockDepartments = [
  {
    name: "Engineering",
    employees: 84,
    activeCourses: 8,
    completionRate: 68,
  },
  {
    name: "Marketing",
    employees: 42,
    activeCourses: 5,
    completionRate: 74,
  },
  {
    name: "Product",
    employees: 36,
    activeCourses: 6,
    completionRate: 59,
  },
  {
    name: "Sales",
    employees: 53,
    activeCourses: 4,
    completionRate: 45,
  },
  {
    name: "HR",
    employees: 15,
    activeCourses: 7,
    completionRate: 81,
  },
];

const HRDashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      if (user.role !== "hr") {
        navigate("/login");
      }
    } catch (error) {
      console.error("Failed to parse user data", error);
      navigate("/login");
    }
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const filteredEmployees = mockEmployees.filter(
    employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userRole) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's learning initiatives
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

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="import">Onboarding</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Employee Management</CardTitle>
                    <CardDescription>View and manage employees and their learning progress</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1">
                    <UserPlus className="h-4 w-4" />
                    <span>Add Employee</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search employees..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="grid grid-cols-1 md:grid-cols-6 p-3 text-sm font-medium text-muted-foreground bg-secondary/50">
                    <div className="md:col-span-2">Employee</div>
                    <div className="hidden md:block">Department</div>
                    <div className="hidden md:block text-center">Courses</div>
                    <div className="hidden md:block text-center">Progress</div>
                    <div className="hidden md:block text-center">Actions</div>
                  </div>
                  
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-6 p-3 text-sm border-t items-center">
                        <div className="md:col-span-2">
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden mt-1">{employee.department}</div>
                          <div className="text-xs text-muted-foreground">{employee.email}</div>
                          <div className="flex items-center mt-2 md:hidden">
                            <div className="text-xs mr-4">
                              <span className="font-medium">{employee.courses}</span> courses
                            </div>
                            <ProgressIndicator 
                              progress={employee.progress} 
                              size="sm" 
                              showLabel={false}
                              className="flex-1" 
                            />
                          </div>
                        </div>
                        <div className="hidden md:block">{employee.department}</div>
                        <div className="hidden md:block text-center">{employee.courses}</div>
                        <div className="hidden md:block text-center">
                          <ProgressIndicator 
                            progress={employee.progress} 
                            size="sm" 
                            showLabel={false} 
                            className="w-full" 
                          />
                        </div>
                        <div className="hidden md:flex justify-center mt-2 md:mt-0">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No employees match your search criteria
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredEmployees.length} of {mockEmployees.length} employees
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  <span>Export to CSV</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Learning metrics by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-3 text-sm font-medium text-muted-foreground bg-secondary/50">
                    <div>Department</div>
                    <div className="text-center">Employees</div>
                    <div className="text-center">Courses</div>
                    <div className="text-center">Completion</div>
                  </div>
                  {mockDepartments.map((dept, index) => (
                    <div key={index} className="grid grid-cols-4 p-3 text-sm border-t items-center">
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-center">{dept.employees}</div>
                      <div className="text-center">{dept.activeCourses}</div>
                      <div className="text-center">
                        <ProgressIndicator 
                          progress={dept.completionRate} 
                          size="sm" 
                          showLabel={false} 
                          className="w-24 mx-auto" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Employee Onboarding</CardTitle>
                <CardDescription>Import employees and assign courses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/30 border rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">Upload Employee CSV</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import multiple employees at once using a CSV file
                    </p>
                    
                    <div className="space-y-4 w-full max-w-md">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/70">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">CSV (MAX. 10MB)</p>
                          </div>
                          <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      
                      {csvFile && (
                        <div className="flex items-center justify-between p-2 bg-secondary rounded-md">
                          <span className="text-sm truncate">{csvFile.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setCsvFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="assign-default" />
                          <Label htmlFor="assign-default">
                            Assign default learning paths based on role
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox id="send-invite" defaultChecked />
                          <Label htmlFor="send-invite">
                            Send email invitations to new employees
                          </Label>
                        </div>
                      </div>
                      
                      <Button className="w-full" disabled={!csvFile}>
                        Import Employees
                      </Button>
                    </div>
                    
                    <div className="mt-4 text-xs text-muted-foreground">
                      <a href="#" className="text-primary underline">Download sample CSV template</a>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-px flex-1 bg-border"></div>
                  <span className="px-4 text-xs text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manual-name">Employee Name</Label>
                    <Input id="manual-name" placeholder="John Doe" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="manual-email">Work Email</Label>
                    <Input id="manual-email" type="email" placeholder="john.doe@company.com" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="manual-department">Department</Label>
                    <Input id="manual-department" placeholder="Engineering" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="manual-role">Job Role</Label>
                    <Input id="manual-role" placeholder="Software Engineer" />
                  </div>
                  
                  <Button>Add Employee & Send Invitation</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <AgentStatusPanel />
            
            <Card>
              <CardHeader>
                <CardTitle>AI Agent Management</CardTitle>
                <CardDescription>Configure and control AI agents in your learning environment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Personalization Agent</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Customizes learning content based on employee skills, preferences, and performance.
                      </p>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">RAG System Agent</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Monitors learner progress and triggers interventions when necessary.
                      </p>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-md p-4 text-sm">
                    <p className="font-medium mb-2">About AI Agents</p>
                    <p className="text-muted-foreground">
                      AI agents work behind the scenes to enhance the learning experience. 
                      They analyze data, personalize content, and provide timely interventions 
                      to help employees succeed in their learning journey.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
