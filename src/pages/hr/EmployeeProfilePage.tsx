import React from '@/lib/react-helpers';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
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
  MessageSquare,
  Upload,
  Pencil,
  GraduationCap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { format } from 'date-fns';
import MessageEmployeeModal from '@/components/hr/MessageEmployeeModal';
import { CourseAssignmentDialog } from '@/components/hr';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from '@/lib/supabase';
import { uploadFileToStorage, fixStorageUrl, getPublicUrl } from '@/utils/storageHelpers';
import { useResumeHandler } from './resumeHandler';
import EnhanceCourseContentButton from '@/components/hr/EnhanceCourseContentButton';
import type { Employee as HREmployee } from '@/services/hrEmployeeService';

// Define a unique type for this page that extends the service Employee type
type EmployeeProfile = HREmployee & {
  profile_image_url?: string | null;
  resume_url?: string | null;
  cv_file_url?: string | null;
  cv_extracted_data?: any;
  skills?: string[] | null;
  hr_departments?: { id: string; name: string } | null;
  hr_positions?: { id: string; title: string } | null;
  department?: string;
  position?: string;
};

interface Course {
  id: string;
  title: string;
  description?: string;
  enrollment_date: string;
  completion_date?: string;
  progress: number;
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

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
  department_id: string;
}

// Replace the isValidEmployee function with a simpler version
function isValidEmployee(data: any): boolean {
  return Boolean(data && data.id);
}

const EmployeeProfilePage: React.FC = () => {
  const params = useParams();
  const id = params.id;
  const location = useLocation();
  const navigate = useNavigate();
  // Fallback to extracting ID from URL if params doesn't provide it
  const extractedId = id || location.pathname.split('/').pop();
  
  console.log('EmployeeProfilePage - params:', { id });
  console.log('EmployeeProfilePage - location:', location.pathname);
  console.log('EmployeeProfilePage - extracted ID:', extractedId);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cvProfileDialogOpen, setCvProfileDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    status: 'active'
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [inProgressCourses, setInProgressCourses] = useState(0);
  const [notStartedCourses, setNotStartedCourses] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  
  // Update the useResumeHandler call to handle undefined
  const {
    resumeFile,
    resumeFileName,
    uploading,
    handleResumeFileChange,
    uploadResume,
    viewResume
  } = useResumeHandler(extractedId || '');

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!extractedId) {
        setError('No employee ID provided');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null); // Reset any previous error
      
      try {
        console.log('Fetching employee with ID:', extractedId);
        const { data, error } = await hrEmployeeService.getEmployee(extractedId);
        
        if (error) {
          console.error('Error fetching employee:', error);
          setError(`Failed to load employee data: ${error.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
        
        if (!data) {
          console.error('No employee data returned for ID:', extractedId);
          setError('Employee not found');
          setLoading(false);
          return;
        }
        
        console.log('Employee data response:', data);
        
        // Validate employee data structure
        if (!isValidEmployee(data)) {
          console.error('Invalid employee data structure:', data);
          setError('Invalid employee data format');
          setLoading(false);
          return;
        }
        
        // Set profile image URL if it exists
        if ('profile_image_url' in data && data.profile_image_url) {
          setProfileImageUrl(data.profile_image_url);
        } else {
          setProfileImageUrl(null);
        }
        
        // Cast the data to any to extract values without type-checking
        const anyData = data as any;

        // Create a new object that matches the EmployeeProfile type with all required fields
        const sanitizedEmployeeData = {
          // Required fields from base Employee
          id: typeof anyData.id === 'string' ? anyData.id : '',
          company_id: typeof anyData.company_id === 'string' ? anyData.company_id : '',
          name: typeof anyData.name === 'string' ? anyData.name : 'Unknown',
          email: typeof anyData.email === 'string' ? anyData.email : '',
          status: typeof anyData.status === 'string' ? anyData.status : 'unknown',
          phone: anyData.phone,
          hire_date: anyData.hire_date,
          department_id: anyData.department_id,
          position_id: anyData.position_id,
          last_active_at: anyData.last_active_at,
          current_rag_status: anyData.current_rag_status,
          
          // Extended fields for EmployeeProfile
          profile_image_url: typeof anyData.profile_image_url === 'string' ? anyData.profile_image_url : null,
          resume_url: typeof anyData.resume_url === 'string' ? anyData.resume_url : undefined,
          cv_file_url: typeof anyData.cv_file_url === 'string' ? anyData.cv_file_url : null,
          cv_extracted_data: anyData.cv_extracted_data ?? null,
          skills: Array.isArray(anyData.skills) ? anyData.skills : [],
          
          // Process hr_departments
          hr_departments: anyData.hr_departments && 
            typeof anyData.hr_departments === 'object' && 
            'id' in anyData.hr_departments && 
            'name' in anyData.hr_departments
              ? { id: String(anyData.hr_departments.id), name: String(anyData.hr_departments.name) }
              : null,
          
          // Process hr_positions
          hr_positions: anyData.hr_positions && 
            typeof anyData.hr_positions === 'object' && 
            'id' in anyData.hr_positions && 
            'title' in anyData.hr_positions
              ? { id: String(anyData.hr_positions.id), title: String(anyData.hr_positions.title) }
              : null,
        } as EmployeeProfile;
        
        // Add computed fields
        sanitizedEmployeeData.department = sanitizedEmployeeData.hr_departments?.name || '';
        sanitizedEmployeeData.position = sanitizedEmployeeData.hr_positions?.title || '';
        
        setEmployee(sanitizedEmployeeData);
        console.log('DEBUG - Sanitized employee data:', sanitizedEmployeeData);
        
        // Fetch employee's courses with proper null check for extractedId
        console.log('Fetching courses for employee:', extractedId);
        const { data: coursesData, error: coursesError } = await hrEmployeeService.getEmployeeCourses(extractedId || '');
        
        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
          // Set empty courses but don't return early
          setCourses([]);
          setCompletedCourses(0);
          setNotStartedCourses(0);
          setInProgressCourses(0);
        } else if (coursesData && Array.isArray(coursesData)) {
          console.log('Courses data response:', coursesData);
          setCourses(coursesData);
          
          // Calculate course statistics
          const completed = coursesData.filter(c => c.progress === 100).length;
          const notStarted = coursesData.filter(c => c.progress === 0).length;
          const inProgress = coursesData.length - completed - notStarted;
          
          setCompletedCourses(completed);
          setNotStartedCourses(notStarted);
          setInProgressCourses(inProgress);
        } else {
          console.warn('No valid courses data returned for employee:', extractedId);
          setCourses([]);
          setCompletedCourses(0);
          setNotStartedCourses(0);
          setInProgressCourses(0);
        }
        
        // Fetch employee skills
        try {
          const { data: skillsData } = await hrEmployeeService.getEmployeeSkills(extractedId || '');
          if (skillsData && Array.isArray(skillsData)) {
            setSkills(skillsData);
          } else {
            setSkills([]);
          }
        } catch (skillsError) {
          console.error('Error fetching employee skills:', skillsError);
          setSkills([]);
        }
        
        // Fetch employee activities
        try {
          const { data: activitiesData } = await hrEmployeeService.getEmployeeActivities(extractedId || '');
          if (activitiesData && Array.isArray(activitiesData)) {
            setActivities(activitiesData);
          } else {
            setActivities([]);
          }
        } catch (activitiesError) {
          console.error('Error fetching employee activities:', activitiesError);
          setActivities([]);
        }
      } catch (loadError) {
        console.error('Unexpected error loading employee data:', loadError);
        setError('An unexpected error occurred while loading employee data');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load employee data: ' + (loadError instanceof Error ? loadError.message : String(loadError))
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (extractedId) {
      loadEmployeeData();
    }
  }, [extractedId]);
  
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
    if (!courses || courses.length === 0) return 0;
    return Math.floor(courses.reduce((sum: number, course: Course) => sum + (course.progress || 0), 0) / courses.length);
  };
  
  // Fix the typing in SkillsSection 
  const SkillsSection: React.FC<{ skills: Skill[] }> = ({ skills }: { skills: Skill[] }) => {
    if (!skills || skills.length === 0) {
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
        {skills.map((skill: Skill, index: number) => (
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

  const handleAssignCourse = () => {
    setAssignDialogOpen(true);
  };

  const handleEditClick = async () => {
    if (!employee) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot edit employee: No employee data loaded'
      });
      return;
    }
    
    // Initialize form with employee data
    setEditFormData({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department_id: employee.department_id || '',
      position_id: employee.position_id || '',
      hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
      status: employee.status || 'active'
    });
    
    if (employee.profile_image_url) {
      setProfileImagePreview(employee.profile_image_url);
    }
    
    if (employee?.cv_file_url) {
      const fileName = employee.cv_file_url.split('/').pop() || 'Resume';
    }
    
    // Fetch departments if needed
    if (departments.length === 0) {
      try {
        const { departments: deptData, error: deptError } = await hrEmployeeService.getDepartments();
        if (!deptError && deptData) {
          setDepartments(deptData);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    }
    
    // Fetch positions if needed
    if (positions.length === 0) {
      try {
        const { data: posData, error: posError } = await supabase
          .from('hr_positions')
          .select('id, title, department_id');
          
        if (!posError && posData) {
          setPositions(posData);
          
          // Filter positions based on selected department
          if (employee.department_id) {
            const filtered = posData.filter(pos => pos.department_id === employee.department_id);
            setFilteredPositions(filtered);
          } else {
            setFilteredPositions(posData);
          }
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    }
    
    // Open the modal
    setIsEditModalOpen(true);
  };

  // Fix the typing in handleInputChange
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Fix the typing in handleSelectChange
  const handleSelectChange = (name: string, value: string) => {
    setEditFormData((prev: any) => ({ ...prev, [name]: value }));
    
    // Reset position when department changes
    if (name === 'department_id') {
      setEditFormData((prev: any) => ({ ...prev, position_id: '' }));
      
      // Filter positions based on selected department
      const filtered = positions.filter((pos: Position) => pos.department_id === value);
      setFilteredPositions(filtered);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file'
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 5MB'
      });
      return;
    }
    
    setProfileImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !extractedId) return null;
    
    try {
      console.log("Uploading profile image...");
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${extractedId}-${Date.now()}.${fileExt}`;
      const filePath = `employee-avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(filePath, profileImage);
        
      if (error) {
        console.error("Error uploading to Supabase storage:", error);
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      console.log("Profile image uploaded successfully:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload profile image. Please try again.'
      });
      return null;
    }
  };

  const testAndOpenCvLink = async (url?: string | null) => {
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Resume Unavailable',
        description: 'No resume has been uploaded for this employee.'
      });
      return;
    }
    // Defensively clean the URL: Remove potential trailing colons and digits (e.g., ":1")
    const cleanedUrl = url.replace(/(:\d+)$/, '');
    console.log(`Original URL: ${url}, Cleaned URL: ${cleanedUrl}`); // Add logging
    await viewResume(cleanedUrl);
  };

  const fetchEmployeeData = async () => {
    if (!extractedId) return;
    
    try {
      setLoading(true);
      
      // Fetch updated employee data
      const { data } = await hrEmployeeService.getEmployee(extractedId);
      setEmployee(data);
      
      // Fetch other related data
      const { data: updatedCourses } = await hrEmployeeService.getEmployeeCourses(extractedId);
      if (updatedCourses) setCourses(updatedCourses);
      
      const { data: updatedSkills } = await hrEmployeeService.getEmployeeSkills(extractedId);
      if (updatedSkills) setSkills(updatedSkills);
      
      const { data: updatedActivities } = await hrEmployeeService.getEmployeeActivities(extractedId);
      if (updatedActivities) setActivities(updatedActivities);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!extractedId) return;
    
    setSubmitting(true);
    try {
      // Upload profile image if changed
      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadProfileImage();
      }
      
      // Prepare update data
      let updateData = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        department_id: editFormData.department_id,
        position_id: editFormData.position_id,
        hire_date: editFormData.hire_date,
        status: editFormData.status,
        ...(profileImageUrl && { profile_image_url: profileImageUrl })
      };
      
      console.log("Updating employee with data:", updateData);
      
      // Upload resume file if changed
      let resumeUrl;
      if (resumeFile) {
        const uploadResult = await uploadResume();
        if (uploadResult.success && uploadResult.url) {
          resumeUrl = uploadResult.url;
        }
      }
      
      // Update employee
      const { success, error } = await hrEmployeeService.updateEmployee(extractedId, updateData);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Employee profile updated successfully.'
      });
      
      // Close modal and reload employee data
      setIsEditModalOpen(false);
      fetchEmployeeData();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update employee profile. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add this logging in the EmployeeProfilePage component right before the return statement
  useEffect(() => {
    // Debugging logs to help diagnose the issue
    console.log("DEBUG - Employee State:", JSON.stringify({
      employeeId: employee?.id,
      name: employee?.name,
      email: employee?.email,
      hasPosition: Boolean(employee?.hr_positions),
      hasDepartment: Boolean(employee?.hr_departments),
      hasData: Boolean(employee)
    }));
    
    console.log("DEBUG - Courses State:", JSON.stringify({
      coursesCount: courses?.length || 0,
      isArray: Array.isArray(courses),
      firstCourse: courses?.[0]
    }));
    
    console.log("DEBUG - Skills State:", JSON.stringify({
      skillsCount: skills?.length || 0,
      isArray: Array.isArray(skills)
    }));
  }, [employee, courses, skills]);

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
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
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
        ) : !employee ? (
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
        ) : (
          <>
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
                        {employee.hr_positions?.title && (
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            <span>{employee.hr_positions.title}</span>
                          </div>
                        )}
                        {employee.hr_departments?.name && (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            <span>{employee.hr_departments.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button variant="outline" size="sm" onClick={handleEditClick}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => setIsMessageModalOpen(true)}>
                      <Mail className="h-4 w-4 mr-2" /> Message
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(true)}>
                      <GraduationCap className="h-4 w-4 mr-2" /> Assign Course
                    </Button>
                    
                    {typeof employee.cv_extracted_data === 'object' && employee.cv_extracted_data && (
                      <EnhanceCourseContentButton 
                        employeeId={employee.id} 
                        disabled={loading} 
                      />
                    )}
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
                      
                      {/* Profile Summary Section */}
                      {employee.cv_extracted_data ? (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">
                            Profile Summary
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {typeof employee.cv_extracted_data === 'object' && employee.cv_extracted_data.summary
                              ? employee.cv_extracted_data.summary
                              : typeof employee.cv_extracted_data === 'string'
                                ? employee.cv_extracted_data
                                : 'No profile summary available.'}
                          </p>
                          
                          {/* Display skills if available */}
                          {typeof employee.cv_extracted_data === 'object' && employee.cv_extracted_data.skills && Array.isArray(employee.cv_extracted_data.skills) && employee.cv_extracted_data.skills.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Key Skills</h4>
                              <div className="flex flex-wrap gap-1">
                                {employee.cv_extracted_data.skills.slice(0, 5).map((skill: string, index: number) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {skill}
                                  </span>
                                ))}
                                {employee.cv_extracted_data.skills.length > 5 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    +{employee.cv_extracted_data.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Display experience if available */}
                          {typeof employee.cv_extracted_data === 'object' && 
                           employee.cv_extracted_data.experience && 
                           Array.isArray(employee.cv_extracted_data.experience) &&
                           employee.cv_extracted_data.experience.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Experience</h4>
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">{employee.cv_extracted_data.experience[0].title}</span>
                                {employee.cv_extracted_data.experience[0].company && (
                                  <span> at {employee.cv_extracted_data.experience[0].company}</span>
                                )}
                                {employee.cv_extracted_data.experience[0].duration && (
                                  <span> ({employee.cv_extracted_data.experience[0].duration})</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Display education if available */}
                          {typeof employee.cv_extracted_data === 'object' && 
                           employee.cv_extracted_data.education && 
                           Array.isArray(employee.cv_extracted_data.education) &&
                           employee.cv_extracted_data.education.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Education</h4>
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">{employee.cv_extracted_data.education[0].degree}</span>
                                {employee.cv_extracted_data.education[0].institution && (
                                  <span> from {employee.cv_extracted_data.education[0].institution}</span>
                                )}
                                {employee.cv_extracted_data.education[0].year && (
                                  <span> ({employee.cv_extracted_data.education[0].year})</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Display certifications if available */}
                          {typeof employee.cv_extracted_data === 'object' && 
                           employee.cv_extracted_data.certifications && 
                           Array.isArray(employee.cv_extracted_data.certifications) &&
                           employee.cv_extracted_data.certifications.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Certifications</h4>
                              <div className="flex flex-wrap gap-1">
                                {employee.cv_extracted_data.certifications.map((cert: string, index: number) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    {cert}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Display languages if available */}
                          {typeof employee.cv_extracted_data === 'object' && 
                           employee.cv_extracted_data.languages && 
                           Array.isArray(employee.cv_extracted_data.languages) &&
                           employee.cv_extracted_data.languages.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Languages</h4>
                              <div className="flex flex-wrap gap-1">
                                {employee.cv_extracted_data.languages.map((lang: string, index: number) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    {lang}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Display personal insights if available */}
                          {typeof employee.cv_extracted_data === 'object' && 
                           employee.cv_extracted_data.personalInsights &&
                           typeof employee.cv_extracted_data.personalInsights === 'object' && (
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                              <h4 className="text-xs font-medium text-gray-700 mb-2">Professional Insights</h4>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {employee.cv_extracted_data.personalInsights.yearsOfExperience && (
                                  <div>
                                    <span className="text-gray-500">Experience:</span>
                                    <span className="ml-1 font-medium">{employee.cv_extracted_data.personalInsights.yearsOfExperience}</span>
                                  </div>
                                )}
                                
                                {employee.cv_extracted_data.personalInsights.industries && Array.isArray(employee.cv_extracted_data.personalInsights.industries) && employee.cv_extracted_data.personalInsights.industries.length > 0 && (
                                  <div>
                                    <span className="text-gray-500">Industries:</span>
                                    <span className="ml-1 font-medium">{employee.cv_extracted_data.personalInsights.industries.slice(0, 2).join(", ")}</span>
                                  </div>
                                )}
                                
                                {employee.cv_extracted_data.personalInsights.toolsAndTechnologies && Array.isArray(employee.cv_extracted_data.personalInsights.toolsAndTechnologies) && employee.cv_extracted_data.personalInsights.toolsAndTechnologies.length > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Tools & Technologies:</span>
                                    <span className="ml-1 font-medium">{employee.cv_extracted_data.personalInsights.toolsAndTechnologies.slice(0, 3).join(", ")}</span>
                                    {employee.cv_extracted_data.personalInsights.toolsAndTechnologies.length > 3 && 
                                      <span className="text-gray-400"> +{employee.cv_extracted_data.personalInsights.toolsAndTechnologies.length - 3} more</span>}
                                  </div>
                                )}
                                
                                {employee.cv_extracted_data.personalInsights.softSkills && Array.isArray(employee.cv_extracted_data.personalInsights.softSkills) && employee.cv_extracted_data.personalInsights.softSkills.length > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Soft Skills:</span>
                                    <span className="ml-1 font-medium">{employee.cv_extracted_data.personalInsights.softSkills.join(", ")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Show metadata about the extraction */}
                          {typeof employee.cv_extracted_data === 'object' && employee.cv_extracted_data.extraction_date && (
                            <div className="mt-3 text-xs text-gray-400 flex flex-wrap items-center justify-between">
                              <div>
                                <span>Generated: {new Date(employee.cv_extracted_data.extraction_date).toLocaleDateString()}</span>
                                {employee.cv_extracted_data.source && (
                                  <span className="ml-1">via {employee.cv_extracted_data.source}</span>
                                )}
                                {employee.cv_extracted_data.model && (
                                  <span className="ml-1">using {employee.cv_extracted_data.model}</span>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-blue-600 p-0"
                                onClick={() => {
                                  if (typeof employee?.cv_extracted_data === 'object' && employee?.cv_extracted_data) {
                                    setCvProfileDialogOpen(true);
                                  } else {
                                    toast({
                                      title: "CV Profile Unavailable",
                                      description: "No CV profile data is available for this employee.",
                                      variant: "default"
                                    });
                                  }
                                }}
                              >
                                View Full CV Profile
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              Profile Summary
                            </h3>
                            <Input
                              id="quick_resume_upload"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeFileChange}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 py-0 px-2 text-xs"
                              onClick={() => document.getElementById('quick_resume_upload')?.click()}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Upload CV
                            </Button>
                          </div>
                          
                          {resumeFileName ? (
                            <div className="flex items-center mt-2 mb-3">
                              <span className="text-xs text-gray-600 mr-2">{resumeFileName}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-auto p-0 text-xs text-blue-600"
                                onClick={uploadResume}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-2 mb-3">
                              No profile summary available. Upload a CV to generate one automatically.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {(employee?.cv_file_url || employee?.resume_url) ? (
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500">Resume:</span>
                        <a 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            testAndOpenCvLink(employee?.cv_file_url || employee?.resume_url);
                          }}
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          View Resume
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-500">Resume:</span>
                        <span className="ml-2 text-gray-400">No resume available</span>
                      </div>
                    )}
                    
                    <div className="flex items-center mt-2">
                      <Upload className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-500">Resume:</span>
                      <div className="ml-2">
                        <Input
                          id="quick_resume_upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto py-0 text-blue-600 hover:text-blue-800"
                          onClick={() => document.getElementById('quick_resume_upload')?.click()}
                        >
                          {(employee?.cv_file_url || employee?.resume_url) ? 'Update Resume' : 'Upload Resume'}
                        </Button>
                        {resumeFileName && (
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-600 mr-2">{resumeFileName}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-auto p-0 text-xs text-blue-600"
                              onClick={uploadResume}
                            >
                              Save
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Enrolled Courses</CardTitle>
                      <CardDescription>
                        {courses.length > 0 
                          ? `${courses.length} courses | ${completedCourses} completed, ${inProgressCourses} in progress, ${notStartedCourses} not started`
                          : 'No courses enrolled yet'}
                      </CardDescription>
                    </div>
                    <Button onClick={handleAssignCourse} variant="default">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Assign Course
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {courses.length > 0 ? (
                      <div className="space-y-4">
                        {courses.map((course: Course, index: number) => (
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
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No courses assigned</h3>
                        <p className="text-muted-foreground mb-4">This employee hasn't been assigned any courses yet.</p>
                        <Button onClick={handleAssignCourse}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Assign Course
                        </Button>
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
                      {(activities && activities.length > 0) 
                        ? `${activities.length} recent activities` 
                        : 'No activities recorded yet'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(activities && activities.length > 0) ? (
                      <div className="space-y-4">
                        {activities.map((activity: Activity, index: number) => (
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

            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Learning & Development</h3>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees/${employee.id}/development-plan`)}
                  variant="outline"
                >
                  Development Plan
                </Button>
                <Button
                  onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees/${employee.id}/trainings`)}
                  variant="outline"
                >
                  Training History
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <CourseAssignmentDialog 
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        employeeId={employee?.id}
      />
      
      <MessageEmployeeModal
        open={isMessageModalOpen}
        onOpenChange={setIsMessageModalOpen}
        recipientId={employee?.id}
        recipientName={employee?.name}
      />

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Employee Profile</DialogTitle>
            <DialogDescription>
              Make changes to the employee profile. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdit}>
            <div className="space-y-6 py-4">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-8">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2">
                    {profileImagePreview ? (
                      <AvatarImage src={profileImagePreview} alt={editFormData.name} />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {editFormData.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Input
                    id="profile_image"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full p-2 h-auto"
                    onClick={() => document.getElementById('profile_image')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-medium">{editFormData.name || 'Employee Name'}</h3>
                  <p className="text-sm text-gray-500">{editFormData.email || 'employee@example.com'}</p>
                  <p className="text-sm mt-2 text-gray-600">
                    Change the profile picture by clicking the upload button.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={editFormData.phone || ''}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    value={editFormData.hire_date || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={editFormData.department_id || ''}
                    onValueChange={(value: string) => handleSelectChange('department_id', value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept: Department) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={editFormData.position_id || ''}
                    onValueChange={(value: string) => handleSelectChange('position_id', value)}
                    disabled={!editFormData.department_id}
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder={!editFormData.department_id ? "Select department first" : "Select position"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPositions.map((pos: Position) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editFormData.status || 'active'}
                    onValueChange={(value: string) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* CV/Resume Upload Section */}
              <div className="space-y-2 col-span-full mt-6">
                <Label htmlFor="resume_file">Resume/CV</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="resume_file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('resume_file')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Resume/CV
                  </Button>
                  {resumeFileName && (
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                      {resumeFileName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Upload a resume or CV to automatically generate a profile summary.
                  Supported formats: PDF, DOC, DOCX.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CV Profile Dialog */}
      <Dialog open={cvProfileDialogOpen} onOpenChange={setCvProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CV Profile: {employee?.name}</DialogTitle>
            <DialogDescription>
              Detailed information extracted from the employee's CV
            </DialogDescription>
          </DialogHeader>
          
          {typeof employee?.cv_extracted_data === 'object' ? (
            <div className="space-y-6 py-4">
              {/* Summary Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Professional Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md border">
                  <p className="text-sm">
                    {employee.cv_extracted_data.summary || 'No professional summary available.'}
                  </p>
                </div>
              </div>
              
              {/* Skills Section */}
              {employee.cv_extracted_data.skills && Array.isArray(employee.cv_extracted_data.skills) && employee.cv_extracted_data.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Skills & Competencies</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="flex flex-wrap gap-2">
                      {employee.cv_extracted_data.skills.map((skill: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Experience Section */}
              {employee.cv_extracted_data.experience && Array.isArray(employee.cv_extracted_data.experience) && employee.cv_extracted_data.experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Professional Experience</h3>
                  <div className="space-y-4">
                    {employee.cv_extracted_data.experience.map((exp: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md border">
                        <div className="flex flex-wrap justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{exp.title}</h4>
                          {exp.duration && (
                            <span className="text-sm text-gray-600">{exp.duration}</span>
                          )}
                        </div>
                        {exp.company && (
                          <p className="text-sm text-gray-700 mb-2">{exp.company}</p>
                        )}
                        {exp.highlights && exp.highlights.length > 0 && exp.highlights.map((highlight: string, hIndex: number) => (
                          <p key={hIndex} className="text-sm text-gray-600">{highlight}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Education Section */}
              {employee.cv_extracted_data.education && Array.isArray(employee.cv_extracted_data.education) && employee.cv_extracted_data.education.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Education</h3>
                  <div className="space-y-4">
                    {employee.cv_extracted_data.education.map((edu: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md border">
                        <div className="flex flex-wrap justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                          {edu.year && (
                            <span className="text-sm text-gray-600">{edu.year}</span>
                          )}
                        </div>
                        {edu.institution && (
                          <p className="text-sm text-gray-700">{edu.institution}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Certifications Section */}
              {employee.cv_extracted_data.certifications && Array.isArray(employee.cv_extracted_data.certifications) && employee.cv_extracted_data.certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Certifications</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {employee.cv_extracted_data.certifications.map((cert: string, index: number) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Languages Section */}
              {employee.cv_extracted_data.languages && Array.isArray(employee.cv_extracted_data.languages) && employee.cv_extracted_data.languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Languages</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="flex flex-wrap gap-2">
                      {employee.cv_extracted_data.languages.map((lang: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Personal Insights Section */}
              {employee.cv_extracted_data.personalInsights && typeof employee.cv_extracted_data.personalInsights === 'object' && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Professional Insights</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employee.cv_extracted_data.personalInsights.yearsOfExperience && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Years of Experience</h4>
                          <p className="text-sm">{employee.cv_extracted_data.personalInsights.yearsOfExperience}</p>
                        </div>
                      )}
                      
                      {employee.cv_extracted_data.personalInsights.industries && Array.isArray(employee.cv_extracted_data.personalInsights.industries) && employee.cv_extracted_data.personalInsights.industries.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Industries</h4>
                          <p className="text-sm">{employee.cv_extracted_data.personalInsights.industries.join(", ")}</p>
                        </div>
                      )}
                      
                      {employee.cv_extracted_data.personalInsights.toolsAndTechnologies && Array.isArray(employee.cv_extracted_data.personalInsights.toolsAndTechnologies) && employee.cv_extracted_data.personalInsights.toolsAndTechnologies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Tools & Technologies</h4>
                          <p className="text-sm">{employee.cv_extracted_data.personalInsights.toolsAndTechnologies.join(", ")}</p>
                        </div>
                      )}
                      
                      {employee.cv_extracted_data.personalInsights.projectManagement && Array.isArray(employee.cv_extracted_data.personalInsights.projectManagement) && employee.cv_extracted_data.personalInsights.projectManagement.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Project Management</h4>
                          <p className="text-sm">{employee.cv_extracted_data.personalInsights.projectManagement.join(", ")}</p>
                        </div>
                      )}
                      
                      {employee.cv_extracted_data.personalInsights.softSkills && Array.isArray(employee.cv_extracted_data.personalInsights.softSkills) && employee.cv_extracted_data.personalInsights.softSkills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Soft Skills</h4>
                          <p className="text-sm">{employee.cv_extracted_data.personalInsights.softSkills.join(", ")}</p>
                        </div>
                      )}
                      
                      {employee.cv_extracted_data.personalInsights.publications && Array.isArray(employee.cv_extracted_data.personalInsights.publications) && employee.cv_extracted_data.personalInsights.publications.length > 0 && (
                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-gray-700">Publications</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {employee.cv_extracted_data.personalInsights.publications.map((pub: string, index: number) => (
                              <li key={index}>{pub}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Key Achievements Section */}
              {employee.cv_extracted_data.keyAchievements && employee.cv_extracted_data.keyAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Achievements</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {employee.cv_extracted_data.keyAchievements.map((achievement: string, index: number) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Professional Interests Section */}
              {employee.cv_extracted_data.professionalInterests && employee.cv_extracted_data.professionalInterests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Professional Interests</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="flex flex-wrap gap-2">
                      {employee.cv_extracted_data.professionalInterests.map((interest: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-amber-100 text-amber-800">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Metadata */}
              {employee.cv_extracted_data.extraction_date && (
                <div className="pt-4 border-t text-xs text-gray-500">
                  <p>Generated on {new Date(employee.cv_extracted_data.extraction_date).toLocaleString()}</p>
                  {employee.cv_extracted_data.source && (
                    <p>Source: {employee.cv_extracted_data.source}</p>
                  )}
                  {employee.cv_extracted_data.model && (
                    <p>Model: {employee.cv_extracted_data.model}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">No detailed CV data available</div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeProfilePage;