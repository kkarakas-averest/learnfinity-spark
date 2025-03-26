
import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

const HRLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, just navigate to HR dashboard
    navigate(ROUTES.HR_DASHBOARD);
  };

  return (
    <div className="container mx-auto max-w-md mt-12 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">HR Admin Login</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              id="email" 
              className="w-full p-2 border rounded" 
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              id="password" 
              className="w-full p-2 border rounded" 
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-primary text-white p-2 rounded hover:bg-primary/90"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default HRLoginPage;
