import React from 'react';
import { useState, useEffect } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { hrBulkImportService } from '@/services/hrBulkImportService';

interface ImportResult {
  success: boolean;
  message: string;
  employee?: any;
}

interface BulkEmployeeImportProps {
  onComplete?: () => void;
}

const BulkEmployeeImport: React.FC<BulkEmployeeImportProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportResults([]); // Clear previous results
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccessMessage(null);
    setImportResults([]);

    try {
      // Read and parse the CSV file
      const text = await file.text();
      
      // Basic CSV parsing - this should be replaced with a more robust CSV parser
      // for production use
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const employeeData = [];
      
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (values.length === headers.length) {
          const employee: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            employee[header.toLowerCase()] = values[index];
          });
          
          // Make sure required fields exist
          if (employee.name && employee.email) {
            employeeData.push(employee);
          }
        }
      }
      
      // Show progress for file parsing
      setProgress(50);
      
      // Import the employees
      const results = await hrBulkImportService.importEmployees(employeeData);

      if (results.success) {
        setProgress(100);
        setImportResults(results.data.map(employee => ({
          success: true,
          message: `Successfully imported ${employee.name || employee.firstName + ' ' + employee.lastName}`,
          employee
        })));
        
        setSuccessMessage(`Successfully imported ${results.data.length} employees.`);
        
        // Call onComplete if provided
        if (onComplete) {
          setTimeout(onComplete, 1500);
        }
      } else {
        throw new Error(results.message || 'Import failed');
      }
    } catch (e: any) {
      console.error("Error importing data:", e);
      setError(e.message || "Failed to import data");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Employee Import</CardTitle>
        <CardDescription>Import employee data from a CSV file.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <Input type="file" onChange={handleFileChange} disabled={uploading} />
        </div>

        {uploading && (
          <Progress value={progress} className="mb-4" />
        )}

        <Button onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? "Importing..." : "Import"}
          <Upload className="ml-2 h-4 w-4" />
        </Button>

        {importResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Import Results:</h3>
            <ul>
              {importResults.map((result, index) => (
                <li key={index} className="mb-2">
                  {result.success ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between"></CardFooter>
    </Card>
  );
};

export default BulkEmployeeImport;
