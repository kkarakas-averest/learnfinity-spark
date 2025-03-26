
import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const LoginPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full p-2 border rounded" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full p-2 border rounded" />
        </div>
        <button className="w-full bg-primary text-white p-2 rounded">Login</button>
        <div className="mt-4 text-center">
          <p>HR Admin? <Link to={ROUTES.HR_LOGIN} className="text-primary hover:underline">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
