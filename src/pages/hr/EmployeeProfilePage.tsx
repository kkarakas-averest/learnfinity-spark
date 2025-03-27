import React from '@/lib/react-helpers';
import { useParams, Link, useLocation } from 'react-router-dom';
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
  FileText,
  MessageSquare
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { format } from 'date-fns';
import MessageEmployeeModal from '@/components/hr/MessageEmployeeModal';

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
  const params = useParams();
  const location = useLocation();
  // Fallback to extracting ID from URL if params doesn't provide it
  const id = params.id || params.subpath || location.pathname.split('/').filter(Boolean)[2];
  
  console.log('EmployeeProfilePage - params:', params);
  console.log('EmployeeProfilePage - location:', location.pathname);
  console.log('EmployeeProfilePage - extracted ID:', id);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    if (!id) {
      console.error('No employee ID provided');
      setError('No employee ID provided');
      setLoading(false);
      return;
    }
    
    // Skip loading if this is a "new" employee page
    if (id === 'new') {
      console.log('New employee form - skipping data loading');
      setLoading(false);
      return;
    }
    
    const loadEmployeeData = async () => {
      setLoading(true);
      try {
        console.log('Fetching employee with ID:', id);
        // Fetch employee details
        const { data: employeeData, error: employeeError } = await hrEmployeeService.getEmployee(id);
        
        console.log('Employee data response:', { data: employeeData, error: employeeError });
        
        if (employeeError || !employeeData) {
          throw new Error(employeeError?.message || 'Failed to fetch employee details');
        }
        
        setEmployee(employeeData);
        
        // Fetch courses
        console.log('Fetching courses for employee:', id);
        const { data: coursesData, error: coursesError } = await hrEmployeeService.getEmployeeCourses(id);
        console.log('Courses data response:', { success: !coursesError, count: coursesData?.length });
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
  
  const SkillsSection: React.FC<{ skills: Skill[] }> = ({ skills }) => {
    if (skills.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <Award className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p>No skills recorded for this employee.</p>
        </div>
      );
    }

    const getProficiencyColor = (level: string) => {
      switch (level.toLowerCase()) {
        case 'beginner': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'intermediate': return 'bg-green-100 text-green-800 border-green-200';
        case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'expert': return 'bg-amber-100 text-amber-800 border-amber-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill, index) => (
          <div key={index} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{skill.name}</h3>
              <Badge className={`${getProficiencyColor(skill.level)}`}>
                {skill.level}
              </Badge>
            </div>
            {skill.inProgress && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                In Progress
              </Badge>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employee Profile</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link to={`${ROUTES.HR_DASHBOARD}/employees`}>
              Back to List
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-shrink-0 h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                  {employee.profile_image_url ? (
                    <img 
                      src={employee.profile_image_url} 
                      alt={employee.name} 
                      className="h-full w-full rounded-full object-cover" 
                    />
                  ) : (
                    <User className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold">{employee.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-1 text-gray-500">
                    {employee.position && (
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        <span>{employee.position}</span>
                      </div>
                    )}
                    {employee.department && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        <span>{employee.department}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                  <Link to={`${ROUTES.HR_DASHBOARD_EMPLOYEES_EDIT.replace(':id', employee.id)}`}>
                    Edit Profile
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsMessageModalOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="ml-2">{employee.email}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <PhoneCall className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">Phone:</span>
                    <span className="ml-2">{employee.phone || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">Joined:</span>
                    <span className="ml-2">{formatDate(employee.hire_date)}</span>
                  </div>
                </div>
              </div>

              <div>
                {employee.resume_url && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">Resume:</span>
                    <a 
                      href={employee.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      View Resume
                    </a>
                  </div>
                )}

                <div className="flex items-center mt-3">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-500">Last Activity:</span>
                  <span className="ml-2">{employee.last_active_at ? formatDate(employee.last_active_at) : 'No activity recorded'}</span>
                </div>

                <div className="flex items-center mt-3">
                  <div className="flex items-center">
                    {employee.current_rag_status && getRagStatusInfo(employee.current_rag_status).icon}
                    <span className="text-sm text-gray-500 ml-2">Status:</span>
                    <Badge className="ml-2" variant="outline">
                      {employee.current_rag_status ? employee.current_rag_status.toUpperCase() : 'Not set'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="courses">
          <TabsList className="mb-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Courses</CardTitle>
                <CardDescription>
                  {courses.length > 0 
                    ? `${courses.length} courses | ${completedCourses} completed, ${inProgressCourses} in progress, ${notStartedCourses} not started`
                    : 'No courses enrolled yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map((course, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">{course.title}</h3>
                          <Badge variant={course.progress === 100 ? "default" : "outline"}>
                            {course.progress === 100 ? "Completed" : "In Progress"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{course.description}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Enrolled: {formatDate(course.enrollment_date)}</span>
                          </div>
                          {course.completion_date && (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              <span>Completed: {formatDate(course.completion_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p>This employee hasn't been enrolled in any courses yet</p>
                    <Button className="mt-4" variant="outline">Assign Course</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Skills & Competencies</CardTitle>
                <CardDescription>
                  {skills.length > 0 
                    ? `${skills.length} skills recorded` 
                    : 'No skills recorded yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkillsSection skills={skills} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  {activities.length > 0 
                    ? `${activities.length} recent activities` 
                    : 'No activity recorded yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={index} className="flex border-b pb-3 last:border-b-0">
                        <div className="w-10 mr-4 flex justify-center pt-1">
                          {activity.activity_type === 'course_progress' ? (
                            <BookOpen className="h-5 w-5 text-blue-500" />
                          ) : activity.activity_type === 'login' ? (
                            <User className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.description}</p>
                          <div className="flex justify-between mt-1">
                            <div className="text-sm text-gray-500">
                              {activity.course_title && (
                                <span className="mr-2">Course: {activity.course_title}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p>No activity recorded for this employee yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add the message modal */}
      {employee && (
        <MessageEmployeeModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          employee={{
            id: employee.id,
            name: employee.name,
            email: employee.email
          }}
        />
      )}
    </div>
  );
};

export default EmployeeProfilePage;
