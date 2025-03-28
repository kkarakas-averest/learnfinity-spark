import React, { useState, useEffect } from '@/lib/react-helpers';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, Upload } from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department_id?: string;
  position_id?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status?: string;
  skills?: string[];
  profile_image_url?: string;
  user_id?: string;
}

interface Skill {
  id: string;
  name: string;
  proficiency_level?: string;
}

const EditEmployeePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    status: 'active',
    skills: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch employee
        const { data: employeeData, error: employeeError } = await hrEmployeeService.getEmployee(id);
        
        if (employeeError) throw new Error('Failed to fetch employee data');
        
        if (employeeData) {
          const typedEmployeeData = employeeData as Employee;
          setEmployee(typedEmployeeData);
          
          // Initialize form with employee data
          setFormData({
            name: typedEmployeeData.name || '',
            email: typedEmployeeData.email || '',
            phone: typedEmployeeData.phone || '',
            department_id: typedEmployeeData.department_id || '',
            position_id: typedEmployeeData.position_id || '',
            hire_date: typedEmployeeData.hire_date || '',
            status: typedEmployeeData.status || 'active',
            skills: Array.isArray(typedEmployeeData.skills) 
              ? typedEmployeeData.skills.join(', ') 
              : ''
          });
          
          if (typedEmployeeData.profile_image_url) {
            setProfileImagePreview(typedEmployeeData.profile_image_url);
          }
          
          // Safely fetch employee's skills
          try {
            const { data: skillData, error: skillError } = await supabase
              .from('hr_employee_skills')
              .select('skill_name')
              .eq('employee_id', id);
              
            if (!skillError && skillData) {
              const employeeSkills = skillData.map(s => s.skill_name);
              setSelectedSkills(employeeSkills);
            } else if (skillError && skillError.code === '42P01') {
              // Table doesn't exist, use empty array
              console.warn('Skills table does not exist, using empty array');
              setSelectedSkills([]);
            }
          } catch (skillError) {
            console.error('Error fetching skills:', skillError);
            // Continue with empty skills
            setSelectedSkills([]);
          }
        }
        
        // Fetch departments
        const { departments: deptData, error: deptError } = await hrEmployeeService.getDepartments();
        
        if (deptError) {
          console.error('Error fetching departments:', deptError);
        } else {
          setDepartments(deptData || []);
        }
        
        // Fetch positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('hr_positions')
          .select('id, title, department_id');
          
        if (!positionsError) {
          setPositions(positionsData || []);
          
          // Filter positions based on selected department
          if (employeeData?.department_id) {
            const filtered = positionsData.filter(
              pos => pos.department_id === employeeData.department_id
            );
            setFilteredPositions(filtered);
          } else {
            setFilteredPositions(positionsData);
          }
        }
        
        // Safely fetch available skills
        try {
          const { data: availableSkillsData, error: availableSkillsError } = await supabase
            .from('hr_skills')
            .select('id, name');
            
          if (!availableSkillsError) {
            setAvailableSkills(availableSkillsData || []);
          } else if (availableSkillsError.code === '42P01') {
            // If skills table doesn't exist, use empty array
            console.warn('Skills table does not exist, using empty array');
            setAvailableSkills([]);
          }
        } catch (skillsError) {
          console.error('Error fetching available skills:', skillsError);
          setAvailableSkills([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load employee data'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Update filtered positions when department changes
  useEffect(() => {
    if (formData.department_id) {
      const filtered = positions.filter(
        pos => pos.department_id === formData.department_id
      );
      setFilteredPositions(filtered);
    } else {
      setFilteredPositions(positions);
    }
  }, [formData.department_id, positions]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset position when department changes
    if (name === 'department_id') {
      setFormData(prev => ({ ...prev, position_id: '' }));
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
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSkillSelect = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };
  
  const handleAddNewSkill = () => {
    if (!newSkill.trim()) return;
    
    // Check if skill already exists in selectedSkills
    if (selectedSkills.includes(newSkill.trim())) {
      toast({
        title: 'Skill already added',
        description: 'This skill is already in the list'
      });
      return;
    }
    
    setSelectedSkills([...selectedSkills, newSkill.trim()]);
    setNewSkill('');
  };
  
  const uploadProfileImage = async (): Promise<string | null> => {
    if (!profileImage || !id) return null;
    
    try {
      console.log("Uploading profile image...");
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setSubmitting(true);
    try {
      // Upload profile image if changed
      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadProfileImage();
      }
      
      // Get current employee data to preserve user_id if it exists
      const { data: currentEmployee } = await hrEmployeeService.getEmployee(id);
      
      // Prepare data for update
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department_id: formData.department_id,
        position_id: formData.position_id,
        hire_date: formData.hire_date,
        status: formData.status,
        // Preserve user_id if it exists
        ...(currentEmployee && 'user_id' in currentEmployee && { user_id: currentEmployee.user_id }),
        ...(profileImageUrl && { profile_image_url: profileImageUrl })
      };
      
      console.log("Updating employee with data:", updateData);
      
      // Update employee
      const { success, error } = await hrEmployeeService.updateEmployee(id, updateData);
      
      if (error) throw error;
      
      // Try to update skills - handle errors gracefully if table doesn't exist
      try {
        // First try to delete existing skills
        const { error: deleteError } = await supabase
          .from('hr_employee_skills')
          .delete()
          .eq('employee_id', id);
        
        // If the table doesn't exist, we can try to create it with our new skills
        if (deleteError && deleteError.code === '42P01') {
          console.warn('hr_employee_skills table does not exist, will attempt to create it');
        } else if (deleteError) {
          console.error('Error deleting existing skills:', deleteError);
        }
        
        // Add selected skills if we have any
        if (selectedSkills.length > 0) {
          // Prepare skill records
          const skillRecords = selectedSkills.map(skillName => ({
            employee_id: id,
            skill_name: skillName,
            proficiency_level: 'intermediate',
            is_in_progress: false
          }));
          
          // Insert skills in a single operation
          const { error: insertError } = await supabase
            .from('hr_employee_skills')
            .insert(skillRecords);
          
          if (insertError && insertError.code !== '42P01') {
            console.error('Error adding skills:', insertError);
          }
        }
      } catch (skillsError) {
        console.error('Error updating skills:', skillsError);
        // Continue with the update, don't fail the whole operation
      }
      
      toast({
        title: 'Success',
        description: 'Employee profile updated successfully. Changes are automatically synced to the learner dashboard.'
      });
      
      // Navigate back to employee profile
      navigate(`${ROUTES.HR_DASHBOARD}/employees/${id}`);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update employee profile'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Employee</h1>
        <Button 
          variant="outline"
          onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees/${id}`)}
        >
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-8">
              <div className="relative">
                <Avatar className="h-32 w-32 border-2">
                  {profileImagePreview ? (
                    <AvatarImage src={profileImagePreview} alt={formData.name} />
                  ) : (
                    <AvatarFallback className="text-3xl">
                      {formData.name.charAt(0).toUpperCase()}
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
                <h3 className="text-lg font-medium">{formData.name || 'Employee Name'}</h3>
                <p className="text-sm text-gray-500">{formData.email || 'employee@example.com'}</p>
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
                  value={formData.name}
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
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
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
                  value={formData.hire_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department_id}
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
                  value={formData.position_id}
                  onValueChange={(value) => handleSelectChange('position_id', value)}
                  disabled={!formData.department_id}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder={!formData.department_id ? "Select department first" : "Select position"} />
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
                  value={formData.status}
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
            
            {/* Skills Section */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Skills & Competencies</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSkills.map((skill) => (
                  <Badge key={skill} className="py-2 px-3 flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillSelect(skill)}
                      className="ml-1 text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedSkills.length === 0 && (
                  <p className="text-sm text-gray-500">No skills selected. Select from available skills or add new ones.</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="availableSkills">Available Skills</Label>
                  <div className="border rounded-md p-3 h-[200px] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableSkills.map((skill) => (
                        <div key={skill.id} className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-md">
                          <input
                            type="checkbox"
                            id={`skill-${skill.id}`}
                            checked={selectedSkills.includes(skill.name)}
                            onChange={() => handleSkillSelect(skill.name)}
                            className="rounded text-primary"
                          />
                          <Label htmlFor={`skill-${skill.id}`} className="cursor-pointer">
                            {skill.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newSkill">Add New Skill</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="newSkill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Enter skill name"
                    />
                    <Button 
                      type="button" 
                      size="icon"
                      onClick={handleAddNewSkill}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees/${id}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditEmployeePage;
