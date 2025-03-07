import React, { useState, useEffect } from "@/lib/react-helpers";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react'; // Import Loader icon
import NavbarMigrated from "@/components/NavbarMigrated"; // Import NavbarMigrated

// Import from our new state management system
import { useHRAuth, useAuth, useUI } from "@/state";

const HRLoginMigrated: React.FC = () => {
  // Use our new hooks instead of the old context
  const { login, isAuthenticated, isLoading: hrLoading } = useHRAuth();
  const { signOut: regularUserSignOut } = useAuth(); // Import regular user signOut
  const { toast, toastError, toastSuccess } = useUI();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("HRLoginMigrated - Current state:", { 
    hrLoading, 
    isAuthenticated,
    isSubmitting
  });

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !hrLoading) {
      console.log("HRLogin: User already authenticated, redirecting to dashboard");
      navigate(ROUTES.HR_DASHBOARD);
    }
  }, [isAuthenticated, hrLoading, navigate]);

  // Function to ensure HR login doesn't conflict with regular user login
  const ensureCleanLoginState = async () => {
    // Sign out any existing regular user first to prevent conflicts
    try {
      await regularUserSignOut();
      console.log("Successfully signed out regular user before HR login");
    } catch (error) {
      console.warn("Error signing out regular user:", error);
      // Continue anyway - non-blocking
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("HRLogin: Attempting login");
    
    if (!username || !password) {
      toast(
        "Missing information",
        "Please enter both username and password",
        "error"
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First ensure we don't have any conflicting sessions
      await ensureCleanLoginState();
      
      // Then attempt HR login
      const success = await login(username, password);
      console.log(`HRLogin: Login ${success ? 'successful' : 'failed'}`);
      
      if (success) {
        console.log(`HRLogin: Navigating to ${ROUTES.HR_DASHBOARD}`);
        // Force navigation regardless of state updates
        setTimeout(() => {
          // Make sure we're using the consistent path defined in ROUTES
          navigate(ROUTES.HR_DASHBOARD);
          console.log(`HRLogin: Navigation triggered to ${ROUTES.HR_DASHBOARD}`);
        }, 500);
      }
      // Note: Error handling is now done inside the useHRAuth hook directly
    } catch (error) {
      console.error("HRLogin: Error during login:", error);
      toastError(
        "Login error",
        "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hrLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavbarMigrated />
        <div className="container mx-auto flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading HR authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarMigrated />
      <div className="container mx-auto flex items-center justify-center py-16">
        <div className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl font-semibold mb-4">HR Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Username:
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Password:
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>For demonstration: use "hr@example.com" and "hrpassword123"</p>
              <p>Or: "admin@hr.com" and "adminhr456"</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HRLoginMigrated; 