
import Papa from 'papaparse';

export interface EmployeeCSVRow {
  name: string;
  email: string;
  position?: string;
  department?: string;
  phone?: string;
  hire_date?: string;
  status?: 'active' | 'inactive' | 'onboarding' | 'terminated';
  [key: string]: string | undefined; // For any additional columns
}

export interface CSVParseResult {
  data: EmployeeCSVRow[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

/**
 * Parse CSV file with employee data
 * @param file CSV file to parse
 * @returns Promise with parsed data
 */
export const parseEmployeeCSV = (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse<EmployeeCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings for validation
      complete: (results) => {
        resolve({
          data: results.data,
          errors: results.errors,
          meta: results.meta
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Validate employee CSV data
 * @param data Parsed CSV data
 * @returns Object with valid employees and errors
 */
export const validateEmployeeCSV = (data: EmployeeCSVRow[]) => {
  const validEmployees: EmployeeCSVRow[] = [];
  const errors: { row: number; message: string; data: EmployeeCSVRow }[] = [];

  data.forEach((row, index) => {
    const rowErrors: string[] = [];

    // Check required fields
    if (!row.name || row.name.trim() === '') {
      rowErrors.push('Name is required');
    }

    if (!row.email || row.email.trim() === '') {
      rowErrors.push('Email is required');
    } else if (!isValidEmail(row.email)) {
      rowErrors.push('Email is invalid');
    }

    // Status validation
    if (row.status && !['active', 'inactive', 'onboarding', 'terminated'].includes(row.status)) {
      rowErrors.push('Status must be one of: active, inactive, onboarding, terminated');
    }

    // Date validation
    if (row.hire_date && !isValidDate(row.hire_date)) {
      rowErrors.push('Hire date is invalid (use YYYY-MM-DD format)');
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: index + 2, // +2 because of 0-indexing and header row
        message: rowErrors.join('; '),
        data: row
      });
    } else {
      validEmployees.push(row);
    }
  });

  return {
    validEmployees,
    errors
  };
};

// Helper functions for validation
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidDate = (dateString: string) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};
