import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Hardcoded HR credentials
const HR_CREDENTIALS = {
  username: "adminhr",
  password: "adminhr"
};

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const HRLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in as HR
  useEffect(() => {
    const checkExistingLogin = () => {
      try {
        const userStr = localStorage.getItem("currentUser");
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log("Found existing user in localStorage:", user.role);
          if (user.role === "hr") {
            console.log("Already logged in as HR, redirecting to dashboard");
            navigate('/hr');
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Error checking existing login:", error);
        return false;
      }
    };

    checkExistingLogin();
  }, [navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setLoginError(null);
      setIsLoading(true);
      
      console.log("Attempting HR login with username:", values.username);
      
      // Add a small delay to simulate a real login process
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check against hardcoded credentials
      if (values.username === HR_CREDENTIALS.username && values.password === HR_CREDENTIALS.password) {
        // Store HR user info in localStorage
        const hrUser = {
          id: "hr-admin-id",
          name: "HR Administrator",
          email: "hr@learnfinity.com",
          role: "hr"
        };
        
        console.log("Login successful, storing HR user in localStorage");
        localStorage.setItem("currentUser", JSON.stringify(hrUser));
        
        // Double-check the localStorage was set correctly
        const storedUser = localStorage.getItem("currentUser");
        console.log("Verification - localStorage currentUser set to:", storedUser);
        
        // Success message
        toast({
          title: "HR Login Successful",
          description: "Redirecting to HR dashboard...",
        });
        
        // Add a small delay before redirecting to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Redirect to HR dashboard
        console.log("Redirecting to HR dashboard");
        navigate('/hr', { replace: true });
      } else {
        throw new Error("Invalid HR credentials");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      setLoginError("Invalid HR credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight">
            HR Administrator Login
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Access the HR dashboard to manage learners and courses
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-8">
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="HR username" {...field} disabled={isLoading} />
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
                    "HR Sign In"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                This is a restricted area for HR administrators only.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Use the credentials:</strong><br/>
                Username: adminhr<br/>
                Password: adminhr
              </p>
              <Button 
                variant="link" 
                className="text-sm text-primary"
                onClick={() => navigate('/login')}
              >
                Return to main login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRLogin; 