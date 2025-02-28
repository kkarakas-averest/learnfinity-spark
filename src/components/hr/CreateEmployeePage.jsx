import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import EmployeeProfileForm from './EmployeeProfileForm';
import agentProfileService from '@/services/agentProfileService';

const CreateEmployeePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await agentProfileService.submitEmployeeProfile(formData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create employee profile');
      }
      
      setResult(response);
    } catch (err) {
      console.error('Error creating employee profile:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoBack = () => {
    navigate('/hr/employees');
  };
  
  const handleCreateAnother = () => {
    setResult(null);
    setError(null);
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create Employee Profile</h1>
        </div>
      </div>
      
      <Separator />
      
      {/* Success message */}
      {result && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Profile Created Successfully</AlertTitle>
          <AlertDescription className="text-green-700">
            The employee profile for {result.employeeRecord.name} has been created and submitted for AI processing.
            <div className="mt-4 flex space-x-4">
              <Button onClick={handleCreateAnother}>Create Another Profile</Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/hr/employees/view/${result.employeeRecord.id}`)}
              >
                View Profile
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error Creating Profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Form */}
      {!result && (
        <EmployeeProfileForm 
          onSubmit={handleSubmit} 
          isLoading={isSubmitting} 
        />
      )}
      
      {/* Instructions */}
      {!result && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">What happens next?</h3>
          <p className="text-blue-700 mb-2">
            After submitting this form:
          </p>
          <ol className="list-decimal list-inside text-blue-700 space-y-1 ml-2">
            <li>Our AI agent will analyze the employee information</li>
            <li>A personalized learning profile will be created</li>
            <li>The content creation agent will generate relevant courses</li>
            <li>The employee will be able to access their personalized learning path</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default CreateEmployeePage; 