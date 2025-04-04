import React from "@/lib/react-helpers";
import { useNavigate, useLocation } from "react-router-dom";
import { useHRAuth } from "@/contexts/HRAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

const HRLogin = () => {
  const { login, isAuthenticated, isLoading } = useHRAuth();
  const { signOut: regularUserSignOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("HRLogin: User already authenticated, redirecting to dashboard");
      navigate(ROUTES.HR_DASHBOARD);
    }
  }, [isAuthenticated, isLoading, navigate]);

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
      toast({
        title: "Missing information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
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
        navigate(ROUTES.HR_DASHBOARD);
      } else {
        console.error("HRLogin: Authentication failed");
        toast({
          title: "Authentication failed",
          description: "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("HRLogin: Error during login:", error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading HR authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
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
              placeholder="Enter your username (use 'hr')"
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
              placeholder="Enter your password (use 'password')"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>For demonstration: use "hr" and "password"</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRLogin;
