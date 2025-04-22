import React from '@/lib/react-helpers';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Import icons from lucide-react
import { 
  Users, 
  BookOpen, 
  BarChart2, 
  Settings, 
  FileText, 
  Layers, 
  Library,
  Activity
} from 'lucide-react';

type NavItemProps = {
  title: string;
  href: string;
  icon?: React.ReactNode;
  isActive?: boolean;
};

type NavSectionProps = {
  title: string;
  items: NavItemProps[];
};

const NavItem: React.FC<NavItemProps> = ({ 
  title, 
  href, 
  icon, 
  isActive = false 
}: NavItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
};

const NavSection: React.FC<NavSectionProps> = ({ title, items }: NavSectionProps) => {
  return (
    <div className="py-2">
      <h3 className="px-3 text-xs font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="space-y-1">
        {items.map((item: NavItemProps, index: number) => (
          <NavItem 
            key={index} 
            title={item.title} 
            href={item.href} 
            icon={item.icon} 
            isActive={item.isActive} 
          />
        ))}
      </div>
    </div>
  );
};

const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navSections: NavSectionProps[] = [
    {
      title: "Dashboard",
      items: [
        {
          title: "Overview",
          href: "/hr-dashboard",
          icon: <BarChart2 className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard"
        },
        {
          title: "Employees",
          href: "/hr-dashboard/employees",
          icon: <Users className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/employees"
        },
        {
          title: "Programs",
          href: "/hr-dashboard/programs",
          icon: <BookOpen className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/programs"
        },
        {
          title: "Learner Progress",
          href: "/hr-dashboard/learner-progress",
          icon: <Activity className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/learner-progress"
        },
        {
          title: "Reports",
          href: "/hr-dashboard/reports",
          icon: <BarChart2 className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/reports"
        }
      ]
    },
    {
      title: "Course Builder",
      items: [
        {
          title: "Overview",
          href: "/hr-dashboard/course-builder",
          icon: <BookOpen className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/course-builder"
        },
        {
          title: "Course Templates",
          href: "/hr-dashboard/course-builder/templates",
          icon: <FileText className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/course-builder/templates"
        },
        {
          title: "Module Editor",
          href: "/hr-dashboard/course-builder/modules",
          icon: <Layers className="h-4 w-4" />,
          isActive: currentPath.includes("/hr-dashboard/course-builder/modules")
        },
        {
          title: "Content Library",
          href: "/hr-dashboard/course-builder/library",
          icon: <Library className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/course-builder/library"
        }
      ]
    },
    {
      title: "Settings",
      items: [
        {
          title: "General",
          href: "/hr-dashboard/settings",
          icon: <Settings className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/settings"
        }
      ]
    }
  ];

  // Management section items
  const managementItems = [
    {
      title: "Employees",
      href: "/hr-dashboard/employees",
      icon: <Users className="h-4 w-4" />,
      isActive: currentPath === "/hr-dashboard/employees"
    },
    {
      title: "Learning Programs",
      href: "/hr-dashboard/programs",
      icon: <Layers className="h-4 w-4" />,
      isActive: currentPath === "/hr-dashboard/programs"
    },
    {
      title: "Course Builder",
      href: "/hr-dashboard/courses",
      icon: <Library className="h-4 w-4" />,
      isActive: currentPath === "/hr-dashboard/courses"
    },
    {
      title: "Learner Progress",
      href: "/hr-dashboard/learner-progress",
      icon: <Activity className="h-4 w-4" />,
      isActive: currentPath === "/hr-dashboard/learner-progress"
    }
  ];

  return (
    <div className="w-64 border-r h-screen overflow-y-auto py-4 px-2 bg-background">
      <div className="px-3 py-2">
        <h2 className="text-lg font-semibold">HR Dashboard</h2>
        <p className="text-sm text-muted-foreground">Employee management portal</p>
      </div>
      
      <nav className="mt-4 space-y-1">
        {navSections.map((section, index) => (
          <NavSection 
            key={index} 
            title={section.title} 
            items={section.items} 
          />
        ))}
      </nav>
    </div>
  );
};

export default DashboardSidebar; 