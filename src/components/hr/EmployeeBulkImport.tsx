import React, { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';
import { generateEmployeeCSVTemplate } from '@/lib/utils/csvTemplates';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

// Define the expected response type for bulkImportEmployees
interface BulkImportResponse {
  success: boolean;
  importedCount?: number;
  error?: string;
}

const EmployeeBulkImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const { toast } = useToast();

  // Fetch departments and positions on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Get departments
        const deptResult = await hrEmployeeService.getDepartments();
        if (deptResult.success) {
          setDepartments(deptResult.departments || []);
        }
        
        // Get positions - mock implementation until API is added
        // This would need to be implemented in hrEmployeeService
        const posResult = await getMockPositions();
        setPositions(posResult);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, []);
  
  // Mock function to get positions until API is implemented
  const getMockPositions = async (): Promise<Position[]> => {
    return [
      { id: "pos-1", title: "Software Engineer" },
      { id: "pos-2", title: "Product Manager" },
      { id: "pos-3", title: "UX Designer" }
    ];
  };
  
  // Generate an enhanced CSV template with actual department and position IDs
  const handleDownloadTemplate = () => {
    // This calls our utility function to download the CSV template
    generateEmployeeCSVTemplate();
    
    toast({
      title: "Template Downloaded",
      description: "Employee import template has been downloaded.",
      duration: 3000,
    });
  };
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file type (must be CSV)
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setFile(selectedFile);
  };
  
  // Handle file upload and processing
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev: number) => {
          const newProgress = prev + 15;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 500);
      
      // Mock implementation for bulk import until API is available
      const result = await mockBulkImportEmployees(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        setSuccess(`Successfully imported ${result.importedCount} employees`);
        toast({
          title: "Import Successful",
          description: `${result.importedCount} employees have been imported.`,
          duration: 5000,
        });
      } else {
        setError(result.error || 'Failed to process import');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Mock implementation for bulk import until API is available
  const mockBulkImportEmployees = async (file: File): Promise<BulkImportResponse> => {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // Simulate successful import
        resolve({
          success: true,
          importedCount: 5 // Mock importing 5 employees
        });
      }, 2000);
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Employee Import</CardTitle>
        <CardDescription>
          Import multiple employees at once using a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Step 1: Download Template</h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
            <p className="text-xs text-muted-foreground">
              Use this template to prepare your employee data
            </p>
          </div>
          
          <div className="mt-4 bg-muted p-3 rounded-md text-xs">
            <h4 className="font-medium mb-1">CSV Format Guide:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>name</strong>: Full name of employee (Required)</li>
              <li><strong>email</strong>: Email address (Required)</li>
              <li><strong>department_id</strong>: Department ID (Required)</li>
              <li><strong>position_id</strong>: Position ID (Required)</li>
              <li><strong>phone</strong>: Phone number (Optional)</li>
              <li><strong>hire_date</strong>: Date in YYYY-MM-DD format (Optional)</li>
              <li><strong>status</strong>: active, inactive, or onboarding (Optional, defaults to active)</li>
            </ul>
          </div>
          
          <div className="mt-4">
            <h4 className="text-xs font-medium mb-1">Available Department IDs:</h4>
            <div className="max-h-24 overflow-y-auto text-xs bg-muted p-2 rounded-md">
              {departments.map((dept: Department) => (
                <div key={dept.id} className="mb-1">
                  <span className="font-mono text-blue-600">{dept.id}</span>: {dept.name}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-2">
            <h4 className="text-xs font-medium mb-1">Available Position IDs:</h4>
            <div className="max-h-24 overflow-y-auto text-xs bg-muted p-2 rounded-md">
              {positions.map((pos: Position) => (
                <div key={pos.id} className="mb-1">
                  <span className="font-mono text-blue-600">{pos.id}</span>: {pos.title}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Step 2: Upload Your CSV</h3>
          <div className="grid w-full max-w-md items-center gap-1.5">
            <Label htmlFor="csv-upload">CSV File</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          
          {file && (
            <div className="mt-2 flex items-center text-sm">
              <FileSpreadsheet className="h-4 w-4 mr-1 text-green-500" />
              <span>{file.name}</span>
            </div>
          )}
          
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mt-4 border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full md:w-auto"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Processing...' : 'Upload and Import'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmployeeBulkImport; 