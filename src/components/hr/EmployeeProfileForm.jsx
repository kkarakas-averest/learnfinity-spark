import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, FileText, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EmployeeProfileForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    role: '',
    department: '',
    experience: 'entry-level',
    additional_info: '',
  });
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };
  
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.employee_id || !formData.name || !formData.role || !formData.department) {
      setError('Please fill out all required fields');
      return;
    }
    
    // Create form data with files for upload
    const submitData = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    
    // Add files
    uploadedFiles.forEach((file, index) => {
      submitData.append(`document_${index}`, file);
    });
    
    // Submit the form
    onSubmit(submitData);
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create Employee Profile</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input 
                id="employee_id" 
                name="employee_id" 
                value={formData.employee_id} 
                onChange={handleChange} 
                placeholder="EMP001"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="John Doe"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Job Role *</Label>
              <Input 
                id="role" 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                placeholder="Software Developer"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input 
                id="department" 
                name="department" 
                value={formData.department} 
                onChange={handleChange} 
                placeholder="Engineering"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level</Label>
            <Select 
              value={formData.experience} 
              onValueChange={(value) => handleSelectChange('experience', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry-level">Entry-level</SelectItem>
                <SelectItem value="mid-level">Mid-level</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="lead">Lead/Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additional_info">Additional Information</Label>
            <Textarea 
              id="additional_info" 
              name="additional_info" 
              value={formData.additional_info} 
              onChange={handleChange} 
              placeholder="Enter any additional information about the employee's background, skills, interests, or learning preferences..."
              rows={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Upload Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 mb-2">
                Upload employee documents (resume, certifications, etc.)
              </p>
              <Input
                type="file"
                id="documents"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => document.getElementById('documents').click()}
              >
                Select Files
              </Button>
            </div>
            
            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Uploaded Files:</h4>
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center bg-secondary p-2 rounded">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmployeeProfileForm; 