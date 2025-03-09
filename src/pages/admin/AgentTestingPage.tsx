import React from "@/lib/react-helpers";
import { AgentTestResults } from "@/components/admin/AgentTestResults";
import { AgentTestFramework } from "@/agents/testing/AgentTestFramework";
import { registerRAGStatusTests } from "@/agents/testing/RAGStatusTests";
import { AgentFactory } from "@/agents/AgentFactory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TestResult } from "@/agents/testing/AgentTestFramework";
import { toast } from "sonner";

export default function AgentTestingPage() {
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [testFramework, setTestFramework] = React.useState<AgentTestFramework | null>(null);
  
  // Initialize the agent factory and test framework
  const initializeFramework = async () => {
    setIsInitializing(true);
    
    try {
      // Initialize agent factory
      const agentFactory = AgentFactory.getInstance();
      await agentFactory.initializeRAGCrew(true);
      
      // Initialize test framework
      const framework = AgentTestFramework.getInstance();
      
      // Register test cases
      registerRAGStatusTests(framework);
      
      setTestFramework(framework);
      setIsInitialized(true);
      toast.success("Agent testing framework initialized successfully");
    } catch (error) {
      console.error("Error initializing agent testing framework:", error);
      toast.error("Failed to initialize agent testing framework");
    } finally {
      setIsInitializing(false);
    }
  };
  
  // Run all tests
  const runAllTests = async (): Promise<TestResult[]> => {
    if (!testFramework) {
      toast.error("Test framework not initialized");
      return [];
    }
    
    try {
      const results = await testFramework.runAllTests();
      const passedCount = results.filter(r => r.passed).length;
      
      if (passedCount === results.length) {
        toast.success(`All ${results.length} tests passed!`);
      } else {
        toast.warning(`${passedCount} of ${results.length} tests passed`);
      }
      
      return results;
    } catch (error) {
      console.error("Error running tests:", error);
      toast.error("Failed to run tests");
      return [];
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Testing</h1>
          <p className="text-muted-foreground">
            Test and validate agent behaviors in real-time
          </p>
        </div>
        
        {!isInitialized ? (
          <Button 
            onClick={initializeFramework} 
            disabled={isInitializing}
            size="lg"
          >
            {isInitializing ? "Initializing..." : "Initialize Testing Framework"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 flex items-center gap-1">
              <span className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></span>
              Framework Ready
            </span>
          </div>
        )}
      </div>
      
      <Separator className="mb-6" />
      
      <Tabs defaultValue="test-runner" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="test-runner">Test Runner</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="test-runner">
          {!isInitialized ? (
            <Card>
              <CardHeader>
                <CardTitle>Initialize Framework</CardTitle>
                <CardDescription>
                  The testing framework needs to be initialized before running tests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={initializeFramework} 
                  disabled={isInitializing}
                >
                  {isInitializing ? "Initializing..." : "Initialize Now"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AgentTestResults onRunTests={runAllTests} />
          )}
        </TabsContent>
        
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Configure test parameters and validation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuration options will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>Testing Documentation</CardTitle>
              <CardDescription>
                Learn how to create and run agent tests
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Getting Started with Agent Testing</h3>
              <p>
                The agent testing framework allows you to validate agent behaviors and responses
                against expected outcomes. This helps ensure that agents are functioning correctly
                and producing reliable results.
              </p>
              
              <h4>Key Concepts</h4>
              <ul>
                <li><strong>Test Cases</strong>: Define inputs and expected outputs for agents</li>
                <li><strong>Validation Rules</strong>: Specify criteria for evaluating agent responses</li>
                <li><strong>Test Results</strong>: Detailed information about test execution and validation</li>
              </ul>
              
              <h4>Creating Custom Tests</h4>
              <p>
                To create custom tests, you'll need to:
              </p>
              <ol>
                <li>Define test cases with appropriate inputs and validation rules</li>
                <li>Register the test cases with the test framework</li>
                <li>Run the tests and analyze the results</li>
              </ol>
              
              <h4>Example Test Case</h4>
              <pre className="bg-muted p-4 rounded-md text-xs">
{`// Example test case for RAG status determination
testFramework.registerTestCase({
  name: 'Red Status Determination',
  description: 'Tests that an employee with clear red indicators is correctly classified',
  agentType: 'analyzer',
  input: {
    employeeData: {
      // Employee data with red indicators
    }
  },
  validationRules: [
    ValidationRules.hasRequiredFields(['status', 'confidence']),
    ValidationRules.fieldEquals('status', 'red'),
    // Additional validation rules
  ]
});`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 