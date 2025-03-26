
import { supabase } from '@/lib/supabase-client';
import { EmployeeCSVRow } from '@/utils/csv/parseEmployeeCSV';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling bulk employee imports
 */
export const hrBulkImportService = {
  /**
   * Import multiple employees from CSV data
   * @param employees Array of employee data from CSV
   * @returns Promise with results of import operation
   */
  async importEmployees(employees: EmployeeCSVRow[]) {
    try {
      // First, check if departments and positions exist and create them if needed
      await this.ensureDepartmentsExist(employees);
      await this.ensurePositionsExist(employees);
      
      // Prepare employees for insertion with department and position IDs
      const preparedEmployees = await this.prepareEmployeesForInsertion(employees);
      
      // Insert employees in batches to avoid hitting limits
      const batchSize = 50;
      const results = [];
      
      for (let i = 0; i < preparedEmployees.length; i += batchSize) {
        const batch = preparedEmployees.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('hr_employees')
          .insert(batch)
          .select();
        
        if (error) {
          console.error('Error inserting employee batch:', error);
          throw error;
        }
        
        results.push(...(data || []));
      }
      
      // Create user accounts for each employee
      const userAccounts = await this.createUserAccounts(results);
      
      return { 
        success: true, 
        message: `Successfully imported ${results.length} employees`, 
        data: results,
        userAccounts
      };
    } catch (error) {
      console.error('Error in bulk employee import:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error during import',
        error 
      };
    }
  },
  
  /**
   * Ensure all departments from CSV exist in the database
   * @param employees Array of employee data
   */
  async ensureDepartmentsExist(employees: EmployeeCSVRow[]) {
    // Extract unique departments
    const departments = [...new Set(
      employees
        .filter(emp => emp.department && emp.department.trim() !== '')
        .map(emp => emp.department!.trim())
    )];
    
    if (departments.length === 0) return;
    
    // Check which departments already exist
    const { data: existingDepts } = await supabase
      .from('hr_departments')
      .select('name')
      .in('name', departments);
      
    const existingDeptNames = existingDepts?.map(d => d.name) || [];
    
    // Create departments that don't exist
    const newDepartments = departments
      .filter(dept => !existingDeptNames.includes(dept))
      .map(name => ({ 
        id: uuidv4(),
        name 
      }));
    
    if (newDepartments.length > 0) {
      const { error } = await supabase
        .from('hr_departments')
        .insert(newDepartments);
        
      if (error) {
        throw new Error(`Failed to create departments: ${error.message}`);
      }
    }
  },
  
  /**
   * Ensure all position/department combinations from CSV exist
   * @param employees Array of employee data
   */
  async ensurePositionsExist(employees: EmployeeCSVRow[]) {
    // Get position/department combinations
    const positionDeptPairs = [...new Set(
      employees
        .filter(emp => 
          emp.position && emp.position.trim() !== '' && 
          emp.department && emp.department.trim() !== '')
        .map(emp => `${emp.position!.trim()}|${emp.department!.trim()}`)
    )].map(pair => {
      const [position, department] = pair.split('|');
      return { position, department };
    });
    
    if (positionDeptPairs.length === 0) return;
    
    // Get all departments
    const { data: departments } = await supabase
      .from('hr_departments')
      .select('id, name');
      
    if (!departments) throw new Error('Failed to fetch departments');
    
    const departmentMap = departments.reduce((acc, dept) => {
      acc[dept.name] = dept.id;
      return acc;
    }, {} as Record<string, string>);
    
    // Check which positions already exist
    for (const { position, department } of positionDeptPairs) {
      const departmentId = departmentMap[department];
      if (!departmentId) continue;
      
      const { data: existingPositions } = await supabase
        .from('hr_positions')
        .select('id')
        .eq('title', position)
        .eq('department_id', departmentId);
        
      if (existingPositions && existingPositions.length > 0) continue;
      
      // Create the position if it doesn't exist
      const { error } = await supabase
        .from('hr_positions')
        .insert({
          id: uuidv4(),
          title: position,
          department_id: departmentId
        });
        
      if (error) {
        throw new Error(`Failed to create position "${position}": ${error.message}`);
      }
    }
  },
  
  /**
   * Prepare employee data for insertion with correct IDs
   * @param employees Array of employee data from CSV
   */
  async prepareEmployeesForInsertion(employees: EmployeeCSVRow[]) {
    // Get departments and positions for lookup
    const { data: departments } = await supabase
      .from('hr_departments')
      .select('id, name');
      
    const { data: positions } = await supabase
      .from('hr_positions')
      .select('id, title, department_id');
      
    if (!departments || !positions) {
      throw new Error('Failed to fetch departments or positions');
    }
    
    // Create lookup maps
    const departmentMap = departments.reduce((acc, dept) => {
      acc[dept.name] = dept.id;
      return acc;
    }, {} as Record<string, string>);
    
    const positionMap = positions.reduce((acc, pos) => {
      // Key is title|department_id to handle cases where same title exists in different departments
      acc[`${pos.title}|${pos.department_id}`] = pos.id;
      return acc;
    }, {} as Record<string, string>);
    
    // Prepare employees with correct IDs
    return employees.map(emp => {
      const departmentId = emp.department ? departmentMap[emp.department.trim()] : null;
      
      let positionId = null;
      if (emp.position && departmentId) {
        positionId = positionMap[`${emp.position.trim()}|${departmentId}`];
      }
      
      const hireDate = emp.hire_date ? new Date(emp.hire_date).toISOString() : null;
      
      return {
        id: uuidv4(),
        name: emp.name.trim(),
        email: emp.email.trim(),
        department_id: departmentId,
        position_id: positionId,
        phone: emp.phone,
        hire_date: hireDate,
        status: emp.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  },
  
  /**
   * Create user accounts for imported employees
   * @param employees Array of imported employees
   */
  async createUserAccounts(employees: any[]) {
    const results = [];
    
    for (const employee of employees) {
      try {
        // Generate a temporary password
        const tempPassword = `Welcome${Math.floor(Math.random() * 10000)}!`;
        
        // Create the user account with Supabase Auth
        const { data, error } = await supabase.auth.admin.createUser({
          email: employee.email,
          password: tempPassword,
          email_confirm: true, // Skip email verification
          user_metadata: {
            name: employee.name,
            role: 'learner'
          }
        });
        
        if (error) {
          console.error(`Error creating user account for ${employee.email}:`, error);
          results.push({
            employee_id: employee.id,
            email: employee.email,
            success: false,
            error: error.message
          });
          continue;
        }
        
        // Update the employee record with the user ID
        await supabase
          .from('hr_employees')
          .update({ user_id: data.user.id })
          .eq('id', employee.id);
        
        results.push({
          employee_id: employee.id,
          user_id: data.user.id,
          email: employee.email,
          temp_password: tempPassword,
          success: true
        });
      } catch (error) {
        console.error(`Exception creating user account for ${employee.email}:`, error);
        results.push({
          employee_id: employee.id,
          email: employee.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  },
  
  /**
   * Generate CSV template for employee imports
   * @returns CSV string with headers
   */
  generateCSVTemplate() {
    const headers = [
      'name',
      'email',
      'department',
      'position',
      'phone',
      'hire_date',
      'status'
    ];
    
    const examples = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        department: 'Engineering',
        position: 'Software Engineer',
        phone: '555-123-4567',
        hire_date: '2023-01-15',
        status: 'active'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        department: 'Marketing',
        position: 'Marketing Specialist',
        phone: '555-987-6543',
        hire_date: '2023-02-01',
        status: 'onboarding'
      }
    ];
    
    // Convert to CSV
    let csv = headers.join(',') + '\n';
    
    examples.forEach(example => {
      const row = headers.map(header => {
        const value = example[header as keyof typeof example] || '';
        return `"${value}"`;
      }).join(',');
      
      csv += row + '\n';
    });
    
    return csv;
  }
};
