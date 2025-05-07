import { saveAs } from 'file-saver';

/**
 * Generate and download a CSV template for bulk employee imports
 * Based on the hr_employees table schema and required fields
 */
export const generateEmployeeCSVTemplate = () => {
  // CSV header row based on required employee fields in our schema
  const headers = [
    'name',
    'email',
    'department_id',
    'position_id',
    'phone',
    'hire_date',
    'status'
  ];
  
  // Example row with format instructions
  const exampleRow = [
    'John Doe',
    'john.doe@example.com',
    'dept_id_here', // Will be replaced with actual UUID in UI
    'position_id_here', // Will be replaced with actual UUID in UI
    '+1234567890',
    '2023-11-20', // YYYY-MM-DD format
    'active' // active, inactive, onboarding
  ];
  
  // Create CSV content with headers and example row
  let csvContent = headers.join(',') + '\n';
  csvContent += exampleRow.join(',') + '\n';
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, 'employee_import_template.csv');
};

/**
 * Helper function to convert employee data to CSV format
 * @param employees Array of employee objects
 * @returns CSV string representation
 */
export const convertEmployeesToCSV = (employees: any[]) => {
  // Define the headers based on our schema
  const headers = [
    'name',
    'email',
    'department_id',
    'position_id',
    'phone',
    'hire_date',
    'status'
  ];
  
  // Create CSV header row
  let csvContent = headers.join(',') + '\n';
  
  // Add employee rows
  employees.forEach(employee => {
    const row = [
      employee.name || '',
      employee.email || '',
      employee.department_id || '',
      employee.position_id || '',
      employee.phone || '',
      employee.hire_date || '',
      employee.status || 'active'
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}; 