
import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const EmployeeOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = React.useState([
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Marketing' },
    { id: '3', name: 'Sales' },
    { id: '4', name: 'HR' }
  ]);
  
  const fetchDepartments = async () => {
    try {
      // In a real app, you would fetch departments from API
      console.log('Fetching departments');
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };
  
  React.useEffect(() => {
    fetchDepartments();
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, just navigate back to the employees list
    navigate(`${ROUTES.HR_DASHBOARD}/employees`);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employee Onboarding</h1>
        <button 
          onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees`)}
          className="bg-secondary text-primary px-4 py-2 rounded hover:bg-secondary/90"
        >
          Back to Employees
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add Single Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">First Name</label>
              <input 
                id="firstName"
                type="text"
                className="w-full p-2 border rounded" 
                required
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">Last Name</label>
              <input 
                id="lastName"
                type="text"
                className="w-full p-2 border rounded" 
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
              <input 
                id="email"
                type="email"
                className="w-full p-2 border rounded" 
                required
              />
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium mb-2">Department</label>
              <select 
                id="department"
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <button 
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90"
            >
              Create & Send Welcome Email
            </button>
          </div>
        </form>
        
        <div className="mt-10 pt-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Bulk Import Employees</h2>
          <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
            <p className="mb-4">Upload a CSV file with employee information</p>
            <input 
              type="file" 
              accept=".csv"
              className="hidden" 
              id="csv-upload" 
            />
            <label 
              htmlFor="csv-upload"
              className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 cursor-pointer"
            >
              Select CSV File
            </label>
            <p className="mt-4 text-sm text-gray-500">
              CSV should include: First Name, Last Name, Email, Department
            </p>
          </div>
          
          <div className="mt-4">
            <a 
              href="#" 
              className="text-blue-600 hover:underline text-sm"
              onClick={(e) => {
                e.preventDefault();
                alert('Template would download in a real implementation');
              }}
            >
              Download CSV Template
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingPage;
