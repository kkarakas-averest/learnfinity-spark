
import React from "@/lib/react-helpers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { isSupabaseConfigured, testSupabaseConnection } from "@/lib/supabase";

interface SystemStatus {
  auth: {
    configured: boolean;
    user: boolean;
    userDetails: boolean;
  };
  supabase: {
    configured: boolean;
    connected: boolean;
    error?: string;
  };
  routes: {
    current: string;
  };
}

export default function DiagnosticTool() {
  const { user, userDetails, isLoading } = useAuth();
  const [systemStatus, setSystemStatus] = React.useState<SystemStatus>({
    auth: {
      configured: false,
      user: false,
      userDetails: false,
    },
    supabase: {
      configured: false,
      connected: false,
    },
    routes: {
      current: window.location.pathname,
    },
  });
  const [isRunningCheck, setIsRunningCheck] = React.useState(false);

  const runSystemCheck = async () => {
    setIsRunningCheck(true);
    
    try {
      console.log("Running system diagnostic check...");
      
      // Check Supabase configuration
      const supabaseConfigured = isSupabaseConfigured();
      let supabaseConnected = false;
      let supabaseError = undefined;
      
      if (supabaseConfigured) {
        const connectionTest = await testSupabaseConnection();
        supabaseConnected = connectionTest.success;
        supabaseError = connectionTest.error?.message || connectionTest.details;
      }
      
      // Update status
      setSystemStatus({
        auth: {
          configured: true, // Auth system is configured if this component loads
          user: !!user,
          userDetails: !!userDetails,
        },
        supabase: {
          configured: supabaseConfigured,
          connected: supabaseConnected,
          error: supabaseError,
        },
        routes: {
          current: window.location.pathname,
        },
      });
      
      toast({
        title: "System Check Complete",
        description: "Check the diagnostic panel for results.",
      });
    } catch (error) {
      console.error("Error running system check:", error);
      toast({
        variant: "destructive",
        title: "System Check Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsRunningCheck(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">System Diagnostic Tool</h2>
      
      <Button 
        onClick={runSystemCheck} 
        disabled={isRunningCheck}
        className="mb-4"
      >
        {isRunningCheck ? "Running Check..." : "Run System Check"}
      </Button>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="auth">
          <AccordionTrigger>
            Authentication Status 
            {systemStatus.auth.user ? (
              <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 ml-2 text-amber-500" />
            )}
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              <li>Auth Configured: {systemStatus.auth.configured ? "Yes ✅" : "No ❌"}</li>
              <li>User Authenticated: {systemStatus.auth.user ? "Yes ✅" : "No ❌"}</li>
              <li>User Details Available: {systemStatus.auth.userDetails ? "Yes ✅" : "No ❌"}</li>
              {userDetails && (
                <>
                  <li>User Name: {userDetails.name}</li>
                  <li>User Role: {userDetails.role}</li>
                  <li>User Email: {userDetails.email}</li>
                </>
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="supabase">
          <AccordionTrigger>
            Supabase Connection
            {systemStatus.supabase.connected ? (
              <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 ml-2 text-amber-500" />
            )}  
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              <li>Supabase Configured: {systemStatus.supabase.configured ? "Yes ✅" : "No ❌"}</li>
              <li>Supabase Connected: {systemStatus.supabase.connected ? "Yes ✅" : "No ❌"}</li>
              {systemStatus.supabase.error && (
                <li>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                      {systemStatus.supabase.error}
                    </AlertDescription>
                  </Alert>
                </li>
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="routes">
          <AccordionTrigger>Routing Information</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              <li>Current Route: {systemStatus.routes.current}</li>
              <li>Expected Dashboard: {userDetails?.role === 'learner' ? '/dashboard' : 
                userDetails?.role === 'hr' ? '/hr-dashboard' : 
                userDetails?.role === 'mentor' ? '/mentor' : 
                userDetails?.role === 'superadmin' ? '/admin' : 'Not logged in'}</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
