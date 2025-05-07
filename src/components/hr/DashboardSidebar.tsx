import React from '@/lib/react-helpers';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Import icons from lucide-react
import { 
  Users, 
  BookOpen, 
  BarChart2, 
  Settings, 
  FileText, 
  Layers, 
  ChevronRight,
  Activity,
  Award,
  Bot,
  ChevronDown,
  Home,
  Building,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavItemProps = {
  title: string;
  href: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  color?: string;
  isCollapsed?: boolean;
};

type NavSectionProps = {
  title: string;
  items: NavItemProps[];
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  sectionColor?: string;
  isCollapsed?: boolean;
};

type DashboardSidebarProps = {
  onToggleCollapse?: (collapsed: boolean) => void;
};

const NavItem: React.FC<NavItemProps> = ({ 
  title, 
  href, 
  icon, 
  isActive = false,
  color = "blue",
  isCollapsed = false
}: NavItemProps) => {
  // Extract color classes based on the provided color
  const getColorClasses = (colorName: string) => {
    const colorMap: {[key: string]: {bg: string, text: string, hover: string}} = {
      blue: { bg: "bg-blue-100", text: "text-blue-700", hover: "hover:bg-blue-50" },
      green: { bg: "bg-green-100", text: "text-green-700", hover: "hover:bg-green-50" },
      purple: { bg: "bg-purple-100", text: "text-purple-700", hover: "hover:bg-purple-50" },
      amber: { bg: "bg-amber-100", text: "text-amber-700", hover: "hover:bg-amber-50" },
      rose: { bg: "bg-rose-100", text: "text-rose-700", hover: "hover:bg-rose-50" },
      indigo: { bg: "bg-indigo-100", text: "text-indigo-700", hover: "hover:bg-indigo-50" },
      cyan: { bg: "bg-cyan-100", text: "text-cyan-700", hover: "hover:bg-cyan-50" },
      teal: { bg: "bg-teal-100", text: "text-teal-700", hover: "hover:bg-teal-50" },
    };
    
    return colorMap[colorName] || colorMap.blue;
  };
  
  const colors = getColorClasses(color);
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Link
        to={href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
          isCollapsed ? "justify-center" : "",
          isActive 
            ? `${colors.bg} ${colors.text} shadow-sm` 
            : `text-muted-foreground ${colors.hover} hover:text-gray-900`
        )}
        title={isCollapsed ? title : undefined}
      >
        <div className={`${isActive ? colors.text : "text-gray-500"} transition-colors`}>
          {icon}
        </div>
        {!isCollapsed && <span>{title}</span>}
      </Link>
    </motion.div>
  );
};

const NavSection: React.FC<NavSectionProps> = ({ 
  title, 
  items, 
  icon, 
  defaultOpen = true, 
  sectionColor,
  isCollapsed = false
}: NavSectionProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  // Assign a color to each nav item based on the section color
  const itemsWithColors = items.map(item => ({
    ...item,
    color: item.color || sectionColor
  }));
  
  // If sidebar is collapsed, just show the items without section header
  if (isCollapsed) {
    return (
      <div className="py-2">
        <div className="space-y-1">
          {itemsWithColors.map((item: NavItemProps, index: number) => (
            <NavItem 
              key={index} 
              title={item.title} 
              href={item.href} 
              icon={item.icon} 
              isActive={item.isActive}
              color={item.color}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-2">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500 group-hover:text-gray-700">{icon}</span>}
          <h3 className="text-xs font-semibold tracking-wide uppercase">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="opacity-70"
        >
          <ChevronRight size={14} />
        </motion.div>
      </motion.button>
      
      <motion.div 
        initial={defaultOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        animate={{ 
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="space-y-1 ml-2 pl-2 mt-1 border-l-2 border-gray-100">
          {itemsWithColors.map((item: NavItemProps, index: number) => (
            <NavItem 
              key={index} 
              title={item.title} 
              href={item.href} 
              icon={item.icon} 
              isActive={item.isActive}
              color={item.color}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  onToggleCollapse 
}: DashboardSidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Check if we're on mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // If mobile, ensure sidebar is collapsed by default
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };
    
    // Set initial value
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, [isCollapsed]);
  
  // Define color schemes for different sections
  const sectionColors = {
    dashboard: "blue",
    learning: "green",
    settings: "purple"
  };

  const navSections: NavSectionProps[] = [
    {
      title: "Main",
      icon: <Home size={16} />,
      sectionColor: sectionColors.dashboard,
      items: [
        {
          title: "Dashboard",
          href: "/hr-dashboard",
          icon: <Home className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard"
        },
        {
          title: "Employees",
          href: "/hr-dashboard/employees",
          icon: <Users className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/employees" || currentPath.includes("/hr-dashboard/employees/")
        },
        {
          title: "Skills Inventory",
          href: "/hr-dashboard/skills-inventory",
          icon: <Award className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/skills-inventory",
          color: "indigo"
        },
        {
          title: "Position Requirements",
          href: "/hr-dashboard/positions/requirements",
          icon: <Building className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/positions/requirements",
          color: "amber"
        },
        {
          title: "Learner Progress",
          href: "/hr-dashboard/learner-progress",
          icon: <Activity className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/learner-progress",
          color: "teal"
        },
        {
          title: "Reports",
          href: "/hr-dashboard/reports",
          icon: <BarChart2 className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/reports",
          color: "rose"
        }
      ]
    },
    {
      title: "Learning",
      icon: <BookOpen size={16} />,
      sectionColor: sectionColors.learning,
      defaultOpen: false,
      items: [
        {
          title: "AI Course Generator",
          href: "/hr-dashboard/course-generator",
          icon: <Bot className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/course-generator",
          color: "cyan"
        }
      ]
    },
    {
      title: "Configuration",
      icon: <Settings size={16} />,
      sectionColor: sectionColors.settings,
      defaultOpen: false,
      items: [
        {
          title: "Settings",
          href: "/hr-dashboard/settings",
          icon: <Settings className="h-4 w-4" />,
          isActive: currentPath === "/hr-dashboard/settings"
        }
      ]
    }
  ];
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Inform parent component if callback provided
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsedState);
    }
  };

  return (
    <motion.div
      initial={{ width: isMobile ? 72 : 260 }}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="border-r h-screen overflow-hidden py-4 bg-white shadow-sm relative flex flex-col"
    >
      {/* Toggle button */}
      <div className="absolute top-3 right-3 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-8 w-8" 
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
      
      {/* Logo area */}
      <div className={cn(
        "px-4 py-3 flex items-center", 
        isCollapsed ? "justify-center" : "justify-start"
      )}>
        <Link 
          to="/hr-dashboard" 
          className={cn(
            "font-bold text-primary",
            isCollapsed ? "text-xl" : "text-xl"
          )}
        >
          {isCollapsed ? "LF" : "Learnfinity"}
        </Link>
      </div>
      
      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        {navSections.map((section, index) => (
          <NavSection 
            key={index}
            title={section.title}
            items={section.items}
            icon={section.icon}
            defaultOpen={section.defaultOpen}
            sectionColor={section.sectionColor}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default DashboardSidebar; 