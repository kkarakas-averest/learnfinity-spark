
import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, just navigate back to the employees list
    navigate(`${ROUTES.HR_DASHBOARD}/employees`);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add New Employee</h1>
        <button 
          onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees`)}
          className="bg-secondary text-primary px-4 py-2 rounded hover:bg-secondary/90"
        >
          Cancel
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
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
                <option value="engineering">Engineering</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="hr">HR</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="position" className="block text-sm font-medium mb-2">Position</label>
              <input 
                id="position"
                type="text"
                className="w-full p-2 border rounded" 
                required
              />
            </div>
            
            <div>
              <label htmlFor="hireDate" className="block text-sm font-medium mb-2">Hire Date</label>
              <input 
                id="hireDate"
                type="date"
                className="w-full p-2 border rounded" 
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="skills" className="block text-sm font-medium mb-2">Skills</label>
            <textarea 
              id="skills"
              className="w-full p-2 border rounded" 
              rows={3}
              placeholder="JavaScript, React, TypeScript"
            />
            <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
          </div>
          
          <div className="pt-4 border-t">
            <button 
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90"
            >
              Create Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployeePage;
