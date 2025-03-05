import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase";
import { UserRole } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertCircle, Info, Check } from "lucide-react";

// Define the registration schema with extended profile fields
const registerSchema = z.object({
  // Basic account info
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." }),
  confirmPassword: z.string(),
  
  // Profile details
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(500, { message: "Bio must not exceed 500 characters." }).optional(),
  interests: z.string().max(200, { message: "Interests must not exceed 200 characters." }).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  
  // Contact and social media
  phoneNumber: z.string().optional(),
  linkedinUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  githubUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  
  // Preferences
  receiveNotifications: z.boolean().default(true),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions." }),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const { signUp, user, isLoading: authLoading } = useAuth();
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      jobTitle: "",
      company: "",
      bio: "",
      interests: "",
      experienceLevel: "beginner",
      phoneNumber: "",
      linkedinUrl: "",
      githubUrl: "",
      receiveNotifications: true,
      termsAccepted: false,
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Check if Supabase is configured correctly
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setRegistrationError("Authentication service is not configured properly. Please contact support.");
    }
  }, []);

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      setRegistrationError(null);
      
      console.log("Starting registration with:", values.email);
      
      // Create the user in Supabase Auth
      await signUp(values.email, values.password, values.name, "learner");
      
      // After signup succeeds, store additional profile information in a separate profile table
      // This assumes that the AuthContext's signUp function properly creates the user in the users table
      // and signs the user in, so we'll have access to the user's ID
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      if (newUser?.id) {
        // Additional profile data to store
        const profileData = {
          user_id: newUser.id,
          job_title: values.jobTitle || null,
          company: values.company || null,
          bio: values.bio || null,
          interests: values.interests || null,
          experience_level: values.experienceLevel || "beginner",
          phone_number: values.phoneNumber || null,
          linkedin_url: values.linkedinUrl || null,
          github_url: values.githubUrl || null,
          receive_notifications: values.receiveNotifications,
        };
        
        // First, check if the user_profiles table exists
        const { error: tableCheckError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .limit(1);
          
        if (tableCheckError) {
          console.warn('user_profiles table likely does not exist yet, will create it if possible');
          
          // Try to create the table if it doesn't exist (this would typically be done via migrations)
          // Note: This approach is simplified and not recommended for production
          try {
            const createTableSQL = `
              CREATE TABLE IF NOT EXISTS public.user_profiles (
                user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                job_title TEXT,
                company TEXT,
                bio TEXT,
                interests TEXT,
                experience_level TEXT,
                phone_number TEXT,
                linkedin_url TEXT,
                github_url TEXT,
                receive_notifications BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
              );
            `;
            
            await supabase.rpc('execute_sql', { sql: createTableSQL });
            console.log('Created user_profiles table');
          } catch (createError) {
            console.error('Failed to create user_profiles table:', createError);
          }
        }
        
        // Now attempt to insert the profile data
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData);
          
        if (insertError) {
          console.warn('Failed to save extended profile data:', insertError);
          // We'll continue even if saving extended profile fails
          // The core user data is already saved
        }
      }
      
      // Show success message
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Welcome to Learnfinity!",
      });
      
      // Redirect will be handled by the useEffect that checks for user
    } catch (error: any) {
      console.error("Registration failed:", error);
      setRegistrationError(error.message || "Registration failed. Please try again or contact support.");
      
      // Show error toast
      toast({
        title: "Registration Failed",
        description: error.message || "There was an issue creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate current step fields before proceeding
    if (registrationStep === 1) {
      const basicInfoValid = form.trigger(['name', 'email', 'password', 'confirmPassword']);
      if (basicInfoValid) {
        setRegistrationStep(2);
      }
    } else if (registrationStep === 2) {
      setRegistrationStep(3);
    }
  };

  const prevStep = () => {
    setRegistrationStep(registrationStep - 1);
  };

  // Render loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold">Learnfinity</h1>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Create Your Account</h2>
          <p className="mt-2 text-muted-foreground">
            Join our community and start your personalized learning journey
          </p>
        </div>
        
        {registrationError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration Error</AlertTitle>
            <AlertDescription>{registrationError}</AlertDescription>
          </Alert>
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${registrationStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {registrationStep > 1 ? <Check className="h-4 w-4" /> : "1"}
                </div>
                <div className={`h-1 w-12 ${registrationStep > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${registrationStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {registrationStep > 2 ? <Check className="h-4 w-4" /> : "2"}
                </div>
                <div className={`h-1 w-12 ${registrationStep > 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${registrationStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Step {registrationStep} of 3
              </div>
            </div>
            <CardTitle>
              {registrationStep === 1 && "Account Information"}
              {registrationStep === 2 && "Professional Profile"}
              {registrationStep === 3 && "Preferences & Terms"}
            </CardTitle>
            <CardDescription>
              {registrationStep === 1 && "Create your account credentials"}
              {registrationStep === 2 && "Tell us about yourself"}
              {registrationStep === 3 && "Set your preferences and complete registration"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Account Information */}
                {registrationStep === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" type="email" {...field} />
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
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters with uppercase, lowercase, and a number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                {/* Step 2: Professional Profile */}
                {registrationStep === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Software Engineer" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your current role or position
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company / Organization</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your experience level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This helps us personalize your learning content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us a bit about yourself and your learning goals..." 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A brief description about yourself (max 500 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning Interests</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="AI, Web Development, UX Design..."
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated topics you're interested in learning
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                {/* Step 3: Preferences & Terms */}
                {registrationStep === 3 && (
                  <>
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.linkedin.com/in/yourname" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="githubUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub Profile (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://github.com/yourusername" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="text-lg font-semibold">Preferences</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="receiveNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Receive Notifications</FormLabel>
                              <FormDescription>
                                Get updates about new courses, features, and learning opportunities
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Terms and Conditions</FormLabel>
                              <FormDescription>
                                I agree to the <Link to="#" className="text-primary hover:underline">Terms of Service</Link> and <Link to="#" className="text-primary hover:underline">Privacy Policy</Link>
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-between pt-4">
                  {registrationStep > 1 ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline"
                      asChild
                    >
                      <Link to="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Link>
                    </Button>
                  )}
                  
                  {registrationStep < 3 ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Complete Registration"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 