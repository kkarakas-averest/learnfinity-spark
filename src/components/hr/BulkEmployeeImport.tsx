import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadIcon, CheckCircleIcon, CircleIcon } from 'lucide-react';
import { hrBulkImportService } from '@/services/hrBulkImportService';
import { Progress } from '@/components/ui/progress';

interface ImportResult {
  success: boolean;
  message: string;
  employee?: any;
}

const BulkEmployeeImport = () => {
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
      const results = await hrBulkImportService.importEmployeesFromCSV(file, (uploadProgress) => {
        setProgress(Math.round((uploadProgress.loaded / uploadProgress.total) * 100));
      });

      setImportResults(results);
      setSuccessMessage("File imported successfully!");
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
            <CircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <CheckCircleIcon className="h-4 w-4" />
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
          <UploadIcon className="ml-2 h-4 w-4" />
        </Button>

        {importResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Import Results:</h3>
            <ul>
              {importResults.map((result, index) => (
                <li key={index} className="mb-2">
                  {result.success ? (
                    <Alert>
                      <CheckCircleIcon className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <CircleIcon className="h-4 w-4" />
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
