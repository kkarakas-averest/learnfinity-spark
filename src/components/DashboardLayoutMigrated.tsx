import React, { useState, useEffect } from "@/lib/react-helpers";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart2, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Home,
  Building,
  BrainCircuit,
  FileSpreadsheet,
  GraduationCap,
  User,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

// Import from our new state management system
import { useAuth, useUI } from "@/state";

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  role: "all" | "superadmin" | "hr" | "learner" | "mentor";
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayoutMigrated: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Use our new hooks instead of the old context
  const { userDetails, signOut, isLoading } = useAuth();
  const { toastSuccess } = useUI();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !userDetails) {
      navigate("/login");
    }
  }, [userDetails, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    toastSuccess('Logged out', 'You have been successfully logged out');
    navigate('/login');
  };

  const sidebarItems: SidebarItem[] = [
    // Common items
    { title: "Home", icon: Home, href: "/", role: "all" },
    { title: "Profile", icon: User, href: "/profile", role: "all" },
    
    // Super Admin items
    { title: "Dashboard", icon: BarChart2, href: "/admin", role: "superadmin" },
    { title: "Organizations", icon: Building, href: "/admin/organizations", role: "superadmin" },
    { title: "Users", icon: Users, href: "/admin/users", role: "superadmin" },
    { title: "Course Management", icon: GraduationCap, href: "/admin/course", role: "superadmin" },
    { title: "AI Management", icon: BrainCircuit, href: "/admin/ai", role: "superadmin" },
    
    // HR items
    { title: "Dashboard", icon: BarChart2, href: ROUTES.HR_DASHBOARD, role: "hr" },
    { title: "Employees", icon: Users, href: ROUTES.HR_DASHBOARD_EMPLOYEES, role: "hr" },
    { title: "Learning Path", icon: GraduationCap, href: ROUTES.HR_DASHBOARD_COURSES, role: "hr" },
    { title: "Reports", icon: FileSpreadsheet, href: ROUTES.HR_DASHBOARD_REPORTS, role: "hr" },
    
    // Learner items
    { title: "Dashboard", icon: BarChart2, href: "/dashboard", role: "learner" },
    { title: "My Learning", icon: GraduationCap, href: "/learning", role: "learner" },
    
    // Mentor items
    { title: "Dashboard", icon: BarChart2, href: "/mentor", role: "mentor" },
    { title: "My Learners", icon: Users, href: "/mentor/learners", role: "mentor" },
  ];

  const filteredItems = sidebarItems.filter(
    item => item.role === "all" || (userDetails && item.role === userDetails.role)
  );

  const isActive = (path: string) => location.pathname === path;

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-secondary/20 overflow-hidden">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-background shadow-lg transition-transform duration-200 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Learnfinity</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {userDetails && (
          <div className="border-b p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                {userDetails.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium">{userDetails.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{userDetails.role}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              </li>
            ))}
            
            <li className="pt-6">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:bg-red-100 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-64">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayoutMigrated; 