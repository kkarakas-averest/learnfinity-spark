import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useHRAuth } from "@/contexts/HRAuthContext";

// Login form schema validation
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// Type for form values based on schema
type LoginFormValues = z.infer<typeof loginSchema>;

const HRLogin = () => {
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useHRAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/hr');
    }
  }, [isAuthenticated, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      setLoginError(null);
      
      // Attempt login with credentials
      await login(values.username, values.password);
      
      // If successful, navigate to dashboard
      navigate('/hr');
    } catch (error) {
      setLoginError("Invalid HR credentials. Please try again.");
    }
  };

  // Early return if already authenticated to avoid form flashing
  if (isAuthenticated) {
    return null;
  }

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
                        <Input placeholder="HR username" {...field} disabled={authLoading} />
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
                        <Input placeholder="••••••••" type="password" {...field} disabled={authLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? (
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