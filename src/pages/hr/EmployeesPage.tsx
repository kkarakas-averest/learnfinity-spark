
import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const EmployeesPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        <div className="space-x-2">
          <Link 
            to={`${ROUTES.HR_DASHBOARD}/employee/create`}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Add Employee
          </Link>
          <Link 
            to={`${ROUTES.HR_DASHBOARD}/employee/onboarding`}
            className="bg-secondary text-primary px-4 py-2 rounded hover:bg-secondary/90"
          >
            Onboarding
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="w-full p-2 border rounded"
          />
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    JS
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">John Smith</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">john.smith@example.com</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">Engineering</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <Link to={`${ROUTES.HR_DASHBOARD}/employee/1`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                  <Link to={`${ROUTES.HR_DASHBOARD}/employee/1/edit`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeesPage;
