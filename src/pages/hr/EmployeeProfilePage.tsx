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
  Upload
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
import { uploadFileToStorage, fixStorageUrl } from '@/utils/storageHelpers';

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
  user_id?: string;
  status?: string;
  cv_file_url?: string;
  cv_extracted_data?: {
    summary?: string;
    extraction_date?: string;
    source?: string;
  } | string;
}

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
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!extractedId) return;
      
      setLoading(true);
      try {
        console.log('Fetching employee with ID:', extractedId);
        const { data, error } = await hrEmployeeService.getEmployee(extractedId);
        
        if (error) throw error;
        
        console.log('Employee data response:', { data, error });
        setEmployee(data);
        
        // Fetch employee's courses
        console.log('Fetching courses for employee:', extractedId);
        const { data: coursesData, error: coursesError } = await hrEmployeeService.getEmployeeCourses(extractedId);
        console.log('Courses data response:', { data: coursesData, error: coursesError });
        
        if (!coursesError && coursesData) {
          setCourses(coursesData);
          
          // Calculate course statistics
          const completed = coursesData.filter(c => c.progress === 100).length;
          const notStarted = coursesData.filter(c => c.progress === 0).length;
          const inProgress = coursesData.length - completed - notStarted;
          
          setCompletedCourses(completed);
          setNotStartedCourses(notStarted);
          setInProgressCourses(inProgress);
        }
        
        // Fetch employee skills
        const { data: skillsData } = await hrEmployeeService.getEmployeeSkills(extractedId);
        if (skillsData) {
          setSkills(skillsData);
        }
        
        // Fetch employee activities
        const { data: activitiesData } = await hrEmployeeService.getEmployeeActivities(extractedId);
        if (activitiesData) {
          setActivities(activitiesData);
        }
      } catch (error) {
        console.error('Error loading employee data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load employee data'
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
    if (!courses.length) return 0;
    const total = courses.reduce((sum, course) => sum + course.progress, 0);
    return Math.round(total / courses.length);
  };
  
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
      setResumeFileName(employee.cv_file_url.split('/').pop() || 'Resume');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setEditFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset position when department changes
    if (name === 'department_id') {
      setEditFormData(prev => ({ ...prev, position_id: '' }));
      
      // Filter positions based on selected department
      const filtered = positions.filter(pos => pos.department_id === value);
      setFilteredPositions(filtered);
    }
  };

  const handleProfileImageChange = (e) => {
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

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setResumeFileName(file.name);
    }
  };

  const uploadResumeFile = async () => {
    if (!resumeFile || !extractedId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Resume file or employee ID is missing",
      });
      return;
    }

    try {
      const fileExt = resumeFile.name.split('.').pop();
      // Using a flat structure without nested directories
      const timestamp = Date.now();
      const filePath = `resumes/${extractedId}-${timestamp}.${fileExt}`;
      
      console.log(`Preparing to upload resume to path: ${filePath}`);
      
      // Upload file using our helper
      const { success, error, publicUrl } = await uploadFileToStorage(
        'employee-files',
        filePath,
        resumeFile
      );
        
      if (!success || error) {
        console.error("Error uploading resume:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload resume: " + (error.message || "Unknown error"),
        });
        return;
      }
      
      if (!publicUrl) {
        console.error("No public URL returned");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get public URL for resume",
        });
        return;
      }
      
      console.log("Resume URL:", publicUrl);
      
      // Update employee with the new CV URL
      const { error: updateError } = await supabase
        .from('hr_employees')
        .update({ 
          cv_file_url: publicUrl,
          resume_url: publicUrl, // Also update the resume_url field for backward compatibility
          updated_at: new Date().toISOString()
        })
        .eq('id', extractedId);
      
      if (updateError) {
        console.error("Error updating employee record:", updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update employee record with resume URL",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Resume uploaded successfully",
      });
      
      // Update the UI
      setEmployee(prev => {
        if (!prev) return null;
        return { 
          ...prev, 
          cv_file_url: publicUrl,
          resume_url: publicUrl 
        };
      });
      
      // Call the API to process the CV and generate a summary
      try {
        const response = await fetch('/api/hr/employees/process-cv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employeeId: extractedId,
            cvUrl: publicUrl
          })
        });
        
        if (!response.ok) {
          console.warn('Failed to process CV for summary generation:', await response.text());
        }
      } catch (apiError) {
        console.error('Error calling CV processing API:', apiError);
        // Non-blocking error - we'll continue even if this fails
      }
      
      // Refresh the employee data
      fetchEmployeeData();
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload resume",
      });
    }
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
      
      // Upload resume file if changed and prepare update data
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
      
      if (resumeFile) {
        // Upload the CV file first
        await uploadResumeFile();
        
        // Fetch the updated employee data to get the new CV URL
        const { data: updatedEmployee } = await hrEmployeeService.getEmployee(extractedId);
        
        if (updatedEmployee && 'cv_file_url' in updatedEmployee && updatedEmployee.cv_file_url) {
          // Call the API to process the CV and generate a summary
          const response = await fetch('/api/hr/employees/process-cv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              employeeId: extractedId,
              cvUrl: updatedEmployee.cv_file_url
            })
          });
          
          if (!response.ok) {
            console.warn('Failed to process CV for summary generation');
          }
        }
      }
      
      console.log("Updating employee with data:", updateData);
      
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

  const testAndOpenCvLink = async (url: string) => {
    if (!url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No resume URL available",
      });
      return;
    }

    console.log("Testing CV URL:", url);
    
    try {
      // Fix the URL before opening
      const fixedUrl = fixStorageUrl(url, 'employee-files');
      console.log("Fixed URL:", fixedUrl);
      
      // Check if the URL is accessible
      const response = await fetch(fixedUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Failed to access CV file: ${response.status} ${response.statusText}`);
      }
      
      window.open(fixedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error opening CV URL:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not open the CV file. Please check the storage bucket permissions.",
      });
    }
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
                <Button variant="outline" onClick={handleEditClick}>
                  Edit Profile
                </Button>
                
                {employee.cv_file_url && (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => testAndOpenCvLink(employee.cv_file_url as string)}
                  >
                    <FileText className="h-4 w-4" />
                    View CV
                  </Button>
                )}
                
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
                  
                  {/* Profile Summary Section */}
                  {employee.cv_extracted_data && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Profile Summary
                      </h3>
                      <p className="text-sm text-gray-600">
                        {typeof employee.cv_extracted_data === 'object' && employee.cv_extracted_data.summary
                          ? employee.cv_extracted_data.summary
                          : typeof employee.cv_extracted_data === 'string'
                            ? employee.cv_extracted_data
                            : 'No profile summary available.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {(employee?.cv_file_url || employee?.resume_url) && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-500">Resume:</span>
                    <a 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        testAndOpenCvLink(employee?.cv_file_url || employee?.resume_url || '');
                      }}
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      View Resume
                    </a>
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
                          onClick={uploadResumeFile}
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
                    onValueChange={(value) => handleSelectChange('department_id', value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
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
                    onValueChange={(value) => handleSelectChange('position_id', value)}
                    disabled={!editFormData.department_id}
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder={!editFormData.department_id ? "Select department first" : "Select position"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPositions.map((pos) => (
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
                    onValueChange={(value) => handleSelectChange('status', value)}
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
    </div>
  );
};

export default EmployeeProfilePage;
