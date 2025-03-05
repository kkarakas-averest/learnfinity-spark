import React from "react";
import { Link } from "react-router-dom";
import { 
  Menu, 
  X, 
  Book, 
  GraduationCap, 
  Settings, 
  Home,
  User,
  LogOut
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
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";

// Navigation items configuration
const NAV_ITEMS = {
  public: [
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

// User menu component
const UserMenu = ({ userDetails, signOut }: { userDetails: any; signOut: () => Promise<void> }) => {
  if (!userDetails) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar name={userDetails.name} email={userDetails.email} role={userDetails.role} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDetails?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userDetails?.email}
            </p>
            {userDetails?.role && (
              <Badge className="mt-1 w-fit">
                {userDetails.role}
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
    <Link to={to} className="flex items-center cursor-pointer">
      {icon}
      <span>{label}</span>
    </Link>
  </DropdownMenuItem>
);

// Mobile navigation menu
const MobileMenu = ({ isOpen, navItems, onClose, userDetails, signOut }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 top-16 z-20 bg-background md:hidden block">
      <div className="container p-6">
        <nav className="flex flex-col gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center gap-2 text-lg font-medium"
              onClick={onClose}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
          <Link
            to="/profile"
            className="flex items-center gap-2 text-lg font-medium"
            onClick={onClose}
          >
            <User className="h-5 w-5" />
            Profile
          </Link>
          {userDetails?.role && userDetails.role !== "learner" && (
            <Link
              to={userDetails.role === "superadmin" ? "/admin" : "/hr"}
              className="flex items-center gap-2 text-lg font-medium"
              onClick={onClose}
            >
              <Settings className="h-5 w-5" />
              {userDetails.role === "superadmin" ? "Admin Panel" : "HR Dashboard"}
            </Link>
          )}
          <button
            className="flex items-center gap-2 text-lg font-medium text-red-500"
            onClick={() => {
              signOut();
              onClose();
            }}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </nav>
      </div>
    </div>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, userDetails, signOut } = useAuth();
  const [isClient, setIsClient] = React.useState(false);
  const [authVerified, setAuthVerified] = React.useState(false);
  
  // Use useEffect to ensure we're running in the client environment
  React.useEffect(() => {
    setIsClient(true);
    
    // Enhanced logging for debugging auth state
    console.log('Auth state in Navbar:', { 
      user: user ? 'User exists' : 'No user',
      userDetails: userDetails ? `User details: ${userDetails.name}` : 'No details',
      supabaseConfigured: isSupabaseConfigured() ? 'Yes' : 'No'
    });

    // Mark auth as verified after the component has mounted
    const timer = setTimeout(() => {
      setAuthVerified(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [user, userDetails]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // Determine which nav items to show based on authentication status
  const navItems = user && authVerified
    ? [...NAV_ITEMS.public, ...NAV_ITEMS.authenticated]
    : NAV_ITEMS.public;

  // Only show content when we're sure we're on the client and auth state is verified
  const showContent = isClient && authVerified;

  console.log('Current auth state:', user ? 'Logged in' : 'Not logged in', 'Verified:', authVerified);

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b bg-background">
      {showContent && (
        <div className="absolute bottom-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-tl-md z-50">
          Auth: {user ? 'Logged In' : 'Logged Out'}
        </div>
      )}
      <div className="container h-full px-4 md:px-6">
        <div className="flex h-full items-center justify-between">
          {/* Logo and Nav Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold">Learnfinity</span>
            </Link>
            {showContent && user && (
              <nav className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          
          {/* User Menu and Mobile Toggle */}
          <div className="flex items-center gap-4">
            {showContent && (user ? (
              // AUTHENTICATED USER: Show profile dropdown
              <div className="flex items-center gap-4">
                {userDetails?.role && userDetails.role !== "learner" && (
                  <Link to={userDetails.role === "superadmin" ? ROUTES.ADMIN_DASHBOARD : ROUTES.HR_DASHBOARD}>
                    <Badge className="hidden md:inline-flex">
                      {userDetails.role === "superadmin" ? "Admin Panel" : "HR Dashboard"}
                    </Badge>
                  </Link>
                )}
                <UserMenu userDetails={userDetails} signOut={signOut} />
              </div>
            ) : (
              // VISITOR: Show sign in button
              <Link to="/login">
                <Button variant="default" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            ))}
            {showContent && user && (
              <button
                className="block md:hidden"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {showContent && user && (
        <MobileMenu 
          isOpen={isMenuOpen} 
          navItems={navItems} 
          onClose={() => setIsMenuOpen(false)} 
          userDetails={userDetails}
          signOut={signOut}
        />
      )}
    </header>
  );
};

export default Navbar;
