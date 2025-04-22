import React from 'react';
import useState from 'react';
import useEffect from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
// Comment out useSearchParams until we fix the import issue
// We'll use useLocation with URLSearchParams instead
// import { useSearchParams } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { ROUTES } from '@/lib/routes';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import specific icons as a workaround for lucide-react import issue
import { AlertTriangle } from "lucide-react"; // Using AlertTriangle instead of Terminal

// Define the expected shape of invite verification data (optional, for validation function)
interface InviteDetails {
  email: string;
  company_name: string; // Fetch company name for display?
  role: string;
}

const AcceptInvitePage: React.FC = () => {
  const supabase = useSupabaseClient<Database>();
  const navigate = useNavigate();
  const inviteToken = new URLSearchParams(useLocation().search).get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true); // Start by verifying token
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null); // Store verified details

  // State for the signup form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Optional: Collect full name

  // --- Token Verification Effect ---
  useEffect(() => {
    const verifyToken = async () => {
      if (!inviteToken) {
        setError("No invite token provided in the URL.");
        setIsVerifying(false);
        return;
      }

      setIsVerifying(true);
      setError(null);
      console.log("Verifying invite token:", inviteToken);

      try {
        // Option 1: Direct DB Check (Requires RLS to allow read based on token)
        // This is simpler but exposes invite details potentially before signup
        // const { data, error: dbError } = await supabase
        //   .from('invites')
        //   .select('email, role, company_id, companies(name)') // Fetch company name via relationship
        //   .eq('invite_token', inviteToken)
        //   .eq('status', 'pending')
        //   .gt('expires_at', new Date().toISOString()) // Check expiry
        //   .maybeSingle();

        // Option 2: Call an Edge Function (Recommended)
        // Creates `verify-invite-token` function that checks validity and returns minimal needed info
        const { data, error: funcError } = await supabase.functions.invoke('verify-invite-token', {
            body: { token: inviteToken }
        });

        if (funcError || (data && data.error)) {
            throw new Error(data?.error || funcError?.message || 'Invalid or expired invite token.');
        }

        if (!data || !data.email) { // Check for expected data from function
             throw new Error('Verification failed: Invalid response from server.');
        }

        // Assuming function returns { email: string, role: string, company_name: string }
        setInviteDetails({
            email: data.email,
            role: data.role,
            company_name: data.company_name || 'the company' // Fallback if name not returned
        });
        console.log("Token verified successfully for:", data.email);

      } catch (err: any) {
        console.error("Invite verification failed:", err);
        setError(err.message || "Failed to verify invitation. The link may be invalid or expired.");
        setInviteDetails(null);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [inviteToken, supabase]);


  // --- Signup Handler ---
  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteToken || !inviteDetails) {
        setError("Cannot sign up without a valid verified invite.");
        return;
    }
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (password.length < 6) { // Basic password check
        setError("Password must be at least 6 characters long.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sign up using Supabase Auth, passing the invite token in metadata
      const { data, error: signupError } = await supabase.auth.signUp({
        email: inviteDetails.email, // Use email from verified invite
        password: password,
        options: {
          // Crucially pass the token here!
          data: {
            invite_token: inviteToken,
            // Add full_name here if collecting it and user_profiles expects it
            // full_name: fullName,
          },
        },
      });

      if (signupError) {
        // The handle_new_user function might also throw errors if invite is invalid *again*
        // Catch specific errors if needed (e.g., "User already registered")
        throw signupError;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
         toast({
           title: "Signup Successful! Check Your Email",
           description: "Please check your email to confirm your account before logging in.",
           duration: 10000, // Longer duration
         });
         // Navigate to a "check email" page or show message here
         navigate(ROUTES.LOGIN); // Or a dedicated "check email" route
      } else if (data.user && data.session) {
         // User signed up and logged in (e.g., if email confirmation disabled)
         toast({
            title: "Signup Successful!",
            description: "You have successfully signed up and logged in.",
         });
         // The HRAuthContext will handle redirection based on role
         navigate(ROUTES.HR_DASHBOARD); // Or let context handle redirect
      } else {
          // Should not happen based on Supabase docs, but handle defensively
          throw new Error("Signup completed but no user or session data received.");
      }

    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "An error occurred during signup.");
      setIsLoading(false);
    }
    // Don't set isLoading false here if navigating away on success
  };

  // --- Render Logic ---

  if (isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="ml-4">Verifying invite...</p>
      </div>
    );
  }

  if (error || !inviteDetails) {
    // Show error if verification failed or details are missing
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invite Invalid</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error || "Could not retrieve invite details."}</AlertDescription>
            </Alert>
             <Button variant="link" onClick={() => navigate(ROUTES.LOGIN)} className="mt-4">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If verification succeeded, show signup form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {inviteDetails.company_name} as a {inviteDetails.role}.
            Complete your signup for {inviteDetails.email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Optional: Full Name Input */}
            {/* <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
                 <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" /> : 'Complete Signup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage; 