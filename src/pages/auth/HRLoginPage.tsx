
import React from '@/lib/react-helpers';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const HRLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login success
    navigate(ROUTES.HR_DASHBOARD);
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">HR Admin Login</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full p-2 border rounded" defaultValue="hr@example.com" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" className="w-full p-2 border rounded" defaultValue="password" />
          </div>
          <button type="submit" className="w-full bg-primary text-white p-2 rounded">Login</button>
        </form>
        <div className="mt-4 text-center">
          <p>Not an HR admin? <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default HRLoginPage;
