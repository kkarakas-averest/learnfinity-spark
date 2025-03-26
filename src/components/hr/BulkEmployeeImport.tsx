
import React, { useState, useRef } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileUp, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Loader2,
  User,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

import { 
  parseEmployeeCSV, 
  validateEmployeeCSV, 
  type EmployeeCSVRow 
} from '@/utils/csv/parseEmployeeCSV';
import { hrBulkImportService } from '@/services/hrBulkImportService';

export function BulkEmployeeImport({ onComplete }: { onComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<EmployeeCSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; message: string; data: EmployeeCSVRow }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportResults(null);
    setActiveTab('preview');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check if it's a CSV file
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    try {
      // Parse CSV
      const result = await parseEmployeeCSV(selectedFile);
      
      // Validate data
      const { validEmployees, errors } = validateEmployeeCSV(result.data);
      
      setParsedData(validEmployees);
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        toast.warning(`${errors.length} rows contain errors. Please review before importing.`);
      } else {
        toast.success(`CSV file parsed successfully with ${validEmployees.length} valid employees.`);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file. Please check the format.');
    }
  };
  
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('No valid employees to import');
      return;
    }
    
    try {
      setIsUploading(true);
      
      const result = await hrBulkImportService.importEmployees(parsedData);
      
      setImportResults(result);
      setActiveTab('results');
      
      if (result.success) {
        toast.success(`Successfully imported ${result.data.length} employees`);
        
        // Show credentials dialog if there are successful imports
        if (result.userAccounts && result.userAccounts.some((acc: any) => acc.success)) {
          setShowCredentialsDialog(true);
        }
        
        // Notify parent component
        if (onComplete) onComplete();
      } else {
        toast.error(`Failed to import employees: ${result.message}`);
      }
    } catch (error) {
      console.error('Error importing employees:', error);
      toast.error('An unexpected error occurred during import');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    const template = hrBulkImportService.generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadErrors = () => {
    if (validationErrors.length === 0) return;
    
    // Create CSV with headers
    const headers = Object.keys(validationErrors[0].data);
    headers.push('error_message');
    
    let csv = headers.join(',') + '\n';
    
    // Add rows
    validationErrors.forEach(({ data, message }) => {
      const rowValues = headers.map(header => {
        if (header === 'error_message') return `"${message}"`;
        const value = data[header] || '';
        return `"${value}"`;
      });
      
      csv += rowValues.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_errors.csv';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCopyCredentials = () => {
    if (!importResults?.userAccounts) return;
    
    const successfulAccounts = importResults.userAccounts.filter((acc: any) => acc.success);
    if (successfulAccounts.length === 0) return;
    
    // Format the credentials
    let credentialsText = "Employee Credentials:\n\n";
    
    successfulAccounts.forEach((account: any) => {
      credentialsText += `Email: ${account.email}\n`;
      credentialsText += `Temporary Password: ${account.temp_password}\n\n`;
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(credentialsText);
    toast.success('Credentials copied to clipboard');
  };
  
  // Preview Table
  const renderPreviewTable = () => {
    if (!parsedData.length && !validationErrors.length) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <p>No data to preview. Please upload a CSV file.</p>
        </div>
      );
    }
    
    // Get all unique headers from both valid and invalid data
    const allData = [...parsedData, ...validationErrors.map(err => err.data)];
    const headers = allData.length > 0 
      ? Array.from(new Set(allData.flatMap(row => Object.keys(row))))
      : [];
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Row</TableHead>
              <TableHead className="w-20">Status</TableHead>
              {headers.map(header => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Valid rows */}
            {parsedData.map((row, index) => (
              <TableRow key={`valid-${index}`}>
                <TableCell>{index + 2}</TableCell>
                <TableCell>
                  <Badge variant="success" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                </TableCell>
                {headers.map(header => (
                  <TableCell key={header}>{row[header] || ''}</TableCell>
                ))}
                <TableCell>-</TableCell>
              </TableRow>
            ))}
            
            {/* Invalid rows */}
            {validationErrors.map(({ row, message, data }, index) => (
              <TableRow key={`error-${index}`} className="bg-red-50">
                <TableCell>{data.row}</TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </Badge>
                </TableCell>
                {headers.map(header => (
                  <TableCell key={header}>{data[header] || ''}</TableCell>
                ))}
                <TableCell className="text-red-500">{message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Results Table
  const renderResultsTable = () => {
    if (!importResults || !importResults.userAccounts) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <p>No import results available.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {importResults.userAccounts.map((account: any, index: number) => (
              <TableRow key={index} className={account.success ? '' : 'bg-red-50'}>
                <TableCell>{account.email}</TableCell>
                <TableCell>
                  {account.success ? (
                    <Badge variant="success" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {account.success ? (
                    <span className="text-sm">User account created</span>
                  ) : (
                    <span className="text-sm text-red-500">{account.error}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyCredentials}
              variant="outline"
              size="sm"
              disabled={!importResults.userAccounts.some((acc: any) => acc.success)}
            >
              Copy All Credentials
            </Button>
            
            <Button
              onClick={() => setShowCredentialsDialog(true)}
              variant="outline"
              size="sm"
              disabled={!importResults.userAccounts.some((acc: any) => acc.success)}
            >
              View Credentials
            </Button>
          </div>
          
          <div>
            <Button onClick={resetState} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Start New Import
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Summary of valid and invalid rows
  const renderSummary = () => {
    const totalRows = parsedData.length + validationErrors.length;
    const validPercentage = totalRows > 0 ? (parsedData.length / totalRows) * 100 : 0;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm">
            <span className="font-medium">{parsedData.length}</span> valid rows
          </span>
          <span className="text-sm">
            <span className="font-medium">{validationErrors.length}</span> invalid rows
          </span>
        </div>
        <Progress value={validPercentage} className="h-2" />
      </div>
    );
  };
  
  return (
    <Card className="shadow-sm border">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Bulk Employee Import</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Upload a CSV file to import multiple employees at once. You can download a template to get started.
          </p>
          
          <div className="flex items-center space-x-2 mb-6">
            <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            
            <div className="relative flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
          </div>
          
          {(parsedData.length > 0 || validationErrors.length > 0) && renderSummary()}
          
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                {validationErrors.length} rows contain errors. Please fix these issues before importing.
                <Button
                  onClick={handleDownloadErrors}
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download Errors CSV
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs 
            defaultValue="preview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-4"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="results" disabled={!importResults}>Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="p-0">
              {renderPreviewTable()}
            </TabsContent>
            
            <TabsContent value="results" className="p-0">
              {renderResultsTable()}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-end mt-4">
          <div className="flex space-x-2">
            <Button
              onClick={resetState}
              variant="ghost"
              disabled={!(parsedData.length > 0 || validationErrors.length > 0) || isUploading}
            >
              Clear
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  Import {parsedData.length} Employees
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Credentials</DialogTitle>
            <DialogDescription>
              Temporary login credentials for imported employees. These passwords should be changed on first login.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Temporary Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importResults?.userAccounts
                  ?.filter((acc: any) => acc.success)
                  .map((account: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">{account.email}</TableCell>
                    <TableCell className="font-mono">{account.temp_password}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCopyCredentials}>
              Copy All Credentials
            </Button>
            <Button onClick={() => setShowCredentialsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
