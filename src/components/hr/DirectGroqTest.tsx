import React, { useState } from '@/lib/react-helpers';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * DirectGroqTest component that directly calls the Groq API from the browser
 * This bypasses the need for a serverless function
 */
const DirectGroqTest: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('Write a short greeting message about professional development.');
  const [result, setResult] = useState('');
  
  const callGroqAPI = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      // Call Groq API directly from the browser
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 400
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Direct Groq API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      setResult(content);
      
      toast({
        title: 'API call successful',
        description: 'Content generated successfully',
      });
    } catch (error) {
      console.error('Direct API call error:', error);
      toast({
        title: 'API call failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Direct Groq API Test</CardTitle>
        <CardDescription>Call the Groq API directly from the browser</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here"
            disabled={isLoading}
          />
        </div>
        
        {result && (
          <div className="bg-gray-50 p-4 rounded-md mt-4">
            <p className="text-sm font-semibold mb-1">Generated content:</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={callGroqAPI}
          disabled={isLoading || !prompt}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Call Groq API
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DirectGroqTest; 