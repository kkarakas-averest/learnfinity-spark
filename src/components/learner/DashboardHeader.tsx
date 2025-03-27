import React from "@/lib/react-helpers";
import UserNotifications from '@/components/navigation/UserNotifications';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/state';
import { useNavigate } from 'react-router-dom';

const DashboardHeader: React.FC = () => {
  const { user, userDetails, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  return (
    <header className="bg-white border-b shadow-sm py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary mr-4">Learnfinity</h1>
          <nav className="hidden md:flex space-x-4">
            <a href="/dashboard" className="text-sm font-medium">Dashboard</a>
            <a href="/dashboard/courses" className="text-sm font-medium">My Courses</a>
            <a href="/dashboard/calendar" className="text-sm font-medium">Calendar</a>
          </nav>
        </div>
        
        <div className="flex items-center space-x-2">
          <UserNotifications />
          
          <div className="flex items-center ml-4">
            <div className="mr-3 hidden md:block text-right">
              <div className="text-sm font-medium">{userDetails?.name || user?.email || 'Learner'}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 