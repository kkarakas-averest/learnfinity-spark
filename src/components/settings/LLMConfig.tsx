import React, { useState, useEffect } from "@/lib/react-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LLMService } from "@/lib/llm/llm-service";
import { supportedModels } from "@/lib/llm/config";
import { supabase } from "@/lib/supabase";

/**
 * LLMConfig component for managing LLM settings
 */
export default function LLMConfig() {
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("llama-3.1-70b-versatile");
  const [enableLLM, setEnableLLM] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<{
    configured: boolean;
    message: string;
    error?: string;
  }>({
    configured: false,
    message: "Checking configuration...",
  });
  
  // Reference to LLM service
  const llmService = LLMService.getInstance();
  
  // Load current configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        // Check if we're configured
        const isConfigured = llmService.isConfigured();
        const config = llmService.getConfig();
        
        setModel(config.model);
        setEnableLLM(config.provider === 'groq');
        
        let apiKeyFound = false;
        
        // Try to load API key from Supabase first
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('llm_config')
            .single();
          
          if (error) {
            console.warn('Could not load LLM config from database:', error);
          } else if (data?.llm_config?.apiKey) {
            // Mask API key for display ("sk-...XXXX")
            const key = data.llm_config.apiKey;
            setApiKey(key.startsWith('sk-') ? `sk-...${key.slice(-4)}` : "(stored)");
            apiKeyFound = true;
          }
        } catch (dbError) {
          console.warn('Error accessing database for config:', dbError);
        }
        
        // If no API key found in Supabase, check localStorage
        if (!apiKeyFound) {
          try {
            const localConfig = localStorage.getItem('llm_config');
            if (localConfig) {
              const parsedConfig = JSON.parse(localConfig);
              if (parsedConfig.apiKey) {
                const key = parsedConfig.apiKey;
                setApiKey(key.startsWith('sk-') ? `sk-...${key.slice(-4)}` : "(stored locally)");
                // Also update the LLM service if needed
                if (!isConfigured) {
                  llmService.setProvider(
                    parsedConfig.provider || 'groq',
                    {
                      apiKey: parsedConfig.apiKey,
                      model: parsedConfig.model || model
                    }
                  );
                }
                apiKeyFound = true;
              }
            }
          } catch (storageError) {
            console.warn('Error accessing localStorage for config:', storageError);
          }
        }
        
        setStatus({
          configured: isConfigured,
          message: isConfigured 
            ? "✅ LLM service is configured and ready to use" + (apiKeyFound ? "" : " (but API key display unavailable)")
            : "❌ LLM service is not configured"
        });
      } catch (error) {
        console.error('Error loading LLM config:', error);
        setStatus({
          configured: false,
          message: "Failed to load configuration",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    loadConfig();
  }, [llmService]);
  
  // Save configuration changes
  const saveConfig = async () => {
    setIsSaving(true);
    
    try {
      // Only save if the API key is provided and not masked
      if (apiKey && !apiKey.includes('...')) {
        let savedToDatabase = false;
        
        // Try to save to Supabase first
        try {
          const currentUser = await supabase.auth.getUser();
          
          // Only attempt database save if we have a valid user
          if (currentUser.data?.user?.id) {
            const { error } = await supabase
              .from('user_preferences')
              .upsert({
                user_id: currentUser.data.user.id,
                llm_config: {
                  apiKey,
                  model,
                  provider: enableLLM ? 'groq' : 'mock',
                  timestamp: new Date().toISOString()
                }
              });
              
            if (error) {
              console.warn('Supabase error when saving API key:', error);
              // Don't throw here, we'll fall back to localStorage
            } else {
              savedToDatabase = true;
              console.log('Successfully saved API key to database');
            }
          } else {
            console.warn('No authenticated user found for database storage');
          }
        } catch (dbError) {
          console.warn('Failed to save to database, falling back to localStorage:', dbError);
        }
        
        // If database save failed or user isn't authenticated, fall back to localStorage
        if (!savedToDatabase) {
          try {
            // Store the config in localStorage as fallback (less secure but functional)
            localStorage.setItem('llm_config', JSON.stringify({
              apiKey, 
              model,
              provider: enableLLM ? 'groq' : 'mock',
              timestamp: new Date().toISOString()
            }));
            console.log('Saved API key to localStorage (fallback storage)');
          } catch (storageError) {
            console.error('Failed to save to localStorage:', storageError);
            throw new Error('Could not save configuration to any storage mechanism');
          }
        }
        
        // Update LLM service configuration
        llmService.setProvider(
          enableLLM ? 'groq' : 'mock',
          {
            apiKey,
            model
          }
        );
        
        setStatus({
          configured: llmService.isConfigured(),
          message: "✅ Configuration saved and updated" + (!savedToDatabase ? " (using local storage)" : "")
        });
      } else {
        // Just update the model and provider
        llmService.setProvider(
          enableLLM ? 'groq' : 'mock',
          { model }
        );
        
        setStatus({
          configured: llmService.isConfigured(),
          message: "✅ Configuration updated (API key unchanged)"
        });
      }
    } catch (error) {
      console.error('Error saving LLM config:', error);
      setStatus({
        configured: false,
        message: "Failed to save configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Test the current configuration
  const testConfig = async () => {
    setIsSaving(true);
    setStatus({
      configured: status.configured,
      message: "Testing configuration..."
    });
    
    try {
      const testPrompt = "Hello, this is a test of the LLM service. Please respond with a brief greeting.";
      const response = await llmService.complete(testPrompt, {
        temperature: 0.3,
        maxTokens: 50
      });
      
      setStatus({
        configured: true,
        message: `✅ Test successful! Response: "${response.substring(0, 50)}${response.length > 50 ? '...' : ''}"`
      });
    } catch (error) {
      console.error('Error testing LLM config:', error);
      setStatus({
        configured: false,
        message: "❌ Test failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Large Language Model Configuration</CardTitle>
        <CardDescription>
          Configure the LLM service for enhanced analysis capabilities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">Groq API Key</Label>
          <div className="flex gap-2">
            <Input 
              id="apiKey" 
              type="password"
              placeholder="sk-..." 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
            />
            <div className="w-[100px] flex items-center">
              <Switch
                checked={enableLLM}
                onCheckedChange={setEnableLLM}
                id="enable-llm"
              />
              <Label htmlFor="enable-llm" className="ml-2">
                Enable
              </Label>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Get your API key from{" "}
            <a 
              href="https://console.groq.com/" 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Groq Console
            </a>
          </p>
        </div>
        
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(supportedModels)
                .filter(([_, info]) => info.provider === 'groq')
                .map(([modelName, info]) => (
                  <SelectItem key={modelName} value={modelName}>
                    {modelName} - {info.description}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            Higher parameter models provide better quality but may be slower
          </p>
        </div>
        
        {/* Status Display */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium mb-1">Status</h3>
          <p className={`text-sm ${status.configured ? 'text-green-600' : 'text-amber-600'}`}>
            {status.message}
          </p>
          {status.error && (
            <p className="text-sm text-red-600 mt-1">
              Error: {status.error}
            </p>
          )}
        </div>
        
        {/* Usage Statistics */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium mb-1">Usage Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Requests</p>
              <p className="font-medium">{llmService.getUsageStats().requests}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Tokens</p>
              <p className="font-medium">{llmService.getUsageStats().total_tokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Prompt Tokens</p>
              <p className="font-medium">{llmService.getUsageStats().prompt_tokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Completion Tokens</p>
              <p className="font-medium">{llmService.getUsageStats().completion_tokens.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={testConfig} disabled={isSaving}>
          Test Configuration
        </Button>
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardFooter>
    </Card>
  );
} 