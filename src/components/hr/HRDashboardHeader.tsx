import React from "@/lib/react-helpers";
import UserNotifications from '@/components/navigation/UserNotifications';
import { Button } from '@/components/ui/button';
import { useHRAuth } from '@/state';
import { useNavigate } from 'react-router-dom';
import { Settings, User, ChevronDown, FileText, Layers, BookOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HRDashboardHeaderProps {
  username?: string;
  onLogout: () => void;
}

const HRDashboardHeader: React.FC<HRDashboardHeaderProps> = ({ 
  username = "HR Admin",
  onLogout
}) => {
  const navigate = useNavigate();
  
  const navigateToSettings = () => {
    navigate('/hr-dashboard/settings');
  };

  const navigateToTemplates = () => {
    navigate('/hr-dashboard/course-builder/templates');
  };

  const navigateToModules = () => {
    navigate('/hr-dashboard/course-builder/modules');
  };

  const navigateToMainCourseBuilder = () => {
    navigate('/hr-dashboard/course-builder');
  };

  return (
    <header className="bg-white border-b shadow-sm py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary mr-4">HR Dashboard</h1>
          <nav className="hidden md:flex space-x-4">
            <a href="/hr-dashboard" className="text-sm font-medium hover:text-primary">Overview</a>
            <a href="/hr-dashboard/employees" className="text-sm font-medium hover:text-primary">Employees</a>
            <a href="/hr-dashboard/programs" className="text-sm font-medium hover:text-primary">Programs</a>
            <a href="/hr-dashboard/reports" className="text-sm font-medium hover:text-primary">Reports</a>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm font-medium hover:text-primary flex items-center">
                  Course Builder
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={navigateToMainCourseBuilder}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Overview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={navigateToTemplates}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Course Templates</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={navigateToModules}>
                  <Layers className="mr-2 h-4 w-4" />
                  <span>Module Editor</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
        
        <div className="flex items-center space-x-2">
          <UserNotifications />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{username}</span>
                  <span className="text-xs text-gray-500">HR Administrator</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={navigateToSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default HRDashboardHeader; 