import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// For debugging purposes
const testCredentials = {
  email: "test@example.com",
  password: "password123"
};

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const LoginPage = () => {
  const { signIn, signUp, isLoading, signupDisabled, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    signupDisabled ? "login" : "login" // Always default to login if signup is disabled
  );
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear error when tab changes
  useEffect(() => {
    setLoginError(null);
    setSignupError(null);
  }, [activeTab]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setLoginError(null);
      console.log("Attempting login with:", values.email);
      
      // Add a small delay to ensure UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await signIn(values.email, values.password);
      
      // Success message
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      // Set user-friendly error message
      setLoginError(error.message || "Failed to sign in. Please check your credentials and try again.");
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    try {
      setSignupError(null);
      console.log("Attempting signup with:", values.email);
      
      // Add a small delay to ensure UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await signUp(values.email, values.password, values.name, "learner");
      
      // Success message
      toast({
        title: "Account Created",
        description: "Your account has been successfully created. Welcome to Learnfinity!",
      });
    } catch (error: any) {
      console.error("Signup failed:", error);
      // Set user-friendly error message
      setSignupError(error.message || "Failed to create account. Please try again or contact support.");
    }
  };

  const fillTestCredentials = () => {
    loginForm.setValue("email", testCredentials.email);
    loginForm.setValue("password", testCredentials.password);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
            Welcome to Learnfinity
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-8">
            {process.env.NODE_ENV === 'development' && (
              <Alert className="mb-6" variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Development Mode</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>Running in development environment.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fillTestCredentials}
                    className="w-full"
                  >
                    Fill Test Credentials
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => {
                // Prevent switching to signup tab if signups are disabled
                if (value === "signup" && signupDisabled) {
                  return;
                }
                setActiveTab(value as "login" | "signup");
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup" disabled={signupDisabled}>
                  Create Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {loginError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {loginError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" type="email" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup">
                {signupDisabled ? (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      New user registration is currently disabled.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {signupError && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {signupError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-5">
                        <FormField
                          control={signupForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} disabled={isLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" type="email" {...field} disabled={isLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input placeholder="••••••••" type="password" {...field} disabled={isLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input placeholder="••••••••" type="password" {...field} disabled={isLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            By continuing, you agree to Learnfinity's{" "}
            <Link
              to="#"
              className="font-semibold leading-6 text-primary hover:text-primary/80"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="#"
              className="font-semibold leading-6 text-primary hover:text-primary/80"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900">Want to create a detailed profile?</h3>
              <p className="mt-1 text-sm text-gray-500">
                Use our comprehensive registration form to set up your full learning profile.
              </p>
              <div className="mt-3">
                <Link to="/register">
                  <Button variant="outline" className="w-full">
                    Register with Full Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
