import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  BellRing,
  LogOut 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

import DashboardOverview from '@/components/hr/DashboardOverview';
import EmployeeManagement from '@/components/hr/EmployeeManagement';
import CourseManagement from '@/components/hr/CourseManagement';
import AgentStatusPanel from '@/components/dashboard/AgentStatusPanel';
import { useHRAuth } from '@/contexts/HRAuthContext';
import HRAuth from '@/components/hr/HRAuth';

// Main Dashboard component
const HRDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState('dashboard');
  const navigate = useNavigate();
  const { currentUser, logout } = useHRAuth();

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  // Define navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'employees', label: 'Employees', icon: <Users className="h-5 w-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="h-5 w-5" /> },
    { id: 'ai-agents', label: 'AI Agents', icon: <BellRing className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> }
  ];

  return (
    <HRAuth>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-64 flex-col border-r bg-background">
          <div className="p-6">
            <h2 className="text-2xl font-bold">HR Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Learnfinity HR Admin</p>
          </div>
          
          <div className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => handleSectionChange(item.id)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </div>
          
          <div className="p-4 mt-auto">
            <Separator className="mb-4" />
            {currentUser && (
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">HR Administrator</p>
                </div>
              </div>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <Sheet>
          <div className="lg:hidden flex items-center justify-between p-4 border-b">
            <h2 className="font-bold">HR Dashboard</h2>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent side="left" className="flex flex-col">
            <div className="py-4">
              <h2 className="text-xl font-bold">HR Dashboard</h2>
              <p className="text-sm text-muted-foreground">Learnfinity HR Admin</p>
            </div>
            
            <div className="flex-1 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    handleSectionChange(item.id);
                    
                    // Close the sheet after navigation on mobile
                    const closeButton = document.querySelector('[data-radix-collection-item]');
                    if (closeButton instanceof HTMLElement) {
                      closeButton.click();
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
            
            <div className="pt-4 mt-auto">
              <Separator className="mb-4" />
              {currentUser && (
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">HR Administrator</p>
                  </div>
                </div>
              )}
              <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container py-6 md:py-10 max-w-7xl">
            {/* Dashboard Overview */}
            {activeSection === 'dashboard' && (
              <>
                <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
                <DashboardOverview />
              </>
            )}
            
            {/* Employees Section */}
            {activeSection === 'employees' && (
              <>
                <h1 className="text-3xl font-bold mb-6">Employee Management</h1>
                <EmployeeManagement />
              </>
            )}
            
            {/* Courses Section */}
            {activeSection === 'courses' && (
              <>
                <h1 className="text-3xl font-bold mb-6">Course Management</h1>
                <CourseManagement />
              </>
            )}
            
            {/* AI Agents Section */}
            {activeSection === 'ai-agents' && (
              <>
                <h1 className="text-3xl font-bold mb-6">AI Agent Monitoring</h1>
                <AgentStatusPanel />
              </>
            )}
            
            {/* Settings Section */}
            {activeSection === 'settings' && (
              <>
                <h1 className="text-3xl font-bold mb-6">HR Dashboard Settings</h1>
                <div className="grid gap-6">
                  <div className="border rounded-lg p-6">
                    <h2 className="text-xl font-medium mb-4">General Settings</h2>
                    <p className="text-muted-foreground mb-4">Configure general HR dashboard settings and preferences.</p>
                    <Button variant="outline">Coming Soon</Button>
                  </div>
                  
                  <div className="border rounded-lg p-6">
                    <h2 className="text-xl font-medium mb-4">Notifications</h2>
                    <p className="text-muted-foreground mb-4">Configure notification preferences for employee activities and system alerts.</p>
                    <Button variant="outline">Coming Soon</Button>
                  </div>
                  
                  <div className="border rounded-lg p-6">
                    <h2 className="text-xl font-medium mb-4">Integrations</h2>
                    <p className="text-muted-foreground mb-4">Manage integrations with HR tools and third-party services.</p>
                    <Button variant="outline">Coming Soon</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </HRAuth>
  );
};

export default HRDashboard;
