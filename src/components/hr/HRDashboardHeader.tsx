import React from "@/lib/react-helpers";
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from '../learner/NotificationBadge';
import NotificationPanel from '../learner/NotificationPanel';
import { Button } from '@/components/ui/button';
import { useHRAuth } from '@/state';
import { useNavigate } from 'react-router-dom';

interface HRDashboardHeaderProps {
  username?: string;
  onLogout: () => void;
}

const HRDashboardHeader: React.FC<HRDashboardHeaderProps> = ({ 
  username = "HR Admin",
  onLogout
}) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };
  
  return (
    <header className="bg-white border-b shadow-sm py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary mr-4">HR Dashboard</h1>
          <nav className="hidden md:flex space-x-4">
            <a href="/hr-dashboard" className="text-sm font-medium">Overview</a>
            <a href="/hr-dashboard/employees" className="text-sm font-medium">Employees</a>
            <a href="/hr-dashboard/programs" className="text-sm font-medium">Programs</a>
            <a href="/hr-dashboard/reports" className="text-sm font-medium">Reports</a>
          </nav>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <NotificationBadge 
              count={unreadCount} 
              onClick={toggleNotifications} 
            />
            
            {showNotifications && (
              <NotificationPanel 
                notifications={notifications} 
                onClose={() => setShowNotifications(false)} 
                onReadNotification={markAsRead}
                onClearAll={markAllAsRead}
              />
            )}
          </div>
          
          <div className="flex items-center ml-4">
            <div className="mr-3 hidden md:block text-right">
              <div className="text-sm font-medium">{username}</div>
              <div className="text-xs text-gray-500">HR Administrator</div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HRDashboardHeader; 