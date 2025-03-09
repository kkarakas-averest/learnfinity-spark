import React from "@/lib/react-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Clock, RefreshCw, X } from "lucide-react";

// Import types from the test framework
import { TestResult } from '@/agents/testing/AgentTestFramework';

// Create AccordionItem component since it's not exported from accordion.tsx
const AccordionItem = AccordionPrimitive.Item;

interface AgentTestResultsProps {
  onRunTests?: () => Promise<TestResult[]>;
  initialResults?: TestResult[];
}

export function AgentTestResults({ onRunTests, initialResults = [] }: AgentTestResultsProps) {
  const [results, setResults] = React.useState<TestResult[]>(initialResults);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('all');
  
  // Calculate summary statistics
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const averageResponseTime = totalTests > 0 
    ? results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests 
    : 0;
  
  // Filter results based on active tab
  const filteredResults = activeTab === 'all' 
    ? results 
    : activeTab === 'passed' 
      ? results.filter(r => r.passed) 
      : results.filter(r => !r.passed);
  
  // Run tests handler
  const handleRunTests = async () => {
    if (!onRunTests) return;
    
    setIsLoading(true);
    try {
      const newResults = await onRunTests();
      setResults(newResults);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Agent Test Results</span>
          <Button 
            onClick={handleRunTests} 
            disabled={isLoading || !onRunTests}
            size="sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Validate agent behavior and responses against expected outcomes
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalTests}</div>
              <p className="text-sm text-muted-foreground">Total Tests</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <p className="text-sm text-muted-foreground">Passed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{averageResponseTime.toFixed(0)}ms</div>
              <p className="text-sm text-muted-foreground">Avg. Response Time</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Pass Rate</span>
            <span className="text-sm font-medium">{passRate.toFixed(1)}%</span>
          </div>
          <Progress value={passRate} className="h-2" />
        </div>
        
        {/* Results Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Tests ({totalTests})</TabsTrigger>
            <TabsTrigger value="passed">Passed ({passedTests})</TabsTrigger>
            <TabsTrigger value="failed">Failed ({failedTests})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {filteredResults.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No results</AlertTitle>
                <AlertDescription>
                  {results.length === 0 
                    ? "No tests have been run yet. Click 'Run Tests' to start testing."
                    : `No ${activeTab} tests found.`}
                </AlertDescription>
              </Alert>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredResults.map((result, index) => (
                  <AccordionItem key={result.testCaseId} value={result.testCaseId}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{result.testCaseName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline">{result.agentType}</Badge>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {result.responseTime}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent>
                      {result.error && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{result.error.message}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Validation Results</h4>
                          <ul className="space-y-2">
                            {result.validationResults.map((validation, vIndex) => (
                              <li key={vIndex} className="text-sm">
                                <div className="flex items-start gap-2">
                                  {validation.passed ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-600 mt-0.5" />
                                  )}
                                  <div>
                                    <div className="font-medium">{validation.ruleName}</div>
                                    {validation.message && !validation.passed && (
                                      <div className="text-red-600">{validation.message}</div>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Output</h4>
                          <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                            {JSON.stringify(result.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        Last updated: {results.length > 0 
          ? new Date(Math.max(...results.map(r => r.timestamp.getTime()))).toLocaleString() 
          : 'Never'}
      </CardFooter>
    </Card>
  );
} 