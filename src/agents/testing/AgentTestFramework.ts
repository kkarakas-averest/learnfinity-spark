/**
 * Agent Test Framework
 * 
 * A comprehensive framework for testing agent behaviors, interactions, and responses
 * in real-time. This framework allows for:
 * 
 * 1. Simulating agent interactions
 * 2. Validating agent responses against expected outcomes
 * 3. Measuring performance metrics (response time, accuracy)
 * 4. Generating test reports
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentMessage } from '../core/BaseAgent';
import { AgentFactory } from '../AgentFactory';
import { AgentEventBus } from '../AgentEventBus';
import { Agent, AgentConfig } from '../types';

// Types for test cases and validation
export interface AgentTestCase {
  id: string;
  name: string;
  description: string;
  agentType: 'analyzer' | 'educator' | 'monitor' | 'integrator';
  input: any;
  expectedOutput?: any;
  validationRules?: ValidationRule[];
  timeout?: number; // milliseconds
}

export interface ValidationRule {
  name: string;
  description: string;
  validator: (result: any) => { valid: boolean; message?: string };
}

export interface TestResult {
  testCaseId: string;
  testCaseName: string;
  agentType: string;
  passed: boolean;
  responseTime: number; // milliseconds
  output: any;
  validationResults: {
    ruleName: string;
    passed: boolean;
    message?: string;
  }[];
  error?: Error;
  timestamp: Date;
}

export class AgentTestFramework {
  private static instance: AgentTestFramework;
  private agentFactory: AgentFactory;
  private testCases: Map<string, AgentTestCase> = new Map();
  private testResults: TestResult[] = [];
  private mockMode: boolean = false;
  
  private constructor() {
    this.agentFactory = AgentFactory.getInstance();
  }
  
  /**
   * Get the singleton instance of the test framework
   */
  public static getInstance(): AgentTestFramework {
    if (!AgentTestFramework.instance) {
      AgentTestFramework.instance = new AgentTestFramework();
    }
    return AgentTestFramework.instance;
  }
  
  /**
   * Register a test case
   */
  public registerTestCase(testCase: Omit<AgentTestCase, 'id'>): string {
    const id = uuidv4();
    const fullTestCase: AgentTestCase = {
      id,
      ...testCase,
      timeout: testCase.timeout || 5000, // Default 5 second timeout
    };
    
    this.testCases.set(id, fullTestCase);
    return id;
  }
  
  /**
   * Enable or disable mock mode
   * In mock mode, agents return predefined responses instead of processing real tasks
   */
  public setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
  }
  
  /**
   * Run a specific test case
   */
  public async runTest(testCaseId: string): Promise<TestResult> {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      throw new Error(`Test case with ID ${testCaseId} not found`);
    }
    
    // Create agent instance for testing
    const agent = this.agentFactory.createAgent(testCase.agentType, {
      name: `Test ${testCase.agentType} Agent`,
      verbose: true,
    });
    
    await agent.initialize();
    
    // Run the test
    const startTime = Date.now();
    let output: any;
    let error: Error | undefined;
    
    try {
      // Set timeout for the test
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Test timed out after ${testCase.timeout}ms`)), testCase.timeout);
      });
      
      // Run the actual test
      const testPromise = agent.processTask({
        type: 'test',
        data: testCase.input,
      });
      
      // Race between test completion and timeout
      output = await Promise.race([testPromise, timeoutPromise]);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Validate the output
    const validationResults = this.validateOutput(testCase, output);
    const passed = !error && validationResults.every(result => result.passed);
    
    // Create test result
    const result: TestResult = {
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      agentType: testCase.agentType,
      passed,
      responseTime,
      output,
      validationResults,
      error,
      timestamp: new Date(),
    };
    
    // Store the result
    this.testResults.push(result);
    
    return result;
  }
  
  /**
   * Run all registered test cases
   */
  public async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const testCaseId of this.testCases.keys()) {
      try {
        const result = await this.runTest(testCaseId);
        results.push(result);
      } catch (error) {
        console.error(`Error running test ${testCaseId}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Validate test output against rules
   */
  private validateOutput(testCase: AgentTestCase, output: any): { ruleName: string; passed: boolean; message?: string }[] {
    const results: { ruleName: string; passed: boolean; message?: string }[] = [];
    
    // If no validation rules are defined but expected output is, do a simple equality check
    if (!testCase.validationRules && testCase.expectedOutput) {
      const isEqual = this.deepEqual(output, testCase.expectedOutput);
      results.push({
        ruleName: 'default-equality',
        passed: isEqual,
        message: isEqual ? 'Output matches expected output' : 'Output does not match expected output',
      });
      return results;
    }
    
    // Apply each validation rule
    if (testCase.validationRules) {
      for (const rule of testCase.validationRules) {
        try {
          const validationResult = rule.validator(output);
          results.push({
            ruleName: rule.name,
            passed: validationResult.valid,
            message: validationResult.message,
          });
        } catch (error) {
          results.push({
            ruleName: rule.name,
            passed: false,
            message: `Validation rule threw an error: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Deep equality check for objects
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  /**
   * Get all test results
   */
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }
  
  /**
   * Get results for a specific test case
   */
  public getTestResultById(testCaseId: string): TestResult[] {
    return this.testResults.filter(result => result.testCaseId === testCaseId);
  }
  
  /**
   * Generate a test report
   */
  public generateTestReport(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageResponseTime: number;
    results: TestResult[];
  } {
    const results = this.getTestResults();
    const passedTests = results.filter(r => r.passed).length;
    
    return {
      totalTests: results.length,
      passedTests,
      failedTests: results.length - passedTests,
      averageResponseTime: results.length > 0 
        ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length 
        : 0,
      results,
    };
  }
  
  /**
   * Clear all test results
   */
  public clearTestResults(): void {
    this.testResults = [];
  }
  
  /**
   * Clear all registered test cases
   */
  public clearTestCases(): void {
    this.testCases.clear();
  }
} 