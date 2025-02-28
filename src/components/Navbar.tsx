import { useState } from "react";
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

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userDetails, signOut } = useAuth();

  // Navigation items that are shown to all users (including visitors)
  const publicNavItems = [
  ];

  // Navigation items that are only shown to authenticated users
  const authenticatedNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Courses", href: "/courses", icon: Book },
    { name: "My Learning", href: "/dashboard", icon: GraduationCap },
  ];

  // Determine which nav items to show based on authentication status
  const navItems = user 
    ? [...publicNavItems, ...authenticatedNavItems]
    : publicNavItems;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b bg-background">
      <div className="container h-full px-4 md:px-6">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold">Learnfinity</span>
            </Link>
            {user && (
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
          <div className="flex items-center gap-4">
            {user ? (
              // AUTHENTICATED USER: Show profile dropdown
              <div className="flex items-center gap-4">
                {userDetails?.role && userDetails.role !== "learner" && (
                  <Link to={userDetails.role === "superadmin" ? "/admin" : "/hr"}>
                    <Badge variant="outline" className="hidden md:inline-flex">
                      {userDetails.role === "superadmin" ? "Admin Panel" : "HR Dashboard"}
                    </Badge>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userDetails?.name}`} alt={userDetails?.name} />
                        <AvatarFallback>{userDetails?.name ? getInitials(userDetails.name) : <User size={14} />}</AvatarFallback>
                      </Avatar>
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
                          <Badge variant="outline" className="mt-1 w-fit">
                            {userDetails.role}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center cursor-pointer">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/courses" className="flex items-center cursor-pointer">
                        <Book className="mr-2 h-4 w-4" />
                        <span>Courses</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
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
              </div>
            ) : (
              // VISITOR: Show sign in button
              <Link to="/login">
                <Button variant="default" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
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
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-20 bg-background md:hidden",
          isMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="container p-6">
          <nav className="flex flex-col gap-6">
            {user ? (
              // AUTHENTICATED USER: Show navigation and profile links in mobile menu
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center gap-2 text-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                {userDetails?.role && userDetails.role !== "learner" && (
                  <Link
                    to={userDetails.role === "superadmin" ? "/admin" : "/hr"}
                    className="flex items-center gap-2 text-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    {userDetails.role === "superadmin" ? "Admin Panel" : "HR Dashboard"}
                  </Link>
                )}
                <button
                  className="flex items-center gap-2 text-lg font-medium text-red-500"
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </button>
              </>
            ) : (
              // VISITOR: Show sign in link in mobile menu
              <Link
                to="/login"
                className="flex items-center gap-2 text-lg font-medium text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
