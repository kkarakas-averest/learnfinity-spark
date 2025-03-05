
import React from "@/lib/react-helpers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const OnboardingWizard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Welcome to Learnfinity</h1>
        <p className="text-center text-muted-foreground">
          This is a placeholder for the onboarding wizard. In a complete implementation,
          this would guide new users through setting up their profile, preferences, and
          learning goals.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="w-full"
          >
            Skip & Go to Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full" 
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
