import React, { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Simple test button for the GroqAPI integration
 */
const GroqTestButton: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      const baseUrl = window.location.origin;
      
      // Call the simplified test endpoint
      const response = await fetch(`${baseUrl}/api/groq-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Write a short greeting message.'
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        
        let errorMessage = 'Failed to connect to Groq API';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error('Error details:', errorData.details);
          }
        } catch (e) {
          // Use the raw error text if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      toast({
        title: 'GroqAPI Test Success',
        description: data.content,
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleClick}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Test GroqAPI
        </>
      )}
    </Button>
  );
};

export default GroqTestButton; 