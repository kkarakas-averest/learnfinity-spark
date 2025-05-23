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
import SkillsInventory from '@/components/hr/profile/SkillsInventory';

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
    model?: string;
    skills?: string[];
    experience?: {
      title: string;
      company?: string;
      duration?: string;
      highlights?: string[];
    }[];
    education?: {
      degree?: string;
      institution?: string;
      year?: string;
    }[];
    certifications?: string[];
    languages?: string[];
    keyAchievements?: string[];
    professionalInterests?: string[];
    personalInsights?: {
      yearsOfExperience?: string;
      industries?: string[];
      toolsAndTechnologies?: string[];
      projectManagement?: string[];
      softSkills?: string[];
      publications?: string[];
    };
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
  const [skills, setSkills] = useState<any[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<any[]>([]);
  const [missingSkills, setMissingSkills] = useState<any[]>([]);
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
  const [generatingPath, setGeneratingPath] = useState(false);
  const [learningPathResult, setLearningPathResult] = useState<string | null>(null);
  
  // Add this right after where the component gets the ID
  const {
    resumeFile,
    resumeFileName,
    uploading,
    handleResumeFileChange,
    uploadResume,
    viewResume
  } = useResumeHandler(extractedId ?? '');

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!extractedId) return;
      setLoading(true);
      try {
        console.log('Fetching employee with ID:', extractedId);
        const { data, error: employeeError } = await hrEmployeeService.getEmployee(extractedId);
        if (employeeError) throw employeeError;
        setEmployee(data);

        // Fetch employee's courses
        const { data: coursesData, error: coursesError } = await hrEmployeeService.getEmployeeCourses(extractedId);
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

        // Fetch employee skills with taxonomy and gaps
        const { skills, requiredSkills, missingSkills, error: skillsError } = await hrEmployeeService.getEmployeeSkillsWithTaxonomyAndGaps(extractedId);
        if (!skillsError) {
          setSkills(skills);
          setRequiredSkills(requiredSkills);
          setMissingSkills(missingSkills);
        }

        // Fetch employee activities
        const { data: activitiesData } = await hrEmployeeService.getEmployeeActivities(extractedId);
        if (activitiesData) {
          setActivities(activitiesData);
        }
      } catch (err) {
        console.error('Error loading employee data:', err);
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
    const total = courses.reduce((sum: number, course: Course) => sum + course.progress, 0);
    return Math.round(total / courses.length);
  };
  
  // Defensive extraction of cv_extracted_data
  const cvData = typeof employee.cv_extracted_data === 'object' && employee.cv_extracted_data !== null
    ? employee.cv_extracted_data
    : {};

  const summary = cvData.summary || (typeof employee.cv_extracted_data === 'string' ? employee.cv_extracted_data : 'No profile summary available.');
  const cvSkills = Array.isArray(cvData.skills) ? cvData.skills : [];
  const certifications = Array.isArray(cvData.certifications) ? cvData.certifications : [];
  const languages = Array.isArray(cvData.languages) ? cvData.languages : [];
  const experience = Array.isArray(cvData.experience) ? cvData.experience : [];
  const education = Array.isArray(cvData.education) ? cvData.education : [];
  const keyAchievements = Array.isArray(cvData.keyAchievements) ? cvData.keyAchievements : [];
  const professionalInterests = Array.isArray(cvData.professionalInterests) ? cvData.professionalInterests : [];
  const personalInsights = typeof cvData.personalInsights === 'object' && cvData.personalInsights !== null ? cvData.personalInsights : {};
  const publications = Array.isArray(personalInsights.publications) ? personalInsights.publications : [];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev: typeof editFormData) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditFormData((prev: typeof editFormData) => ({ ...prev, [name]: value }));
    
    // Reset position when department changes
    if (name === 'department_id') {
      setEditFormData((prev: typeof editFormData) => ({ ...prev, position_id: '' }));
      
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

  const testAndOpenCvLink = async (url: string) => {
    await viewResume(url);
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

  const handleGenerateLearningPath = async () => {
    if (!employee || !missingSkills.length) return;
    setGeneratingPath(true);
    try {
      const response = await fetch('/api/skills/course-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          positionId: employee.position_id,
          title: `Learning Path for ${employee.name}`,
          skillIds: missingSkills.map((s: any) => s.taxonomy_skill_id || s.id),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setLearningPathResult('Learning path generated successfully!');
        toast({ title: 'Success', description: 'Learning path generated. Check the learner dashboard.' });
      } else {
        setLearningPathResult('Failed to generate learning path.');
        toast({ title: 'Error', description: 'Failed to generate learning path.' });
      }
    } catch (err) {
      setLearningPathResult('Error generating learning path.');
      toast({ title: 'Error', description: 'Error generating learning path.' });
    } finally {
      setGeneratingPath(false);
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
                
                {employee.cv_extracted_data && (
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
                        {summary}
                      </p>
                      
                      {/* Display skills if available */}
                      {Array.isArray(cvSkills) && cvSkills.length > 0 ? (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Key Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {cvSkills.slice(0, 5).map((skill: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {skill}
                              </span>
                            ))}
                            {cvSkills.length > 5 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                +{cvSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">No skills listed</div>
                      )}
                      
                      {/* Display experience if available */}
                      {experience.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Experience</h4>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">{experience[0].title}</span>
                            {experience[0].company && (
                              <span> at {experience[0].company}</span>
                            )}
                            {experience[0].duration && (
                              <span> ({experience[0].duration})</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Display education if available */}
                      {education.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Education</h4>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">{education[0].degree}</span>
                            {education[0].institution && (
                              <span> from {education[0].institution}</span>
                            )}
                            {education[0].year && (
                              <span> ({education[0].year})</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Display certifications if available */}
                      {certifications.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Certifications</h4>
                          <div className="flex flex-wrap gap-1">
                            {certifications.map((cert: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Display languages if available */}
                      {languages.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Languages</h4>
                          <div className="flex flex-wrap gap-1">
                            {languages.map((lang: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Display personal insights if available */}
                      {typeof personalInsights === 'object' && Object.keys(personalInsights).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Professional Insights</h4>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(personalInsights).map(([key, value], index) => (
                              <div key={index}>
                                <h4 className="text-sm font-medium text-gray-700">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                                <p className="text-sm">{
                                  Array.isArray(value)
                                    ? value.filter((v): v is string => typeof v === 'string').join(", ")
                                    : typeof value === 'string' || typeof value === 'number'
                                      ? value.toString()
                                      : ''
                                }</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show metadata about the extraction */}
                      {cvData.extraction_date && (
                        <div className="mt-3 text-xs text-gray-400 flex flex-wrap items-center justify-between">
                          <div>
                            <span>Generated: {new Date(cvData.extraction_date).toLocaleDateString()}</span>
                            {cvData.source && (
                              <span className="ml-1">via {cvData.source}</span>
                            )}
                            {cvData.model && (
                              <span className="ml-1">using {cvData.model}</span>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-blue-600 p-0"
                            onClick={() => setCvProfileDialogOpen(true)}
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
                <SkillsInventory
                  skills={skills}
                  requiredSkills={requiredSkills}
                  missingSkills={missingSkills}
                  onAddSkill={() => {}}
                  onEditSkill={() => {}}
                  isEditable={false}
                  onGenerateLearningPath={handleGenerateLearningPath}
                />
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
                    {summary}
                  </p>
                </div>
              </div>
              
              {/* Skills Section */}
              {Array.isArray(cvSkills) && cvSkills.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Skills & Competencies</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="flex flex-wrap gap-2">
                      {cvSkills.map((skill: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No skills listed</div>
              )}
              
              {/* Experience Section */}
              {experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Professional Experience</h3>
                  <div className="space-y-4">
                    {experience.map((exp: { title: string; company?: string; duration?: string; highlights?: string[]; }, index: number) => (
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
                        {exp.highlights && exp.highlights.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {exp.highlights.map((highlight: string, hIndex: number) => (
                              <li key={hIndex}>{highlight}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Education Section */}
              {education.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Education</h3>
                  <div className="space-y-4">
                    {education.map((edu: { degree?: string; institution?: string; year?: string; }, index: number) => (
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
              {certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Certifications</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {certifications.map((cert: string, index: number) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Languages Section */}
              {languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Languages</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Personal Insights Section */}
              {typeof personalInsights === 'object' && Object.keys(personalInsights).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Professional Insights</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(personalInsights).map(([key, value], index) => (
                        <div key={index}>
                          <h4 className="text-sm font-medium text-gray-700">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                          <p className="text-sm">{
                            Array.isArray(value)
                              ? value.filter((v): v is string => typeof v === 'string').join(", ")
                              : typeof value === 'string' || typeof value === 'number'
                                ? value.toString()
                                : ''
                          }</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Key Achievements Section */}
              {keyAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Achievements</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {keyAchievements.map((achievement: string, index: number) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Professional Interests Section */}
              {professionalInterests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Professional Interests</h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="flex flex-wrap gap-2">
                      {professionalInterests.map((interest: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-amber-100 text-amber-800">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Metadata */}
              {cvData.extraction_date && (
                <div className="pt-4 border-t text-xs text-gray-500">
                  <p>Generated on {new Date(cvData.extraction_date).toLocaleString()}</p>
                  {cvData.source && (
                    <p>Source: {cvData.source}</p>
                  )}
                  {cvData.model && (
                    <p>Model: {cvData.model}</p>
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