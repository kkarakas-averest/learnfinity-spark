import React, { useState, useEffect } from '@/lib/react-helpers';
import { supabase } from '@/lib/supabase';
import BulkEmployeeImport from '@/components/hr/BulkEmployeeImport';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  ragStatus: 'red' | 'amber' | 'green';
  progress: number;
  lastActivity: string;
  created_at?: string;
}

interface EmployeeMetrics {
  active: number;
  onLeave: number;
  atRisk: number;
  newThisMonth: number;
}

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [metrics, setMetrics] = useState<EmployeeMetrics>({
    active: 0,
    onLeave: 0,
    atRisk: 0,
    newThisMonth: 0
  });
  
  useEffect(() => {
    const fetchEmployees = async () => {
      // Fetch employees from database
      const { data, error } = await supabase
        .from('employees')
        .select('*');
        
      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }
      
      if (data) {
        setEmployees(data as Employee[]);
        calculateMetrics(data as Employee[]);
      }
    };
    
    fetchEmployees();
  }, []);
  
  const calculateMetrics = (employees: Employee[]) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const metrics = {
      active: employees.filter(e => e.status === 'active').length,
      onLeave: employees.filter(e => e.status === 'on_leave').length,
      atRisk: employees.filter(e => e.ragStatus === 'red').length,
      newThisMonth: employees.filter(e => {
        const createdAt = e.created_at ? new Date(e.created_at) : null;
        return createdAt && createdAt >= firstDayOfMonth;
      }).length
    };
    
    setMetrics(metrics);
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Employee Management</h1>
      
      <BulkEmployeeImport />
      
      {/* Rest of the component */}
    </div>
  );
};

export default EmployeesPage; 