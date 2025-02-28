import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHRAuth } from '@/contexts/HRAuthContext';

const EmployeeProfileForm = ({ onSubmit, isLoading, departments = [], positions = [] }) => {
  const { hrUser } = useHRAuth() || {};
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    departmentId: '',
    positionId: '',
    status: 'active',
    notes: '',
    companyId: '',
  });
  
  const [error, setError] = useState(null);
  
  // Set the company ID from the HR user's context when component mounts
  useEffect(() => {
    if (hrUser?.company_id) {
      setFormData(prev => ({
        ...prev,
        companyId: hrUser.company_id
      }));
    }
  }, [hrUser]);
  
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.departmentId) {
      setError('Please fill out all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Ensure company ID is set
    if (!formData.companyId) {
      console.warn('Company ID not set. Using default or null value.');
    }
    
    // Submit the form
    onSubmit(formData);
  };
  
  // Filter positions based on selected department
  const filteredPositions = formData.departmentId
    ? positions.filter(pos => pos.department_id === formData.departmentId)
    : positions;
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Employee Information</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input 
              id="email" 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleChange} 
              placeholder="john.doe@example.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              Employee will be automatically registered with this email address
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department *</Label>
              <Select 
                value={formData.departmentId} 
                onValueChange={(value) => handleSelectChange('departmentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="positionId">Position</Label>
              <Select 
                value={formData.positionId} 
                onValueChange={(value) => handleSelectChange('positionId', value)}
                disabled={!formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              placeholder="Any additional notes about the employee..."
              rows={3}
            />
          </div>

          {/* Hidden input for company ID - populated automatically from HR user context */}
          <input type="hidden" name="companyId" value={formData.companyId} />
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Employee...' : 'Create Employee'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmployeeProfileForm; 