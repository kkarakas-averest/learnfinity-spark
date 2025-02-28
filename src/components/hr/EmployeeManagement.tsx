import React, { useState } from 'react';
import { 
  Search,
  Filter,
  UserPlus,
  Upload,
  Download,
  AlertTriangle,
  Clock,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock employee data
const employees = [
  {
    id: "emp001",
    name: "Alex Johnson",
    email: "alex.j@techcorp.com",
    department: "Engineering",
    courses: 4,
    coursesCompleted: 3,
    progress: 75,
    lastActivity: "2 days ago",
    status: "active"
  },
  {
    id: "emp002",
    name: "Sarah Miller",
    email: "sarah.m@techcorp.com",
    department: "Product",
    courses: 3,
    coursesCompleted: 1,
    progress: 42,
    lastActivity: "Today",
    status: "active"
  },
  {
    id: "emp003",
    name: "James Wilson",
    email: "james.w@techcorp.com",
    department: "Marketing",
    courses: 2,
    coursesCompleted: 2,
    progress: 100,
    lastActivity: "1 week ago",
    status: "active"
  },
  {
    id: "emp004",
    name: "Emma Davis",
    email: "emma.d@techcorp.com",
    department: "HR",
    courses: 5,
    coursesCompleted: 1,
    progress: 34,
    lastActivity: "3 days ago",
    status: "active"
  },
  {
    id: "emp005",
    name: "Michael Brown",
    email: "michael.b@techcorp.com",
    department: "Engineering",
    courses: 3,
    coursesCompleted: 0,
    progress: 15,
    lastActivity: "2 weeks ago",
    status: "inactive"
  }
];

// Function to get status badge color
const getStatusBadge = (status: string) => {
  switch(status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "inactive":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

// Function to get progress color
const getProgressColor = (progress: number) => {
  if (progress >= 75) return "bg-green-500";
  if (progress >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const EmployeeManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState('tracking');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Filter employees based on search term and department
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = 
      selectedDepartment === 'all' || 
      emp.department.toLowerCase() === selectedDepartment.toLowerCase();
    
    return matchesSearch && matchesDepartment;
  });

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="tracking">Progress Tracking</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        {/* Progress Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Employee Learning Progress</CardTitle>
                  <CardDescription>Track employee learning progress and engagement</CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Employee</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search employees..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-center">Last Activity</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-xs text-muted-foreground">{employee.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center">
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getProgressColor(employee.progress)}`} 
                                  style={{ width: `${employee.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs mt-1">
                                {employee.coursesCompleted}/{employee.courses} courses ({employee.progress}%)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="text-sm">{employee.lastActivity}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={getStatusBadge(employee.status)}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No employees match your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredEmployees.length} of {employees.length} employees
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                <span>Export to CSV</span>
              </Button>
            </CardFooter>
          </Card>

          {/* Engagement Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Alerts</CardTitle>
              <CardDescription>Employees who need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-amber-50 flex items-start space-x-4">
                  <div className="bg-amber-100 text-amber-700 rounded-full p-2">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Michael Brown has been inactive for 14 days</h3>
                    <p className="text-sm text-muted-foreground mt-1">No learning progress has been made since Oct 14, 2023</p>
                    <div className="mt-3">
                      <Button size="sm" variant="outline">Send Reminder</Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md bg-red-50 flex items-start space-x-4">
                  <div className="bg-red-100 text-red-700 rounded-full p-2">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Emma Davis is behind schedule on 3 courses</h3>
                    <p className="text-sm text-muted-foreground mt-1">Course completion is below expected pace</p>
                    <div className="mt-3">
                      <Button size="sm" variant="outline">View Courses</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Onboarding</CardTitle>
              <CardDescription>Add new employees to the learning platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* CSV Upload */}
              <div className="bg-secondary/30 border rounded-lg p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">Bulk Upload Employees</h3>
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
              
              {/* Manual Addition */}
              <div>
                <h3 className="text-lg font-medium mb-4">Add Single Employee</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manual-name">Employee Name</Label>
                    <Input id="manual-name" placeholder="John Doe" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="manual-email">Work Email</Label>
                    <Input id="manual-email" type="email" placeholder="john.doe@company.com" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="manual-department">Department</Label>
                      <Select>
                        <SelectTrigger id="manual-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="manual-role">Job Role</Label>
                      <Input id="manual-role" placeholder="Software Engineer" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox id="manual-assign-default" defaultChecked />
                    <Label htmlFor="manual-assign-default">
                      Assign default learning path for this role
                    </Label>
                  </div>
                  
                  <Button className="mt-2">
                    Add Employee & Send Invitation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeManagement; 