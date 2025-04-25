import React, { useState, useEffect } from '@/lib/react-helpers';
import { supabase } from '@/lib/supabase';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHRAuth } from '@/contexts/HRAuthContext';

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string;
  company_id: string;
  status: string;
}

const TestUtility: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [diagnosticResults, setDiagnosticResults] = useState<string>('');
  const { hrUser } = useHRAuth();

  useEffect(() => {
    fetchTables();
    fetchAllEmployees();
    fetchDepartments();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');

      if (error) {
        console.error('Error fetching tables:', error);
        return;
      }

      if (data) {
        setTables(data.map(t => t.tablename as string));
      }
    } catch (error) {
      console.error('Exception fetching tables:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      // Direct query without filters to see ALL employees
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*');

      if (error) {
        console.error('Error fetching all employees:', error);
        return;
      }

      console.log('Direct query found employees:', data);
      setEmployees(data || []);
    } catch (error) {
      console.error('Exception fetching all employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*');

      if (error) {
        console.error('Error fetching departments:', error);
        return;
      }

      setDepartments(data || []);
    } catch (error) {
      console.error('Exception fetching departments:', error);
    }
  };

  const createTestEmployee = async () => {
    try {
      setLoading(true);
      
      if (!departments || departments.length === 0) {
        alert('No departments found. Please create a department first.');
        return;
      }
      
      const currentCompanyId = hrUser?.company_id || '4fb1a692-3995-40ee-8aa5-292fd8ebf029';
      
      // Create a timestamp for uniqueness
      const timestamp = new Date().getTime();
      
      const newEmployee = {
        name: `Test Employee ${timestamp}`,
        email: `test.employee.${timestamp}@example.com`,
        department_id: departments[0].id,
        status: 'active',
        company_id: currentCompanyId
      };
      
      console.log('Creating test employee:', newEmployee);
      
      const result = await hrEmployeeService.createEmployee(newEmployee);
      
      if (result && 'success' in result && result.success) {
        // Type guard for result.data
        const employeeData = (result as { data?: Employee }).data;
        console.log('Test employee created:', employeeData);
        alert('Test employee created successfully!');
        fetchAllEmployees(); // Refresh the list
      } else {
        console.error('Failed to create test employee:', result.error);
        alert(`Failed to create test employee: ${result.error}`);
      }
    } catch (error) {
      console.error('Exception creating test employee:', error);
      alert(`Exception creating test employee: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      let results = '';
      
      // 1. Get current user info
      results += `Current HR User: ${JSON.stringify(hrUser)}\n\n`;
      
      // 2. Check company ID query
      const companyId = hrUser?.company_id || '4fb1a692-3995-40ee-8aa5-292fd8ebf029';
      results += `Using company ID: ${companyId}\n`;
      
      // 3. Direct count of employees with this company ID
      const { count, error: countError } = await supabase
        .from('hr_employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
        
      results += `Direct count of employees with company_id ${companyId}: ${count || 0}\n`;
      if (countError) results += `Count error: ${JSON.stringify(countError)}\n`;
      
      // 4. Check if company exists
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId);
        
      results += `Company data: ${JSON.stringify(companyData || [])}\n`;
      if (companyError) results += `Company error: ${JSON.stringify(companyError)}\n`;
      
      // 5. Check for all employees
      const { data: allEmployees, error: empError } = await supabase
        .from('hr_employees')
        .select('*');
        
      results += `Total employees in system: ${allEmployees?.length || 0}\n`;
      if (empError) results += `Employee query error: ${JSON.stringify(empError)}\n`;
      
      // 6. Check company IDs of existing employees
      if (allEmployees && allEmployees.length > 0) {
        const companyIds = [...new Set(allEmployees.map(e => e.company_id))];
        results += `Unique company IDs in use: ${JSON.stringify(companyIds)}\n`;
      }
      
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setDiagnosticResults(`Error running diagnostics: ${JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">HR Database Test Utility</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
          </CardHeader>
          <CardContent>
            {tables.length > 0 ? (
              <ul className="list-disc pl-5">
                {tables.map((table: string) => (
                  <li key={table}>{table}</li>
                ))}
              </ul>
            ) : (
              <p>No tables found or loading...</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <ul className="list-disc pl-5">
                {departments.map((dept: Department) => (
                  <li key={dept.id}>{dept.name} (ID: {dept.id})</li>
                ))}
              </ul>
            ) : (
              <p>No departments found</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Employees (Direct DB Query)</h2>
          <div className="space-x-2">
            <Button onClick={fetchAllEmployees} disabled={loading}>
              Refresh
            </Button>
            <Button onClick={createTestEmployee} disabled={loading || departments.length === 0}>
              Create Test Employee
            </Button>
            <Button onClick={runDiagnostics} disabled={loading}>
              Run Diagnostics
            </Button>
          </div>
        </div>
        
        {loading ? (
          <p>Loading...</p>
        ) : employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Department ID</th>
                  <th className="border p-2">Company ID</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: Employee) => (
                  <tr key={emp.id}>
                    <td className="border p-2">{emp.id}</td>
                    <td className="border p-2">{emp.name}</td>
                    <td className="border p-2">{emp.email}</td>
                    <td className="border p-2">{emp.department_id}</td>
                    <td className="border p-2 font-mono text-xs">{emp.company_id}</td>
                    <td className="border p-2">{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No employees found in database</p>
        )}
      </div>
      
      {diagnosticResults && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
              {diagnosticResults}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestUtility; 