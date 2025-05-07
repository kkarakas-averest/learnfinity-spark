import React from "@/lib/react-helpers";
import { Link, useLocation } from 'react-router-dom';
import UserNotifications from '@/components/navigation/UserNotifications';
import { Button } from '@/components/ui/button';
import { useHRAuth } from '@/state';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  ChevronDown, 
  FileText, 
  Layers, 
  BookOpen, 
  Menu, 
  Home, 
  Users, 
  Award, 
  BarChart2,
  Bot,
  Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  label,
  icon
}: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href || 
    (href !== '/hr-dashboard' && location.pathname.startsWith(href));

  return (
    <Link 
      to={href} 
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors", 
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <span className={cn("mr-2", isActive ? "text-primary" : "text-gray-500")}>
        {icon}
      </span>
      {label}
    </Link>
  );
};

interface HRDashboardHeaderProps {
  username?: string;
  onLogout: () => void;
}

const HRDashboardHeader: React.FC<HRDashboardHeaderProps> = ({ 
  username = "HR Admin",
  onLogout
}: HRDashboardHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navigateToSettings = () => {
    navigate('/hr-dashboard/settings');
  };

  // Main navigation items
  const mainNavItems = [
    { href: '/hr-dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { href: '/hr-dashboard/employees', label: 'Employees', icon: <Users className="h-4 w-4" /> },
    { href: '/hr-dashboard/skills-inventory', label: 'Skills', icon: <Award className="h-4 w-4" /> },
    { href: '/hr-dashboard/organization-setup', label: 'Organization', icon: <Building className="h-4 w-4" /> },
  ];

  // Course-related navigation items for dropdown
  const courseNavItems = [
    { href: '/hr-dashboard/course-generator', label: 'AI Course Generator', icon: <Bot className="h-4 w-4" /> },
    { href: '/hr-dashboard/course-builder', label: 'Course Builder', icon: <BookOpen className="h-4 w-4" /> },
    { href: '/hr-dashboard/course-builder/templates', label: 'Templates', icon: <FileText className="h-4 w-4" /> },
    { href: '/hr-dashboard/course-builder/modules', label: 'Modules', icon: <Layers className="h-4 w-4" /> },
  ];

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center">
          <Link to="/hr-dashboard" className="flex items-center mr-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Learnfinity HR
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {mainNavItems.map((item) => (
              <NavItem 
                key={item.href} 
                href={item.href} 
                label={item.label} 
                icon={item.icon} 
              />
            ))}
            
            {/* Course Builder Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center px-3 py-2 text-sm font-medium rounded-md">
                  <span className="mr-2 text-gray-500">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  Learning
                  <ChevronDown className="h-4 w-4 ml-1 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {courseNavItems.map((item) => (
                  <DropdownMenuItem 
                    key={item.href} 
                    className={cn(
                      "flex items-center",
                      location.pathname === item.href && "bg-muted"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <span className="mr-2 text-gray-500">{item.icon}</span>
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <NavItem 
              href="/hr-dashboard/reports" 
              label="Reports" 
              icon={<BarChart2 className="h-4 w-4" />} 
            />
          </nav>
        </div>
        
        {/* User Menu and Mobile Menu */}
        <div className="flex items-center space-x-2">
          <UserNotifications />
          
          {/* User Menu */}
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
                  <span className="text-xs text-muted-foreground">HR Administrator</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={navigateToSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] sm:w-[350px]">
              <div className="flex flex-col h-full py-6">
                <h2 className="text-lg font-bold mb-6 px-4">HR Dashboard</h2>
                
                <nav className="flex flex-col space-y-1 px-2">
                  {mainNavItems.map((item) => (
                    <Link 
                      key={item.href}
                      to={item.href} 
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors", 
                        location.pathname === item.href
                          ? "bg-primary/10 text-primary" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span className={cn("mr-2", location.pathname === item.href ? "text-primary" : "text-gray-500")}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                  
                  <div className="pt-2 pb-1">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Learning
                    </p>
                  </div>
                  
                  {courseNavItems.map((item) => (
                    <Link 
                      key={item.href}
                      to={item.href} 
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors", 
                        location.pathname === item.href 
                          ? "bg-primary/10 text-primary" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span className={cn("mr-2", location.pathname === item.href ? "text-primary" : "text-gray-500")}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                  
                  <NavItem 
                    href="/hr-dashboard/reports" 
                    label="Reports" 
                    icon={<BarChart2 className="h-4 w-4" />} 
                  />
                </nav>
                
                <div className="mt-auto px-4">
                  <Button variant="outline" className="w-full" onClick={onLogout}>
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default HRDashboardHeader; 