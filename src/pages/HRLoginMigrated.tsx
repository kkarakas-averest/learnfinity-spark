import React, { useState, useEffect } from "@/lib/react-helpers";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import from our new state management system
import { useHRAuth, useUI } from "@/state";

const HRLoginMigrated: React.FC = () => {
  // Use our new hooks instead of the old context
  const { login, isAuthenticated, isLoading } = useHRAuth();
  const { toast, toastError } = useUI();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("HRLogin: User already authenticated, redirecting to dashboard");
      navigate(ROUTES.HR_DASHBOARD);
    }
  }, [isAuthenticated, isLoading, navigate]);

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
      const success = await login(username, password);
      console.log(`HRLogin: Login ${success ? 'successful' : 'failed'}`);
      
      if (success) {
        console.log(`HRLogin: Navigating to ${ROUTES.HR_DASHBOARD}`);
        navigate(ROUTES.HR_DASHBOARD);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
  );
};

export default HRLoginMigrated; 