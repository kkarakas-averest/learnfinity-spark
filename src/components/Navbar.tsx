
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsMobileMenuOpen(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 px-6 md:px-10 py-4 
        ${isScrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold">Learnfinity</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary/80 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300
                ${isActive(item.path) 
                  ? "text-primary after:w-full" 
                  : "text-muted-foreground after:w-0 hover:after:w-full"}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background animate-fade-in z-40">
          <div className="flex flex-col p-6 space-y-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-lg font-medium px-4 py-2 rounded-md transition-colors
                  ${isActive(item.path) 
                    ? "bg-secondary text-primary" 
                    : "text-muted-foreground hover:bg-secondary/50"}`}
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-4 pt-4 border-t">
              <Button variant="outline" asChild>
                <Link to="/login" onClick={closeMenu}>Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/register" onClick={closeMenu}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
