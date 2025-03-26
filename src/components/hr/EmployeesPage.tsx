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

<BulkEmployeeImport /> 