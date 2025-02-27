
import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Building,
  BrainCircuit,
  FileSpreadsheet,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type SidebarItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  role: "all" | "superadmin" | "hr" | "learner";
};

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      navigate("/login");
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    } catch (error) {
      // Handle parsing error
      console.error("Failed to parse user data", error);
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate("/login");
  };

  const sidebarItems: SidebarItem[] = [
    // Common items
    { title: "Home", icon: Home, href: "/", role: "all" },
    
    // Super Admin items
    { title: "Dashboard", icon: BarChart, href: "/admin", role: "superadmin" },
    { title: "Organizations", icon: Building, href: "/admin/organizations", role: "superadmin" },
    { title: "Users", icon: Users, href: "/admin/users", role: "superadmin" },
    { title: "Course Management", icon: GraduationCap, href: "/admin/course", role: "superadmin" },
    { title: "AI Management", icon: BrainCircuit, href: "/admin/ai", role: "superadmin" },
    
    // HR items
    { title: "Dashboard", icon: BarChart, href: "/hr", role: "hr" },
    { title: "Employees", icon: Users, href: "/hr/employees", role: "hr" },
    { title: "Learning Path", icon: GraduationCap, href: "/hr/learning-path", role: "hr" },
    { title: "Reports", icon: FileSpreadsheet, href: "/hr/reports", role: "hr" },
    
    // Learner items
    { title: "Dashboard", icon: BarChart, href: "/dashboard", role: "learner" },
    { title: "My Learning", icon: GraduationCap, href: "/learning", role: "learner" },
  ];

  const filteredItems = sidebarItems.filter(
    item => item.role === "all" || item.role === userRole
  );

  const isActive = (path: string) => location.pathname === path;

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
