import React, { useState, useEffect } from '@/lib/react-helpers';
import { Link } from "react-router-dom";
import { 
  Menu, 
  X, 
  Book, 
  GraduationCap, 
  Settings, 
  Home,
  User,
  LogOut,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { User as UserType } from '@/types/hr.types';

// Import from our new state management system
import { useAuth, useUser, useUI } from "@/state";

// Define NavItem interface at the top
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Navigation items configuration
const NAV_ITEMS = {
  public: [
    { name: "Courses", href: "/courses", icon: Book },
    { name: "Register", href: "/register", icon: User },
  ],
  authenticated: [
    { name: "Home", href: "/", icon: Home },
    { name: "Courses", href: "/courses", icon: Book },
    { name: "My Learning", href: "/dashboard", icon: GraduationCap },
  ]
};

// User avatar component
const UserAvatar = ({ name, email, role }: { name?: string; email?: string; role?: UserRole }) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} />
      <AvatarFallback>{name ? getInitials(name) : <User size={14} />}</AvatarFallback>
    </Avatar>
  );
};

// Utility to get display name from user object
function getDisplayName(user: Partial<UserType> | null | undefined): string {
  if (!user) return "User";
  // @ts-expect-error: 'name' may exist on some user objects for display
  return user.name || user.username || "User";
}

// User menu component
const UserMenu = ({ userDetails, signOut }: { userDetails: UserType | null; signOut: () => Promise<void> }) => {
  // Fallback userData with username for compatibility
  const userData: Partial<UserType> = userDetails || { 
    username: "User", 
    email: "", 
    role: "learner" 
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar name={getDisplayName(userData)} email={userData.email} role={userData.role as UserRole} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName(userData)}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email}
            </p>
            {userData.role && (
              <Badge className="mt-1 w-fit">
                {userData.role}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <NavMenuItem to="/profile" icon={<User className="mr-2 h-4 w-4" />} label="Profile" />
        <NavMenuItem to="/dashboard" icon={<GraduationCap className="mr-2 h-4 w-4" />} label="Dashboard" />
        <NavMenuItem to="/courses" icon={<Book className="mr-2 h-4 w-4" />} label="Courses" />
        <NavMenuItem to="/settings" icon={<Settings className="mr-2 h-4 w-4" />} label="Settings" />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-500 focus:text-red-500"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Navigation menu item component
const NavMenuItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <DropdownMenuItem asChild>
    <Link to={to} className="flex items-center">
      {icon}
      <span>{label}</span>
    </Link>
  </DropdownMenuItem>
);

// Mobile menu component
const MobileMenu = ({ 
  isOpen, 
  navItems, 
  onClose, 
  userDetails, 
  signOut 
}: { 
  isOpen: boolean; 
  navItems: NavItem[]; 
  onClose: () => void;
  userDetails: UserType | null;
  signOut: () => Promise<void>;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
      <div className="fixed inset-y-0 right-0 w-full max-w-xs border-l bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" onClick={onClose}>
            <GraduationCap size={24} className="text-primary" />
            <span className="text-xl font-bold">Learnfinity</span>
          </Link>
          <Button variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X size={24} />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="mt-8 space-y-4">
          {userDetails && (
            <div className="mb-4 flex items-center space-x-3 rounded-lg border p-3">
              <UserAvatar name={getDisplayName(userDetails)} email={userDetails.email} role={userDetails.role as UserRole} />
              <div className="flex-1 overflow-hidden">
                <p className="font-medium leading-none">{getDisplayName(userDetails)}</p>
                <p className="text-sm text-muted-foreground truncate">{userDetails.email}</p>
                {userDetails.role && (
                  <Badge variant="outline" className="mt-1">
                    {userDetails.role}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {navItems.map((item: NavItem) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center space-x-2 rounded-lg p-2 hover:bg-accent"
                onClick={onClose}
              >
                <IconComponent className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          {userDetails && (
            <Button 
              variant="ghost" 
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="flex w-full items-center justify-start space-x-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Navbar component
const NavbarMigrated: React.FC = () => {
  // Use our new hooks instead of the old context
  const { user, userDetails, isAuthenticated, signOut, isLoading } = useAuth();
  const { theme, isMobile } = useUI();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isSupabase, setIsSupabase] = useState(false);

  // Set up the navigation items based on authentication state
  useEffect(() => {
    setNavItems(isAuthenticated ? NAV_ITEMS.authenticated : NAV_ITEMS.public);
    
    // Check if Supabase is configured
    setIsSupabase(isSupabaseConfigured());
  }, [isAuthenticated]);

  // Toggle mobile menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-2">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <GraduationCap size={24} className="text-primary" />
            <span className="text-xl font-bold">Learnfinity</span>
          </Link>
          {!isLoading && isSupabase && (
            <Badge variant="outline" className="hidden md:inline-flex">
              {isAuthenticated ? 'Authenticated' : 'Public'}
            </Badge>
          )}
        </div>
        
        <nav className="hidden md:flex md:items-center md:space-x-4">
          {navItems.map((item: NavItem) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
              >
                <IconComponent className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          {isAuthenticated ? (
            <UserMenu userDetails={userDetails as UserType | null} signOut={signOut} />
          ) : (
            <div className="flex items-center space-x-1">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </nav>
        
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <MobileMenu
          isOpen={isMenuOpen}
          navItems={navItems}
          onClose={() => setIsMenuOpen(false)}
          userDetails={userDetails as UserType | null}
          signOut={signOut}
        />
      </div>
    </header>
  );
};

export default NavbarMigrated; 