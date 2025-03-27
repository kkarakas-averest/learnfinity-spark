import React from '@/lib/react-helpers';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from '@/lib/react-helpers';
import { ROUTES } from '@/lib/routes';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Calendar, 
  Mail, 
  PhoneCall, 
  Building, 
  Award, 
  User, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { format } from 'date-fns';

// Define interfaces for the data
interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  hire_date?: string;
  department_id?: string;
  position_id?: string;
  department?: string;
  position?: string;
  profile_image_url?: string;
  resume_url?: string;
  last_active_at?: string;
  current_rag_status?: 'green' | 'amber' | 'red';
  last_rag_update?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  progress: number;
  enrollment_date?: string;
  completion_date?: string;
}

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  inProgress: boolean;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  timestamp: string;
  course_title?: string;
}

const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    if (!id) return;
    
    const loadEmployeeData = async () => {
      setLoading(true);
      try {
        // Fetch employee details
        const { data: employeeData, error: employeeError } = await hrEmployeeService.getEmployee(id);
        
        if (employeeError || !employeeData) {
          throw new Error(employeeError?.message || 'Failed to fetch employee details');
        }
        
        setEmployee(employeeData);
        
        // Fetch courses
        const { data: coursesData, error: coursesError } = await hrEmployeeService.getEmployeeCourses(id);
        if (!coursesError && coursesData) {
          setCourses(coursesData);
        } else {
          console.warn('Error fetching courses:', coursesError);
          // Fallback to empty array if there's an error
          setCourses([]);
        }
        
        // Fetch skills
        const { data: skillsData, error: skillsError } = await hrEmployeeService.getEmployeeSkills(id);
        if (!skillsError && skillsData) {
          setSkills(skillsData);
        } else {
          console.warn('Error fetching skills:', skillsError);
          // Fallback to empty array if there's an error
          setSkills([]);
        }
        
        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await hrEmployeeService.getEmployeeActivities(id);
        if (!activitiesError && activitiesData) {
          setActivities(activitiesData);
        } else {
          console.warn('Error fetching activities:', activitiesError);
          // Fallback to empty array if there's an error
          setActivities([]);
        }
        
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching employee data');
        console.error('Error fetching employee data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadEmployeeData();
  }, [id]);
  
  // Helper function to get RAG status color and icon
  const getRagStatusInfo = (status: string | undefined) => {
    const statusLower = (status || 'green').toLowerCase();
    switch (statusLower) {
      case 'green':
        return { 
          color: 'bg-green-500', 
          textColor: 'text-green-700',
          borderColor: 'border-green-600',
          bgColor: 'bg-green-50',
          icon: <CheckCircle className="h-5 w-5 text-green-500" /> 
        };
      case 'amber':
        return { 
          color: 'bg-amber-500', 
          textColor: 'text-amber-700',
          borderColor: 'border-amber-600',
          bgColor: 'bg-amber-50',
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> 
        };
      case 'red':
        return { 
          color: 'bg-red-500', 
          textColor: 'text-red-700',
          borderColor: 'border-red-600',
          bgColor: 'bg-red-50',
          icon: <AlertCircle className="h-5 w-5 text-red-500" /> 
        };
      default:
        return { 
          color: 'bg-gray-500', 
          textColor: 'text-gray-700',
          borderColor: 'border-gray-600',
          bgColor: 'bg-gray-50',
          icon: <CheckCircle className="h-5 w-5 text-gray-500" /> 
        };
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Profile</h3>
            <p className="text-gray-600">{error}</p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!employee) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-2">Employee Not Found</h3>
            <p className="text-gray-600">The requested employee profile could not be found.</p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const ragStatus = getRagStatusInfo(employee.current_rag_status);
  
  // Calculate overall learning progress
  const calculateOverallProgress = (): number => {
    if (!courses.length) return 0;
    const total = courses.reduce((sum, course) => sum + course.progress, 0);
    return Math.round(total / courses.length);
  };
  
  // Get completed and in-progress course counts
  const completedCourses = courses.filter(c => c.progress === 100).length;
  const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100).length;
  const notStartedCourses = courses.filter(c => c.progress === 0).length;
  
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employee Profile</h1>
        <div className="space-x-2">
          <Link 
            to={`${ROUTES.HR_DASHBOARD}/employees/${id}/edit`}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Edit Profile
          </Link>
          <Link 
            to={`${ROUTES.HR_DASHBOARD}/employees`}
            className="bg-secondary text-primary px-4 py-2 rounded hover:bg-secondary/90"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {employee.profile_image_url ? (
                <img 
                  src={employee.profile_image_url} 
                  alt={employee.name} 
                  className="h-32 w-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="h-16 w-16 text-primary/40" />
                </div>
              )}
              <h2 className="text-2xl font-bold">{employee.name}</h2>
              <p className="text-gray-600 mt-1">{employee.position || 'No Position'}</p>
              
              <div className="flex items-center mt-2">
                <Badge className={`${ragStatus.bgColor} ${ragStatus.textColor} ${ragStatus.borderColor}`}>
                  {ragStatus.icon}
                  <span className="ml-1 capitalize">{employee.current_rag_status || 'Green'}</span>
                </Badge>
              </div>
              
              <div className="w-full mt-6 space-y-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center">
                    <PhoneCall className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-sm">{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm">{employee.department || 'No Department'}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm">{employee.position || 'No Position'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-sm">Joined: {formatDate(employee.hire_date)}</span>
                </div>
                {employee.last_active_at && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="text-sm">Last Active: {formatDate(employee.last_active_at)}</span>
                  </div>
                )}
              </div>
              
              {employee.resume_url && (
                <Button variant="outline" className="mt-6 w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Resume
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Right Columns: Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Overall progress across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{calculateOverallProgress()}%</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedCourses}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{inProgressCourses}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{notStartedCourses}</div>
                  <div className="text-xs text-gray-500">Not Started</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs for Skills, Courses, and Activity */}
          <Tabs defaultValue="skills">
            <TabsList className="w-full">
              <TabsTrigger value="skills" className="flex-1">Skills</TabsTrigger>
              <TabsTrigger value="courses" className="flex-1">Courses</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">Recent Activity</TabsTrigger>
            </TabsList>
            
            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Skills obtained and in progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {skills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {skills.map((skill, index) => (
                        <div key={index} className="border rounded-md p-3">
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-medium">{skill.name}</div>
                            <Badge variant={skill.inProgress ? "outline" : "default"}>
                              {skill.inProgress ? "In Progress" : skill.level}
                            </Badge>
                          </div>
                          {!skill.inProgress && (
                            <div className="flex items-center mt-1">
                              <Award className="h-3 w-3 text-amber-500 mr-1" />
                              <span className="text-xs text-gray-500 capitalize">{skill.level}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No skills data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Courses</CardTitle>
                  <CardDescription>Courses and their progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {courses.length > 0 ? (
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div key={course.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{course.title}</h4>
                              {course.description && (
                                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                              )}
                            </div>
                            <Badge
                              variant={course.progress === 100 ? "default" : "outline"}
                              className={course.progress === 100 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                            >
                              {course.progress === 100 ? "Completed" : `${course.progress}% Complete`}
                            </Badge>
                          </div>
                          <Progress value={course.progress} className="h-2 mt-2" />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>Enrolled: {formatDate(course.enrollment_date)}</span>
                            {course.completion_date && (
                              <span>Completed: {formatDate(course.completion_date)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No courses enrolled
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest learning activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 border-b pb-4 last:border-0">
                          <div className="rounded-full bg-primary/10 p-2 mt-1">
                            {activity.activity_type === 'course_started' ? (
                              <BookOpen className="h-4 w-4 text-primary" />
                            ) : activity.activity_type === 'course_completed' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : activity.activity_type === 'section_completed' ? (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            {activity.course_title && (
                              <p className="text-xs text-gray-500 mt-1">Course: {activity.course_title}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No activity recorded
                    </div>
                  )}
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
