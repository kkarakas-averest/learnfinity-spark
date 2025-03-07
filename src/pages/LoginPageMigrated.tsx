import React, { useState, useEffect, useRef } from "@/lib/react-helpers";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Key, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NavbarMigrated from "@/components/NavbarMigrated";

// Import from our new state management system
import { useAuth, useUI } from "@/state";

// Schema for login form
const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

// Use typeof for z.infer
type LoginFormValues = z.infer<typeof loginSchema>;

// Debug rendering to identify potential mounting/unmounting issues
console.log("LoginPageMigrated module loaded");

const LoginPageMigrated: React.FC = () => {
  // Use our new hooks instead of the old context
  const { signInWithPassword, userDetails, isLoading: authLoading } = useAuth();
  const { toastSuccess, toastError } = useUI();
  
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMounted = useRef(false);
  
  // Debug rendering
  useEffect(() => {
    console.log("LoginPageMigrated mounted");
    hasMounted.current = true;
    
    return () => {
      console.log("LoginPageMigrated unmounted");
      hasMounted.current = false;
    };
  }, []);
  
  // Log state changes but avoid excessive logging
  const prevState = useRef({ authLoading, userDetails, loading, error });
  useEffect(() => {
    // Only log if something changed
    if (
      prevState.current.authLoading !== authLoading ||
      prevState.current.userDetails !== userDetails ||
      prevState.current.loading !== loading ||
      prevState.current.error !== error
    ) {
      console.log("LoginPageMigrated - Current state:", { 
        authLoading, 
        userDetails, 
        loading,
        error 
      });
      
      prevState.current = { authLoading, userDetails, loading, error };
    }
  }, [authLoading, userDetails, loading, error]);
  
  // Redirect if already logged in - with debounce to avoid redirect loops
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (userDetails && !redirectTimeoutRef.current && hasMounted.current) {
      console.log("User details detected, will redirect based on role:", userDetails.role);
      
      // Clear any existing redirect timeout
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      
      // Set a new redirect timeout
      redirectTimeoutRef.current = setTimeout(() => {
        if (hasMounted.current) { // Only redirect if still mounted
          console.log("Executing redirect for role:", userDetails.role);
          redirectBasedOnRole(userDetails.role);
          redirectTimeoutRef.current = null;
        }
      }, 300);
    }
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [userDetails, navigate]);
  
  const redirectBasedOnRole = (role: string) => {
    console.log("Redirecting based on role:", role);
    switch (role) {
      case 'superadmin':
        navigate('/admin');
        break;
      case 'hr':
        navigate('/hr-dashboard');
        break;
      case 'mentor':
        navigate('/mentor');
        break;
      case 'learner':
      default:
        navigate('/dashboard');
        break;
    }
  };
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const adminForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "admin123",
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const { email, password } = data;
      console.log("Attempting login with:", email);
      
      // Use the new signInWithPassword method from useAuth
      const response = await signInWithPassword(email, password);
      console.log("Login response:", response);
      
      toastSuccess(
        "Login successful!",
        "You've successfully logged in."
      );
      
      // Check if userDetails is set immediately
      console.log("After login - userDetails:", userDetails);
      
      // Always force navigation after successful login
      // This ensures we don't rely solely on the useEffect
      setTimeout(() => {
        // If we have user details, use those for role-based navigation
        if (userDetails) {
          console.log("User details available, navigating based on role:", userDetails.role);
          redirectBasedOnRole(userDetails.role);
        } else {
          // Fallback to dashboard if no user details yet
          console.log("No user details yet, navigating to dashboard as fallback");
          navigate("/dashboard");
        }
      }, 500);
      
      // Navigation is also handled by the useEffect that watches userDetails
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to sign in. Please check your credentials.";
      
      setError(errorMessage);
      
      toastError(
        "Login failed",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const onAdminSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const { email, password } = data;
      console.log("Attempting admin login with:", email);
      
      // Use the new signInWithPassword method from useAuth
      await signInWithPassword(email, password);
      
      toastSuccess(
        "Admin login successful!",
        "You've successfully logged in as admin."
      );
      
      // Navigation is handled by the useEffect above that watches userDetails
    } catch (error: any) {
      console.error("Admin login error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to sign in. Please check your credentials.";
      
      setError(errorMessage);
      
      toastError(
        "Admin login failed",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarMigrated />
      <div className="container mx-auto py-10 px-4">
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and password below to sign in
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="px-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign up
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="secondary" className="w-full gap-2" onClick={() => adminForm.handleSubmit(onAdminSubmit)()}>
              <ShieldCheck className="h-4 w-4" />
              Sign in as Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageMigrated; 