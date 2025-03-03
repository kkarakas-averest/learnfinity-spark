
import React from "react";
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
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  role: "all" | "superadmin" | "hr" | "learner" | "mentor";
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userDetails, signOut, isLoading } = useAuth();

  React.useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !userDetails) {
      navigate("/login");
    }
  }, [userDetails, isLoading, navigate]);

  const handleLogout = () => {
    signOut();
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
    { title: "Dashboard", icon: BarChart2, href: "/hr", role: "hr" },
    { title: "Employees", icon: Users, href: "/hr/employees", role: "hr" },
    { title: "Learning Path", icon: GraduationCap, href: "/hr/learning-path", role: "hr" },
    { title: "Reports", icon: FileSpreadsheet, href: "/hr/reports", role: "hr" },
    
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar background overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold">Learnfinity</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {filteredItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={18} />
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
