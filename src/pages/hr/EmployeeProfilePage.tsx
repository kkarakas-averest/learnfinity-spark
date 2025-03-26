
import React from '@/lib/react-helpers';
import { useParams, Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employee Profile</h1>
        <div className="space-x-2">
          <Link 
            to={`${ROUTES.HR_DASHBOARD}/employee/${id}/edit`}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Edit Profile
          </Link>
          <Link 
            to={`${ROUTES.HR_DASHBOARD}/employees`}
            className="bg-secondary text-primary px-4 py-2 rounded hover:bg-secondary/90"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center text-xl">
              {id}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold">Employee #{id}</h2>
              <p className="text-gray-600">employee{id}@example.com</p>
              <p className="text-gray-600">Engineering Department</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Skills</h3>
              <ul className="list-disc list-inside">
                <li>JavaScript</li>
                <li>React</li>
                <li>TypeScript</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Learning Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm mt-2">75% Complete</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">RAG Status</h3>
              <div className="flex items-center">
                <span className="h-4 w-4 rounded-full bg-green-500 mr-2"></span>
                <span>Green</span>
              </div>
              <p className="text-sm mt-2">Last updated: 2 days ago</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Active Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-4 rounded">
                <h4 className="font-semibold">Introduction to React</h4>
                <p className="text-sm text-gray-600">Progress: 80%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div className="border p-4 rounded">
                <h4 className="font-semibold">Advanced TypeScript</h4>
                <p className="text-sm text-gray-600">Progress: 45%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfilePage;
